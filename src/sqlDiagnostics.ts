import * as vscode from 'vscode';
import * as nearley from 'nearley';
import lexer from './sqlLexer';
import grammar from './sqlGrammar';
// 有效的 SQL 关键字（白名单，可根据需要扩展）
const validKeywords = new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE',
    'DELETE', 'VALUES', 'AND', 'OR', 'NOT', 'AS', 'JOIN',
    'ON', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET'
]);

// 辅助函数：将字符串偏移量转换为 vscode.Position
function documentPositionToLocation(content: string, offset: number): vscode.Position {
    let line = 0;
    let char = 0;
    for (let i = 0; i < offset; i++) {
        if (content[i] === '\n') {
            line++;
            char = 0;
        } else {
            char++;
        }
    }
    return new vscode.Position(line, char);
}


interface DiagnosticRule {
    name: string;
    check: (sql: string) => vscode.Diagnostic[];
}

// 规则1: 检测非法关键字（不在白名单中的“单词”被视为可能的拼写错误）
const invalidKeywordRule: DiagnosticRule = {
    name: 'invalid-keyword',
    check: (sql: string) => {
        const diagnostics: vscode.Diagnostic[] = [];
        // 匹配单词边界内的“大写单词”（忽略字符串内的内容）
        // 简化：匹配所有 [A-Z_][A-Z0-9_]*，并检查是否在白名单中
        const keywordRegex = /\b([A-Z_][A-Z0-9_]*)\b/g;
        let match;
        while ((match = keywordRegex.exec(sql)) !== null) {
            const word = match[1].toUpperCase();
            // 忽略一些常见的非关键字词（比如表名、列名）, 简单起见只检查长度>2
            if (word.length >= 2 && !validKeywords.has(word)) {
                const startPos = match.index;
                const endPos = startPos + match[0].length;
                const range = new vscode.Range(
                    documentPositionToLocation(sql, startPos),
                    documentPositionToLocation(sql, endPos)
                );
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `无效关键字: "${match[0]}"，请检查拼写或该关键字是否受支持`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        }
        return diagnostics;
    }
};

// 规则2: 检测字符串引号是否闭合（单引号）
const unclosedStringRule: DiagnosticRule = {
    name: 'unclosed-string',
    check: (sql: string) => {
        const diagnostics: vscode.Diagnostic[] = [];
        let inString = false;
        let stringStartIdx = -1;
        for (let i = 0; i < sql.length; i++) {
            const ch = sql[i];
            if (ch === "'") {
                if (!inString) {
                    inString = true;
                    stringStartIdx = i;
                } else {
                    // 检查是否是转义引号（SQL 中使用 '' 表示一个单引号）
                    if (i + 1 < sql.length && sql[i + 1] === "'") {
                        i++; // 跳过下一个引号
                        continue;
                    }
                    inString = false;
                    stringStartIdx = -1;
                }
            }
        }
        if (inString) {
            const range = new vscode.Range(
                documentPositionToLocation(sql, stringStartIdx),
                documentPositionToLocation(sql, sql.length)
            );
            diagnostics.push(new vscode.Diagnostic(
                range,
                '字符串引号未闭合',
                vscode.DiagnosticSeverity.Error
            ));
        }
        return diagnostics;
    }
};

// 规则3: 括号匹配检测
const parenthesesMismatchRule: DiagnosticRule = {
    name: 'parentheses-mismatch',
    check: (sql: string) => {
        const diagnostics: vscode.Diagnostic[] = [];
        let balance = 0;
        let lastOpenIdx = -1;
        for (let i = 0; i < sql.length; i++) {
            const ch = sql[i];
            if (ch === '(') {
                if (balance === 0) lastOpenIdx = i;
                balance++;
            } else if (ch === ')') {
                balance--;
                if (balance < 0) {
                    // 多余的右括号
                    const range = new vscode.Range(
                        documentPositionToLocation(sql, i),
                        documentPositionToLocation(sql, i + 1)
                    );
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        '多余的右括号',
                        vscode.DiagnosticSeverity.Error
                    ));
                    balance = 0; // 重置避免连续报错
                }
            }
        }
        if (balance > 0) {
            const range = new vscode.Range(
                documentPositionToLocation(sql, lastOpenIdx),
                documentPositionToLocation(sql, lastOpenIdx + 1)
            );
            diagnostics.push(new vscode.Diagnostic(
                range,
                `缺少 ${balance} 个右括号`,
                vscode.DiagnosticSeverity.Error
            ));
        }
        return diagnostics;
    }
};

// 规则4: SELECT 语句后必须跟至少一个列表达式（简单检测）
const selectNoColumnsRule: DiagnosticRule = {
    name: 'select-no-columns',
    check: (sql: string) => {
        const diagnostics: vscode.Diagnostic[] = [];
        // 匹配 SELECT 后面紧跟空白或换行，然后直接跟 FROM（没有列名）
        const selectNoColumnsRegex = /\bSELECT\s+FROM\b/i;
        const match = selectNoColumnsRegex.exec(sql);
        if (match) {
            const startPos = match.index;
            const endPos = startPos + match[0].length;
            const range = new vscode.Range(
                documentPositionToLocation(sql, startPos),
                documentPositionToLocation(sql, endPos)
            );
            diagnostics.push(new vscode.Diagnostic(
                range,
                'SELECT 子句后未指定任何列',
                vscode.DiagnosticSeverity.Error
            ));
        }
        return diagnostics;
    }
};

// 规则5: FROM 关键字必须出现（在 SELECT 语句中）
const missingFromClauseRule: DiagnosticRule = {
    name: 'missing-from',
    check: (sql: string) => {
        const diagnostics: vscode.Diagnostic[] = [];
        const selectRegex = /\bSELECT\b/i;
        const fromRegex = /\bFROM\b/i;
        if (selectRegex.test(sql) && !fromRegex.test(sql)) {
            const selectMatch = selectRegex.exec(sql);
            if (selectMatch) {
                const range = new vscode.Range(
                    documentPositionToLocation(sql, selectMatch.index),
                    documentPositionToLocation(sql, selectMatch.index + selectMatch[0].length)
                );
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'SELECT 语句缺少 FROM 子句',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
        return diagnostics;
    }
};

// 导出主诊断函数，组合所有规则
export function diagnoseSql(sqlContent: string): vscode.Diagnostic[] {
    const allRules: DiagnosticRule[] = [
        invalidKeywordRule,
        unclosedStringRule,
        parenthesesMismatchRule,
        selectNoColumnsRule,
        missingFromClauseRule
    ];
    let diagnostics: vscode.Diagnostic[] = [];
    for (const rule of allRules) {
        diagnostics = diagnostics.concat(rule.check(sqlContent));
    }
    // 创建解析器实例，传入自定义 lexer
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar),{lexer: lexer as any});
	 try {
        // 尝试解析整个 SQL
        const { results } = parser.feed(sqlContent);
        return [];
    } catch (err: any) {
        // 解析失败，生成诊断信息
        const errorMessage = err.message || '语法错误';
	}
    return diagnostics;
}
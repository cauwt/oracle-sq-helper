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

interface DiagnosticRule {
	name: string;
	check: (results: any) => vscode.Diagnostic[];
}

// 规则6: 列没有带表名
const missingTableInColumnRule: DiagnosticRule = {
	name: 'missing-table-in-column',
	check: (results: any) => {
		const diagnostics: vscode.Diagnostic[] = [];
		try {
			// 查找解析结果中的 source_columns，检查是否有未带表名的列
			const select_statement = results.find((node: any) => node.type === 'select_statement');
			if (select_statement) {
				const select_list = select_statement.select_list || [];
				select_list.forEach((item: any) => {
					if (item.source_columns) {
						item.source_columns.forEach((col: any) => {
							if (!col.table) {
								const range = new vscode.Range(
									new vscode.Position(col.start.line - 1, col.start.col - 1),
									new vscode.Position(col.end.line - 1, col.end.col - 1)
								);
								diagnostics.push(new vscode.Diagnostic(
									range,
									'列未带表名',
									vscode.DiagnosticSeverity.Warning
								));
							}
						});
					}
				});
			}
		} catch (err: any) {
			// 解析失败，生成诊断信息
			const errorMessage = err.message || '语法错误';
		}
		return diagnostics;
	}
};

// 导出主诊断函数，组合所有规则
export function diagnoseSql(sqlContent: string): vscode.Diagnostic[] {
	// 创建解析器实例，传入自定义 lexer
	const allRules: DiagnosticRule[] = [
		missingTableInColumnRule
	];
	let diagnostics: vscode.Diagnostic[] = [];
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar), { lexer: lexer as any });
	try {
		// 尝试解析整个 SQL
		const { results } = parser.feed(sqlContent);
		for (const rule of allRules) {
			diagnostics = diagnostics.concat(rule.check(results));
		}
	} catch (err: any) {
		// 解析失败，生成诊断信息
		const errorMessage = err.message || '语法错误';
		const lineMatch = errorMessage.match(/line (\d+)/);
		const colMatch = errorMessage.match(/col (\d+)/);
		const line = lineMatch ? parseInt(lineMatch[1], 10) - 1 : 0;
		const col = colMatch ? parseInt(colMatch[1], 10) - 1 : 0;
	}
	return diagnostics;
}
import * as vscode from 'vscode';
export async function provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location | null> {
    // 1. 获取光标下的完整表名（可能包含 schema）
    const wordRange = document.getWordRangeAtPosition(
        position,
        /(ods|fds|dim|mid|ads)*\.[a-zA-Z_][a-zA-Z0-9_]*/
    );
    if (!wordRange) return null;

    const wordText = document.getText(wordRange);
    // 只处理 schema.table 格式
    const match = wordText.match(/^(ods|fds|dim|mid|ads)\.([a-zA-Z_][a-zA-Z0-9_]*)$/);
    if (!match) return null;

    // 2. 检查该表名是否出现在 FROM 或 JOIN 之后
    // const isInFromOrJoin = isTableNameInFromOrJoin(document, wordRange.start);
    // if (!isInFromOrJoin) {
    //     return null; // 不跳转
    // }

    // 3. 构建目标文件路径（全部转小写）
    const [, schema, table] = match;
	let relativePath = `${schema.toLowerCase()}/sp_${table.toLowerCase()}.pro`;
	// 如果schema为ods，则使用 ods/table.sql 的路径
	if (schema.toLowerCase() === 'ods') {
		relativePath = `${schema.toLowerCase()}/${table.toLowerCase()}.sql`;
	}

    // 4. 定位文件
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('未找到工作区根目录');
        return null;
    }

    const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
    try {
        await vscode.workspace.fs.stat(fileUri);
    } catch {
        vscode.window.showErrorMessage(`表定义文件不存在: ${relativePath}`);
        return null;
    }

    return new vscode.Location(fileUri, new vscode.Position(0, 0));
}

function isTableNameInFromOrJoin(document: vscode.TextDocument, position: vscode.Position): boolean {
    // 获取从文档开头到光标位置的文本（限制大小避免性能问题）
    const start = new vscode.Position(0, 0);
    const textBefore = document.getText(new vscode.Range(start, position));

    // 查找最后一个 FROM 或 JOIN（大小写不敏感）
    // 正则捕获：关键字（FROM/JOIN）及其后面的所有内容
    const fromJoinRegex = /(FROM|JOIN)\s+([\s\S]*?)(?=SELECT|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|$)/gi;
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;
    
    // 使用循环获取最后一个匹配
    while ((match = fromJoinRegex.exec(textBefore)) !== null) {
        lastMatch = match;
    }

    if (!lastMatch) return false;

    // 最后一个 FROM/JOIN 之后的内容（到下一个关键字之前）
    const afterKeyword = lastMatch[2];
    // 检查光标所在的表名（wordText）是否在 afterKeyword 中
    // 注意：可能包含子查询、括号等，但简单判断：表名作为完整单词出现在其中
    // 更精确：提取所有标识符（可能带 schema），看是否包含 wordText
    // 这里用正则匹配标识符（允许点号），并检查是否与当前表名相同
    const identifierRegex = /[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/g;
    let idMatch: RegExpExecArray | null;
    while ((idMatch = identifierRegex.exec(afterKeyword)) !== null) {
        if (idMatch[0] === document.getText(document.getWordRangeAtPosition(position))) {
            return true;
        }
    }
    return false;
}
import * as vscode from 'vscode';
import { diagnoseSql } from './sqlDiagnostics';

// 诊断集合（用于展示错误波浪线）
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    // 初始化诊断集合
    diagnosticCollection = vscode.languages.createDiagnosticCollection('sql');
    context.subscriptions.push(diagnosticCollection);

    // 当活动文本编辑器变化时，更新诊断
    const updateDiagnostics = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'sql') {
            const diagnostics = diagnoseSql(editor.document.getText());
            diagnosticCollection.set(editor.document.uri, diagnostics);
        }
    };

    // 注册表名跳转定义提供者
    const definitionProvider = vscode.languages.registerDefinitionProvider(['sql','oracle-sql'], {
        provideDefinition: async (document, position, token) => {
            // 获取当前光标所在位置的单词（允许包含点号）
            const wordRange = document.getWordRangeAtPosition(
                position,
                /[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?/
            );
            if (!wordRange) return null;

            const text = document.getText(wordRange);
            // 匹配 schema.table 格式
            const match = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/);
            if (!match) return null;

            const [, schema, table] = match;

            // 构建目标文件相对路径：schema/sp_table.pro
            const relativePath = `${schema.toLowerCase()}/sp_${table.toLowerCase()}.pro`;

            // 获取当前文件所在的工作区根目录
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('未找到工作区根目录');
                return null;
            }

            // 拼接得到完整 URI
            const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

            // 检查文件是否存在
            try {
                await vscode.workspace.fs.stat(fileUri);
            } catch {
                vscode.window.showErrorMessage(`表定义文件不存在: ${fileUri}`);
                return null;
            }

            // 返回位置（跳转到文件开头）
            return new vscode.Location(fileUri, new vscode.Position(0, 0));
        }
    });

    context.subscriptions.push(definitionProvider);
	// 监听文档打开和内容变更
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateDiagnostics),
        vscode.workspace.onDidChangeTextDocument(event => {
            if (vscode.window.activeTextEditor?.document === event.document) {
                updateDiagnostics();
            }
        })
    );

    // 初始触发一次
    updateDiagnostics();
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
        diagnosticCollection.dispose();
    }
}
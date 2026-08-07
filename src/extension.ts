import * as vscode from 'vscode';
import { provideDefinition } from './sqlDefinitionLink';
import { diagnoseSql } from './sqlDiagnostics';
import { formatDocumentComments } from './sqlFormat';

// 诊断集合（用于展示错误波浪线）
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
	const languageId='oracle-sql';
    // 初始化诊断集合
    diagnosticCollection = vscode.languages.createDiagnosticCollection(languageId);
    context.subscriptions.push(diagnosticCollection);

    // 注册表名跳转定义提供者
    const definitionProvider = vscode.languages.registerDefinitionProvider(languageId, {
        provideDefinition: provideDefinition
    });

    context.subscriptions.push(definitionProvider);

    // 当活动文本编辑器变化时，更新诊断
    const updateDiagnostics = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === languageId) {
            const diagnostics = diagnoseSql(editor.document.getText());
            diagnosticCollection.set(editor.document.uri, diagnostics);
        }
    };

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
    // 注册格式化注释命令
    const formatCommentsCmd = vscode.commands.registerCommand('sql.formatComments', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        // 只对 oracle-sql 语言生效
        if (editor.document.languageId !== 'oracle-sql') {
            vscode.window.showWarningMessage('仅支持 .pro 文件（PL/SQL）');
            return;
        }
        formatDocumentComments(editor);
    });
    context.subscriptions.push(formatCommentsCmd);
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.clear();
        diagnosticCollection.dispose();
    }
}
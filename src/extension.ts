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
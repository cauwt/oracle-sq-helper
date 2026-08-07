import * as vscode from 'vscode';
/**
 * 格式化当前文档的所有单行注释
 */
export function formatDocumentComments(editor: vscode.TextEditor) {
    const document = editor.document;
    const fullText = document.getText();
    const lines = fullText.split('\n');
    const newLines: string[] = [];

    for (const line of lines) {
        newLines.push(formatLine(line));
    }

    const newText = newLines.join('\n');
    // 应用修改（全量替换）
    const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(fullText.length)
    );
    editor.edit(editBuilder => {
        editBuilder.replace(fullRange, newText);
    });
}

/**
 * 计算字符串的显示宽度（英文字母/数字/标点=1，汉字=2，制表符=4）
 */
function getDisplayWidth(str: string): number {
    let width = 0;
    for (const ch of str) {
        if (ch === '\t') {
            width += 4;
        } else if (/[\u4e00-\u9fff\u3400-\u4DBF\uF900-\uFAFF]/.test(ch)) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

/**
 * 格式化单行
 */
function formatLine(line: string): string {
    const commentIndex = line.indexOf('--');
    if (commentIndex === -1) return line;

    const beforeWithWhitespace = line.substring(0, commentIndex);
    const commentPart = line.substring(commentIndex);

    // 提取非空白前缀
    const trimmedBefore = beforeWithWhitespace.replace(/\s+$/, '');
    const whitespaceBetween = beforeWithWhitespace.substring(trimmedBefore.length);

    // 规则1：只有空白 → 对齐到第5列（一个制表符）
    if (trimmedBefore.length === 0) {
        return '\t' + commentPart;
    }

    // 计算非空白部分的显示宽度
    const width = getDisplayWidth(trimmedBefore);
    const whitespaceWidth = getDisplayWidth(whitespaceBetween);
    const originalStartCol = width + whitespaceWidth; // 原始注释起始列

    // 规则2：宽度 < 99 → 补到99
    if (width < 99) {
        const diff = 99 - width;
        const tabs = Math.floor(diff / 4);
        const spaces = diff % 4;
        const separator = '\t'.repeat(tabs) + ' '.repeat(spaces);
        return trimmedBefore + separator + commentPart;
    }

    // 规则3：宽度 >= 99
    if (originalStartCol > 100) {
        return trimmedBefore + commentPart; // 去掉所有空白
    } else {
        return trimmedBefore + ' ' + commentPart; // 保留一个空格
    }
}
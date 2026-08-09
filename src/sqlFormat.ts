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
    let trimmedBefore = beforeWithWhitespace.trimEnd();
    // 规则1：只有空白 → 对齐到第5列（一个制表符）
    if (trimmedBefore.length === 0) {
        return '\t' + commentPart;
    }

	// 提取前导白空格：截取前导空格和制表符
	const leadingWhitespaceMatch = trimmedBefore.match(/^[ \t]*/);
	let leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';
	leadingWhitespace = optimizeSpacesAndTabs(leadingWhitespace);
	trimmedBefore = leadingWhitespace + trimmedBefore.trimStart();

    // 计算非空白部分的显示宽度
    const width = getDisplayWidth(trimmedBefore);

    // 规则2：宽度 < 100 → 补到100
    if (width < 100) {
        const diff = 100 - width;
        const tabs = Math.floor(diff / 4);
        const spaces = diff % 4;
        const separator = ' '.repeat(spaces) + '\t'.repeat(tabs);
        return trimmedBefore + separator + commentPart;
    }else {
    	// 规则3：宽度 >= 100
    	return trimmedBefore + ' ' + commentPart; // 去掉所有空白
	}
}

/**
 * 将字符串中的空格和制表符进行优化：
 * 1. 连续的4个空格 → 1个制表符
 * 2. 遇到1-3个空格后紧跟一个制表符 → 去除空格，保留制表符
 * 3. 末尾剩余的1-3个空格 → 保留（不替换）
 */
function optimizeSpacesAndTabs(input: string): string {
    let result = '';
    let spaceCount = 0;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === ' ') {
            spaceCount++;
        } else if (ch === '\t') {
            // 遇到制表符时，处理之前累积的空格
            const tabs = Math.floor(spaceCount / 4);
            result += '\t'.repeat(tabs);        // 每4个空格替换为1个制表符
            // 剩余1-3个空格（如果有）因后面紧跟制表符，按规则2去除
            result += '\t';                     // 保留当前的制表符
            spaceCount = 0;
        }
    }

    // 处理末尾剩余的空格
    if (spaceCount > 0) {
        const tabs = Math.floor(spaceCount / 4);
        result += '\t'.repeat(tabs);
        const rem = spaceCount % 4;
        if (rem > 0) {
            result += ' '.repeat(rem);          // 末尾剩余1-3个空格保留
        }
    }

    return result;
}
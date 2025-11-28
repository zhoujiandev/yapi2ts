import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * 模板变量替换的参数类型
 */
export interface TemplateVariables {
    [key: string]: string;
}

/**
 * 加载 HTML 模板文件并替换占位符
 * 占位符格式: {{variableName}}
 *
 * @param extensionUri 扩展的根 URI
 * @param templateName 模板文件名（相对于 media 目录）
 * @param variables 要替换的变量
 * @returns 替换后的 HTML 字符串
 */
export function loadTemplate(
    extensionUri: vscode.Uri,
    templateName: string,
    variables: TemplateVariables
): string {
    const templatePath = path.join(extensionUri.fsPath, 'media', templateName);

    let template: string;
    try {
        template = fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to load template: ${templateName}. Error: ${error}`);
    }

    // 替换所有 {{variableName}} 格式的占位符
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (key in variables) {
            return variables[key];
        }
        // 如果变量不存在，保留原占位符并打印警告
        console.warn(`Template variable not found: ${key}`);
        return match;
    });
}

/**
 * 异步加载 HTML 模板文件并替换占位符
 *
 * @param extensionUri 扩展的根 URI
 * @param templateName 模板文件名（相对于 media 目录）
 * @param variables 要替换的变量
 * @returns Promise<替换后的 HTML 字符串>
 */
export async function loadTemplateAsync(
    extensionUri: vscode.Uri,
    templateName: string,
    variables: TemplateVariables
): Promise<string> {
    const templatePath = path.join(extensionUri.fsPath, 'media', templateName);

    let template: string;
    try {
        template = await fs.promises.readFile(templatePath, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to load template: ${templateName}. Error: ${error}`);
    }

    // 替换所有 {{variableName}} 格式的占位符
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        if (key in variables) {
            return variables[key];
        }
        console.warn(`Template variable not found: ${key}`);
        return match;
    });
}

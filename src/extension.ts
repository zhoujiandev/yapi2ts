// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { YapiWebviewProvider } from './webviewProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "yapi2ts" is now active!');

    // 创建WebView提供者
    const provider = new YapiWebviewProvider(context.extensionUri, context);

    // 注册WebView提供者
    const disposable = vscode.window.registerWebviewViewProvider(
        YapiWebviewProvider.viewType,
        provider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );
    context.subscriptions.push(disposable);

    // 注册重置模板的命令
    const resetTemplatesCommand = vscode.commands.registerCommand(
        'yapi2ts.resetTemplates',
        async () => {
            try {
                // 重置模板到默认状态
                await context.globalState.update('yapi2ts.templates', undefined);

                vscode.window.showInformationMessage(
                    'YAPI TypeScript: 模板已重置，重新加载插件后生效'
                );
            } catch (error) {
                vscode.window.showErrorMessage(`重置模板失败: ${error}`);
            }
        }
    );
    context.subscriptions.push(resetTemplatesCommand);

    // 注册清除Token的命令
    const clearTokensCommand = vscode.commands.registerCommand('yapi2ts.clearTokens', async () => {
        try {
            const config = vscode.workspace.getConfiguration('yapi2ts');
            const projects = config.get<any[]>('projects') || [];

            let count = 0;
            for (const p of projects) {
                if (p.id) {
                    const secretKey = `yapi2ts_token_${p.id}`;
                    await context.secrets.delete(secretKey);
                    count++;
                }
            }

            // 清理可能缓存的上一次连接的项目 ID 的 Token
            const lastId = context.globalState.get<string>('yapi2ts.lastConnectedProjectId');
            if (lastId) {
                await context.secrets.delete(`yapi2ts_token_${lastId}`);
            }

            vscode.window.showInformationMessage(
                `YAPI TypeScript: 已成功清除本地安全存储中的项目 Token (共清理 ${count} 个项目)`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`清除 Token 失败: ${error}`);
        }
    });
    context.subscriptions.push(clearTokensCommand);

    // 强制显示视图容器
    vscode.commands.executeCommand('workbench.view.extension.yapi2ts');
}

// This method is called when your extension is deactivated
export function deactivate() {}

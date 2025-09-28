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
	console.log('Creating YapiWebviewProvider...');
	const provider = new YapiWebviewProvider(context.extensionUri, context);

	// 注册WebView提供者
	console.log('Registering webview provider with viewType:', YapiWebviewProvider.viewType);
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
	console.log('WebView provider registered successfully');

	// 强制显示视图容器
	vscode.commands.executeCommand('workbench.view.extension.yapi2ts');
	console.log('Attempted to show yapi2ts view container');

	// 注册命令
	const openPanelCommand = vscode.commands.registerCommand('yapi2ts.openPanel', () => {
		// 显示YAPI侧边栏视图
		vscode.commands.executeCommand('workbench.view.extension.yapi2ts');
	});

	const refreshCommand = vscode.commands.registerCommand('yapi2ts.refresh', () => {
		// 刷新WebView
		vscode.window.showInformationMessage('Refreshing YAPI interfaces...');
	});

	const generateTypesCommand = vscode.commands.registerCommand('yapi2ts.generateTypes', () => {
		vscode.window.showInformationMessage('Generate Types command executed!');
	});

	const generateApiCommand = vscode.commands.registerCommand('yapi2ts.generateApi', () => {
		vscode.window.showInformationMessage('Generate API command executed!');
	});

	// 添加命令到订阅列表
	context.subscriptions.push(
		openPanelCommand,
		refreshCommand,
		generateTypesCommand,
		generateApiCommand
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

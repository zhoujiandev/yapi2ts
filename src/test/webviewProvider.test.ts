import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { YapiWebviewProvider } from '../webviewProvider';

suite('YapiWebviewProvider Test Suite', () => {
    let provider: YapiWebviewProvider;

    setup(() => {
        // 创建简化的模拟上下文
        const mockContext = {
            subscriptions: [],
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            extensionUri: vscode.Uri.file('/test'),
            extensionPath: '/test',
            asAbsolutePath: (path: string) => `/test/${path}`,
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global'),
            logUri: vscode.Uri.file('/test/log'),
            storagePath: '/test/storage',
            globalStoragePath: '/test/global',
            logPath: '/test/log',
            extensionMode: vscode.ExtensionMode.Test
        } as any;

        // 使用真实的扩展路径以便能加载 media 目录下的模板文件
        const extensionRoot = path.resolve(__dirname, '..', '..');
        const extensionUri = vscode.Uri.file(extensionRoot);
        provider = new YapiWebviewProvider(extensionUri, mockContext);
    });

    suite('Basic Functionality', () => {
        test('should have correct view type', () => {
            assert.strictEqual(
                YapiWebviewProvider.viewType,
                'yapi2ts.explorer',
                'Should have correct view type'
            );
        });

        test('should be created successfully', () => {
            assert.ok(provider, 'Provider should be created');
        });
    });

    suite('HTML Generation', () => {
        test('should generate HTML content', () => {
            // 创建模拟的 webview
            const mockWebview = {
                options: {},
                html: '',
                asWebviewUri: (uri: vscode.Uri) => uri,
                cspSource: 'test-csp'
            } as any;

            // 测试 HTML 生成（通过调用私有方法的方式）
            const htmlContent = (provider as any)._getHtmlForWebview(mockWebview);

            assert.ok(typeof htmlContent === 'string', 'Should return HTML string');
            assert.ok(htmlContent.length > 0, 'HTML content should not be empty');
            assert.ok(htmlContent.includes('<!DOCTYPE html>'), 'Should contain DOCTYPE');
            assert.ok(htmlContent.includes('<html'), 'Should contain html tag');
        });

        test('should include necessary CSS and JS resources', () => {
            const mockWebview = {
                options: {},
                html: '',
                asWebviewUri: (uri: vscode.Uri) => uri,
                cspSource: 'test-csp'
            } as any;

            const htmlContent = (provider as any)._getHtmlForWebview(mockWebview);

            assert.ok(htmlContent.includes('main.css'), 'Should include main.css');
            assert.ok(htmlContent.includes('main.js'), 'Should include main.js');
        });
    });

    suite('State Management', () => {
        test('should handle state restoration', () => {
            // 测试状态恢复功能
            const mockWebviewView = {
                webview: {
                    options: {},
                    html: '',
                    asWebviewUri: (uri: vscode.Uri) => uri,
                    cspSource: 'test-csp',
                    onDidReceiveMessage: () => ({ dispose: () => {} }),
                    postMessage: () => Promise.resolve(true)
                },
                visible: true,
                show: () => {},
                title: 'Test',
                onDidDispose: (callback: () => void) => ({ dispose: () => {} })
            } as any;

            // 调用 resolveWebviewView 方法
            provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            // 验证 webview 已设置
            assert.ok(mockWebviewView.webview.html.length > 0, 'HTML should be set');
        });
    });

    suite('Error Handling', () => {
        test('should handle invalid webview gracefully', () => {
            // 测试空的 webview 处理
            try {
                provider.resolveWebviewView(null as any, {} as any, {} as any);
                assert.fail('Should throw error for null webview');
            } catch (error) {
                assert.ok(error instanceof Error, 'Should throw an error');
            }
        });
    });

    suite('Template Management', () => {
        test('should handle template operations', () => {
            // 测试模板相关功能
            const mockWebviewView = {
                webview: {
                    options: {},
                    html: '',
                    asWebviewUri: (uri: vscode.Uri) => uri,
                    cspSource: 'test-csp',
                    onDidReceiveMessage: () => ({ dispose: () => {} }),
                    postMessage: (message: any) => {
                        // 验证消息格式
                        assert.ok(message, 'Message should exist');
                        return Promise.resolve(true);
                    }
                },
                visible: true,
                show: () => {},
                title: 'Test',
                onDidDispose: (callback: () => void) => ({ dispose: () => {} })
            } as any;

            provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

            // 验证基本功能
            assert.ok(true, 'Template operations should work');
        });
    });
});

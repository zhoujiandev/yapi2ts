import * as assert from 'assert';
import * as vscode from 'vscode';
import { CodeGenerator } from '../codeGenerator';
import { TemplateConfig, YapiInterfaceDetail } from '../types';
import { YapiWebviewProvider } from '../webviewProvider';
import { YapiService } from '../yapiService';

suite('Integration Test Suite', () => {
    let yapiService: YapiService;
    let codeGenerator: CodeGenerator;
    let webviewProvider: YapiWebviewProvider;

    setup(() => {
        yapiService = new YapiService();
        codeGenerator = new CodeGenerator();

        // 创建模拟的扩展上下文
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
            extensionMode: vscode.ExtensionMode.Test
        } as any;

        webviewProvider = new YapiWebviewProvider(vscode.Uri.file('/test'), mockContext);
    });

    suite('Complete Workflow', () => {
        test('should handle complete type generation workflow', () => {
            // 1. 配置 YAPI 服务
            const yapiUrl = 'https://test.yapi.com';
            const projectToken = 'test-token';
            yapiService.setConfig(yapiUrl, projectToken);

            assert.ok(yapiService.isConfigured(), 'YAPI service should be configured');

            // 2. 创建模拟接口数据
            const mockInterface: YapiInterfaceDetail = {
                _id: 1,
                title: 'Get User Info',
                path: '/api/user/info',
                method: 'GET',
                catid: 1,
                desc: 'Get user information',
                project_id: 1,
                status: 'done',
                req_body_type: 'json',
                req_body_other: '',
                req_query: [{ name: 'userId', required: '1', desc: 'User ID' }],
                req_headers: [],
                req_params: [],
                res_body: JSON.stringify({
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                    },
                    required: ['id', 'name']
                }),
                res_body_type: 'json',
                markdown: '',
                req_body_is_json_schema: true,
                res_body_is_json_schema: true
            };

            // 3. 生成类型定义
            const typeDefinitions = codeGenerator.generateTypeDefinitions([mockInterface]);

            assert.ok(typeDefinitions, 'Should generate type definitions');
            assert.ok(typeDefinitions.length > 0, 'Type definitions should not be empty');
            assert.ok(typeDefinitions.includes('interface'), 'Should contain interface definition');

            // 4. 生成 API 定义
            const template: TemplateConfig = {
                id: 'test-template',
                name: 'Test Template',
                content: `
/**
 * \${title}
 * \${desc}
 */
export const \${methodName} = (params: \${paramsTypeName}) => {
    return request<\${responseTypeName}>({
        url: '\${path}',
        method: '\${method}',
        params
    });
};`,
                description: 'Test template',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            const apiDefinitions = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                yapiUrl
            );

            assert.ok(apiDefinitions, 'Should generate API definitions');
            assert.ok(apiDefinitions.length > 0, 'API definitions should not be empty');
            assert.ok(apiDefinitions.includes('getInfo'), 'Should contain method name');
        });

        test('should handle multiple interfaces workflow', () => {
            // 配置服务
            yapiService.setConfig('https://test.yapi.com', 'test-token');

            // 创建多个接口
            const interfaces: YapiInterfaceDetail[] = [
                {
                    _id: 1,
                    title: 'Get User',
                    path: '/api/user',
                    method: 'GET',
                    catid: 1,
                    desc: 'Get user',
                    project_id: 1,
                    status: 'done',
                    req_body_type: 'json',
                    req_body_other: '',
                    req_query: [],
                    req_headers: [],
                    req_params: [],
                    res_body: JSON.stringify({
                        type: 'object',
                        properties: { id: { type: 'number' } }
                    }),
                    res_body_type: 'json',
                    markdown: '',
                    req_body_is_json_schema: false,
                    res_body_is_json_schema: true
                },
                {
                    _id: 2,
                    title: 'Create User',
                    path: '/api/user',
                    method: 'POST',
                    catid: 1,
                    desc: 'Create user',
                    project_id: 1,
                    status: 'done',
                    req_body_type: 'json',
                    req_body_other: JSON.stringify({
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            email: { type: 'string' }
                        }
                    }),
                    req_query: [],
                    req_headers: [],
                    req_params: [],
                    res_body: JSON.stringify({
                        type: 'object',
                        properties: { success: { type: 'boolean' } }
                    }),
                    res_body_type: 'json',
                    markdown: '',
                    req_body_is_json_schema: true,
                    res_body_is_json_schema: true
                }
            ];

            // 生成类型定义
            const typeDefinitions = codeGenerator.generateTypeDefinitions(interfaces);
            assert.ok(
                typeDefinitions.includes('GetUserResponse'),
                'Should contain first interface type'
            );
            assert.ok(
                typeDefinitions.includes('PostUserResponse'),
                'Should contain second interface type'
            );

            // 生成 API 定义
            const template: TemplateConfig = {
                id: 'multi-template',
                name: 'Multi Template',
                content: 'export const ${methodName} = () => {};',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            const apiDefinitions = codeGenerator.generateApiDefinitions(
                interfaces,
                template,
                'https://test.yapi.com'
            );

            assert.ok(apiDefinitions.includes('getUser'), 'Should contain GET method');
            assert.ok(apiDefinitions.includes('postUser'), 'Should contain POST method');
        });
    });

    suite('Error Recovery', () => {
        test('should handle service configuration errors gracefully', () => {
            // 测试无效配置
            yapiService.setConfig('', '');
            assert.strictEqual(
                yapiService.isConfigured(),
                false,
                'Should not be configured with empty values'
            );

            // 注意：isConfigured 只检查是否为空，不验证 URL 格式
            yapiService.setConfig('invalid-url', 'token');
            assert.strictEqual(
                yapiService.isConfigured(),
                true,
                'Should be configured with non-empty values'
            );
        });

        test('should handle code generation errors gracefully', () => {
            // 测试无效接口数据（故意使用无效 method 来测试边界情况）
            const invalidInterface = {
                _id: 1,
                title: '',
                path: '',
                method: 'INVALID', // 故意使用无效的 HTTP 方法
                catid: 1,
                desc: '',
                project_id: 1,
                status: 'done',
                req_body_type: 'json',
                req_body_other: 'invalid json',
                req_query: [],
                req_headers: [],
                req_params: [],
                res_body: 'invalid json',
                res_body_type: 'json',
                markdown: '',
                req_body_is_json_schema: false,
                res_body_is_json_schema: false
            } as unknown as YapiInterfaceDetail;

            // 应该能处理无效数据而不抛出错误
            const result = codeGenerator.generateTypeDefinitions([invalidInterface]);
            assert.ok(typeof result === 'string', 'Should return string even with invalid data');
        });

        test('should handle template errors gracefully', () => {
            const mockInterface: YapiInterfaceDetail = {
                _id: 1,
                title: 'Test',
                path: '/test',
                method: 'GET',
                catid: 1,
                desc: 'Test',
                project_id: 1,
                status: 'done',
                req_body_type: 'json',
                req_body_other: '',
                req_query: [],
                req_headers: [],
                req_params: [],
                res_body: '{}',
                res_body_type: 'json',
                markdown: '',
                req_body_is_json_schema: false,
                res_body_is_json_schema: false
            };

            // 测试无效模板
            const invalidTemplate: TemplateConfig = {
                id: 'invalid',
                name: 'Invalid',
                content: '{{invalidPlaceholder}}',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // 应该能处理无效模板
            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                invalidTemplate,
                'https://test.yapi.com'
            );
            assert.ok(typeof result === 'string', 'Should handle invalid template gracefully');
        });
    });

    suite('Component Integration', () => {
        test('should integrate YapiService and CodeGenerator', () => {
            // 配置服务
            yapiService.setConfig('https://test.yapi.com', 'test-token');

            // 模拟从 YAPI 获取的数据
            const mockInterface: YapiInterfaceDetail = {
                _id: 1,
                title: 'Integration Test',
                path: '/api/integration',
                method: 'GET',
                catid: 1,
                desc: 'Integration test interface',
                project_id: 1,
                status: 'done',
                req_body_type: 'json',
                req_body_other: '',
                req_query: [],
                req_headers: [],
                req_params: [],
                res_body: JSON.stringify({
                    type: 'object',
                    properties: {
                        result: { type: 'string' }
                    }
                }),
                res_body_type: 'json',
                markdown: '',
                req_body_is_json_schema: false,
                res_body_is_json_schema: false
            };

            // 使用 CodeGenerator 处理数据
            const typeDefinitions = codeGenerator.generateTypeDefinitions([mockInterface]);
            const defaultTemplates = CodeGenerator.getDefaultTemplates();

            assert.ok(typeDefinitions, 'Should generate types from service data');
            assert.ok(defaultTemplates.length > 0, 'Should have default templates');

            if (defaultTemplates.length > 0) {
                const apiDefinitions = codeGenerator.generateApiDefinitions(
                    [mockInterface],
                    defaultTemplates[0],
                    yapiService.getBaseUrl()
                );
                assert.ok(apiDefinitions, 'Should generate API definitions');
            }
        });

        test('should handle webview provider initialization', () => {
            // 测试 WebviewProvider 的基本功能
            assert.ok(webviewProvider, 'WebviewProvider should be created');
            assert.strictEqual(
                YapiWebviewProvider.viewType,
                'yapi2ts.explorer',
                'Should have correct view type'
            );
        });
    });
});

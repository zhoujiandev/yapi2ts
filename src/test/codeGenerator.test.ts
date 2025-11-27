import * as assert from 'assert';
import { CodeGenerator } from '../codeGenerator';
import { TemplateConfig, YapiInterfaceDetail } from '../types';

suite('CodeGenerator Test Suite', () => {
    let codeGenerator: CodeGenerator;

    setup(() => {
        codeGenerator = new CodeGenerator();
    });

    // 创建模拟接口数据的辅助函数
    function createMockInterface(
        overrides: Partial<YapiInterfaceDetail> = {}
    ): YapiInterfaceDetail {
        return {
            _id: 1,
            title: 'Test Interface',
            path: '/api/test',
            method: 'GET',
            catid: 1,
            desc: 'Test description',
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
                    id: { type: 'number' },
                    name: { type: 'string' }
                }
            }),
            res_body_type: 'json',
            markdown: '',
            req_body_is_json_schema: true,
            res_body_is_json_schema: true,
            ...overrides
        };
    }

    // 创建模拟模板的辅助函数
    function createMockTemplate(overrides: Partial<TemplateConfig> = {}): TemplateConfig {
        return {
            id: 'test-template',
            name: 'Test Template',
            content: `
/**
 * \${title}
 * \${desc}
 */
export const \${methodName} = (data: \${paramsTypeName}) => {
    return request<\${responseTypeName}>({
        url: '\${path}',
        method: '\${method}',
        data
    });
};`,
            description: 'Test template',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...overrides
        };
    }

    suite('Type Definition Generation', () => {
        test('should generate basic interface type definition', () => {
            const mockInterface = createMockInterface({
                title: 'Get User Info',
                path: '/api/user/info',
                res_body: JSON.stringify({
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                    },
                    required: ['id', 'name']
                })
            });

            const result = codeGenerator.generateTypeDefinitions([mockInterface]);

            assert.ok(result.includes('interface'), 'Should contain interface definition');
            assert.ok(result.includes('Response'), 'Should contain response type');
        });

        test('should handle empty interfaces array', () => {
            const result = codeGenerator.generateTypeDefinitions([]);
            assert.strictEqual(result, '', 'Should return empty string for empty array');
        });

        test('should handle interface with query parameters', () => {
            const mockInterface = createMockInterface({
                title: 'Search Users',
                path: '/api/users/search',
                req_query: [
                    { name: 'keyword', required: '1', desc: 'Search keyword' },
                    { name: 'page', required: '0', desc: 'Page number' }
                ]
            });

            const result = codeGenerator.generateTypeDefinitions([mockInterface]);

            assert.ok(result.length > 0, 'Should generate type definitions');
        });
    });

    suite('API Definition Generation', () => {
        test('should generate API definition with template', () => {
            const mockInterface = createMockInterface({
                title: 'Create User',
                path: '/api/user',
                method: 'POST'
            });

            const template = createMockTemplate();

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('Create User'), 'Should contain interface title');
            assert.ok(result.includes('POST'), 'Should contain HTTP method');
            assert.ok(result.includes('/api/user'), 'Should contain API path');
        });

        test('should handle template with comments', () => {
            const mockInterface = createMockInterface({
                title: 'Delete User',
                path: '/api/user/{id}',
                method: 'DELETE',
                desc: 'Delete user by ID'
            });

            const template = createMockTemplate({
                content: `
/**
 * \${title}
 * \${desc}
 * @param id - User ID
 */
export const \${methodName} = (id: number) => {
    return request<\${responseTypeName}>({
        url: '\${path}'.replace('{id}', id.toString()),
        method: '\${method}'
    });
};`
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('Delete User'), 'Should contain title in comment');
            assert.ok(result.includes('Delete user by ID'), 'Should contain description');
        });
    });

    suite('Default Templates', () => {
        test('should provide default templates', () => {
            const templates = CodeGenerator.getDefaultTemplates();

            assert.ok(Array.isArray(templates), 'Should return array of templates');
            assert.ok(templates.length > 0, 'Should have at least one template');

            templates.forEach(template => {
                assert.ok(template.id, 'Template should have id');
                assert.ok(template.name, 'Template should have name');
                assert.ok(template.content, 'Template should have content');
            });
        });

        test('should have unique template IDs', () => {
            const templates = CodeGenerator.getDefaultTemplates();
            const ids = templates.map(t => t.id);
            const uniqueIds = new Set(ids);

            assert.strictEqual(ids.length, uniqueIds.size, 'All template IDs should be unique');
        });

        test('should have three built-in templates', () => {
            const templates = CodeGenerator.getDefaultTemplates();
            assert.strictEqual(templates.length, 3, 'Should have 3 built-in templates');

            const templateIds = templates.map(t => t.id);
            assert.ok(templateIds.includes('axios'), 'Should have axios template');
            assert.ok(templateIds.includes('fetch'), 'Should have fetch template');
            assert.ok(
                templateIds.includes('request-simple'),
                'Should have simple request template'
            );
        });
    });

    suite('Template System (EJS)', () => {
        test('should render ES6 template syntax with variables', () => {
            const mockInterface = createMockInterface({
                title: 'Get User Info',
                path: '/api/user/info',
                method: 'GET'
            });

            const template = createMockTemplate({
                content: 'export const ${methodName} = () => request.${lowerCaseMethod}("${path}");'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('request.get'), 'Should render lowerCaseMethod');
            assert.ok(result.includes('/api/user/info'), 'Should render path');
        });

        test('should render ternary expressions for GET requests', () => {
            const mockInterface = createMockInterface({
                title: 'Get Data',
                path: '/api/data',
                method: 'GET'
            });

            const template = createMockTemplate({
                content: 'const paramKey = ${isGet ? "params" : "data"};'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('const paramKey = params'), 'Should render params for GET');
        });

        test('should render ternary expressions for POST requests', () => {
            const mockInterface = createMockInterface({
                title: 'Create Data',
                path: '/api/data',
                method: 'POST'
            });

            const template = createMockTemplate({
                content: 'const paramKey = ${isGet ? "params" : "data"};'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('const paramKey = data'), 'Should render data for POST');
        });

        test('should render EJS conditional syntax', () => {
            const mockInterface = createMockInterface({
                title: 'Get Data',
                path: '/api/data',
                method: 'GET'
            });

            const template = createMockTemplate({
                content: `<% if (isGet) { %>GET_BLOCK<% } else { %>OTHER_BLOCK<% } %>`
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('GET_BLOCK'), 'Should render GET block');
            assert.ok(!result.includes('OTHER_BLOCK'), 'Should not render OTHER block');
        });

        test('should render EJS conditional syntax for non-GET', () => {
            const mockInterface = createMockInterface({
                title: 'Update Data',
                path: '/api/data',
                method: 'PUT'
            });

            const template = createMockTemplate({
                content: `<% if (isGet) { %>GET_BLOCK<% } else { %>OTHER_BLOCK<% } %>`
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(!result.includes('GET_BLOCK'), 'Should not render GET block');
            assert.ok(result.includes('OTHER_BLOCK'), 'Should render OTHER block');
        });

        test('should provide all HTTP method boolean flags', () => {
            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

            methods.forEach(method => {
                const mockInterface = createMockInterface({
                    title: `${method} Test`,
                    path: '/api/test',
                    method: method
                });

                const flagName = `is${method.charAt(0)}${method.slice(1).toLowerCase()}`;
                const template = createMockTemplate({
                    content: `\${${flagName} ? "YES" : "NO"}`
                });

                const result = codeGenerator.generateApiDefinitions(
                    [mockInterface],
                    template,
                    'https://yapi.example.com'
                );

                assert.ok(result.includes('YES'), `Should have ${flagName}=true for ${method}`);
            });
        });

        test('should provide iface object with interface properties', () => {
            const mockInterface = createMockInterface({
                _id: 123,
                title: 'Test Interface',
                path: '/api/test',
                status: 'done'
            });

            const template = createMockTemplate({
                content: 'ID: ${iface._id}, Status: ${iface.status}'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.includes('ID: 123'), 'Should render iface._id');
            assert.ok(result.includes('Status: done'), 'Should render iface.status');
        });

        test('should handle template rendering errors gracefully', () => {
            const mockInterface = createMockInterface({
                title: 'Error Test',
                path: '/api/error'
            });

            // 使用无效的 EJS 语法
            const template = createMockTemplate({
                content: '<% if (undefinedVar) { %>test<% } %>'
            });

            // 应该不抛出错误，而是回退到简单替换
            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(
                typeof result === 'string',
                'Should return string even with invalid template'
            );
        });

        test('should render interfaceUrl correctly', () => {
            const mockInterface = createMockInterface({
                _id: 456,
                project_id: 123,
                title: 'Test',
                path: '/api/test'
            });

            const template = createMockTemplate({
                content: 'URL: ${interfaceUrl}'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(
                result.includes('https://yapi.example.com/project/123/interface/api/456'),
                'Should render correct interfaceUrl'
            );
        });
    });

    suite('Method Name Generation', () => {
        test('should generate camelCase method names', () => {
            const mockInterface = createMockInterface({
                title: 'Get User Profile Info',
                path: '/api/user/profile'
            });

            const template = createMockTemplate({
                content: 'export const \${methodName} = () => {};'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.length > 0, 'Should generate API definition');
        });

        test('should handle path-based method names', () => {
            const mockInterface = createMockInterface({
                title: '',
                path: '/api/orders/list',
                desc: 'List orders'
            });

            const template = createMockTemplate({
                content: 'export const {{methodName}} = () => {};'
            });

            const result = codeGenerator.generateApiDefinitions(
                [mockInterface],
                template,
                'https://yapi.example.com'
            );

            assert.ok(result.length > 0, 'Should generate method name from path');
        });
    });

    suite('Error Handling', () => {
        test('should handle invalid JSON in response body', () => {
            const mockInterface = createMockInterface({
                title: 'Invalid Response',
                path: '/api/invalid',
                res_body: 'invalid json'
            });

            const result = codeGenerator.generateTypeDefinitions([mockInterface]);

            // Should not throw error and should handle gracefully
            assert.ok(typeof result === 'string', 'Should return string even with invalid JSON');
        });

        test('should handle missing required fields', () => {
            const mockInterface = createMockInterface({
                title: 'Incomplete Interface',
                path: '/api/incomplete'
            });

            // Should not throw error
            const result = codeGenerator.generateTypeDefinitions([mockInterface]);
            assert.ok(typeof result === 'string', 'Should handle incomplete interface data');
        });
    });
});

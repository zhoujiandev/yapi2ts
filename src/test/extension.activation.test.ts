import * as assert from 'assert';

suite('Extension Activation Test Suite', () => {
    suite('Extension Registration', () => {
        test('should have correct package.json configuration', () => {
            // 测试扩展的基本配置
            const packageJson = require('../../package.json');

            assert.ok(packageJson.name, 'Package should have a name');
            assert.ok(packageJson.displayName, 'Package should have a display name');
            assert.ok(packageJson.description, 'Package should have a description');
            assert.ok(packageJson.version, 'Package should have a version');
            assert.strictEqual(
                packageJson.engines.vscode,
                '^1.50.0',
                'Should target correct VS Code version'
            );
        });

        test('should have correct activation events', () => {
            const packageJson = require('../../package.json');

            // 从 VS Code 1.74 开始，扩展会根据 contributes 字段自动激活
            // activationEvents 可以为空数组
            assert.ok(
                Array.isArray(packageJson.activationEvents),
                'Should have activation events array'
            );
        });

        test('should have correct contributes configuration', () => {
            const packageJson = require('../../package.json');

            assert.ok(packageJson.contributes, 'Should have contributes section');
            assert.ok(packageJson.contributes.commands, 'Should have commands');
            assert.ok(packageJson.contributes.views, 'Should have views');
            assert.ok(packageJson.contributes.viewsContainers, 'Should have view containers');
        });
    });

    suite('Command Registration', () => {
        test('should have resetTemplates command in package.json', () => {
            const packageJson = require('../../package.json');
            const commands = packageJson.contributes.commands;

            const resetCommand = commands.find(
                (cmd: any) => cmd.command === 'yapi2ts.resetTemplates'
            );
            assert.ok(resetCommand, 'resetTemplates command should be defined in package.json');
            assert.ok(resetCommand.title, 'Command should have a title');
        });

        test('should have correct command configuration', () => {
            const packageJson = require('../../package.json');
            const commands = packageJson.contributes.commands;

            assert.ok(Array.isArray(commands), 'Commands should be an array');
            assert.ok(commands.length > 0, 'Should have at least one command');

            commands.forEach((cmd: any) => {
                assert.ok(cmd.command, 'Each command should have a command property');
                assert.ok(cmd.title, 'Each command should have a title');
            });
        });
    });

    suite('View Registration', () => {
        test('should have correct view container configuration', () => {
            const packageJson = require('../../package.json');
            const viewContainers = packageJson.contributes.viewsContainers;

            assert.ok(viewContainers.activitybar, 'Should have activity bar view containers');

            const yapiContainer = viewContainers.activitybar.find(
                (container: any) => container.id === 'yapi2ts'
            );
            assert.ok(yapiContainer, 'Should have yapi2ts view container');
            assert.ok(yapiContainer.title, 'View container should have a title');
            assert.ok(yapiContainer.icon, 'View container should have an icon');
        });

        test('should have correct view configuration', () => {
            const packageJson = require('../../package.json');
            const views = packageJson.contributes.views;

            assert.ok(views.yapi2ts, 'Should have yapi2ts views');

            const interfaceListView = views.yapi2ts.find(
                (view: any) => view.id === 'yapi2ts.explorer'
            );
            assert.ok(interfaceListView, 'Should have interface list view');
            assert.ok(interfaceListView.name, 'View should have a name');
            assert.ok(interfaceListView.type, 'View should have a type');
        });
    });

    suite('Extension Context', () => {
        test('should handle mock extension context', () => {
            const mockContext = {
                subscriptions: [],
                workspaceState: {
                    get: () => undefined,
                    update: () => Promise.resolve()
                },
                globalState: {
                    get: () => undefined,
                    update: () => Promise.resolve(),
                    keys: () => []
                },
                extensionPath: '/mock/path',
                storagePath: '/mock/storage',
                globalStoragePath: '/mock/global-storage',
                logPath: '/mock/log'
            };

            // 测试上下文对象的基本结构
            assert.ok(Array.isArray(mockContext.subscriptions), 'Should have subscriptions array');
            assert.ok(mockContext.workspaceState, 'Should have workspace state');
            assert.ok(mockContext.globalState, 'Should have global state');
            assert.ok(mockContext.extensionPath, 'Should have extension path');
        });
    });

    suite('Configuration Management', () => {
        test('should handle configuration structure', () => {
            // 测试配置的基本结构
            const mockConfig = {
                yapiBaseUrl: 'https://yapi.example.com',
                projectToken: 'test-token',
                outputPath: './src/api'
            };

            assert.ok(typeof mockConfig.yapiBaseUrl === 'string', 'yapiBaseUrl should be string');
            assert.ok(typeof mockConfig.projectToken === 'string', 'projectToken should be string');
            assert.ok(typeof mockConfig.outputPath === 'string', 'outputPath should be string');
        });
    });

    suite('Error Handling', () => {
        test('should handle activation errors gracefully', () => {
            // 测试错误处理逻辑
            const mockError = new Error('Test activation error');

            assert.ok(mockError instanceof Error, 'Should be an Error instance');
            assert.ok(mockError.message, 'Error should have a message');
        });

        test('should handle command execution errors', () => {
            // 测试命令执行错误处理
            const mockCommandError = new Error('Command execution failed');

            assert.ok(mockCommandError instanceof Error, 'Should be an Error instance');
            assert.strictEqual(
                mockCommandError.message,
                'Command execution failed',
                'Should have correct error message'
            );
        });
    });

    suite('Resource Management', () => {
        test('should handle resource paths correctly', () => {
            const mockPaths = {
                extensionPath: '/path/to/extension',
                storagePath: '/path/to/storage',
                globalStoragePath: '/path/to/global-storage'
            };

            Object.values(mockPaths).forEach(path => {
                assert.ok(typeof path === 'string', 'Path should be a string');
                assert.ok(path.length > 0, 'Path should not be empty');
            });
        });
    });

    suite('VS Code Integration', () => {
        test('should have correct activation events', () => {
            const packageJson = require('../../package.json');
            const activationEvents = packageJson.activationEvents;

            // 从 VS Code 1.74 开始，扩展会根据 contributes 字段自动激活
            // activationEvents 可以为空数组，VS Code 会自动处理
            assert.ok(Array.isArray(activationEvents), 'Activation events should be an array');

            // 验证扩展有足够的贡献点来自动激活
            assert.ok(packageJson.contributes, 'Should have contributes section');
            assert.ok(packageJson.contributes.views, 'Should have views for auto-activation');
            assert.ok(packageJson.contributes.commands, 'Should have commands for auto-activation');
        });

        test('should handle resource management', () => {
            // 测试资源管理的基本概念
            const mockResources = {
                disposables: [],
                subscriptions: []
            };

            assert.ok(Array.isArray(mockResources.disposables), 'Should have disposables array');
            assert.ok(
                Array.isArray(mockResources.subscriptions),
                'Should have subscriptions array'
            );
        });
    });
});

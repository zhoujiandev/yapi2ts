import * as vscode from 'vscode';
import { CodeGenerator } from './codeGenerator';
import { ApiError, AuthenticationError, NetworkError, TimeoutError } from './errors';
import {
    CollaborationConfig,
    ProjectConfig,
    TemplateConfig,
    WebviewMessage,
    YapiInterfaceDetail,
    YapiProject
} from './types';
import { loadTemplate } from './utils/templateLoader';
import { YapiService } from './yapiService';

export class YapiWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'yapi2ts.explorer';

    private _view?: vscode.WebviewView;
    private yapiService: YapiService;
    private codeGenerator: CodeGenerator;
    private templates: TemplateConfig[] = [];
    private projects: ProjectConfig[] = [];
    private disposables: vscode.Disposable[] = [];
    private timers: NodeJS.Timeout[] = [];
    private isCollabMode: boolean = false;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly context: vscode.ExtensionContext
    ) {
        this.yapiService = new YapiService();
        this.codeGenerator = new CodeGenerator();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 监听来自WebView的消息
        const messageDisposable = webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('Received message from webview:', message);
                this.handleMessage(message);
            },
            undefined,
            this.disposables
        );

        // 恢复状态并发送初始数据
        const timer = setTimeout(async () => {
            console.log('WebView ready, starting initialization...');
            this.restoreState();
            await this.sendInitialData();
        }, 500); // 增加延迟时间，确保webview完全加载
        this.timers.push(timer);

        // 注册清理函数
        webviewView.onDidDispose(
            () => {
                this.dispose();
            },
            null,
            this.disposables
        );
    }

    private restoreState() {
        // 从扩展上下文恢复配置
        const yapiUrl = this.context.globalState.get<string>('yapi2ts.yapiUrl', '');
        const projectToken = this.context.globalState.get<string>('yapi2ts.projectToken', '');

        if (yapiUrl && projectToken) {
            this.yapiService.setConfig(yapiUrl, projectToken);
        }
    }

    private async sendInitialData() {
        if (this._view) {
            // 确保模板和项目数据已加载
            await this.loadTemplates();
            await this.loadProjects();

            console.log(
                'Sending initial data, templates:',
                this.templates.length,
                'projects:',
                this.projects.length
            );

            // 发送模板数据和状态
            const yapiUrl = this.context.globalState.get<string>('yapi2ts.yapiUrl', '');
            const projectToken = this.context.globalState.get<string>('yapi2ts.projectToken', '');

            this._view.webview.postMessage({
                type: 'templatesLoaded',
                templates: this.templates
            });

            this._view.webview.postMessage({
                type: 'projectsLoaded',
                projects: this.projects
            });

            // 恢复协同模式状态
            this.isCollabMode = this.context.globalState.get<boolean>('yapi2ts.collabMode', false);
            const collabConfig = this.getCollaborationConfig();
            this._view.webview.postMessage({
                type: 'collabModeChanged',
                enabled: this.isCollabMode,
                config: collabConfig
            });

            // 如果有保存的配置，发送给前端
            if (yapiUrl && projectToken) {
                this._view.webview.postMessage({
                    type: 'configRestored',
                    yapiUrl: yapiUrl,
                    projectToken: projectToken
                });
            }
        }
    }

    private async handleMessage(message: WebviewMessage) {
        switch (message.type) {
            case 'setConfig':
                if (message.yapiUrl && message.projectToken) {
                    await this.handleSetConfig(message.yapiUrl, message.projectToken);
                }
                break;
            case 'loadInterfaces':
                await this.handleLoadInterfaces();
                break;
            case 'generateTypes':
                if (message.interfaceIds) {
                    await this.handleGenerateTypes(message.interfaceIds);
                }
                break;
            case 'generateApi':
                if (message.interfaceIds && message.templateId) {
                    await this.handleGenerateApi(message.interfaceIds, message.templateId);
                }
                break;
            case 'generateAll':
                if (message.interfaceIds && message.templateId) {
                    await this.handleGenerateAll(message.interfaceIds, message.templateId);
                }
                break;
            case 'saveTemplate':
                if (message.template) {
                    await this.handleSaveTemplate(message.template);
                }
                break;
            case 'deleteTemplate':
                if (message.templateId) {
                    await this.handleDeleteTemplate(message.templateId);
                }
                break;
            case 'loadTemplates':
                await this.handleLoadTemplates();
                break;
            case 'saveProject':
                if (message.project) {
                    await this.handleSaveProject(message.project);
                }
                break;
            case 'deleteProject':
                if (message.projectId) {
                    await this.handleDeleteProject(message.projectId);
                }
                break;
            case 'loadProjects':
                await this.handleLoadProjects();
                break;
            case 'copyPath':
                if (message.path) {
                    await this.handleCopyPath(message.path);
                }
                break;
            case 'copyYapiUrl':
                if (message.interfaceId) {
                    await this.handleCopyYapiUrl(message.interfaceId);
                }
                break;
            case 'copyTemplate':
                if (message.content) {
                    await this.handleCopyTemplate(message.content);
                }
                break;
            case 'copyTemplateExample':
                if (message.content) {
                    await this.handleCopyTemplateExample(message.content);
                }
                break;
            case 'setCollabMode':
                await this.handleSetCollabMode(message.enabled ?? false);
                break;
        }
    }

    private async handleSetConfig(yapiUrl: string, projectToken: string) {
        try {
            this.yapiService.setConfig(yapiUrl, projectToken);

            // 保存配置到扩展状态
            await this.context.globalState.update('yapi2ts.yapiUrl', yapiUrl);
            await this.context.globalState.update('yapi2ts.projectToken', projectToken);

            const connectionResult = await this.yapiService.testConnection();

            this._view?.webview.postMessage({
                type: 'configResult',
                success: connectionResult.success,
                message: connectionResult.success ? '连接成功' : '连接失败，请检查项目配置和网络'
            });

            if (connectionResult.success && connectionResult.project) {
                // 保存项目信息到 globalState
                await this.context.globalState.update(
                    'yapi2ts.projectInfo',
                    connectionResult.project
                );

                // 先通知前端展开树目录
                this._view?.webview.postMessage({
                    type: 'expandTree'
                });

                // 稍微延迟后再加载接口，确保树展开动画完成
                const loadTimer = setTimeout(() => {
                    this.handleLoadInterfaces();
                }, 300);
                this.timers.push(loadTimer);
            }
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this._view?.webview.postMessage({
                type: 'configResult',
                success: false,
                message: `连接失败: ${errorMessage}`
            });
        }
    }

    private async handleLoadInterfaces() {
        try {
            // 检查是否已配置
            if (!this.yapiService.isConfigured()) {
                this._view?.webview.postMessage({
                    type: 'interfacesLoadFailed',
                    error: '请先配置YAPI地址和项目Token'
                });
                return;
            }

            // 通知 Webview：开始加载接口，展示 loading
            this._view?.webview.postMessage({
                type: 'interfacesLoading'
            });

            // 从 globalState 获取项目信息和接口数据
            const projectInfo = this.context.globalState.get('yapi2ts.projectInfo');
            const { categories, interfaces } = await this.yapiService.getAllInterfaces();

            this._view?.webview.postMessage({
                type: 'interfacesLoaded',
                categories,
                interfaces,
                projectInfo,
                updateTime: Date.now()
            });
        } catch (error) {
            const errorMessage = this.getDetailedErrorMessage(error);
            // 通知 Webview：加载失败，隐藏 loading 并显示错误
            this._view?.webview.postMessage({
                type: 'interfacesLoadFailed',
                error: errorMessage.message,
                detail: errorMessage.detail,
                actions: errorMessage.actions
            });
            this.sendNotification(`加载接口失败: ${errorMessage.message}`, 'error');
        }
    }

    private async handleGenerateTypes(interfaceIds: number[]) {
        try {
            // 获取接口详情
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);

            // 按分类分组接口
            const interfacesByCategory = new Map<number, YapiInterfaceDetail[]>();
            interfaces.forEach(iface => {
                if (!interfacesByCategory.has(iface.catid)) {
                    interfacesByCategory.set(iface.catid, []);
                }
                interfacesByCategory.get(iface.catid)!.push(iface);
            });

            // 为每个分类获取完整的接口列表用于命名冲突计算
            const categoryInterfacesMap = new Map<number, YapiInterfaceDetail[]>();
            for (const catId of interfacesByCategory.keys()) {
                try {
                    const categoryInterfaceList = await this.yapiService.getInterfaceList(
                        catId,
                        1,
                        1000
                    );
                    const allCategoryInterfaceIds = categoryInterfaceList.list.map(
                        iface => iface._id
                    );
                    const categoryInterfaces =
                        await this.yapiService.getInterfaceDetails(allCategoryInterfaceIds);
                    categoryInterfacesMap.set(catId, categoryInterfaces);
                } catch (error) {
                    console.warn(`Failed to get interfaces for category ${catId}:`, error);
                    // 如果获取失败，至少使用当前选中的接口
                    categoryInterfacesMap.set(catId, interfacesByCategory.get(catId) || []);
                }
            }

            // 生成类型定义，传入分类接口映射
            const typeDefinitions = this.codeGenerator.generateTypeDefinitions(
                interfaces,
                categoryInterfacesMap
            );

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(typeDefinitions);

            // 发送成功消息给前端
            this._view?.webview.postMessage({
                type: 'generateTypesResult',
                success: true,
                message: `已生成 ${interfaces.length} 个接口的类型定义并复制到剪贴板`
            });
        } catch (error) {
            console.error('Generate types error:', error);

            // 发送失败消息给前端
            this._view?.webview.postMessage({
                type: 'generateTypesResult',
                success: false,
                message: `生成类型定义失败: ${error}`
            });

            this.sendNotification(`生成类型定义失败: ${error}`, 'error');
        }
    }

    private async handleGenerateApi(interfaceIds: number[], templateId: string) {
        try {
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);
            const template = this.templates.find(t => t.id === templateId);

            if (!template) {
                // 发送失败消息给前端
                this._view?.webview.postMessage({
                    type: 'generateApiResult',
                    success: false,
                    message: '未找到指定的模板'
                });

                this.sendNotification('未找到指定的模板', 'error');
                return;
            }

            // 从接口信息中提取分类信息，构建分类接口映射
            let categoryInterfacesMap: Map<number, YapiInterfaceDetail[]> | undefined;

            // 获取所有涉及的分类ID
            const categoryIds = [...new Set(interfaces.map(iface => iface.catid))];

            if (categoryIds.length > 0) {
                categoryInterfacesMap = new Map();

                // 为每个分类获取其所有接口
                for (const catId of categoryIds) {
                    try {
                        const categoryInterfaceList = await this.yapiService.getInterfaceList(
                            catId,
                            1,
                            1000
                        );
                        const allCategoryInterfaceIds = categoryInterfaceList.list.map(
                            iface => iface._id
                        );
                        const allCategoryInterfaces =
                            await this.yapiService.getInterfaceDetails(allCategoryInterfaceIds);
                        categoryInterfacesMap.set(catId, allCategoryInterfaces);
                    } catch (error) {
                        console.warn(`Failed to get interfaces for category ${catId}:`, error);
                    }
                }
            }

            const apiDefinitions = this.codeGenerator.generateApiDefinitions(
                interfaces,
                template,
                this.yapiService.getBaseUrl(),
                categoryInterfacesMap
            );

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(apiDefinitions);

            // 发送成功消息给前端
            this._view?.webview.postMessage({
                type: 'generateApiResult',
                success: true,
                message: `已复制 ${interfaceIds.length} 个接口的API定义到剪贴板`
            });
        } catch (error) {
            // 发送失败消息给前端
            this._view?.webview.postMessage({
                type: 'generateApiResult',
                success: false,
                message: `生成API定义失败: ${error}`
            });

            this.sendNotification(`生成API定义失败: ${error}`, 'error');
        }
    }

    private async handleGenerateAll(interfaceIds: number[], templateId: string) {
        try {
            // 获取接口详情
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);
            const template = this.templates.find(t => t.id === templateId);

            if (!template) {
                this._view?.webview.postMessage({
                    type: 'generateAllResult',
                    success: false,
                    message: '未找到指定的模板'
                });
                this.sendNotification('未找到指定的模板', 'error');
                return;
            }

            // 按分类分组接口
            const interfacesByCategory = new Map<number, YapiInterfaceDetail[]>();
            interfaces.forEach(iface => {
                if (!interfacesByCategory.has(iface.catid)) {
                    interfacesByCategory.set(iface.catid, []);
                }
                interfacesByCategory.get(iface.catid)!.push(iface);
            });

            // 为每个分类获取完整的接口列表用于命名冲突计算
            const categoryInterfacesMap = new Map<number, YapiInterfaceDetail[]>();
            for (const catId of interfacesByCategory.keys()) {
                try {
                    const categoryInterfaceList = await this.yapiService.getInterfaceList(
                        catId,
                        1,
                        1000
                    );
                    const allCategoryInterfaceIds = categoryInterfaceList.list.map(
                        iface => iface._id
                    );
                    const categoryInterfaces =
                        await this.yapiService.getInterfaceDetails(allCategoryInterfaceIds);
                    categoryInterfacesMap.set(catId, categoryInterfaces);
                } catch (error) {
                    console.warn(`Failed to get interfaces for category ${catId}:`, error);
                    // 如果获取失败，至少使用当前选中的接口
                    categoryInterfacesMap.set(catId, interfacesByCategory.get(catId) || []);
                }
            }

            // 生成类型定义
            const typeDefinitions = this.codeGenerator.generateTypeDefinitions(
                interfaces,
                categoryInterfacesMap
            );

            // 生成API定义
            const apiDefinitions = this.codeGenerator.generateApiDefinitions(
                interfaces,
                template,
                this.yapiService.getBaseUrl(),
                categoryInterfacesMap
            );

            // 合并输出：类型定义 + 空行 + API定义
            const completeCode = `${typeDefinitions}\n\n${apiDefinitions}`;

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(completeCode);

            // 发送成功消息给前端
            this._view?.webview.postMessage({
                type: 'generateAllResult',
                success: true,
                message: `已生成并复制 ${interfaces.length} 个接口的完整代码（类型定义 + API代码）`
            });
        } catch (error) {
            console.error('Generate all error:', error);

            // 发送失败消息给前端
            this._view?.webview.postMessage({
                type: 'generateAllResult',
                success: false,
                message: `生成完整代码失败: ${error}`
            });

            this.sendNotification(`生成完整代码失败: ${error}`, 'error');
        }
    }

    private async handleSaveTemplate(template: TemplateConfig) {
        try {
            const existingIndex = this.templates.findIndex(t => t.id === template.id);

            if (existingIndex >= 0) {
                this.templates[existingIndex] = { ...template, updatedAt: Date.now() };
            } else {
                this.templates.push({ ...template, createdAt: Date.now(), updatedAt: Date.now() });
            }

            await this.saveTemplates();

            this._view?.webview.postMessage({
                type: 'templateSaved',
                template
            });

            this.sendNotification('模板保存成功', 'success');
        } catch (error) {
            this.sendNotification(`保存模板失败: ${error}`, 'error');
        }
    }

    private async handleDeleteTemplate(templateId: string) {
        try {
            this.templates = this.templates.filter(t => t.id !== templateId);
            await this.saveTemplates();

            this._view?.webview.postMessage({
                type: 'templateDeleted',
                templateId
            });

            this.sendNotification('模板删除成功', 'success');
        } catch (error) {
            this.sendNotification(`删除模板失败: ${error}`, 'error');
        }
    }

    private async handleLoadTemplates() {
        console.log('handleLoadTemplates', this.templates, this._view?.webview);
        this._view?.webview.postMessage({
            type: 'templatesLoaded',
            templates: this.templates
        });
    }

    private async loadTemplates() {
        try {
            const stored = this.context.globalState.get<TemplateConfig[]>('yapi2ts.templates');
            if (stored && stored.length > 0) {
                this.templates = stored;
            } else {
                // 使用默认模板
                this.templates = CodeGenerator.getDefaultTemplates();
                await this.saveTemplates();
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.templates = CodeGenerator.getDefaultTemplates();
        }
    }

    private async saveTemplates() {
        await this.context.globalState.update('yapi2ts.templates', this.templates);
    }

    private async handleSaveProject(project: ProjectConfig) {
        try {
            const existingIndex = this.projects.findIndex(p => p.id === project.id);
            if (existingIndex >= 0) {
                this.projects[existingIndex] = { ...project, updatedAt: Date.now() };
            } else {
                this.projects.push({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
            }
            await this.saveProjects();
            this._view?.webview.postMessage({
                type: 'projectsLoaded',
                projects: this.projects
            });
            this.sendNotification('项目保存成功', 'success');
        } catch (error) {
            this.sendNotification(`保存项目失败: ${error}`, 'error');
        }
    }

    private async handleDeleteProject(projectId: string) {
        try {
            this.projects = this.projects.filter(p => p.id !== projectId);
            await this.saveProjects();
            this._view?.webview.postMessage({
                type: 'projectsLoaded',
                projects: this.projects
            });
            this.sendNotification('项目删除成功', 'success');
        } catch (error) {
            this.sendNotification(`删除项目失败: ${error}`, 'error');
        }
    }

    private async handleLoadProjects() {
        try {
            this._view?.webview.postMessage({
                type: 'projectsLoaded',
                projects: this.projects
            });
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    }

    private async handleCopyPath(path: string) {
        try {
            await vscode.env.clipboard.writeText(path);
            this.sendNotification(`路径已复制: ${path}`, 'success');
        } catch (error) {
            console.error('Failed to copy path:', error);
            this.sendNotification('复制路径失败', 'error');
        }
    }

    private async handleCopyYapiUrl(interfaceId: string) {
        try {
            // 获取当前配置的YAPI URL和项目信息
            const yapiUrl = this.context.globalState.get<string>('yapi2ts.yapiUrl', '');
            const projectInfo = this.context.globalState.get<YapiProject>('yapi2ts.projectInfo');

            if (!yapiUrl || !projectInfo) {
                this.sendNotification('请先配置YAPI地址和项目Token', 'error');
                return;
            }

            // 构建YAPI接口地址
            const yapiInterfaceUrl = `${yapiUrl}/project/${projectInfo._id}/interface/api/${interfaceId}`;

            await vscode.env.clipboard.writeText(yapiInterfaceUrl);
            this.sendNotification(`YAPI接口地址已复制: ${yapiInterfaceUrl}`, 'success');
        } catch (error) {
            console.error('Failed to copy YAPI URL:', error);
            this.sendNotification('复制YAPI接口地址失败', 'error');
        }
    }

    private async handleCopyTemplate(content: string) {
        try {
            await vscode.env.clipboard.writeText(content);
            this.sendNotification('模板内容已复制到剪贴板', 'success');
        } catch (error) {
            console.error('Failed to copy template:', error);
            this.sendNotification('复制模板内容失败', 'error');
        }
    }

    private async handleCopyTemplateExample(content: string) {
        try {
            await vscode.env.clipboard.writeText(content);
            this.sendNotification('示例模板已复制到剪贴板', 'success');
        } catch (error) {
            console.error('Failed to copy template example:', error);
            this.sendNotification('复制示例模板失败', 'error');
        }
    }

    private async handleSetCollabMode(enabled: boolean) {
        try {
            this.isCollabMode = enabled;

            // 保存协同模式状态到扩展状态
            await this.context.globalState.update('yapi2ts.collabMode', enabled);

            // 读取协同配置
            const collabConfig = this.getCollaborationConfig();

            // 发送状态更新给前端
            this._view?.webview.postMessage({
                type: 'collabModeChanged',
                enabled: enabled,
                config: collabConfig
            });

            if (enabled) {
                if (collabConfig && collabConfig.yapiUrl && collabConfig.projectToken) {
                    this.sendNotification('协同模式已开启', 'success');
                } else {
                    this.sendNotification(
                        '协同模式已开启，但配置不完整，请检查 .vscode/settings.json',
                        'info'
                    );
                }
            } else {
                this.sendNotification('协同模式已关闭', 'info');
            }
        } catch (error) {
            console.error('Failed to set collab mode:', error);
            this.sendNotification('设置协同模式失败', 'error');
        }
    }

    private getCollaborationConfig(): CollaborationConfig | null {
        try {
            const config = vscode.workspace.getConfiguration('yapi2ts');
            const collaboration = config.get<CollaborationConfig>('collaboration');
            return collaboration || null;
        } catch (error) {
            console.error('Failed to get collaboration config:', error);
            return null;
        }
    }

    private sendNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'notification',
                message,
                notificationType: type
            });
        }
    }

    private async loadProjects() {
        try {
            const stored = this.context.globalState.get<ProjectConfig[]>('yapi2ts.projects');
            if (stored && stored.length > 0) {
                this.projects = stored;
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
        }
    }

    private async saveProjects() {
        await this.context.globalState.update('yapi2ts.projects', this.projects);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // 获取样式和脚本的URI
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        // 使用nonce来确保安全
        const nonce = getNonce();

        // 从外部模板文件加载 HTML
        return loadTemplate(this._extensionUri, 'webview.html', {
            cspSource: webview.cspSource,
            nonce,
            styleResetUri: styleResetUri.toString(),
            styleVSCodeUri: styleVSCodeUri.toString(),
            styleMainUri: styleMainUri.toString(),
            scriptUri: scriptUri.toString()
        });
    }

    /**
     * 清理资源，防止内存泄漏
     */
    private dispose(): void {
        // 清理所有定时器
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];

        // 清理所有 disposables
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        console.log('YapiWebviewProvider disposed');
    }

    /**
     * 获取错误消息
     */
    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    /**
     * 获取详细的错误信息，包含可操作的建议
     */
    private getDetailedErrorMessage(error: unknown): {
        message: string;
        detail?: string;
        actions?: Array<{ label: string; command: string }>;
    } {
        let message = '加载失败';
        let detail: string | undefined;
        let actions: Array<{ label: string; command: string }> | undefined;

        if (error instanceof TimeoutError) {
            message = '请求超时';
            detail = `连接 YAPI 服务器超时 (${error.timeout}ms)，请检查网络连接`;
            actions = [
                { label: '重试', command: 'retry' },
                { label: '检查网络', command: 'checkNetwork' }
            ];
        } else if (error instanceof AuthenticationError) {
            message = '认证失败';
            detail = 'Token 无效或已过期，请重新配置';
            actions = [{ label: '配置 Token', command: 'configureToken' }];
        } else if (error instanceof ApiError) {
            message = `API 错误 (${error.statusCode})`;
            detail = error.message;
            if (error.statusCode === 404) {
                actions = [{ label: '检查配置', command: 'checkConfig' }];
            }
        } else if (error instanceof NetworkError) {
            message = '网络错误';
            detail = '无法连接到 YAPI 服务器，请检查网络和服务器地址';
            actions = [
                { label: '重试', command: 'retry' },
                { label: '检查配置', command: 'checkConfig' }
            ];
        } else if (error instanceof Error) {
            message = '未知错误';
            detail = error.message;
        } else {
            message = '未知错误';
            detail = String(error);
        }

        return { message, detail, actions };
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

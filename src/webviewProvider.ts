import * as vscode from 'vscode';
import { CodeGenerator } from './codeGenerator';
import { ProjectConfig, TemplateConfig, YapiInterfaceDetail } from './types';
import { YapiService } from './yapiService';

export class YapiWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'yapi2ts.explorer';

    private _view?: vscode.WebviewView;
    private yapiService: YapiService;
    private codeGenerator: CodeGenerator;
    private templates: TemplateConfig[] = [];
    private projects: ProjectConfig[] = [];

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
        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('Received message from webview:', message);
                this.handleMessage(message);
            },
            undefined,
            this.context.subscriptions
        );

        // 恢复状态并发送初始数据
        setTimeout(async () => {
            console.log('WebView ready, starting initialization...');
            this.restoreState();
            await this.sendInitialData();
        }, 500); // 增加延迟时间，确保webview完全加载
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

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'setConfig':
                await this.handleSetConfig(message.yapiUrl, message.projectToken);
                break;
            case 'loadInterfaces':
                await this.handleLoadInterfaces();
                break;
            case 'generateTypes':
                await this.handleGenerateTypes(message.interfaceIds, message.categoryId);
                break;
            case 'generateApi':
                await this.handleGenerateApi(
                    message.interfaceIds,
                    message.templateId,
                    message.categoryId
                );
                break;
            case 'saveTemplate':
                await this.handleSaveTemplate(message.template);
                break;
            case 'deleteTemplate':
                await this.handleDeleteTemplate(message.templateId);
                break;
            case 'loadTemplates':
                await this.handleLoadTemplates();
                break;
            case 'saveProject':
                await this.handleSaveProject(message.project);
                break;
            case 'deleteProject':
                await this.handleDeleteProject(message.projectId);
                break;
            case 'loadProjects':
                await this.handleLoadProjects();
                break;
            case 'copyPath':
                await this.handleCopyPath(message.path);
                break;
            case 'copyYapiUrl':
                await this.handleCopyYapiUrl(message.interfaceId);
                break;
            case 'copyTemplate':
                await this.handleCopyTemplate(message.content);
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
                message: connectionResult.success ? '连接成功' : '连接失败，请检查配置'
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
                setTimeout(() => {
                    this.handleLoadInterfaces();
                }, 300);
            }
        } catch (error) {
            this._view?.webview.postMessage({
                type: 'configResult',
                success: false,
                message: `连接失败: ${error}`
            });
        }
    }

    private async handleLoadInterfaces() {
        try {
            // 通知 Webview：开始加载接口，展示 loading
            this._view?.webview.postMessage({
                type: 'interfacesLoading'
            });

            const { categories, interfaces } = await this.yapiService.getAllInterfaces();

            this._view?.webview.postMessage({
                type: 'interfacesLoaded',
                categories,
                interfaces
            });
        } catch (error) {
            // 通知 Webview：加载失败，隐藏 loading 并显示错误
            this._view?.webview.postMessage({
                type: 'interfacesLoadFailed',
                error: String(error)
            });
            vscode.window.showErrorMessage(`加载接口失败: ${error}`);
        }
    }

    private async handleGenerateTypes(interfaceIds: number[], categoryId?: number) {
        try {
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);

            // 如果提供了categoryId，获取该分类下的所有接口用于命名冲突计算
            let allCategoryInterfaces: YapiInterfaceDetail[] | undefined;
            if (categoryId) {
                try {
                    const categoryInterfaceList = await this.yapiService.getInterfaceList(
                        categoryId,
                        1,
                        1000
                    );
                    const allCategoryInterfaceIds = categoryInterfaceList.list.map(
                        iface => iface._id
                    );
                    allCategoryInterfaces =
                        await this.yapiService.getInterfaceDetails(allCategoryInterfaceIds);
                } catch (error) {
                    console.warn(
                        'Failed to get all category interfaces for naming consistency:',
                        error
                    );
                }
            }

            const typeDefinitions = this.codeGenerator.generateTypeDefinitions(
                interfaces,
                allCategoryInterfaces
            );

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(typeDefinitions);

            // 发送成功消息给前端
            this._view?.webview.postMessage({
                type: 'generateTypesResult',
                success: true,
                message: `已复制 ${interfaceIds.length} 个接口的类型定义到剪贴板`
            });
        } catch (error) {
            // 发送失败消息给前端
            this._view?.webview.postMessage({
                type: 'generateTypesResult',
                success: false,
                message: `生成类型定义失败: ${error}`
            });

            vscode.window.showErrorMessage(`生成类型定义失败: ${error}`);
        }
    }

    private async handleGenerateApi(
        interfaceIds: number[],
        templateId: string,
        categoryId?: number
    ) {
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

                vscode.window.showErrorMessage('未找到指定的模板');
                return;
            }

            // 如果提供了categoryId，获取该分类下的所有接口用于命名冲突计算
            let allCategoryInterfaces: YapiInterfaceDetail[] | undefined;
            if (categoryId) {
                try {
                    const categoryInterfaceList = await this.yapiService.getInterfaceList(
                        categoryId,
                        1,
                        1000
                    );
                    const allCategoryInterfaceIds = categoryInterfaceList.list.map(
                        iface => iface._id
                    );
                    allCategoryInterfaces =
                        await this.yapiService.getInterfaceDetails(allCategoryInterfaceIds);
                } catch (error) {
                    console.warn(
                        'Failed to get all category interfaces for naming consistency:',
                        error
                    );
                }
            }

            const apiDefinitions = this.codeGenerator.generateApiDefinitions(
                interfaces,
                template,
                this.yapiService.getBaseUrl(),
                allCategoryInterfaces
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

            vscode.window.showErrorMessage(`生成API定义失败: ${error}`);
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

            vscode.window.showInformationMessage('模板保存成功');
        } catch (error) {
            vscode.window.showErrorMessage(`保存模板失败: ${error}`);
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

            vscode.window.showInformationMessage('模板删除成功');
        } catch (error) {
            vscode.window.showErrorMessage(`删除模板失败: ${error}`);
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
            vscode.window.showInformationMessage('项目保存成功');
        } catch (error) {
            vscode.window.showErrorMessage(`保存项目失败: ${error}`);
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
            vscode.window.showInformationMessage('项目删除成功');
        } catch (error) {
            vscode.window.showErrorMessage(`删除项目失败: ${error}`);
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
            vscode.window.showInformationMessage(`路径已复制: ${path}`);
        } catch (error) {
            console.error('Failed to copy path:', error);
            vscode.window.showErrorMessage('复制路径失败');
        }
    }

    private async handleCopyYapiUrl(interfaceId: string) {
        try {
            // 获取当前配置的YAPI URL和项目信息
            const yapiUrl = this.context.globalState.get<string>('yapi2ts.yapiUrl', '');
            const projectInfo = this.context.globalState.get<any>('yapi2ts.projectInfo');

            if (!yapiUrl || !projectInfo) {
                vscode.window.showErrorMessage('请先配置YAPI地址和项目Token');
                return;
            }

            // 构建YAPI接口地址
            const yapiInterfaceUrl = `${yapiUrl}/project/${projectInfo._id}/interface/api/${interfaceId}`;

            await vscode.env.clipboard.writeText(yapiInterfaceUrl);
            vscode.window.showInformationMessage(`YAPI接口地址已复制: ${yapiInterfaceUrl}`);
        } catch (error) {
            console.error('Failed to copy YAPI URL:', error);
            vscode.window.showErrorMessage('复制YAPI接口地址失败');
        }
    }

    private async handleCopyTemplate(content: string) {
        try {
            await vscode.env.clipboard.writeText(content);
            vscode.window.showInformationMessage('模板内容已复制到剪贴板');
        } catch (error) {
            console.error('Failed to copy template:', error);
            vscode.window.showErrorMessage('复制模板内容失败');
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

    private _getHtmlForWebview(webview: vscode.Webview) {
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

        return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} https:; font-src ${webview.cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>YAPI to TypeScript</title>
      </head>
      <body>
        <div class="container">
          <div class="tabs">
            <button class="tab-button active" data-tab="interfaces">接口列表</button>
            <button class="tab-button" data-tab="projects">我的项目</button>
            <button class="tab-button" data-tab="templates">我的模板</button>
          </div>

          <div id="interfaces-tab" class="tab-content active">
            <div class="config-section">
              <div class="form-group inline-form">
                <select id="project-select">
                  <option value="">选择项目</option>
                </select>
                <button id="connect-btn" class="btn btn-primary">连接</button>
              </div>
            </div>

            <div class="interface-search">
                <input type="text" id="interface-search-input" placeholder="输入接口路径，支持模糊匹配项目中所有接口">
                <button id="interface-clear-btn" class="btn-icon" title="清空">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                </button>
                <button id="interface-search-btn" class="btn-icon" title="搜索">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
                </button>
            </div>
              <div class="interface-section">
                <div class="interface-tree collapsible" id="interface-tree">
                  <div class="tree-header">
                    <button id="tree-toggle-btn" class="tree-toggle-btn" title="展开/收缩菜单">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </button>
                    <span class="tree-title">接口菜单</span>
                  </div>
                  <div class="tree-content">
                    <div class="loading">请先选择项目</div>
                  </div>
                </div>
              <div class="interface-table">
                <div class="table-header">
                  <h3>接口列表 <span id="selected-category" class="selected-category"></span> <span id="selected-count" class="selected-count">(已选中 0 个)</span></h3>
                  <div class="table-actions">
                    <button id="generate-types-btn" class="btn btn-secondary">复制参数</button>
                    <div class="action-group api-generation-group">
                        <select id="template-select">
                          <option value="">选择模板</option>
                        </select>
                        <button id="generate-api-btn" class="btn btn-primary">复制API</button>
                    </div>
                  </div>
                </div>
                <div class="table-content" id="table-content">
                  <div class="loading">暂无数据</div>
                </div>
              </div>
            </div>
          </div>

          <div id="projects-tab" class="tab-content">
            <div class="project-section">
              <div class="project-header">
                <h3>项目管理</h3>
                <button id="add-project-btn" class="btn btn-primary">新增项目</button>
              </div>
              <div class="project-list" id="project-list">
                <div class="loading">加载中...</div>
              </div>
            </div>
          </div>

          <div id="templates-tab" class="tab-content">
            <div class="template-section">
              <div class="template-header">
                <h3>模板管理</h3>
                <button id="add-template-btn" class="btn btn-primary">新增模板</button>
              </div>
              <div class="template-description">
                <p class="description-text">
                  您可以创建自定义模板来生成符合项目规范的TypeScript接口定义代码。
                  模板使用ES6模板字符串语法，支持变量替换，示例 <code>/**
 * @description \${title}
 * @url \${interfaceUrl}
 */
export const \${methodName} = (params: \${paramsTypeName},config:Omit&lt;AxiosRequestConfig,\${isNotGet?'"data"':'"params"'}&gt;): Promise&lt;\${responseTypeName}&gt; => {
  return axios.\${lowerCaseMethod}('\${path}', \${isNotGet ? 'params,config' : '{params,...config}'})    
};</code> 
                </p>
                <p class="tip-text">
                  💡 建议：在编辑器中编写模板代码，这样可以获得语法高亮和代码提示，复制粘贴到模板编辑器中。
                </p>
              </div>
              <div class="template-list" id="template-list">
                <div class="loading">加载中...</div>
              </div>
            </div>
          </div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
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

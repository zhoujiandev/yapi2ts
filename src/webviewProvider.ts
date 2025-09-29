import * as vscode from 'vscode';
import { CodeGenerator } from './codeGenerator';
import { ProjectConfig, TemplateConfig } from './types';
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
        // this.loadTemplates();
        // this.loadProjects();
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
                await this.handleGenerateTypes(message.interfaceIds);
                break;
            case 'generateApi':
                await this.handleGenerateApi(message.interfaceIds, message.templateId);
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
        }
    }

    private async handleSetConfig(yapiUrl: string, projectToken: string) {
        try {
            this.yapiService.setConfig(yapiUrl, projectToken);

            // 保存配置到扩展状态
            await this.context.globalState.update('yapi2ts.yapiUrl', yapiUrl);
            await this.context.globalState.update('yapi2ts.projectToken', projectToken);

            const isConnected = await this.yapiService.testConnection();

            this._view?.webview.postMessage({
                type: 'configResult',
                success: isConnected,
                message: isConnected ? '连接成功' : '连接失败，请检查配置'
            });

            if (isConnected) {
                await this.handleLoadInterfaces();
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
            const { categories, interfaces } = await this.yapiService.getAllInterfaces();

            this._view?.webview.postMessage({
                type: 'interfacesLoaded',
                categories,
                interfaces
            });
        } catch (error) {
            vscode.window.showErrorMessage(`加载接口失败: ${error}`);
        }
    }

    private async handleGenerateTypes(interfaceIds: number[]) {
        try {
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);
            const typeDefinitions = this.codeGenerator.generateTypeDefinitions(interfaces);

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(typeDefinitions);

            vscode.window.showInformationMessage(
                `已复制 ${interfaceIds.length} 个接口的类型定义到剪贴板`
            );
        } catch (error) {
            vscode.window.showErrorMessage(`生成类型定义失败: ${error}`);
        }
    }

    private async handleGenerateApi(interfaceIds: number[], templateId: string) {
        try {
            const interfaces = await this.yapiService.getInterfaceDetails(interfaceIds);
            const template = this.templates.find(t => t.id === templateId);

            if (!template) {
                vscode.window.showErrorMessage('未找到指定的模板');
                return;
            }

            const apiDefinitions = this.codeGenerator.generateApiDefinitions(interfaces, template);

            // 复制到剪贴板
            await vscode.env.clipboard.writeText(apiDefinitions);

            vscode.window.showInformationMessage(
                `已复制 ${interfaceIds.length} 个接口的API定义到剪贴板`
            );
        } catch (error) {
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
        this._view?.webview.postMessage({
            type: 'projectsLoaded',
            projects: this.projects
        });
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
            <button class="tab-button" data-tab="templates">我的模板</button>
            <button class="tab-button" data-tab="projects">我的项目</button>
          </div>

          <div id="interfaces-tab" class="tab-content active">
            <div class="config-section">
              <h3>配置</h3>
              <div class="form-group">
                <label for="yapi-url">YAPI地址:</label>
                <input type="text" id="yapi-url" placeholder="http://yapi.example.com">
              </div>
              <div class="form-group">
                <label for="project-token">项目Token:</label>
                <select id="project-select">
                  <option value="">选择项目</option>
                </select>
              </div>
              <button id="connect-btn" class="btn btn-primary">连接</button>
            </div>

            <div class="interface-section">
              <div class="interface-tree" id="interface-tree">
                <div class="loading">请先配置YAPI地址和项目Token</div>
              </div>
              <div class="interface-table">
                <div class="table-header">
                  <h3>接口列表</h3>
                  <div class="table-actions">
                    <select id="template-select">
                      <option value="">选择模板</option>
                    </select>
                    <button id="generate-types-btn" class="btn btn-primary">生成类型</button>
                    <button id="generate-api-btn" class="btn btn-primary">生成API</button>
                  </div>
                </div>
                <div class="table-content" id="table-content">
                  <div class="loading">暂无数据</div>
                </div>
              </div>
            </div>
          </div>

          <div id="templates-tab" class="tab-content">
            <div class="template-section">
              <div class="template-header">
                <h3>模板管理</h3>
                <button id="add-template-btn" class="btn btn-primary">新增模板</button>
              </div>
              <div class="template-list" id="template-list">
                <div class="loading">加载中...</div>
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

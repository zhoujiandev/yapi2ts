import * as vscode from 'vscode';
import {
    YapiProject,
    YapiCategory,
    YapiInterface,
    YapiInterfaceDetail,
    YapiResponse
} from './types';

export class YapiService {
    private baseUrl: string = '';
    private token: string = '';

    constructor() {
        this.loadConfig();
    }

    private loadConfig() {
        const config = vscode.workspace.getConfiguration('yapi2ts');
        this.baseUrl = config.get('yapiUrl', '');
        this.token = config.get('projectToken', '');
    }

    public setConfig(yapiUrl: string, projectToken: string) {
        this.baseUrl = yapiUrl;
        this.token = projectToken;

        // 保存配置到工作区
        const config = vscode.workspace.getConfiguration('yapi2ts');
        config.update('yapiUrl', yapiUrl, vscode.ConfigurationTarget.Workspace);
        config.update('projectToken', projectToken, vscode.ConfigurationTarget.Workspace);
    }

    private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        const url = new URL(endpoint, this.baseUrl);

        // 添加token参数
        if (this.token) {
            params.token = this.token;
        }

        // 构建查询参数
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key].toString());
            }
        });

        try {
            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = (await response.json()) as YapiResponse<T>;

            if (data.errcode !== 0) {
                throw new Error(`YAPI Error ${data.errcode}: ${data.errmsg}`);
            }

            return data.data;
        } catch (error) {
            console.error('YAPI API request failed:', error);
            throw error;
        }
    }

    /**
     * 获取项目信息
     */
    async getProject(): Promise<YapiProject> {
        return this.request<YapiProject>('/api/project/get');
    }

    /**
     * 获取接口分类菜单
     */
    async getCategoryMenu(): Promise<YapiCategory[]> {
        return this.request<YapiCategory[]>('/api/interface/getCatMenu');
    }

    /**
     * 获取分类下的接口列表
     */
    async getInterfaceList(
        catid: number,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        total: number;
        count: number;
        list: YapiInterface[];
    }> {
        return this.request('/api/interface/list_cat', {
            catid,
            page,
            limit
        });
    }

    /**
     * 获取接口详情
     */
    async getInterfaceDetail(id: number): Promise<YapiInterfaceDetail> {
        return this.request<YapiInterfaceDetail>('/api/interface/get', { id });
    }

    /**
     * 批量获取接口详情
     */
    async getInterfaceDetails(ids: number[]): Promise<YapiInterfaceDetail[]> {
        const promises = ids.map(id => this.getInterfaceDetail(id));
        return Promise.all(promises);
    }

    /**
     * 测试连接
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.getProject();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取所有接口（按分类组织）
     */
    async getAllInterfaces(): Promise<{
        categories: YapiCategory[];
        interfaces: Record<number, YapiInterface[]>;
    }> {
        const categories = await this.getCategoryMenu();
        const interfaces: Record<number, YapiInterface[]> = {};

        // 并发获取所有分类的接口
        const promises = categories.map(async category => {
            try {
                const result = await this.getInterfaceList(category._id, 1, 1000); // 获取大量接口
                interfaces[category._id] = result.list;
            } catch (error) {
                console.error(`Failed to fetch interfaces for category ${category.name}:`, error);
                interfaces[category._id] = [];
            }
        });

        await Promise.all(promises);

        return { categories, interfaces };
    }
}

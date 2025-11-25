import { ApiError, AuthenticationError, NetworkError, TimeoutError, YapiError } from './errors';
import {
    YapiCategory,
    YapiInterface,
    YapiInterfaceDetail,
    YapiProject,
    YapiResponse
} from './types';

interface RequestOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

/**
 * 并发控制器
 */
class ConcurrencyLimiter {
    private queue: Array<() => void> = [];
    private activeCount = 0;

    constructor(private limit: number) {}

    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const task = async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                } finally {
                    this.activeCount--;
                    this.next();
                }
            };

            if (this.activeCount < this.limit) {
                this.activeCount++;
                task();
            } else {
                this.queue.push(() => {
                    this.activeCount++;
                    task();
                });
            }
        });
    }

    private next() {
        if (this.activeCount < this.limit && this.queue.length > 0) {
            const task = this.queue.shift();
            task?.();
        }
    }
}

export class YapiService {
    private baseUrl: string = '';
    private token: string = '';
    private readonly DEFAULT_TIMEOUT = 30000; // 30秒
    private readonly DEFAULT_RETRIES = 3;
    private readonly DEFAULT_RETRY_DELAY = 1000; // 1秒
    private limiter = new ConcurrencyLimiter(5); // 限制并发请求数为5

    constructor() {}

    public setConfig(yapiUrl: string, projectToken: string) {
        this.baseUrl = yapiUrl;
        this.token = projectToken;
    }

    public getBaseUrl(): string {
        return this.baseUrl;
    }

    public isConfigured(): boolean {
        return this.baseUrl !== '' && this.token !== '';
    }

    private async request<T>(
        endpoint: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T> {
        const {
            timeout = this.DEFAULT_TIMEOUT,
            retries = this.DEFAULT_RETRIES,
            retryDelay = this.DEFAULT_RETRY_DELAY
        } = options;

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await this.doRequest<T>(endpoint, params, timeout);
            } catch (error) {
                lastError = error as Error;

                // 如果是最后一次尝试，直接抛出错误
                if (attempt === retries) {
                    break;
                }

                // 认证错误不需要重试
                if (
                    error instanceof AuthenticationError ||
                    (error instanceof ApiError && error.statusCode === 401)
                ) {
                    throw error;
                }

                // 等待后重试
                console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
                await this.delay(retryDelay * (attempt + 1));
            }
        }

        throw lastError;
    }

    private async doRequest<T>(
        endpoint: string,
        params: Record<string, unknown>,
        timeout: number
    ): Promise<T> {
        const url = new URL(endpoint, this.baseUrl);

        // 添加token参数
        if (this.token) {
            params.token = this.token;
        }

        // 构建查询参数
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, String(params[key]));
            }
        });

        try {
            // 实现超时控制
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url.toString(), {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // 特殊处理401认证错误
                if (response.status === 401) {
                    throw new AuthenticationError();
                }

                const errorText = await response.text().catch(() => response.statusText);
                throw new ApiError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorText
                );
            }

            const data = (await response.json()) as YapiResponse<T>;

            if (data.errcode !== 0) {
                // YAPI 特定错误码处理
                if (data.errcode === 40011) {
                    throw new AuthenticationError(data.errmsg || 'Token 无效');
                }

                throw new ApiError(data.errmsg || 'Unknown YAPI error', data.errcode, data);
            }

            return data.data;
        } catch (error) {
            // 已经是自定义错误类型，直接抛出
            if (error instanceof YapiError) {
                throw error;
            }

            // AbortError 表示超时
            if ((error as Error).name === 'AbortError') {
                throw new TimeoutError(`请求超时 (${timeout}ms)`, timeout);
            }

            // 网络错误
            throw new NetworkError('网络请求失败，请检查网络连接', error);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        const promises = ids.map(id => this.limiter.add(() => this.getInterfaceDetail(id)));
        return Promise.all(promises);
    }

    /**
     * 测试连接并获取项目信息
     */
    async testConnection(): Promise<{ success: boolean; project?: YapiProject }> {
        try {
            const project = await this.getProject();
            return { success: true, project };
        } catch (error) {
            return { success: false };
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
        const promises = categories.map(category =>
            this.limiter.add(async () => {
                try {
                    const result = await this.getInterfaceList(category._id, 1, 1000); // 获取大量接口
                    interfaces[category._id] = result.list;
                } catch (error) {
                    console.error(
                        `Failed to fetch interfaces for category ${category.name}:`,
                        error
                    );
                    interfaces[category._id] = [];
                }
            })
        );

        await Promise.all(promises);

        return { categories, interfaces };
    }
}

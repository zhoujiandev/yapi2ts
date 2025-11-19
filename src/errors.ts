/**
 * YAPI 错误类型定义
 */

export class YapiError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = 'YapiError';
        Object.setPrototypeOf(this, YapiError.prototype);
    }
}

export class NetworkError extends YapiError {
    constructor(message: string, details?: unknown) {
        super(message, 'NETWORK_ERROR', undefined, details);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends YapiError {
    constructor(
        message: string,
        public timeout: number
    ) {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'TimeoutError';
    }
}

export class ApiError extends YapiError {
    constructor(message: string, statusCode: number, details?: unknown) {
        super(message, 'API_ERROR', statusCode, details);
        this.name = 'ApiError';
    }
}

export class AuthenticationError extends YapiError {
    constructor(message: string = '认证失败，Token 无效或已过期') {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}

// YAPI 接口类型定义

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// 接口状态类型
export type InterfaceStatus = 'done' | 'undone' | 'deprecated';

// 请求体类型
export type RequestBodyType = 'json' | 'form' | 'file' | 'raw';

// 响应体类型
export type ResponseBodyType = 'json' | 'raw';

// 必填字段标识（YAPI 返回字符串）
export type RequiredFlag = '0' | '1';

// JSON Schema 类型定义
export type JsonSchemaType =
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null';

export interface JsonSchema {
    type?: JsonSchemaType | JsonSchemaType[];
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    required?: string[];
    description?: string;
    default?: unknown;
    enum?: unknown[];
    format?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    additionalProperties?: boolean | JsonSchema;
    oneOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    allOf?: JsonSchema[];
    $ref?: string;
}

export interface YapiProject {
    _id: number;
    name: string;
    basepath: string;
    desc: string;
    env: Array<{
        name: string;
        domain: string;
    }>;
}

export interface YapiCategory {
    _id: number;
    name: string;
    project_id: number;
    desc: string;
    index: number;
}

// 表单字段类型
export type FormFieldType = 'text' | 'textarea' | 'file' | 'number' | 'select';

export interface ReqBodyFormItem {
    name: string;
    type: FormFieldType;
    required: RequiredFlag;
    desc: string;
}

export interface ReqQueryItem {
    name: string;
    required: RequiredFlag;
    desc: string;
    example?: string;
}

export interface ReqHeaderItem {
    name: string;
    value: string;
    required: RequiredFlag;
    desc: string;
}

export interface ReqParamItem {
    name: string;
    desc: string;
    example?: string;
}

export interface YapiInterface {
    _id: number;
    title: string;
    desc: string;
    path: string;
    method: HttpMethod;
    project_id: number;
    catid: number;
    status: InterfaceStatus;
    req_body_type: RequestBodyType;
    req_body_form?: ReqBodyFormItem[];
    req_body_other?: string;
    req_query?: ReqQueryItem[];
    req_headers?: ReqHeaderItem[];
    req_params?: ReqParamItem[];
    res_body?: string;
    res_body_type: ResponseBodyType;
    add_time?: number;
    up_time?: number;
}

export interface YapiInterfaceDetail extends YapiInterface {
    markdown: string;
    req_body_is_json_schema: boolean;
    res_body_is_json_schema: boolean;
}

export interface YapiResponse<T = unknown> {
    errcode: number;
    errmsg: string;
    data: T;
}

export interface GenerateConfig {
    projectToken: string;
    yapiUrl: string;
    outputPath: string;
    templateType: 'axios' | 'fetch' | 'custom';
    customTemplate?: string;
}

export interface TemplateConfig {
    id: string;
    name: string;
    content: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ProjectConfig {
    id: string;
    name: string;
    yapiUrl: string;
    projectToken: string;
    createdAt: number;
    updatedAt: number;
}

// Webview 消息类型
export interface WebviewMessage {
    type: string;
    yapiUrl?: string;
    projectToken?: string;
    interfaceIds?: number[];
    templateId?: string;
    template?: TemplateConfig;
    project?: ProjectConfig;
    projectId?: string;
    projectName?: string;
    path?: string;
    interfaceId?: string;
    content?: string;
    enabled?: boolean;
}

// 协同模式配置
export interface CollaborationConfig {
    yapiUrl?: string;
    projectToken?: string;
}

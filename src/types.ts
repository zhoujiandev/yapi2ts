// YAPI 接口类型定义

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

export interface YapiInterface {
  _id: number;
  title: string;
  path: string;
  method: string;
  project_id: number;
  catid: number;
  status: string;
  req_body_type: string;
  req_body_form?: Array<{
    name: string;
    type: string;
    required: string;
    desc: string;
  }>;
  req_body_other?: string;
  req_query?: Array<{
    name: string;
    required: string;
    desc: string;
  }>;
  req_headers?: Array<{
    name: string;
    value: string;
    required: string;
    desc: string;
  }>;
  req_params?: Array<{
    name: string;
    desc: string;
  }>;
  res_body?: string;
  res_body_type: string;
}

export interface YapiInterfaceDetail extends YapiInterface {
  markdown: string;
  req_body_is_json_schema: boolean;
  res_body_is_json_schema: boolean;
}

export interface YapiResponse<T = any> {
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
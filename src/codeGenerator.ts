import * as vscode from 'vscode';
import { YapiInterfaceDetail, TemplateConfig } from './types';

export class CodeGenerator {
  
  /**
   * 生成TypeScript接口类型定义
   */
  generateTypeDefinitions(interfaces: YapiInterfaceDetail[]): string {
    const types = new Set<string>();
    
    interfaces.forEach(iface => {
      // 生成请求参数类型
      if (iface.req_query && iface.req_query.length > 0) {
        const queryType = this.generateQueryType(iface);
        types.add(queryType);
      }

      // 生成请求体类型
      if (iface.req_body_other && iface.req_body_is_json_schema) {
        try {
          const reqBodyType = this.generateTypeFromJsonSchema(
            JSON.parse(iface.req_body_other),
            this.getRequestTypeName(iface)
          );
          types.add(reqBodyType);
        } catch (error) {
          console.warn(`Failed to parse request body schema for ${iface.title}:`, error);
        }
      }

      // 生成响应类型
      if (iface.res_body && iface.res_body_is_json_schema) {
        try {
          const resBodyType = this.generateTypeFromJsonSchema(
            JSON.parse(iface.res_body),
            this.getResponseTypeName(iface)
          );
          types.add(resBodyType);
        } catch (error) {
          console.warn(`Failed to parse response body schema for ${iface.title}:`, error);
        }
      }
    });

    return Array.from(types).join('\n\n');
  }

  /**
   * 生成API接口定义代码
   */
  generateApiDefinitions(interfaces: YapiInterfaceDetail[], template: TemplateConfig): string {
    const apiDefinitions = interfaces.map(iface => {
      return this.generateSingleApiDefinition(iface, template);
    });

    return apiDefinitions.join('\n\n');
  }

  /**
   * 生成单个API接口定义
   */
  private generateSingleApiDefinition(iface: YapiInterfaceDetail, template: TemplateConfig): string {
    const methodName = this.getMethodName(iface);
    const requestTypeName = this.getRequestTypeName(iface);
    const responseTypeName = this.getResponseTypeName(iface);
    const queryTypeName = this.getQueryTypeName(iface);
    
    // 替换模板变量
    return template.content
      .replace(/\{\{methodName\}\}/g, methodName)
      .replace(/\{\{title\}\}/g, iface.title)
      .replace(/\{\{path\}\}/g, iface.path)
      .replace(/\{\{method\}\}/g, iface.method.toUpperCase())
      .replace(/\{\{requestType\}\}/g, requestTypeName)
      .replace(/\{\{responseType\}\}/g, responseTypeName)
      .replace(/\{\{queryType\}\}/g, queryTypeName)
      .replace(/\{\{description\}\}/g, iface.title || '');
  }

  /**
   * 从JSON Schema生成TypeScript类型
   */
  private generateTypeFromJsonSchema(schema: any, typeName: string): string {
    if (!schema || typeof schema !== 'object') {
      return `export type ${typeName} = any;`;
    }

    if (schema.type === 'object' && schema.properties) {
      const properties = Object.keys(schema.properties).map(key => {
        const prop = schema.properties[key];
        const isRequired = schema.required && schema.required.includes(key);
        const optional = isRequired ? '' : '?';
        const type = this.getTypeScriptType(prop);
        const comment = prop.description ? `  /** ${prop.description} */\n` : '';
        
        return `${comment}  ${key}${optional}: ${type};`;
      }).join('\n');

      return `export interface ${typeName} {\n${properties}\n}`;
    }

    return `export type ${typeName} = ${this.getTypeScriptType(schema)};`;
  }

  /**
   * 生成查询参数类型
   */
  private generateQueryType(iface: YapiInterfaceDetail): string {
    if (!iface.req_query || iface.req_query.length === 0) {
      return '';
    }

    const typeName = this.getQueryTypeName(iface);
    const properties = iface.req_query.map(param => {
      const optional = param.required === '1' ? '' : '?';
      const comment = param.desc ? `  /** ${param.desc} */\n` : '';
      return `${comment}  ${param.name}${optional}: string;`;
    }).join('\n');

    return `export interface ${typeName} {\n${properties}\n}`;
  }

  /**
   * 获取TypeScript类型
   */
  private getTypeScriptType(schema: any): string {
    if (!schema) {
      return 'any';
    }

    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array': {
        const itemType = schema.items ? this.getTypeScriptType(schema.items) : 'any';
        return `${itemType}[]`;
      }
      case 'object':
        if (schema.properties) {
          const properties = Object.keys(schema.properties).map(key => {
            const prop = schema.properties[key];
            const isRequired = schema.required && schema.required.includes(key);
            const optional = isRequired ? '' : '?';
            const type = this.getTypeScriptType(prop);
            return `${key}${optional}: ${type}`;
          }).join('; ');
          return `{ ${properties} }`;
        }
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  /**
   * 获取方法名
   */
  private getMethodName(iface: YapiInterfaceDetail): string {
    // 从路径生成方法名
    const pathParts = iface.path.split('/').filter(part => part && !part.startsWith('{'));
    
    let methodName = "";
    if (pathParts.length > 0) {
      methodName += pathParts.map(part => {
        // 处理蛇形命名转大驼峰：user_info -> UserInfo
        return part.split('_').map(subPart => 
          subPart.charAt(0).toUpperCase() + subPart.slice(1).replace(/[^a-zA-Z0-9]/g, '')
        ).join('');
      }).join('');
    }

    return methodName;
  }

  /**
   * 获取请求类型名
   */
  private getRequestTypeName(iface: YapiInterfaceDetail): string {
    const methodName = this.getMethodName(iface);
    return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Query`;
  }

  /**
   * 获取响应类型名
   */
  private getResponseTypeName(iface: YapiInterfaceDetail): string {
    const methodName = this.getMethodName(iface);
    return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Response`;
  }

  /**
   * 获取查询参数类型名
   */
  private getQueryTypeName(iface: YapiInterfaceDetail): string {
    const methodName = this.getMethodName(iface);
    return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Params`;
  }

  /**
   * 获取默认模板
   */
  static getDefaultTemplates(): TemplateConfig[] {
    return [
      {
        id: 'axios',
        name: 'Axios Template',
        description: 'Generate API calls using Axios',
        content: `/**
 * {{description}}
 */
export const {{methodName}} = ({{#if queryType}}params: {{queryType}}{{/if}}{{#if requestType}}{{#if queryType}}, {{/if}}data: {{requestType}}{{/if}}): Promise<{{responseType}}> => {
  return request({
    url: '{{path}}',
    method: '{{method}}',{{#if queryType}}
    params,{{/if}}{{#if requestType}}
    data,{{/if}}
  });
};`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'fetch',
        name: 'Fetch Template',
        description: 'Generate API calls using Fetch API',
        content: `/**
 * {{description}}
 */
export const {{methodName}} = async ({{#if queryType}}params: {{queryType}}{{/if}}{{#if requestType}}{{#if queryType}}, {{/if}}data: {{requestType}}{{/if}}): Promise<{{responseType}}> => {
  const url = new URL('{{path}}', baseURL);
  {{#if queryType}}
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key]);
    }
  });
  {{/if}}
  
  const response = await fetch(url.toString(), {
    method: '{{method}}',{{#if requestType}}
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),{{/if}}
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }
  
  return response.json();
};`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
  }
}
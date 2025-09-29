import { TemplateConfig, YapiInterfaceDetail } from './types';

export class CodeGenerator {
    /**
     * 生成TypeScript接口类型定义
     */
    generateTypeDefinitions(interfaces: YapiInterfaceDetail[]): string {
        const requestFields = new Map<
            string,
            Map<string, { type: string; optional: boolean; comment?: string }>
        >();
        const responseFields = new Map<
            string,
            Map<string, { type: string; optional: boolean; comment?: string }>
        >();

        interfaces.forEach(iface => {
            // 合并请求参数字段（query + body）
            const requestTypeName = this.getRequestTypeName(iface);
            const mergedFields = new Map<
                string,
                { type: string; optional: boolean; comment?: string }
            >();

            // 添加查询参数字段
            if (iface.req_query && iface.req_query.length > 0) {
                const queryFields = this.generateQueryTypeFields(iface);
                queryFields.forEach((field, name) => {
                    mergedFields.set(name, field);
                });
            }

            // 添加请求体字段
            if (
                iface.req_body_type === 'json' &&
                iface.req_body_other &&
                iface.req_body_is_json_schema
            ) {
                try {
                    const bodyFields = this.generateTypeFieldsFromJsonSchema(
                        JSON.parse(iface.req_body_other)
                    );
                    bodyFields.forEach((field, name) => {
                        mergedFields.set(name, field); // 后面的字段会覆盖前面的同名字段
                    });
                } catch (error) {
                    console.warn(`Failed to parse request body schema for ${iface.title}:`, error);
                }
            } else if (
                iface.req_body_type === 'form' &&
                iface.req_body_form &&
                iface.req_body_form.length > 0
            ) {
                const formFields = this.generateFormTypeFields(iface);
                formFields.forEach((field, name) => {
                    mergedFields.set(name, field); // 后面的字段会覆盖前面的同名字段
                });
            }

            // 如果有请求参数，保存合并后的字段
            if (mergedFields.size > 0) {
                requestFields.set(requestTypeName, mergedFields);
            }

            // 收集响应字段
            if (iface.res_body && iface.res_body_is_json_schema) {
                try {
                    const typeName = this.getResponseTypeName(iface);
                    const fields = this.generateTypeFieldsFromJsonSchema(
                        JSON.parse(iface.res_body)
                    );
                    if (fields.size > 0) {
                        responseFields.set(typeName, fields);
                    }
                } catch (error) {
                    console.warn(`Failed to parse response body schema for ${iface.title}:`, error);
                }
            }
        });

        let result = '';

        // 生成请求参数类型定义
        if (requestFields.size > 0) {
            Array.from(requestFields.entries()).forEach(([typeName, fields]) => {
                result += `// 请求参数类型\n export interface ${typeName} {\n`;
                Array.from(fields.entries()).forEach(([fieldName, field]) => {
                    if (field.comment) {
                        result += `  /** ${field.comment} */\n`;
                    }
                    result += `  ${fieldName}${field.optional ? '?' : ''}: ${field.type};\n`;
                });
                result += '}\n\n';
            });
        }

        // 生成响应参数类型定义
        if (responseFields.size > 0) {
            if (result) {
                result += '\n';
            }

            Array.from(responseFields.entries()).forEach(([typeName, fields]) => {
                result += `// 响应参数类型\n export interface ${typeName} {\n`;
                Array.from(fields.entries()).forEach(([fieldName, field]) => {
                    if (field.comment) {
                        result += `  /** ${field.comment} */\n`;
                    }
                    result += `  ${fieldName}${field.optional ? '?' : ''}: ${field.type};\n`;
                });
                result += '}\n\n';
            });
        }

        return result.trim();
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
    private generateSingleApiDefinition(
        iface: YapiInterfaceDetail,
        template: TemplateConfig
    ): string {
        const methodName = this.getMethodName(iface);
        const requestTypeName = this.getRequestTypeName(iface);
        const responseTypeName = this.getResponseTypeName(iface);
        const queryTypeName = this.getQueryTypeName(iface);
        const lowerCaseMethod = iface.method.toLocaleLowerCase();

        // 替换模板变量
        return template.content
            .replace(/\{\{methodName\}\}/g, methodName)
            .replace(/\{\{title\}\}/g, iface.title)
            .replace(/\{\{path\}\}/g, iface.path)
            .replace(/\{\{method\}\}/g, iface.method.toUpperCase())
            .replace(/\{\{lowerCaseMethod\}\}/g, lowerCaseMethod)
            .replace(/\{\{requestType\}\}/g, requestTypeName)
            .replace(/\{\{responseType\}\}/g, responseTypeName)
            .replace(/\{\{queryType\}\}/g, queryTypeName)
            .replace(/\{\{description\}\}/g, iface.title || '');
    }

    /**
     * 生成查询参数类型字段（返回字段对象而不是字符串）
     */
    private generateQueryTypeFields(
        iface: YapiInterfaceDetail
    ): Map<string, { type: string; optional: boolean; comment?: string }> {
        const fields = new Map<string, { type: string; optional: boolean; comment?: string }>();

        if (!iface.req_query || iface.req_query.length === 0) {
            return fields;
        }

        iface.req_query.forEach(param => {
            fields.set(param.name, {
                type: 'string',
                optional: param.required !== '1',
                comment: param.desc || undefined
            });
        });

        return fields;
    }

    /**
     * 从JSON Schema生成TypeScript类型字段（返回字段对象而不是字符串）
     */
    private generateTypeFieldsFromJsonSchema(
        schema: any
    ): Map<string, { type: string; optional: boolean; comment?: string }> {
        const fields = new Map<string, { type: string; optional: boolean; comment?: string }>();

        if (!schema || typeof schema !== 'object') {
            return fields;
        }

        if (schema.type === 'object' && schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const prop = schema.properties[key];
                const isRequired = schema.required && schema.required.includes(key);

                fields.set(key, {
                    type: this.getTypeScriptType(prop),
                    optional: !isRequired,
                    comment: prop.description || undefined
                });
            });
        }

        return fields;
    }

    /**
     * 生成表单类型字段（返回字段对象而不是字符串）
     */
    private generateFormTypeFields(
        iface: YapiInterfaceDetail
    ): Map<string, { type: string; optional: boolean; comment?: string }> {
        const fields = new Map<string, { type: string; optional: boolean; comment?: string }>();

        if (!iface.req_body_form || iface.req_body_form.length === 0) {
            return fields;
        }

        iface.req_body_form.forEach(param => {
            fields.set(param.name, {
                type: this.getFormFieldType(param.type),
                optional: param.required !== '1',
                comment: param.desc || undefined
            });
        });

        return fields;
    }

    /**
     * 获取表单字段类型
     */
    private getFormFieldType(type: string): string {
        switch (type) {
            case 'text':
            case 'textarea':
            case 'select':
                return 'string';
            case 'number':
                return 'number';
            case 'file':
                return 'File';
            default:
                return 'string';
        }
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
                    const properties = Object.keys(schema.properties)
                        .map(key => {
                            const prop = schema.properties[key];
                            const isRequired = schema.required && schema.required.includes(key);
                            const optional = isRequired ? '' : '?';
                            const type = this.getTypeScriptType(prop);
                            return `${key}${optional}: ${type}`;
                        })
                        .join('; ');
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

        let methodName = '';
        if (pathParts.length > 0) {
            methodName += pathParts
                .map(part => {
                    // 处理蛇形命名转大驼峰：user_info -> UserInfo
                    return part
                        .split('_')
                        .map(
                            subPart =>
                                subPart.charAt(0).toUpperCase() +
                                subPart.slice(1).replace(/[^a-zA-Z0-9]/g, '')
                        )
                        .join('');
                })
                .join('');
        }

        return methodName;
    }

    /**
     * 获取请求类型名
     */
    private getRequestTypeName(iface: YapiInterfaceDetail): string {
        const methodName = this.getMethodName(iface);
        return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Request`;
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
                id: 'axios1',
                name: 'Axios Template',
                description: 'Generate API calls using Axios',
                content: `/**
 * {{description}}
 */
export const {{methodName}} = (params: {{queryType}}): Promise<{{responseType}}> => {
  return {{lowerCaseMethod}}('{{path}}',params)
};`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}

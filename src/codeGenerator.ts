import { TemplateConfig, YapiInterfaceDetail } from './types';

export class CodeGenerator {
    /**
     * 生成TypeScript接口类型定义
     */
    generateTypeDefinitions(interfaces: YapiInterfaceDetail[]): string {
        let result = '';

        interfaces.forEach((iface, index) => {
            // 为每个接口生成入参和出参类型定义
            let interfaceResult = '';

            // 生成请求参数类型定义
            const requestTypeName = this.getQueryTypeName(iface);
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

            // 生成请求参数类型定义
            interfaceResult += `// ${iface.title} - 请求参数类型\nexport interface ${requestTypeName} {\n`;
            Array.from(mergedFields.entries()).forEach(([fieldName, field]) => {
                if (field.comment) {
                    interfaceResult += `  /** ${field.comment} */\n`;
                }
                interfaceResult += `  "${fieldName}"${field.optional ? '?' : ''}: ${field.type};\n`;
            });
            interfaceResult += '}\n\n';

            // 生成响应参数类型定义
            if (iface.res_body && iface.res_body_is_json_schema) {
                try {
                    const responseTypeName = this.getResponseTypeName(iface);
                    const responseFields = this.generateTypeFieldsFromJsonSchema(
                        JSON.parse(iface.res_body)
                    );
                    interfaceResult += `// ${iface.title} - 响应参数类型\nexport interface ${responseTypeName} {\n`;
                    Array.from(responseFields.entries()).forEach(([fieldName, field]) => {
                        if (field.comment) {
                            interfaceResult += `  /** ${field.comment} */\n`;
                        }
                        interfaceResult += `  "${fieldName}"${field.optional ? '?' : ''}: ${field.type};\n`;
                    });
                    interfaceResult += '}\n\n';
                } catch (error) {
                    console.warn(`Failed to parse response body schema for ${iface.title}:`, error);
                }
            }

            // 如果当前接口有生成的类型定义，添加到结果中
            if (interfaceResult) {
                // 如果不是第一个接口且前面有内容，添加分隔符
                if (index > 0 && result) {
                    result += '\n';
                }
                result += interfaceResult;
            }
        });

        return result.trim();
    }

    /**
     * 生成API接口定义代码
     */
    generateApiDefinitions(
        interfaces: YapiInterfaceDetail[],
        template: TemplateConfig,
        yapiBaseUrl: string
    ): string {
        const apiDefinitions = interfaces.map(iface => {
            return this.generateSingleApiDefinition(iface, template, yapiBaseUrl);
        });

        return apiDefinitions.join('\n\n');
    }

    /**
     * 生成单个API接口定义
     */
    private generateSingleApiDefinition(
        iface: YapiInterfaceDetail,
        template: TemplateConfig,
        yapiBaseUrl: string
    ): string {
        const methodName = this.getMethodName(iface);
        const responseTypeName = this.getResponseTypeName(iface);
        const paramsTypeName = this.getQueryTypeName(iface);
        const lowerCaseMethod = iface.method.toLocaleLowerCase();

        // 构建接口在YAPI中的完整URL
        const interfaceUrl = `${yapiBaseUrl.replace(/\/$/, '')}/project/${iface.project_id}/interface/api/${iface._id}`;

        // 创建模板变量对象
        const templateVars = {
            methodName,
            title: iface.title,
            path: iface.path,
            method: iface.method.toUpperCase(),
            lowerCaseMethod,
            responseTypeName,
            paramsTypeName,
            interfaceUrl,
            // 添加HTTP方法判断变量
            isGet: iface.method.toUpperCase() === 'GET',
            isPost: iface.method.toUpperCase() === 'POST',
            isPut: iface.method.toUpperCase() === 'PUT',
            isDelete: iface.method.toUpperCase() === 'DELETE',
            isPatch: iface.method.toUpperCase() === 'PATCH',
            isHead: iface.method.toUpperCase() === 'HEAD',
            isOptions: iface.method.toUpperCase() === 'OPTIONS',
            // 添加非GET请求的判断变量
            isNotGet: iface.method.toUpperCase() !== 'GET',
            // 添加接口的其他属性，方便在模板中使用
            interface: iface
        };

        try {
            // 使用Function构造函数来支持ES6模板字符串
            // 将模板内容包装在反引号中，使其成为模板字符串
            const templateFunction = new Function(
                ...Object.keys(templateVars),
                `return \`${template.content}\`;`
            );

            return templateFunction(...Object.values(templateVars));
        } catch (error) {
            console.error('模板执行错误:', error);
            // 如果模板执行失败，回退到原来的字符串替换方式
            return template.content
                .replace(/\$\{methodName\}/g, methodName)
                .replace(/\$\{title\}/g, iface.title)
                .replace(/\$\{path\}/g, iface.path)
                .replace(/\$\{method\}/g, iface.method.toUpperCase())
                .replace(/\$\{lowerCaseMethod\}/g, lowerCaseMethod)
                .replace(/\$\{responseTypeName\}/g, responseTypeName)
                .replace(/\$\{paramsTypeName\}/g, paramsTypeName)
                .replace(/\$\{interfaceUrl\}/g, interfaceUrl);
        }
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
                            // 如果有描述信息，添加注释（换行格式）
                            if (prop.description) {
                                return `\n  /** ${prop.description} */\n  "${key}"${optional}: ${type}`;
                            }
                            return `"${key}"${optional}: ${type}`;
                        })
                        .join('; ');
                    return `{${properties}\n}`;
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

        if (pathParts.length === 0) {
            return iface.method.toLowerCase();
        }

        // 查找版本号（如 v1, v2, v3 等）
        const versionRegex = /^v\d+$/i;
        let version = '';
        let lastSegment = '';

        // 找到最后一个非版本号的路由段作为主要方法名
        for (let i = pathParts.length - 1; i >= 0; i--) {
            const part = pathParts[i];
            if (versionRegex.test(part)) {
                version = part;
            } else if (!lastSegment) {
                lastSegment = part;
            }
            if (version && lastSegment) {
                break;
            }
        }

        if (!lastSegment) {
            return iface.method.toLowerCase();
        }

        // 处理蛇形命名转驼峰：get_slicing_status -> getSlicingStatus
        const camelCaseSegment = lastSegment
            .split('_')
            .map((subPart, index) => {
                const cleanPart = subPart.replace(/[^a-zA-Z0-9]/g, '');
                return index === 0
                    ? cleanPart.toLowerCase()
                    : cleanPart.charAt(0).toUpperCase() + cleanPart.slice(1).toLowerCase();
            })
            .join('');

        const method = iface.method.toLowerCase();

        // 检查是否已经包含方法前缀，避免重复
        let methodName = camelCaseSegment;
        if (!camelCaseSegment.toLowerCase().startsWith(method)) {
            methodName =
                method + camelCaseSegment.charAt(0).toUpperCase() + camelCaseSegment.slice(1);
        }

        // 如果有版本号，添加到方法名后面
        if (version) {
            methodName += version.toUpperCase();
        }

        return methodName;
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
                description: '这是一个axios请求模版，支持ES6模板字符串语法',
                content: `/**
 * @description \${title}
 * @url \${interfaceUrl}
 */
export const \${methodName} = (params: \${paramsTypeName},config:Omit<AxiosRequestConfig,\${isNotGet?'"data"':'"params"'}>): Promise<\${responseTypeName}> => {
  return axios.\${lowerCaseMethod}('\${path}', \${isNotGet ? 'params,config' : '{params,...config}'})    
};`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}

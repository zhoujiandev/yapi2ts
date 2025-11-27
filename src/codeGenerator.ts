import ejs from 'ejs';
import { FormFieldType, JsonSchema, TemplateConfig, YapiInterfaceDetail } from './types';

export class CodeGenerator {
    /**
     * 解析备注字段，处理HTML标签和特殊字符
     */
    private parseDescription(desc: string): string {
        if (!desc) {
            return '';
        }

        // 对于某些标签，在移除前先替换为空格
        let parsed = desc.replace(/<br\s*\/?>/gi, ' ');
        parsed = parsed.replace(/<\/?(p|div|h[1-6])\b[^>]*>/gi, ' ');

        // 移除其他HTML标签
        parsed = parsed.replace(/<[^>]*>/g, '');

        // 处理HTML实体
        const htmlEntities: { [key: string]: string } = {
            '&lt;': '<',
            '&gt;': '>',
            '&amp;': '&',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™'
        };

        Object.keys(htmlEntities).forEach(entity => {
            parsed = parsed.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
        });

        // 处理换行符，将其转换为空格
        parsed = parsed.replace(/\n/g, ' ').replace(/\r/g, ' ');

        // 移除多余的空格
        parsed = parsed.replace(/\s+/g, ' ').trim();

        return parsed;
    }
    constructor() {}

    /**
     * 生成TypeScript接口类型定义
     */
    generateTypeDefinitions(
        interfaces: YapiInterfaceDetail[],
        categoryInterfacesMap?: Map<number, YapiInterfaceDetail[]>
    ): string {
        let result = '';

        // 如果提供了分类接口映射，按分类处理命名冲突
        if (categoryInterfacesMap) {
            // 为每个分类单独计算命名冲突
            categoryInterfacesMap.forEach((allInterfacesInCategory, catId) => {
                // 过滤出当前需要生成的接口（属于该分类的）
                const categoryInterfaces = interfaces.filter(iface => iface.catid === catId);

                if (categoryInterfaces.length > 0) {
                    const pathSegmentCounts =
                        this.calculatePathSegmentCounts(allInterfacesInCategory);

                    categoryInterfaces.forEach(iface => {
                        const interfaceResult = this.generateSingleTypeDefinition(
                            iface,
                            pathSegmentCounts.get(iface._id) || 1
                        );

                        if (interfaceResult) {
                            if (result) {
                                result += '\n';
                            }
                            result += interfaceResult;
                        }
                    });
                }
            });
        } else {
            // 原有逻辑：统一处理所有接口的命名冲突
            const pathSegmentCounts = this.calculatePathSegmentCounts(interfaces);

            interfaces.forEach(iface => {
                const interfaceResult = this.generateSingleTypeDefinition(
                    iface,
                    pathSegmentCounts.get(iface._id) || 1
                );

                if (interfaceResult) {
                    if (result) {
                        result += '\n';
                    }
                    result += interfaceResult;
                }
            });
        }

        return result.trim();
    }

    /**
     * 生成单个接口的类型定义
     */
    private generateSingleTypeDefinition(iface: YapiInterfaceDetail, segmentCount: number): string {
        // 为每个接口生成入参和出参类型定义
        let interfaceResult = '';

        // 生成请求参数类型定义
        const requestTypeName = this.getQueryTypeName(iface, segmentCount);
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
                console.warn(
                    `Failed to parse request body schema for ${this.parseDescription(iface.title)}:`,
                    error
                );
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
        interfaceResult += `// ${this.parseDescription(iface.title)} - 请求参数类型\nexport interface ${requestTypeName} {\n`;
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
                const responseTypeName = this.getResponseTypeName(iface, segmentCount);
                const responseFields = this.generateTypeFieldsFromJsonSchema(
                    JSON.parse(iface.res_body)
                );
                interfaceResult += `// ${this.parseDescription(iface.title)} - 响应参数类型\nexport interface ${responseTypeName} {\n`;
                Array.from(responseFields.entries()).forEach(([fieldName, field]) => {
                    if (field.comment) {
                        interfaceResult += `  /** ${field.comment} */\n`;
                    }
                    interfaceResult += `  "${fieldName}"${field.optional ? '?' : ''}: ${field.type};\n`;
                });
                interfaceResult += '}\n\n';
            } catch (error) {
                console.warn(
                    `Failed to parse response body schema for ${this.parseDescription(iface.title)}:`,
                    error
                );
            }
        }

        return interfaceResult;
    }

    /**
     * 计算每个接口需要的路径节数以避免冲突
     */
    private calculatePathSegmentCounts(interfaces: YapiInterfaceDetail[]): Map<number, number> {
        const pathSegmentCounts = new Map<number, number>();

        // 为每个接口初始化为1个路径节
        interfaces.forEach(iface => {
            pathSegmentCounts.set(iface._id, 1);
        });

        let hasConflicts = true;
        let maxSegments = 1;

        // 循环检测冲突，直到没有冲突为止
        while (hasConflicts && maxSegments <= 5) {
            // 最多检测5层路径
            hasConflicts = false;
            const nameToInterfaces = new Map<string, YapiInterfaceDetail[]>();

            // 根据当前路径节数生成方法名，并分组
            interfaces.forEach(iface => {
                const segmentCount = pathSegmentCounts.get(iface._id) || 1;
                const methodName = this.getMethodNameWithSegments(iface, segmentCount);

                if (!nameToInterfaces.has(methodName)) {
                    nameToInterfaces.set(methodName, []);
                }
                nameToInterfaces.get(methodName)!.push(iface);
            });

            // 检查是否有冲突，如果有，增加冲突接口的路径节数
            nameToInterfaces.forEach((conflictInterfaces, methodName) => {
                if (conflictInterfaces.length > 1) {
                    hasConflicts = true;
                    // 为冲突的接口增加路径节数
                    conflictInterfaces.forEach(iface => {
                        const currentCount = pathSegmentCounts.get(iface._id) || 1;
                        pathSegmentCounts.set(
                            iface._id,
                            Math.min(currentCount + 1, maxSegments + 1)
                        );
                    });
                }
            });

            maxSegments++;
        }

        return pathSegmentCounts;
    }

    /**
     * 根据指定的路径节数生成方法名
     */
    private getMethodNameWithSegments(iface: YapiInterfaceDetail, segmentCount: number): string {
        // 从路径生成方法名
        const pathParts = iface.path.split('/').filter(part => part && !part.startsWith('{'));

        if (pathParts.length === 0) {
            return iface.method.toLowerCase();
        }

        // 查找版本号（如 v1, v2, v3 等）
        const versionRegex = /^v\d+$/i;
        let version = '';
        const segments: string[] = [];

        // 从后往前取指定数量的非版本号路径段
        for (let i = pathParts.length - 1; i >= 0 && segments.length < segmentCount; i--) {
            const part = pathParts[i];
            if (versionRegex.test(part)) {
                if (!version) {
                    version = part;
                }
            } else {
                segments.unshift(part); // 添加到开头，保持顺序
            }
        }

        if (segments.length === 0) {
            return iface.method.toLowerCase();
        }

        // 将多个路径段连接成方法名
        const combinedSegment = segments
            .map(segment => this.convertToCamelCase(segment))
            .map((segment, index) =>
                index === 0 ? segment : segment.charAt(0).toUpperCase() + segment.slice(1)
            )
            .join('');

        const method = iface.method.toLowerCase();

        // 检查是否已经包含方法前缀，避免重复
        let methodName = combinedSegment;
        if (!combinedSegment.toLowerCase().startsWith(method)) {
            methodName =
                method + combinedSegment.charAt(0).toUpperCase() + combinedSegment.slice(1);
        }

        // 如果有版本号，添加到方法名后面
        if (version) {
            methodName += version.toUpperCase();
        }

        return methodName;
    }

    /**
     * 生成API接口定义代码
     */
    generateApiDefinitions(
        interfaces: YapiInterfaceDetail[],
        template: TemplateConfig,
        yapiBaseUrl: string,
        categoryInterfacesMap?: Map<number, YapiInterfaceDetail[]>
    ): string {
        const apiDefinitions = interfaces.map(iface => {
            // 如果是全局搜索，为每个接口找到其所属分类的所有接口用于命名冲突计算
            let allCategoryInterfaces: YapiInterfaceDetail[] | undefined;
            if (categoryInterfacesMap) {
                // 直接使用接口的catid获取分类接口
                allCategoryInterfaces = categoryInterfacesMap.get(iface.catid);
            }

            // 计算该接口在其所属分类中的路径节数以避免冲突
            const pathSegmentCounts = this.calculatePathSegmentCounts(
                allCategoryInterfaces || [iface]
            );

            return this.generateSingleApiDefinition(
                iface,
                template,
                yapiBaseUrl,
                pathSegmentCounts.get(iface._id) || 1
            );
        });

        return apiDefinitions.join('\n\n');
    }

    /**
     * 生成参数注释列表
     */
    private generateParamsComments(iface: YapiInterfaceDetail): string[] {
        const paramsComments: string[] = [];

        // 添加路径参数
        if (iface.req_params && iface.req_params.length > 0) {
            iface.req_params.forEach(param => {
                const desc = param.desc || '路径参数';
                paramsComments.push(`@param {string} params.${param.name} ${desc}`);
            });
        }

        // 添加查询参数
        if (iface.req_query && iface.req_query.length > 0) {
            iface.req_query.forEach(param => {
                const required = param.required === '1' ? '' : '?';
                const desc = param.desc || '查询参数';
                paramsComments.push(`@param {string} params.${param.name}${required} ${desc}`);
            });
        }

        // 添加请求体参数（JSON Schema）
        if (
            iface.req_body_type === 'json' &&
            iface.req_body_other &&
            iface.req_body_is_json_schema
        ) {
            try {
                const schema = JSON.parse(iface.req_body_other);
                if (schema.type === 'object' && schema.properties) {
                    Object.keys(schema.properties).forEach(key => {
                        const prop = schema.properties[key];
                        const isRequired = schema.required && schema.required.includes(key);
                        const required = isRequired ? '' : '?';
                        const type = this.getJSDocType(prop);
                        const desc = prop.description || '请求体参数';
                        paramsComments.push(`@param {${type}} params.${key}${required} ${desc}`);
                    });
                }
            } catch (error) {
                console.warn(
                    `Failed to parse request body schema for ${this.parseDescription(iface.title)}:`,
                    error
                );
            }
        }

        // 添加表单参数
        if (
            iface.req_body_type === 'form' &&
            iface.req_body_form &&
            iface.req_body_form.length > 0
        ) {
            iface.req_body_form.forEach(param => {
                const required = param.required === '1' ? '' : '?';
                const type = this.getFormFieldJSDocType(param.type);
                const desc = param.desc || '表单参数';
                paramsComments.push(`@param {${type}} params.${param.name}${required} ${desc}`);
            });
        }

        return paramsComments;
    }

    /**
     * 获取JSDoc类型注释
     */
    private getJSDocType(schema: JsonSchema): string {
        if (!schema || typeof schema !== 'object') {
            return 'any';
        }

        const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

        switch (schemaType) {
            case 'string':
                return 'string';
            case 'number':
            case 'integer':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'array':
                if (schema.items) {
                    return `${this.getJSDocType(schema.items)}[]`;
                }
                return 'any[]';
            case 'object':
                return 'object';
            case 'null':
                return 'null';
            default:
                return 'any';
        }
    }

    /**
     * 获取表单字段的JSDoc类型
     */
    private getFormFieldJSDocType(type: FormFieldType): string {
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
     * 检测模板是否包含顶部注释，如果没有则自动添加
     */
    private ensureTopComments(
        template: TemplateConfig,
        iface: YapiInterfaceDetail,
        yapiBaseUrl: string
    ): TemplateConfig {
        const content = template.content.trim();
        const interfaceUrl = `${yapiBaseUrl.replace(/\/$/, '')}/project/${iface.project_id}/interface/api/${iface._id}`;
        const paramsComments = this.generateParamsComments(iface);

        // 检查是否已经包含JSDoc注释
        const hasJSDocComment = /\/\*\*[\s\S]*?\*\//.test(content);

        if (hasJSDocComment) {
            // 提取现有的JSDoc注释
            const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
            if (jsdocMatch) {
                const existingComment = jsdocMatch[1];
                const commentLines = existingComment.split('\n').map(line => line.trim());

                // 提取用户自定义的标签（排除 @param，但保留用户自定义的 @description 和 @url）
                const userCustomTags: string[] = [];
                let userDescription: string | null = null;
                let userUrl: string | null = null;

                commentLines.forEach(line => {
                    if (line.startsWith('*') && line.includes('@')) {
                        // 检查是否是 @description（可被用户覆盖）
                        if (/@description/.test(line)) {
                            userDescription = line;
                        }
                        // 检查是否是 @url（可被用户覆盖）
                        else if (/@url/.test(line)) {
                            userUrl = line;
                        }
                        // 排除 @param（不可被用户覆盖）
                        else if (!/@param/.test(line)) {
                            userCustomTags.push(line);
                        }
                    }
                });

                // 构建新的注释结构
                const newCommentLines = [
                    '/**',
                    ` * ${this.parseDescription(iface.title)}`,
                    userDescription
                        ? ` ${userDescription}`
                        : ` * @description ${this.parseDescription(iface.desc)}`, // 优先使用用户的 @description
                    userUrl ? ` ${userUrl}` : ` * @url ${interfaceUrl}`, // 优先使用用户的 @url
                    ...userCustomTags.map(tag => ` ${tag}`), // 其他用户自定义标签，确保前导空格
                    ...paramsComments.map(param => ` * ${param}`), // @param 标签始终由系统生成
                    ' */'
                ];

                const newComment = newCommentLines.join('\n');
                const updatedContent = content.replace(/\/\*\*[\s\S]*?\*\//, newComment);

                return {
                    ...template,
                    content: updatedContent
                };
            }
        }

        // 生成完整的顶部注释（没有现有注释的情况）
        const topComments = [
            '/**',
            ` * ${this.parseDescription(iface.title)}`,
            ` * @description ${this.parseDescription(iface.desc)}`,
            ` * @url ${interfaceUrl}`,
            ...paramsComments.map(param => ` * ${param}`),
            ' */'
        ].join('\n');

        // 没有注释，直接添加到模板开头
        return {
            ...template,
            content: `${topComments}\n${content}`
        };
    }

    /**
     * 生成单个API接口定义
     */
    private generateSingleApiDefinition(
        iface: YapiInterfaceDetail,
        template: TemplateConfig,
        yapiBaseUrl: string,
        segmentCount?: number
    ): string {
        // 确保模板包含顶部注释
        const enhancedTemplate = this.ensureTopComments(template, iface, yapiBaseUrl);

        const methodName = segmentCount
            ? this.getMethodNameWithSegments(iface, segmentCount)
            : this.getMethodName(iface);
        const responseTypeName = this.getResponseTypeName(iface, segmentCount);
        const paramsTypeName = this.getQueryTypeName(iface, segmentCount);
        const upperMethod = iface.method.toUpperCase();
        const lowerCaseMethod = iface.method.toLowerCase();

        // 构建接口在YAPI中的完整URL
        const interfaceUrl = `${yapiBaseUrl.replace(/\/$/, '')}/project/${iface.project_id}/interface/api/${iface._id}`;

        // 创建模板变量对象
        const templateVars = {
            methodName,
            title: this.parseDescription(iface.title),
            path: iface.path,
            method: upperMethod,
            lowerCaseMethod,
            responseTypeName,
            paramsTypeName,
            interfaceUrl,
            // HTTP方法判断变量
            isGet: upperMethod === 'GET',
            isPost: upperMethod === 'POST',
            isPut: upperMethod === 'PUT',
            isDelete: upperMethod === 'DELETE',
            isPatch: upperMethod === 'PATCH',
            isHead: upperMethod === 'HEAD',
            isOptions: upperMethod === 'OPTIONS',
            isNotGet: upperMethod !== 'GET',
            // 接口完整对象，方便在模板中访问更多属性
            iface
        };

        // 转换模板语法：将 ${var} 转换为 <%= var %>
        const ejsTemplate = this.convertToEjsTemplate(enhancedTemplate.content);

        try {
            return ejs.render(ejsTemplate, templateVars);
        } catch (error) {
            const err = error as Error;
            console.error(`模板渲染失败 [${template.name}]: ${err.message}`);
            // 回退到简单字符串替换
            return this.fallbackRender(enhancedTemplate.content, templateVars);
        }
    }

    /**
     * 将 ES6 模板字符串语法转换为 EJS 语法
     * ${var} -> <%= var %>
     * 支持表达式如 ${isGet ? 'params' : 'data'} 和嵌套花括号 ${isGet ? '{a}' : '{b}'}
     */
    private convertToEjsTemplate(content: string): string {
        // 使用更复杂的匹配逻辑，支持嵌套花括号和字符串中的花括号
        let result = '';
        let i = 0;

        while (i < content.length) {
            // 检查是否是 ${ 开头
            if (content[i] === '$' && content[i + 1] === '{') {
                // 找到匹配的结束 }
                let braceCount = 1;
                let j = i + 2;
                let inString: string | null = null;

                while (j < content.length && braceCount > 0) {
                    const char = content[j];

                    // 处理字符串（单引号或双引号）
                    if ((char === '"' || char === "'") && content[j - 1] !== '\\') {
                        if (inString === null) {
                            inString = char;
                        } else if (inString === char) {
                            inString = null;
                        }
                    }

                    // 只在非字符串内计算花括号
                    if (inString === null) {
                        if (char === '{') {
                            braceCount++;
                        } else if (char === '}') {
                            braceCount--;
                        }
                    }
                    j++;
                }

                // 提取表达式内容并转换为 EJS（使用 <%- 不转义 HTML）
                const expr = content.slice(i + 2, j - 1);
                result += `<%- ${expr} %>`;
                i = j;
            } else {
                result += content[i];
                i++;
            }
        }

        return result;
    }

    /**
     * 回退渲染：简单字符串替换（当 EJS 渲染失败时使用）
     */
    private fallbackRender(content: string, vars: Record<string, unknown>): string {
        let result = content;
        for (const [key, value] of Object.entries(vars)) {
            if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
            ) {
                result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
            }
        }
        return result;
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
        schema: JsonSchema
    ): Map<string, { type: string; optional: boolean; comment?: string }> {
        const fields = new Map<string, { type: string; optional: boolean; comment?: string }>();

        if (!schema || typeof schema !== 'object') {
            return fields;
        }

        const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

        if (schemaType === 'object' && schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const prop = schema.properties![key];
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
    private getFormFieldType(type: FormFieldType): string {
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
    private getTypeScriptType(schema: JsonSchema): string {
        if (!schema) {
            return 'any';
        }

        // 处理枚举类型
        if (schema.enum && schema.enum.length > 0) {
            return schema.enum.map(v => (typeof v === 'string' ? `'${v}'` : String(v))).join(' | ');
        }

        const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;

        switch (schemaType) {
            case 'string':
                return 'string';
            case 'number':
            case 'integer':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'null':
                return 'null';
            case 'array': {
                const itemType = schema.items ? this.getTypeScriptType(schema.items) : 'unknown';
                return `${itemType}[]`;
            }
            case 'object':
                if (schema.properties) {
                    const properties = Object.keys(schema.properties)
                        .map(key => {
                            const prop = schema.properties![key];
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
                return 'Record<string, unknown>';
            default:
                return 'unknown';
        }
    }

    /**
     * 将各种命名格式转换为小驼峰命名
     * 支持：蛇形命名(snake_case)、小驼峰(camelCase)、大驼峰(PascalCase)
     */
    private convertToCamelCase(str: string): string {
        // 清理非字母数字字符，但保留下划线用于分割
        const cleanStr = str.replace(/[^a-zA-Z0-9_]/g, '');

        // 如果包含下划线，按蛇形命名处理
        if (cleanStr.includes('_')) {
            return cleanStr
                .split('_')
                .map((part, index) => {
                    const cleanPart = part.replace(/[^a-zA-Z0-9]/g, '');
                    if (!cleanPart) {
                        return '';
                    }
                    return index === 0
                        ? cleanPart.toLowerCase()
                        : cleanPart.charAt(0).toUpperCase() + cleanPart.slice(1).toLowerCase();
                })
                .join('');
        }

        // 处理驼峰命名（包括大驼峰和小驼峰）
        // 如果是大驼峰，转为小驼峰
        if (cleanStr && cleanStr[0] === cleanStr[0].toUpperCase()) {
            return cleanStr.charAt(0).toLowerCase() + cleanStr.slice(1);
        }

        // 如果已经是小驼峰或全小写，直接返回原字符串
        return cleanStr;
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

        // 处理多种命名格式转小驼峰
        const camelCaseSegment = this.convertToCamelCase(lastSegment);

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
    private getResponseTypeName(iface: YapiInterfaceDetail, segmentCount?: number): string {
        const methodName = segmentCount
            ? this.getMethodNameWithSegments(iface, segmentCount)
            : this.getMethodName(iface);
        return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Response`;
    }

    /**
     * 获取查询参数类型名
     */
    private getQueryTypeName(iface: YapiInterfaceDetail, segmentCount?: number): string {
        const methodName = segmentCount
            ? this.getMethodNameWithSegments(iface, segmentCount)
            : this.getMethodName(iface);
        return `${methodName.charAt(0).toUpperCase() + methodName.slice(1)}Params`;
    }

    /**
     * 获取默认模板
     *
     * 模板使用 EJS 语法（推荐）：
     * - <%- variable %>: 输出变量（不转义）
     * - <% if (condition) { %> ... <% } %>: 条件判断
     * - <% for (let item of array) { %> ... <% } %>: 循环
     *
     * 也支持 ES6 模板字符串语法 ${variable}（会自动转换为 EJS，兼容旧模板）
     *
     * 可用变量：
     * - methodName: 方法名
     * - title: 接口标题
     * - path: 接口路径
     * - method: HTTP方法（大写）
     * - lowerCaseMethod: HTTP方法（小写）
     * - responseTypeName: 响应类型名
     * - paramsTypeName: 参数类型名
     * - interfaceUrl: YAPI接口链接
     * - isGet/isPost/isPut/isDelete/isPatch/isHead/isOptions: HTTP方法判断
     * - isNotGet: 是否为非GET请求
     * - iface: 完整接口对象
     */
    static getDefaultTemplates(): TemplateConfig[] {
        return [
            {
                id: 'axios',
                name: 'Axios Template',
                description: '基于 Axios 的请求模板，自动区分 GET/非GET 请求参数',
                content: `export const <%- methodName %> = (params: <%- paramsTypeName %>, config?: Omit<AxiosRequestConfig, <%- isNotGet ? '"data"' : '"params"' %>>): Promise<<%- responseTypeName %>> => {
  return axios.<%- lowerCaseMethod %>('<%- path %>', <%- isNotGet ? 'params, config' : '{ params, ...config }' %>);
};`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'fetch',
                name: 'Fetch Template',
                description: '基于原生 Fetch API 的请求模板，使用 EJS 条件语法',
                content: `export async function <%- methodName %>(params: <%- paramsTypeName %>): Promise<<%- responseTypeName %>> {
<% if (isGet) { %>
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const response = await fetch(\`<%- path %>?\${query}\`);
<% } else { %>
  const response = await fetch('<%- path %>', {
    method: '<%- method %>',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
<% } %>
  return response.json();
}`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'request-simple',
                name: 'Simple Request',
                description: '简洁的请求模板，适用于自定义 request 封装',
                content: `export const <%- methodName %> = (params: <%- paramsTypeName %>) => {
  return request<<%- responseTypeName %>>({
    url: '<%- path %>',
    method: '<%- lowerCaseMethod %>',
    <%- isGet ? 'params' : 'data' %>: params
  });
};`,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    }
}

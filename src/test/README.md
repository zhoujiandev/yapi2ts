# Yapi2ts 扩展测试文档

本文档说明如何运行和维护 Yapi2ts VS Code 扩展的测试套件。

## 测试结构

测试套件包含以下测试文件：

### 1. 核心功能测试

#### `yapiService.test.ts`

- **功能**: 测试 YAPI 服务的核心功能
- **覆盖范围**:
    - 项目信息获取
    - 接口分类菜单获取
    - 接口列表获取
    - 接口详情获取
    - 错误处理和重试机制
    - URL 构建和参数处理

#### `codeGenerator.test.ts`

- **功能**: 测试代码生成器的功能
- **覆盖范围**:
    - TypeScript 类型定义生成
    - API 定义生成
    - 模板处理
    - 默认模板提供
    - 方法名生成
    - 错误处理

#### `webviewProvider.test.ts`

- **功能**: 测试 Webview 提供者的功能
- **覆盖范围**:
    - Webview 初始化
    - HTML 生成
    - 状态管理
    - 错误处理
    - 模板管理

### 2. 扩展集成测试

#### `extension.activation.test.ts`

- **功能**: 测试扩展激活和配置
- **覆盖范围**:
    - package.json 配置验证
    - 命令注册
    - 视图注册
    - 激活事件
    - 错误处理

#### `integration.test.ts`

- **功能**: 测试完整的工作流程
- **覆盖范围**:
    - 端到端类型生成流程
    - 多接口处理
    - 错误恢复
    - 组件集成
    - 数据流验证

## 运行测试

### 前提条件

确保已安装所有依赖：

```bash
npm install
```

### 运行所有测试

```bash
npm test
```

### 运行特定测试文件

```bash
# 运行 YAPI 服务测试
npm test -- --grep "YapiService Test Suite"

# 运行代码生成器测试
npm test -- --grep "CodeGenerator Test Suite"

# 运行 Webview 提供者测试
npm test -- --grep "YapiWebviewProvider Test Suite"

# 运行扩展激活测试
npm test -- --grep "Extension Activation Test Suite"

# 运行集成测试
npm test -- --grep "Integration Test Suite"
```

### 调试测试

在 VS Code 中：

1. 打开测试文件
2. 设置断点
3. 按 `F5` 启动调试
4. 选择 "Extension Tests" 配置

## 测试数据和模拟

### Mock 数据结构

测试使用以下模拟数据结构：

#### YapiInterfaceDetail

```typescript
interface YapiInterfaceDetail {
    _id: number;
    title: string;
    path: string;
    method: string;
    catid: number;
    desc: string;
    project_id: number;
    status: string;
    req_body_type: string;
    req_body_other: string;
    req_query: Array<{ name: string; required: string; desc: string }>;
    req_headers: Array<any>;
    req_params: Array<any>;
    res_body: string;
    res_body_type: string;
    markdown: string;
    req_body_is_json_schema: boolean;
    res_body_is_json_schema: boolean;
}
```

#### TemplateConfig

```typescript
interface TemplateConfig {
    id: string;
    name: string;
    content: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}
```

### 辅助函数

测试文件包含以下辅助函数：

- `createMockInterface()`: 创建模拟接口数据
- `createMockTemplate()`: 创建模拟模板数据
- `createMockProject()`: 创建模拟项目数据

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 遵循 "should [expected behavior] when [condition]" 格式
- 使用中文描述复杂的业务逻辑

### 2. 测试结构

- 使用 `suite()` 组织相关测试
- 使用 `setup()` 和 `teardown()` 进行测试准备和清理
- 保持测试独立性

### 3. 断言

- 使用具体的断言而不是通用的 `assert.ok()`
- 提供有意义的错误消息
- 测试正面和负面情况

### 4. Mock 和 Stub

- 使用最小化的 mock 数据
- 模拟外部依赖（HTTP 请求、文件系统等）
- 避免测试实现细节

## 常见问题

### 1. 测试失败

**问题**: 测试运行失败
**解决方案**:

- 检查依赖是否正确安装
- 确保 TypeScript 编译成功
- 检查测试数据是否正确

### 2. 模板语法错误

**问题**: 模板测试失败
**解决方案**:

- 确保使用正确的模板语法（ES6 模板字符串 `${variable}`）
- 检查模板变量名是否正确
- 验证模板内容格式

### 3. VS Code API 测试

**问题**: VS Code API 相关测试失败
**解决方案**:

- 在测试环境中，某些 VS Code API 可能不可用
- 使用 mock 对象替代真实的 VS Code API
- 专注于测试业务逻辑而不是 VS Code 集成

## 维护测试

### 添加新测试

1. 在相应的测试文件中添加新的测试用例
2. 使用现有的辅助函数创建测试数据
3. 确保测试覆盖正面和负面情况
4. 运行测试确保通过

### 更新现有测试

1. 当代码逻辑改变时，更新相应的测试
2. 保持测试数据与实际数据结构同步
3. 更新断言以反映新的预期行为

### 性能考虑

- 避免在测试中进行真实的网络请求
- 使用轻量级的 mock 数据
- 保持测试运行时间合理

## 测试覆盖率

当前测试覆盖以下主要功能：

- ✅ YAPI 服务集成
- ✅ 代码生成
- ✅ Webview 管理
- ✅ 扩展激活
- ✅ 错误处理
- ✅ 模板管理
- ✅ 类型定义生成
- ✅ API 定义生成

## 持续集成

建议在 CI/CD 流程中包含测试：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v2
            - uses: actions/setup-node@v2
              with:
                  node-version: '16'
            - run: npm install
            - run: npm test
```

## 贡献指南

在提交代码时：

1. 确保所有测试通过
2. 为新功能添加相应的测试
3. 更新测试文档（如有必要）
4. 遵循现有的测试模式和约定

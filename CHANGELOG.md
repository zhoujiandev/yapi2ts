# Change Log

All notable changes to the "yapi2ts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.1.0] - 2025-12-15

### Added

- **协同模式** - 新增团队协作配置支持
    - 支持通过 workspace 配置文件 (`.vscode/settings.json`) 共享 YAPI 配置
    - 新增协同模式开关，一键切换本地/共享配置
    - 新增配置引导页，简化团队成员接入流程
    - 支持 `yapiUrl` 和 `projectToken` 的团队共享与同步

### Fixed

- **依赖类型修复** - 将 `ejs` 从 `devDependencies` 移至 `dependencies`
    - 修复生产环境下模板渲染可能失败的问题
    - 确保打包后的扩展能正确加载 EJS 模块

## [1.0.6] - 2025-12-08

### Improved

- **WebView 架构重构** - HTML/JS 分离，提升代码可维护性
    - 将内联 HTML 模板抽离为独立的 `webview.html` 文件
    - 新增 `templateLoader.ts` 模板加载工具，支持 `{{variable}}` 占位符语法
    - 简化 `webviewProvider.ts`，降低代码复杂度

### Technical

- 新增 `src/utils/templateLoader.ts` - 模板加载工具模块
- 新增 `media/webview.html` - 独立的 WebView HTML 模板
- 优化 `media/main.js` - 精简前端逻辑
- 完善测试覆盖 - 更新 WebView Provider 测试用例

## [1.0.5] - 2025-11-27

### Added

- **EJS 模板引擎** - 模板系统全面升级
    - 引入 EJS 作为模板渲染引擎，支持完整的 JavaScript 表达式
    - 支持条件判断 `<% if (isGet) { %> ... <% } %>`
    - 支持循环语法 `<% for (let item of array) { %> ... <% } %>`
    - 支持三元表达式 `<%- isGet ? 'params' : 'data' %>`
    - 向后兼容 ES6 模板字符串语法 `${variable}`（自动转换为 EJS）

- **新增内置模板**
    - **Fetch Template** - 基于原生 Fetch API 的请求模板
    - **Simple Request** - 简洁的请求模板，适用于自定义 request 封装

- **新增模板变量 `iface`** - 完整的接口对象，可访问所有 YAPI 接口属性
    - `iface.status` - 接口状态 (done | undone | deprecated)
    - `iface.catid` - 分类 ID
    - `iface._id` - 接口 ID

### Improved

- **模板渲染容错** - EJS 渲染失败时自动回退到简单字符串替换
- **文档更新** - README 新增完整的 EJS 语法说明和示例

### Technical

- 新增 `ejs` 依赖用于模板渲染
- 新增 `convertToEjsTemplate()` 方法支持 ES6 语法自动转换
- 新增 `fallbackRender()` 方法作为渲染失败的回退方案
- 完善测试覆盖，新增 EJS 模板渲染相关测试用例

## [1.0.3] - 2025-11-25

### Added

- **并发控制** - 新增 `ConcurrencyLimiter` 并发控制器
    - 限制并发请求数为 5，避免大量接口批量请求时对服务器造成压力
    - 应用于批量获取接口详情和获取所有接口分类数据

### Improved

- **完善类型定义** - 增强 TypeScript 类型安全
    - 新增 `JsonSchema` 完整类型定义，支持 JSON Schema 规范
    - 新增 `FormFieldType`、`ReqBodyFormItem`、`ReqQueryItem`、`ReqHeaderItem`、`ReqParamItem` 等接口类型
    - 完善 `YapiInterface` 和 `YapiInterfaceDetail` 类型，添加请求/响应体详细字段

## [1.0.2] - 2025-11-20

### Added

- **CD工作流优化** - 改进GitHub Actions发布流程
    - 优化自动化发布配置
    - 提升CI/CD流水线稳定性

### Technical

- **代码清理** - 移除冗余测试代码，提升代码质量
- **样式优化** - 更新CSS样式，改善用户界面体验

## [1.0.1] - 2025-11-19

### Fixed

- **修复内存泄漏风险** - WebView Provider 中的定时器和事件监听器未正确清理
    - 添加 `disposables` 和 `timers` 数组追踪资源
    - 实现 `dispose()` 方法确保资源正确释放
    - 注册 WebView 销毁回调自动清理
- **完善错误处理机制** - 添加超时、重试和详细错误信息
    - 创建完整的错误类型体系（NetworkError, TimeoutError, ApiError, AuthenticationError）
    - 实现请求超时控制（默认 30 秒）
    - 实现自动重试机制（最多 3 次，指数退避策略）
    - 提供详细的错误信息和可操作的恢复建议
- **提升类型安全性** - 移除 `any` 类型，使用具体类型定义
    - 将 `YapiResponse<T = any>` 改为 `YapiResponse<T = unknown>`
    - 新增 `HttpMethod`, `InterfaceStatus`, `RequestBodyType`, `RequiredFlag` 等类型定义
    - 添加 `WebviewMessage` 接口定义
    - 为所有函数参数添加类型验证

### Technical

- 新增 `src/errors.ts` - 错误类型定义模块
- 优化 `yapiService.ts` - 重构请求方法，添加超时和重试逻辑
- 优化 `webviewProvider.ts` - 添加资源清理和错误处理辅助方法
- 完善测试覆盖 - 更新 mock 对象以支持新的 API
- 代码质量提升 - 所有测试通过（46/46）

## [1.0.0] - 2025-11-18

### Added

- YAPI接口资源管理器，支持可视化浏览和管理YAPI接口
- 自动生成TypeScript类型定义和API函数
- 支持自定义模板，使用ES6模板字符串语法
- 支持JSDoc注释自动生成，包含接口描述和参数说明
- 项目配置管理，支持多项目配置
- 接口搜索功能，支持跨菜单目录全局搜索
- 接口批量选择和生成功能
- 复制YAPI线上地址和接口路由功能
- 接口开发状态展示
- 模板重置命令 (`YAPI TypeScript: Reset Templates`)
- 响应参数备注支持
- 接口刷新功能

### Features

- 树形目录展开/收缩交互
- 接口菜单收缩展开
- 选中接口数量统计显示
- 请求和响应参数类型自动推导
- 命名冲突自动处理
- 支持Windows和macOS跨平台
- 连接失败友好提示
- 表格展示优化，操作图标后置对齐
- 代码生成Loading状态提示
- 前端通知系统

### Fixed

- 修复中划线命名的对象key报错问题
- 修复CI格式检查问题
- 修复刷新按钮图标和文本对齐
- 降低VS Code最低版本依赖至1.50.0

### Technical

- 集成ESLint和Prettier代码规范
- 集成Husky和lint-staged自动化检查
- 完整的测试框架支持
- CI/CD自动化发布流程
- 使用Webpack打包优化

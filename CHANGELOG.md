# Change Log

All notable changes to the "yapi2ts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.3.3] - 2026-06-23

### Improved

- **文档更新与体验优化** - 全面重构并同步了插件官方文档
    - 更新了 `README.md` 与 `docs/` 下的快速入门、使用指南、常见问题及模板配置等文档。
    - 确保文档内容与 1.3.x 版本引入的 `.vscode/settings.json` 协同配置模式、Keychain 安全隔离机制以及精简模板等最新特性保持完全一致。

## [1.3.2] - 2026-06-22

### Added

- **发布准备脚本** - 新增发布流程自动化脚本以规范发布校验
    - 在 `scripts` 目录中新增 `release-prepare.js` 脚本，在 master 分支、工作区干净且与远程同步时，列出最近 5 个 tag 并提示输入新 tag，打 tag 并推送到远程仓库。
    - 在 `package.json` 中注册 `release:prepare` 脚本命令，简化发版准备流程。

## [1.3.1] - 2026-06-22

### Improved

- **代码生成按钮 Loading 状态优化** - 优化了代码生成三个 CTA 按钮在“生成中”切换时的布局稳定性
    - 引入 `.btn-loading-content` 绝对定位占位，配合 `.btn-content` 的可见性隐藏，确保按钮在 Loading 状态下保持原有物理尺寸，彻底解决由于文字长度差异导致的按钮宽度收缩和界面布局回流抖动问题。

## [1.3.0] - 2026-06-11

### Added

- **手动清除已保存 Token 的命令** - 支持通过命令面板清除本地安全存储中的 Token
    - 新增 `yapi2ts.clearTokens` 命令，供开发者在需要时手动清理 Keychain 中已保存的项目安全 Token。

### Improved

- **团队协作与项目配置重构** - 全面切换为以 `.vscode/settings.json` 为主的团队协作配置模式
    - 彻底移除了本地的“我的项目”增删改查面板，转为从工作区配置中读取 `yapi2ts.projects`。
    - 针对 `projectToken` 提供了详细友好的描述，并移除了 `projectId` 字段。
    - 当项目配置未设置时，自动在“接口列表”中展示“如何配置 YAPI 项目”的操作指引卡片，并支持一键定位打开配置和复制配置模板。
- **Token 敏感数据安全隔离** - 基于 Keychain 彻底避免明文 Token 提交泄露
    - 引入 `vscode.secrets` 加密存储敏感的 YAPI Project Token，以项目唯一 `id` 标识并将其妥善保管在系统钥匙串中。
    - 完善连接逻辑，当连接测试发现授权失败（Token 无效/过期）时，会自动在本地 Keychain 中清理掉失效的密钥，以便下次提示重新输入。
- **UI 视觉与布局高度自适应** - 修复底部大面积留白问题
    - 调整全局样式，显示声明 `html` 和 `body` 元素 `height: 100%` 限制溢出。
    - 调整 `.container` 与 `.tab-content.active` 布局属性，确保树节点与表格内容区域能顺畅拉伸并充满整个视图剩余高度。
    - 在 `.CLAUDE.md` 规范指南中追加图标规范，强制要求全部采用 Lucide 或自定义精美 SVG 图标，全面禁止在 Webview 界面中使用系统 Emoji 符号。

### Fixed

- **项目初始化加载与事件丢失修复** - 解决无配置卡片无法加载问题
    - 修复后端缺少对 `loadProjects` 消息处理器导致 Webview 启动时请求被忽略、数据推送发生竞态的 Bug。
    - 清理了前端 `main.js` 中 `projectsLoaded` 冗余重复的侦听器，提升消息交互稳定性。

## [1.2.9] - 2026-06-08

### Technical

- **版本发布** - 提升版本号至 1.2.9。

## [1.2.8] - 2026-06-08

### Improved

- **UI 布局优化** - 接口代码生成操作平铺与响应式适配
    - 将原有的折叠“高级选项”平铺展开为“生成完整代码”、“仅类型定义”和“仅 API 代码”三个并排按钮，提升交互效率
    - 引入 CSS 容器查询，支持在窄屏或面板折叠状态下自适应为垂直堆叠布局
- **内置模板精简** - 默认只保留 Axios 模板
    - 精简内置模板，移除 Fetch 和 Simple Request 模板，专注于最常用的 Axios 实现，降低用户选择心智负担

## [1.2.7] - 2026-06-06

### Improved

- **UI 视觉与布局优化** - 接口筛选/搜索体验提升
    - 将接口筛选输入框移至左侧接口树导航栏内，保持界面层级清晰
    - 优化搜索栏的响应式布局，在接口加载中/加载失败、或面板折叠状态下自动隐藏搜索栏
    - 微调输入框高度、内边距和字体大小，以及按钮间距，使整体视觉更加精致紧凑
- **AI 辅助编码规范** - 新增 AI 规则定义
    - 新增 `.CLAUDE.md` 文件，规范 AI Agent 的构建、测试、代码风格及工程模式，提升协同开发效率

## [1.2.6] - 2026-06-05

### Improved

- **UI 视觉升级** - Webview 界面图标与状态样式优化
    - 使用现代化 SVG Lucide 图标替换所有 Emoji 图标（如文件夹、复制、链接、状态指示器等），提升整体视觉一致性与现代感
    - 优化接口开发状态的视觉呈现（使用状态圆点 status-dot），并改进复制成功时的勾选反馈交互
- **CI/CD 构建** - 优化持续集成工作流
    - 将 GitHub Actions 中的 pnpm 版本锁定为 `9`，确保与运行环境的 Node.js 兼容性，提升自动化构建与发布的稳定性

## [1.2.5] - 2026-03-21

### Improved

- **UI 视觉统一** - 完善界面图标细节
    - 将代码预览页面的“复制”按钮图标由 Emoji 替换为 SVG，保持整体视觉风格一致
- **文档完善** - 开发者文档更新
    - 完善 `docs/` 目录下的使用文档、快速开始等指引

## [1.2.4] - 2026-02-09

### Improved

- **文档体验升级** - 文档结构重构与视觉优化
    - 重新梳理项目文档，将详细说明迁移至 `docs/` 目录，保持 README 简洁

## [1.2.3] - 2026-02-05

### Improved

- **UI 视觉升级** - 图标与主题优化
    - 使用 SVG 图标全面替换 Emoji，提升界面精致度
    - 深度优化 Light 主题适配，解决按钮、输入框等元素在浅色主题下不可见的问题
    - 优化 Toast 通知样式，提升消息可读性和对比度
- **交互体验** - 细节优化
    - 修复切换协同模式时的布局抖动问题，提升操作流畅度

## [1.2.2] - 2026-02-04

### Improved

- **路径优化** - 优化 YAPI URL 处理逻辑
    - 自动移除 `yapiUrl` 结尾的多余斜杠，确保路径拼接正确

## [1.2.1] - 2026-01-06

### Added

- **接口 ID 搜索** - 增强搜索功能
    - 支持通过接口 ID 进行精确搜索

## [1.2.0] - 2025-12-16

### Added

- **代码预览** - 新增生成代码实时预览功能
    - 支持在生成代码前预览完整的 TypeScript 类型定义和 API 函数
    - 预览窗口支持语法高亮
    - 方便开发者在复制前核对生成的代码内容

### Technical

- **代码规范** - 集成 Prettier 代码格式化工具
    - 统一项目代码风格
- **CI/CD** - 优化 CD 工作流配置

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

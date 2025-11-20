# Change Log

All notable changes to the "yapi2ts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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

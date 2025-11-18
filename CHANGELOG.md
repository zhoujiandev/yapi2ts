# Change Log

All notable changes to the "yapi2ts" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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

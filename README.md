<a id="top"></a>

# YAPI TypeScript

[![Version](https://img.shields.io/open-vsx/v/zhoujian/yapi-ts?color=FF561B)](https://open-vsx.org/extension/zhoujian/yapi-ts)
[![Downloads](https://img.shields.io/open-vsx/dt/zhoujian/yapi-ts?color=57CF27)](https://open-vsx.org/extension/zhoujian/yapi-ts)
![License](https://img.shields.io/badge/license-MIT-2359F1.svg)
[![GitHub Stars](https://img.shields.io/github/stars/zhoujiandev/yapi2ts?style=flat&color=yellow)](https://github.com/zhoujiandev/yapi2ts)
[![GitHub Issues](https://img.shields.io/github/issues/zhoujiandev/yapi2ts)](https://github.com/zhoujiandev/yapi2ts/issues)
[![Last Commit](https://img.shields.io/github/last-commit/zhoujiandev/yapi2ts)](https://github.com/zhoujiandev/yapi2ts/commits)

**English** | A powerful editor extension for auto-generating TypeScript type definitions and API code from YAPI documentation. Supports VSCode, Cursor, VSCodium and other compatible editors.

**中文** | 一个强大的编辑器插件，用于从 YAPI 接口文档自动生成 TypeScript 类型定义和 API 接口代码，提升前端开发效率。支持 VSCode、Cursor、VSCodium 等兼容编辑器。通过可视化界面轻松管理 YAPI 项目，浏览接口文档，并一键生成标准化的 TypeScript 代码。

**Keywords**: YAPI, TypeScript, Code Generator, API Documentation, Type Generation, VSCode Extension, Swagger Alternative, Interface Generator, Frontend Development, API Client

> **插件名称**: yapi-ts  
> **GitHub 仓库**: [https://github.com/zhoujiandev/yapi2ts](https://github.com/zhoujiandev/yapi2ts)  
> **Open VSX**: [https://open-vsx.org/extension/zhoujian/yapi-ts](https://open-vsx.org/extension/zhoujian/yapi-ts)

## 🎬 功能演示 (Demo)

![功能演示](https://github.com/zhoujiandev/yapi2ts/releases/download/assets/presentation.gif)

## ✨ 主要特性 (Key Features)

- **🔗 YAPI 集成**: 支持多项目管理，实时同步接口文档。
- **🎯 智能代码生成**:
    - 自动生成 TypeScript 类型定义（支持 JSON Schema 解析）。
    - 基于模板生成 API 请求代码（支持 Axios, Fetch 等）。
    - 智能处理命名冲突，支持批量生成。
- **🌲 直观界面**: 树形导航接口分类，表格展示接口详情，支持模糊搜索。
- **🛠️ 灵活模板**: 内置常用模板，支持 EJS 自定义模板，满足个性化需求。
- **📋 便捷操作**: 一键复制生成代码，快速访问 YAPI 原文档。

## 🚀 快速开始 (Quick Start)

### 安装

在 VSCode / Cursor 扩展市场搜索 `yapi-ts` 安装，或使用命令：

```bash
code --install-extension zhoujian.yapi-ts
```

### 使用流程

1.  **配置項目**: 在插件面板 "我的项目" 中添加 YAPI 地址和 Token。
2.  **连接**: 在 "接口列表" 选择项目并连接。
3.  **生成**: 选择接口，点击生成类型或 API 代码。

## 📖 文档 (Documentation)

- **💡 用户指南 (User Guide)**
    - [快速开始 (Quick Start)](docs/quick-start.md) - 插件安装与基本配置。
    - [详细使用指南 (Usage Guide)](docs/usage.md) - 项目管理、接口浏览与代码生成详解。
    - [模板系统 (Template System)](docs/templates.md) - 模板语法参考与变量说明。
    - [常见问题 (FAQ)](docs/faq.md) - 常见错误排查与解答。

- **🛠️ 开发者资源 (Developer Resources)**
    - [开发指南 (Development Guide)](docs/development.md) - 环境搭建、项目结构与API说明。
    - [贡献指南 (Contributing)](docs/contributing.md) - 拉取请求提交流程与规范。

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 许可证。

---

**如果这个插件对你有帮助，请给我们一个⭐️！**

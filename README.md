# YAPI to TypeScript

一个强大的VSCode插件，用于从YAPI接口文档自动生成TypeScript类型定义和API接口代码，提升前端开发效率。

## ✨ 功能特性

- 🔗 **YAPI集成** - 连接YAPI项目，实时获取接口文档
- 🌲 **树形导航** - 直观的接口分类树形展示
- 📋 **接口列表** - 表格形式展示接口详情，支持批量操作
- 🎯 **智能生成** - 自动生成TypeScript类型定义和API调用代码
- 🛠️ **模板系统** - 内置Axios模版，支持自定义模板
- 💾 **项目管理** - 多项目配置管理，快速切换
- 📝 **模板编辑** - 可视化模板编辑器，支持变量替换

## 🚀 快速开始

### 安装插件

1. 在VSCode扩展市场搜索 "YAPI to TypeScript"
2. 点击安装并重启VSCode

### 基本使用

1. **打开插件面板**
    - 点击VSCode左侧活动栏的 "YAPI to TypeScript" 图标
    - 或使用命令面板 (`Ctrl+Shift+P`) 搜索 "Open YAPI Panel"

2. **项目管理**
    - 通过项目管理功能添加和管理YAPI项目
    - 配置项目的YAPI服务器地址和Token
    - 选择当前工作的项目

3. **浏览和生成代码**
    - 选择项目后，左侧显示接口分类树
    - 点击分类查看接口列表
    - 勾选需要的接口，选择模板，生成代码

## 📖 详细使用指南

### 接口管理

**项目管理**

- 支持多个YAPI项目配置和管理
- 项目Token获取：YAPI项目 → 设置 → token配置
- 快速切换不同项目
- 自动验证项目连接状态

**浏览接口**

- 左侧树形结构展示接口分类
- 右侧表格显示接口详情（方法、标题、路径、状态）
- 支持接口搜索和筛选

### 代码生成

**生成TypeScript类型定义**

1. 勾选需要生成类型的接口
2. 点击 "生成参数" 按钮
3. 自动生成请求参数和响应数据的TypeScript接口定义
4. 支持JSON Schema和表单参数解析

**生成API接口代码**

1. 勾选需要生成API的接口
2. 选择代码模板（Axios、Fetch或自定义）
3. 点击 "生成API定义" 按钮
4. 根据模板生成完整的API调用代码

### 模板管理

**使用内置模板**

- **Axios模板**：基于axios库的HTTP请求封装

**创建自定义模板**

1. 切换到 "我的模板" 标签页
2. 点击 "新增模板" 创建模板
3. 使用模板变量自定义代码格式
4. 保存并在代码生成时选择使用

## 🔧 模板变量

在自定义模板中，可以使用以下变量来动态生成代码：

| 变量名             | 描述                           | 示例                           |
| ------------------ | ------------------------------ | ------------------------------ |
| `{{methodName}}`   | 方法名（根据接口路径自动生成） | `getUserInfo`                  |
| `{{title}}`        | 接口标题                       | `获取用户信息`                 |
| `{{description}}`  | 接口描述                       | `根据用户ID获取用户详细信息`   |
| `{{path}}`         | 接口路径                       | `/api/user/info`               |
| `{{method}}`       | HTTP方法                       | `GET`, `POST`, `PUT`, `DELETE` |
| `{{requestType}}`  | 请求参数类型名                 | `GetUserInfoRequest`           |
| `{{responseType}}` | 响应数据类型名                 | `GetUserInfoResponse`          |
| `{{queryType}}`    | 查询参数类型名                 | `GetUserInfoQuery`             |

## 📋 内置模板

### Axios模板

适用于使用axios库的项目：

```typescript
/**
 * {{description}}
 */
export const {{methodName}} = (params: {{queryType}}, data: {{requestType}}): Promise<{{responseType}}> => {
  return request({
    url: '{{path}}',
    method: '{{method}}',
    params,
    data,
  });
};
```

## 🔌 YAPI API支持

插件使用以下YAPI开放接口获取数据：

| API端点                     | 功能                 | 参数                              |
| --------------------------- | -------------------- | --------------------------------- |
| `/api/project/get`          | 获取项目信息         | `token`                           |
| `/api/interface/getCatMenu` | 获取接口分类菜单     | `token`, `project_id`             |
| `/api/interface/list_cat`   | 获取分类下的接口列表 | `token`, `catid`, `page`, `limit` |
| `/api/interface/get`        | 获取接口详情         | `token`, `id`                     |

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16
- pnpm >= 7
- VSCode >= 1.100.0

### 本地开发

```bash
# 克隆项目
git clone https://github.com/zhoujiandev/yapi2ts.git
cd yapi2ts

# 安装依赖
pnpm install

# 编译TypeScript
pnpm run compile

# 监听文件变化
pnpm run watch

# 运行测试
pnpm run test
```

### 调试插件

1. 在VSCode中打开项目
2. 按 `F5` 启动调试模式
3. 在新窗口中测试插件功能

### 打包发布

```bash
# 代码检查
pnpm run lint

# 格式化代码
pnpm run format

# 打包插件
pnpm run package

# 发布到VSCode市场
vsce publish
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 提交Issue

- 使用清晰的标题描述问题
- 提供详细的复现步骤
- 包含错误信息和截图

### 提交Pull Request

1. Fork项目到你的GitHub账户
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建Pull Request

### 开发规范

- 遵循TypeScript和ESLint规范
- 添加适当的注释和文档
- 编写单元测试
- 确保所有测试通过

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🔄 更新日志

### v0.0.1 (2024-01-01)

**🎉 初始版本**

- ✅ 基础的YAPI接口获取功能
- ✅ TypeScript类型定义生成
- ✅ 模板化API代码生成
- ✅ 可视化接口管理界面
- ✅ 自定义模板管理
- ✅ 多项目配置支持

## 📞 支持与反馈

- 🐛 [报告Bug](https://github.com/zhoujiandev/yapi2ts/issues)
- 💡 [功能建议](https://github.com/zhoujiandev/yapi2ts/issues)
- 📧 邮箱：support@yapi2ts.com
- 💬 QQ群：123456789

---

**如果这个插件对你有帮助，请给我们一个⭐️！**

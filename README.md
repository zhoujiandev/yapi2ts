# YAPI to TypeScript

一个强大的VSCode插件，用于从YAPI接口文档自动生成TypeScript类型定义和API接口代码，提升前端开发效率。

> **插件名称**: yapi-ts  
> **GitHub仓库**: [https://github.com/zhoujiandev/yapi2ts](https://github.com/zhoujiandev/yapi2ts)

## ✨ 功能特性

- 🔗 **YAPI集成** - 连接YAPI项目，实时获取接口文档
- 🌲 **树形导航** - 直观的接口分类树形展示
- 📋 **接口列表** - 表格形式展示接口详情，支持批量操作
- 🔍 **智能搜索** - 支持接口路径模糊匹配搜索，快速定位接口
- 🎯 **智能生成** - 自动生成TypeScript类型定义和API调用代码
- 🛠️ **模板系统** - 内置Axios模版，支持自定义模板
- 💾 **项目管理** - 多项目配置管理，快速切换
- 📝 **模板编辑** - 可视化模板编辑器，支持变量替换
- 📋 **一键复制** - 生成的代码自动复制到剪贴板
- 🔗 **YAPI链接** - 快速复制YAPI接口地址，便于查看原始文档

## 🚀 快速开始

### 安装插件

1. 在VSCode扩展市场搜索 "yapi-ts" 或 "YAPI to TypeScript"
2. 点击安装并重启VSCode
3. 安装完成后，左侧活动栏会出现 YAPI to TypeScript 图标

### 基本使用

1. **打开插件面板**
    - 点击VSCode左侧活动栏的 "YAPI to TypeScript" 图标
    - 插件界面包含三个主要标签页：
        - **接口列表** - 浏览和生成接口代码
        - **我的项目** - 管理YAPI项目配置
        - **我的模板** - 管理代码生成模板

2. **项目配置**
    - 切换到 "我的项目" 标签页
    - 点击 "新增项目" 添加YAPI项目
    - 填写项目名称、YAPI服务器地址和项目Token
    - 项目Token获取：YAPI项目 → 设置 → token配置

3. **浏览和生成代码**
    - 切换到 "接口列表" 标签页
    - 在项目下拉框中选择已配置的项目，点击 "连接"
    - 左侧显示接口分类树形结构，右侧显示接口列表表格
    - 使用搜索框可以模糊匹配接口路径
    - 勾选需要的接口，选择模板，生成代码

## 📖 详细使用指南

### 项目管理

**添加YAPI项目**

1. 切换到 "我的项目" 标签页
2. 点击 "新增项目" 按钮
3. 填写项目配置信息：
    - **项目名称**：自定义项目名称，便于识别
    - **YAPI地址**：YAPI服务器地址，如 `https://yapi.example.com`
    - **项目Token**：YAPI项目的访问令牌
4. 点击 "保存" 完成项目添加

**获取项目Token**

1. 登录YAPI系统
2. 进入目标项目
3. 点击 "设置" → "token配置"
4. 复制项目Token

**项目管理操作**

- **编辑项目**：点击项目列表中的 "编辑" 按钮修改项目信息
- **删除项目**：点击项目列表中的 "删除" 按钮移除项目
- **快速切换**：在接口列表页面的项目下拉框中快速切换项目

### 接口浏览与搜索

**连接项目**

1. 切换到 "接口列表" 标签页
2. 在项目下拉框中选择已配置的项目
3. 点击 "连接" 按钮加载接口数据

**浏览接口**

- **左侧树形导航**：显示接口分类的树形结构，点击分类查看该分类下的接口
- **右侧接口表格**：显示接口详情，包括HTTP方法、接口标题、路径和状态
- **接口状态标识**：
    - 🟢 已发布
    - 🟡 开发中
    - 🔴 已废弃

**智能搜索**

1. 在搜索框中输入接口路径关键词
2. 支持模糊匹配，可输入路径的任意部分
3. 点击搜索按钮或按回车键执行搜索
4. 搜索结果会在右侧表格中显示
5. 点击 "清空" 按钮清除搜索条件

### 代码生成

**生成TypeScript类型定义**

1. 在接口表格中勾选需要生成类型的接口
2. 点击 "生成参数" 按钮
3. 插件会自动解析接口的请求参数和响应数据
4. 生成的TypeScript接口定义会自动复制到剪贴板
5. 支持以下类型生成：
    - 请求参数类型（Request）
    - 响应数据类型（Response）
    - 查询参数类型（Query）

**生成API接口代码**

1. 在接口表格中勾选需要生成API的接口
2. 在模板下拉框中选择代码模板
3. 点击 "生成API定义" 按钮
4. 根据选择的模板生成完整的API调用代码
5. 生成的代码会自动复制到剪贴板

**批量操作**

- 支持同时选择多个接口进行批量生成
- 可以一次性生成多个接口的类型定义或API代码
- 生成的代码会按接口顺序组织

### 模板管理

**使用内置模板**

- **Axios模板**：基于axios库的HTTP请求封装，适用于大多数项目

**创建自定义模板**

1. 切换到 "我的模板" 标签页
2. 点击 "新增模板" 按钮
3. 填写模板信息：
    - **模板名称**：自定义模板名称
    - **模板内容**：使用模板变量编写代码模板
4. 点击 "保存" 完成模板创建

**模板管理操作**

- **编辑模板**：点击模板列表中的 "编辑" 按钮修改模板
- **删除模板**：点击模板列表中的 "删除" 按钮移除模板
- **重置模板**：使用命令面板执行 "YAPI to TypeScript: Reset Templates" 恢复默认模板

### 其他功能

**复制YAPI接口地址**

1. 在接口表格的操作列中点击 "复制链接" 按钮
2. YAPI接口的完整地址会复制到剪贴板
3. 可以直接在浏览器中打开查看接口详情

## 🔧 模板变量

在自定义模板中，可以使用以下变量来动态生成代码：

| 变量名                 | 描述                           | 示例                                                    |
| ---------------------- | ------------------------------ | ------------------------------------------------------- |
| `{{methodName}}`       | 方法名（根据接口路径自动生成） | `getUserInfo`                                           |
| `{{title}}`            | 接口标题                       | `获取用户信息`                                          |
| `{{path}}`             | 接口路径                       | `/api/user/info`                                        |
| `{{method}}`           | HTTP方法（大写）               | `GET`, `POST`, `PUT`, `DELETE`                          |
| `{{lowerCaseMethod}}`  | HTTP方法（小写）               | `get`, `post`, `put`, `delete`                          |
| `{{responseTypeName}}` | 响应数据类型名                 | `GetUserInfoResponse`                                   |
| `{{paramsTypeName}}`   | 参数类型名                     | `GetUserInfoParams`                                     |
| `{{interfaceUrl}}`     | YAPI接口详情页URL              | `http://yapi.example.com/project/123/interface/api/456` |

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
| `/api/interface/getCatMenu` | 获取接口分类菜单     | `token`                           |
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

# 发布到VSCode市场（需要配置发布权限）
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

---

**如果这个插件对你有帮助，请给我们一个⭐️！**

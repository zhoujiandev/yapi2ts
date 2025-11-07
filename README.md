# YAPI to TypeScript

[![Version](https://img.shields.io/open-vsx/v/zhoujian/yapi-ts)](https://open-vsx.org/extension/zhoujian/yapi-ts)
[![Downloads](https://img.shields.io/open-vsx/dt/zhoujian/yapi-ts)](https://open-vsx.org/extension/zhoujian/yapi-ts)
[![Rating](https://img.shields.io/open-vsx/rating/zhoujian/yapi-ts)](https://open-vsx.org/extension/zhoujian/yapi-ts)

一个强大的VSCode插件，用于从YAPI接口文档自动生成TypeScript类型定义和API接口代码，提升前端开发效率。通过可视化界面轻松管理YAPI项目，浏览接口文档，并一键生成标准化的TypeScript代码。

> **插件名称**: yapi-ts  
> **GitHub仓库**: [https://github.com/zhoujiandev/yapi2ts](https://github.com/zhoujiandev/yapi2ts)  
> **Open VSX**: [https://open-vsx.org/extension/zhoujian/yapi-ts](https://open-vsx.org/extension/zhoujian/yapi-ts)

## 🎬 功能演示

![功能演示](https://github.com/zhoujiandev/yapi2ts/releases/download/assets/presentation.gif)

## ✨ 功能特性

### 🔗 YAPI集成

- 支持多YAPI项目配置和管理
- 实时连接YAPI服务器获取最新接口文档
- 自动同步接口分类和详情信息

### 🎯 智能代码生成

- **TypeScript类型定义** - 自动解析请求参数和响应数据，生成标准TS接口
- **API接口代码** - 基于模板生成完整的API调用函数
- **智能类型推导** - 支持JSON Schema解析，准确生成复杂类型
- **批量生成** - 支持同时选择多个接口进行批量代码生成

### 🌲 直观的界面设计

- **树形导航** - 左侧树形结构展示接口分类，层次清晰
- **表格列表** - 右侧表格展示接口详情，支持状态标识和操作按钮
- **三标签页设计** - 接口列表、项目管理、模板管理分离，操作便捷
- **智能搜索** - 支持接口路径模糊匹配，快速定位目标接口

### 🛠️ 灵活的模板系统

- **内置模板** - 提供Axios等主流HTTP库的默认模板
- **自定义模板** - 支持创建和编辑个性化代码模板
- **变量替换** - 丰富的模板变量支持，满足各种代码生成需求
- **模板管理** - 可视化的模板编辑器，支持增删改查操作

### 💾 项目配置管理

- **多项目支持** - 同时管理多个YAPI项目配置
- **快速切换** - 项目间一键切换，提高工作效率
- **配置持久化** - 项目配置自动保存，重启VSCode后自动恢复

### 📋 便捷的操作体验

- **一键复制** - 生成的代码自动复制到剪贴板，即生即用
- **YAPI链接** - 快速复制YAPI接口地址，便于查看原始文档
- **状态提示** - 清晰的接口状态标识（已发布/开发中/已废弃）
- **错误处理** - 友好的错误提示和异常处理机制

## 🚀 快速开始

### 📦 安装插件

#### 方式一：VSCode扩展市场安装（推荐）

1. 打开VSCode，按 `Ctrl+Shift+X`（Mac: `Cmd+Shift+X`）打开扩展面板
2. 在搜索框中输入 "yapi-ts" 或 "YAPI to TypeScript"
3. 找到插件后点击 "安装" 按钮
4. 安装完成后重启VSCode（如需要）

#### 方式二：命令行安装

```bash
code --install-extension zhoujian.yapi-ts
```

### 🎯 首次使用

安装完成后，您会在VSCode左侧活动栏看到 **YAPI to TypeScript** 图标 📋

#### 1. 打开插件面板

- 点击左侧活动栏的 YAPI to TypeScript 图标
- 插件界面包含三个主要标签页：
    - **📋 接口列表** - 浏览接口文档，生成代码
    - **🏗️ 我的项目** - 管理YAPI项目配置
    - **📝 我的模板** - 管理代码生成模板

#### 2. 配置YAPI项目

1. 切换到 **"我的项目"** 标签页
2. 点击 **"新增项目"** 按钮
3. 填写项目配置信息：
    - **项目名称**：自定义名称，便于识别（如：用户中心API）
    - **YAPI地址**：您的YAPI服务器地址（如：`https://yapi.company.com`）
    - **项目Token**：YAPI项目的访问令牌
4. 点击 **"保存"** 完成配置

> 💡 **获取项目Token的方法**：
>
> 1. 登录您的YAPI系统
> 2. 进入目标项目
> 3. 点击 "设置" → "token配置"
> 4. 复制项目Token

#### 3. 开始使用

1. 切换到 **"接口列表"** 标签页
2. 在项目下拉框中选择刚才配置的项目
3. 点击 **"连接"** 按钮加载接口数据
4. 左侧显示接口分类树，右侧显示接口列表
5. 勾选需要的接口，选择模板，开始生成代码！

### ⚡ 快速体验

以下是一个完整的使用流程示例：

```
1. 配置项目 → 2. 连接YAPI → 3. 浏览接口 → 4. 生成代码 → 5. 复制使用
```

**示例场景**：为用户管理相关接口生成TypeScript代码

1. **添加项目**：项目名称填写"用户管理系统"，配置YAPI地址和Token
2. **连接项目**：选择项目后点击连接，加载所有接口分类
3. **选择接口**：在左侧树中选择"用户管理"分类，右侧表格显示相关接口
4. **生成类型**：勾选"获取用户信息"接口，点击"生成参数"按钮
5. **生成API**：选择Axios模板，点击"生成API定义"按钮
6. **使用代码**：生成的代码已自动复制到剪贴板，直接粘贴到项目中使用

## 📖 详细使用指南

### 🏗️ 项目管理

项目管理是使用插件的第一步，通过配置YAPI项目信息，建立与YAPI服务器的连接。

#### 添加YAPI项目

1. **进入项目管理页面**
    - 切换到 **"我的项目"** 标签页
    - 页面显示已配置的项目列表

2. **新增项目配置**
    - 点击 **"新增项目"** 按钮
    - 在弹出的对话框中填写以下信息：

| 字段          | 说明                            | 示例                          |
| ------------- | ------------------------------- | ----------------------------- |
| **项目名称**  | 自定义项目名称，便于识别和管理  | `用户中心API`、`订单管理系统` |
| **YAPI地址**  | YAPI服务器的完整地址            | `https://yapi.company.com`    |
| **项目Token** | YAPI项目的访问令牌，用于API认证 | `abc123def456...`             |

3. **保存项目配置**
    - 填写完成后点击 **"保存"** 按钮
    - 系统会自动验证配置的有效性
    - 配置成功后项目会出现在项目列表中

#### 获取项目Token

> 💡 **重要提示**：项目Token是访问YAPI接口的凭证，请妥善保管

**获取步骤**：

1. 登录您的YAPI系统
2. 进入目标项目页面
3. 点击页面右上角的 **"设置"** 按钮
4. 在设置页面中找到 **"token配置"** 选项
5. 复制显示的项目Token

#### 项目管理操作

- **📝 编辑项目**：点击项目列表中的 "编辑" 按钮，修改项目配置信息
- **🗑️ 删除项目**：点击项目列表中的 "删除" 按钮，移除不需要的项目配置
- **🔄 快速切换**：在接口列表页面使用项目下拉框快速切换不同项目

### 📋 接口浏览与搜索

接口浏览是插件的核心功能，提供直观的界面来查看和管理YAPI接口。

#### 连接YAPI项目

1. **选择项目**
    - 切换到 **"接口列表"** 标签页
    - 在页面顶部的项目下拉框中选择已配置的项目

2. **建立连接**
    - 点击 **"连接"** 按钮
    - 系统会自动获取项目的接口分类和接口列表
    - 连接成功后左侧显示接口分类树，右侧显示接口表格

#### 界面布局说明

**左侧：接口分类树**

- 📁 显示YAPI项目中的所有接口分类
- 🌲 树形结构，支持展开/折叠操作
- 🎯 点击分类名称可筛选右侧接口列表

**右侧：接口列表表格**

- 📊 表格形式展示接口详细信息
- 🏷️ 包含HTTP方法、接口标题、路径和状态等字段
- ✅ 支持多选操作，便于批量处理

#### 接口状态标识

插件使用不同颜色标识接口状态：

| 状态       | 标识    | 说明                             |
| ---------- | ------- | -------------------------------- |
| **已发布** | 🟢 绿色 | 接口已完成开发并发布，可正常使用 |
| **开发中** | 🟡 黄色 | 接口正在开发中，可能不稳定       |
| **已废弃** | 🔴 红色 | 接口已废弃，不建议使用           |

#### 智能搜索功能

**搜索方式**：

1. 在搜索框中输入接口路径的关键词
2. 支持模糊匹配，可输入路径的任意部分
3. 按回车键或点击搜索按钮执行搜索
4. 点击 "清空" 按钮清除搜索条件

**搜索示例**：

- 输入 `user` 可匹配 `/api/user/info`、`/api/user/list` 等
- 输入 `info` 可匹配 `/api/user/info`、`/api/order/info` 等
- 输入 `/api/user` 可精确匹配该路径下的所有接口

### 🎯 代码生成

代码生成是插件的核心价值，支持生成TypeScript类型定义和API接口代码。

#### 生成TypeScript类型定义

**操作步骤**：

1. 在接口表格中勾选需要生成类型的接口（支持多选）
2. 点击 **"生成参数"** 按钮
3. 插件会自动解析接口的请求参数和响应数据
4. 生成的TypeScript接口定义会自动复制到剪贴板

**生成的类型包括**：

- **请求参数类型**：包含查询参数、请求体参数等
- **响应数据类型**：基于接口返回的JSON Schema生成
- **路径参数类型**：动态路径参数的类型定义

**示例输出**：

```typescript
// 获取用户信息接口类型定义
export interface GetUserInfoRequest {
    userId: number; // 用户ID
    includeProfile?: boolean; // 是否包含详细信息
}

export interface GetUserInfoResponse {
    code: number;
    message: string;
    data: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
}
```

#### 生成API接口代码

**操作步骤**：

1. 在接口表格中勾选需要生成API的接口
2. 在模板下拉框中选择代码模板（如：Axios模板）
3. 点击 **"生成API定义"** 按钮
4. 根据选择的模板生成完整的API调用代码
5. 生成的代码会自动复制到剪贴板

**示例输出**（Axios模板）：

```typescript
/**
 * 获取用户信息
 */
export const getUserInfo = (params: GetUserInfoRequest): Promise<GetUserInfoResponse> => {
    return request({
        url: '/api/user/info',
        method: 'GET',
        params
    });
};
```

#### 批量操作

- **多选支持**：可同时选择多个接口进行批量生成
- **统一输出**：批量生成的代码会按接口顺序组织
- **效率提升**：一次操作生成多个接口的完整代码

### 📝 模板管理

模板系统是插件的核心功能之一，支持使用内置模板和创建自定义模板来生成不同风格的API代码。

#### 使用内置模板

插件提供了经过优化的内置模板，开箱即用：

**🔧 Axios模板**

- 基于流行的Axios HTTP库
- 支持TypeScript类型安全
- 包含完整的请求配置
- 适用于大多数前端项目

#### 创建自定义模板

1. **进入模板管理**
    - 切换到 **"我的模板"** 标签页
    - 查看现有模板列表

2. **新增模板**
    - 点击 **"新增模板"** 按钮
    - 在弹出的编辑器中填写模板信息：

| 字段         | 说明                       | 示例                               |
| ------------ | -------------------------- | ---------------------------------- |
| **模板名称** | 自定义模板名称，便于识别   | `Fetch API模板`、`自定义Axios模板` |
| **模板描述** | 模板的用途和特点说明       | `基于原生Fetch API的轻量级模板`    |
| **模板内容** | 使用模板变量编写的代码模板 | 见下方示例                         |

3. **编写模板内容**
    - 使用 `${变量名}` 语法引用模板变量
    - 支持条件判断和循环逻辑
    - 可以参考内置模板的写法

#### 模板管理操作

- **📝 编辑模板**：点击模板列表中的 "编辑" 按钮，修改模板内容
- **🗑️ 删除模板**：点击模板列表中的 "删除" 按钮，移除自定义模板
- **🔄 重置模板**：使用命令面板执行 "YAPI to TypeScript: Reset Templates" 恢复默认模板

#### 模板变量详解

在自定义模板中，可以使用以下变量来动态生成代码：

##### 基础信息变量

| 变量名               | 描述                           | 示例值                                |
| -------------------- | ------------------------------ | ------------------------------------- |
| `${methodName}`      | 方法名（根据接口路径自动生成） | `getUserInfo`、`createOrder`          |
| `${title}`           | 接口标题                       | `获取用户信息`、`创建订单`            |
| `${path}`            | 接口路径                       | `/api/user/info`、`/api/order/create` |
| `${method}`          | HTTP方法（大写）               | `GET`、`POST`、`PUT`、`DELETE`        |
| `${lowerCaseMethod}` | HTTP方法（小写）               | `get`、`post`、`put`、`delete`        |

##### 类型相关变量

| 变量名                | 描述           | 示例值                                       |
| --------------------- | -------------- | -------------------------------------------- |
| `${responseTypeName}` | 响应数据类型名 | `GetUserInfoResponse`、`CreateOrderResponse` |
| `${paramsTypeName}`   | 参数类型名     | `GetUserInfoParams`、`CreateOrderParams`     |
| `${queryTypeName}`    | 查询参数类型名 | `GetUserInfoQuery`、`SearchOrderQuery`       |

##### 条件判断变量

| 变量名         | 描述              | 用途                    |
| -------------- | ----------------- | ----------------------- |
| `${isGet}`     | 是否为GET请求     | 条件渲染GET特定逻辑     |
| `${isPost}`    | 是否为POST请求    | 条件渲染POST特定逻辑    |
| `${isPut}`     | 是否为PUT请求     | 条件渲染PUT特定逻辑     |
| `${isDelete}`  | 是否为DELETE请求  | 条件渲染DELETE特定逻辑  |
| `${isPatch}`   | 是否为PATCH请求   | 条件渲染PATCH特定逻辑   |
| `${isHead}`    | 是否为HEAD请求    | 条件渲染HEAD特定逻辑    |
| `${isOptions}` | 是否为OPTIONS请求 | 条件渲染OPTIONS特定逻辑 |
| `${isNotGet}`  | 是否为非GET请求   | 条件渲染非GET请求逻辑   |

##### 高级变量

| 变量名            | 描述              | 用途               |
| ----------------- | ----------------- | ------------------ |
| `${interfaceUrl}` | YAPI接口详情页URL | 生成文档链接注释   |
| `${interface}`    | 完整的接口对象    | 访问接口的所有属性 |

#### 模板示例

##### Axios模板示例

```typescript
/**
 * ${title}
 * @description ${interface.desc || ''}
 * @see ${interfaceUrl}
 */
export const ${methodName} = (
  ${isGet ? 'params' : 'data'}: ${paramsTypeName}
): Promise<${responseTypeName}> => {
  return request({
    url: '${path}',
    method: '${method}',
    ${isGet ? 'params' : 'data'},
  });
};
```

##### Fetch API模板示例

```typescript
/**
 * ${title}
 */
export const ${methodName} = async (
  ${isGet ? 'params' : 'data'}: ${paramsTypeName}
): Promise<${responseTypeName}> => {
  const url = '${path}' + ${isGet ? '?' + new URLSearchParams(params).toString()' : ''};

  const response = await fetch(url, {
    method: '${method}',
    headers: {
      'Content-Type': 'application/json',
    },
    ${isNotGet ? 'body: JSON.stringify(data),' : ''}
  });

  return response.json();
};
```

##### 自定义请求库模板示例

```typescript
/**
 * ${title}
 * 接口文档: ${interfaceUrl}
 */
export const ${methodName} = (params: ${paramsTypeName}): Promise<${responseTypeName}> => {
  return http.${lowerCaseMethod}<${responseTypeName}>('${path}', ${isGet ? 'params' : 'params'});
};
```

#### 模板最佳实践

1. **保持一致性**：在同一项目中使用统一的模板风格
2. **添加注释**：为生成的代码添加有意义的注释
3. **类型安全**：充分利用TypeScript的类型系统
4. **错误处理**：在模板中考虑错误处理逻辑
5. **文档链接**：使用 `${interfaceUrl}` 提供接口文档链接

### 🔗 其他实用功能

#### 复制YAPI接口地址

1. 在接口表格的操作列中点击 **"复制链接"** 按钮
2. YAPI接口的完整地址会复制到剪贴板
3. 可以直接在浏览器中打开查看接口的详细文档

**链接格式**：`https://yapi.company.com/project/123/interface/api/456`

#### 接口详情查看

- 点击接口标题可查看接口的详细信息
- 包含请求参数、响应示例、接口说明等完整文档
- 便于开发者深入了解接口规范

## 🔧 模板变量

在自定义模板中，可以使用以下变量来动态生成代码：

| 变量名                | 描述                           | 示例                                                    |
| --------------------- | ------------------------------ | ------------------------------------------------------- |
| `${methodName}`       | 方法名（根据接口路径自动生成） | `getUserInfo`                                           |
| `${title}`            | 接口标题                       | `获取用户信息`                                          |
| `${path}`             | 接口路径                       | `/api/user/info`                                        |
| `${method}`           | HTTP方法（大写）               | `GET`, `POST`, `PUT`, `DELETE`                          |
| `${lowerCaseMethod}`  | HTTP方法（小写）               | `get`, `post`, `put`, `delete`                          |
| `${responseTypeName}` | 响应数据类型名                 | `GetUserInfoResponse`                                   |
| `${paramsTypeName}`   | 参数类型名                     | `GetUserInfoParams`                                     |
| `${interfaceUrl}`     | YAPI接口详情页URL              | `http://yapi.example.com/project/123/interface/api/456` |
| `${isGet}`            | 是否为GET请求                  | `true` 或 `false`                                       |
| `${isPost}`           | 是否为POST请求                 | `true` 或 `false`                                       |
| `${isPut}`            | 是否为PUT请求                  | `true` 或 `false`                                       |
| `${isDelete}`         | 是否为DELETE请求               | `true` 或 `false`                                       |
| `${isPatch}`          | 是否为PATCH请求                | `true` 或 `false`                                       |
| `${isHead}`           | 是否为HEAD请求                 | `true` 或 `false`                                       |
| `${isOptions}`        | 是否为OPTIONS请求              | `true` 或 `false`                                       |
| `${isNotGet}`         | 是否为非GET请求                | `true` 或 `false`                                       |
| `${interface}`        | 完整的接口对象                 | 包含所有YAPI接口属性的对象                              |

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

### 📋 环境要求

**基础环境**：

- **Node.js** >= 16.0.0（推荐使用 LTS 版本）
- **pnpm** >= 7.0.0（包管理器）
- **VSCode** >= 1.100.0（开发和测试环境）
- **Git** >= 2.0.0（版本控制）

**开发工具**（可选但推荐）：

- **VSCode 扩展**：TypeScript Importer、ESLint、Prettier
- **调试工具**：VSCode 内置调试器
- **测试工具**：Jest（已集成）

### 🏗️ 项目结构

```
yapi2ts/
├── src/                    # 源代码目录
│   ├── extension.ts        # 插件入口文件
│   ├── webviewProvider.ts  # Webview 提供者
│   ├── yapiService.ts      # YAPI API 服务
│   ├── codeGenerator.ts    # 代码生成器
│   ├── types.ts           # 类型定义
│   └── utils/             # 工具函数
├── media/                 # 静态资源
│   ├── main.js           # Webview 前端脚本
│   ├── style.css         # 样式文件
│   └── icons/            # 图标资源
├── templates/            # 代码模板
│   └── default.json      # 默认模板配置
├── test/                # 测试文件
├── package.json         # 项目配置
├── tsconfig.json       # TypeScript 配置
└── README.md           # 项目文档
```

### 🚀 本地开发

#### 1. 克隆和初始化

```bash
# 克隆项目
git clone https://github.com/zhoujiandev/yapi2ts.git
cd yapi2ts

# 安装依赖
pnpm install

# 验证安装
pnpm run compile
```

#### 2. 开发命令

```bash
# 编译 TypeScript（一次性）
pnpm run compile

# 监听文件变化（开发模式）
pnpm run watch

# 代码检查
pnpm run lint

# 自动修复代码格式
pnpm run lint:fix

# 格式化代码
pnpm run format

# 运行测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:coverage
```

#### 3. 开发工作流

1. **启动开发环境**：

    ```bash
    pnpm run watch
    ```

2. **在 VSCode 中打开项目**：

    ```bash
    code .
    ```

3. **按 `F5` 启动调试模式**，这会：
    - 编译 TypeScript 代码
    - 启动新的 VSCode 窗口（Extension Development Host）
    - 在新窗口中加载开发中的插件

4. **在新窗口中测试功能**：
    - 点击侧边栏的 YAPI 图标
    - 测试各项功能
    - 查看控制台输出和错误信息

### 🐛 调试指南

#### 1. 插件调试

**启动调试**：

- 在主 VSCode 窗口中按 `F5`
- 或者使用 `Ctrl+Shift+P` 输入 "Debug: Start Debugging"

**调试技巧**：

- 在代码中设置断点
- 使用 `console.log()` 输出调试信息
- 查看 "Developer Tools" 中的控制台输出
- 使用 VSCode 的调试面板查看变量值

#### 2. Webview 调试

**打开开发者工具**：

1. 在插件面板中右键点击
2. 选择 "检查元素" 或 "Inspect"
3. 在开发者工具中调试前端代码

**常见调试场景**：

- 检查网络请求（Network 标签）
- 查看控制台错误（Console 标签）
- 调试 JavaScript 代码（Sources 标签）
- 检查 DOM 结构（Elements 标签）

#### 3. 日志和错误处理

**查看插件日志**：

- 打开 VSCode 输出面板：`Ctrl+Shift+U`
- 选择 "YAPI to TypeScript" 输出通道
- 查看详细的运行日志和错误信息

**常见问题排查**：

- YAPI 连接失败：检查网络和 Token 配置
- 代码生成错误：查看接口数据格式和模板配置
- 插件加载失败：检查 TypeScript 编译错误

### 📦 打包和发布

#### 1. 本地打包

```bash
# 安装 vsce（如果未安装）
npm install -g vsce

# 代码检查和格式化
pnpm run lint
pnpm run format

# 运行测试
pnpm run test

# 打包插件
pnpm run package
# 或者直接使用 vsce
vsce package
```

#### 2. 发布到市场

```bash
# 登录到 VSCode 市场（首次需要）
vsce login <publisher-name>

# 发布新版本
vsce publish

# 发布指定版本
vsce publish 1.0.1

# 发布预发布版本
vsce publish --pre-release
```

#### 3. 版本管理

**版本号规则**：

- 遵循语义化版本控制（Semantic Versioning）
- 格式：`主版本.次版本.修订版本`
- 示例：`1.2.3`

**发布检查清单**：

- [ ] 所有测试通过
- [ ] 代码格式检查通过
- [ ] 更新 CHANGELOG.md
- [ ] 更新版本号
- [ ] 创建 Git 标签
- [ ] 发布到市场

### 🧪 测试指南

#### 1. 单元测试

```bash
# 运行所有测试
pnpm run test

# 运行特定测试文件
pnpm run test -- --testNamePattern="YapiService"

# 生成测试覆盖率报告
pnpm run test:coverage
```

#### 2. 集成测试

**手动测试流程**：

1. 启动调试模式
2. 配置测试 YAPI 项目
3. 测试接口列表加载
4. 测试代码生成功能
5. 测试模板管理功能
6. 验证生成的代码质量

#### 3. 性能测试

**关注指标**：

- 插件启动时间
- 接口列表加载速度
- 代码生成响应时间
- 内存使用情况

### 🔧 开发技巧

#### 1. 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 添加适当的类型注解和注释

#### 2. 性能优化

- 合理使用缓存机制
- 避免频繁的 API 调用
- 优化 Webview 渲染性能
- 使用异步操作避免阻塞

#### 3. 错误处理

- 使用 try-catch 包装异步操作
- 提供友好的错误提示
- 记录详细的错误日志
- 实现优雅的降级处理

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

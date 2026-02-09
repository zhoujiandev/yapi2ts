# 开发指南 & 技术栈

## <a id="tech-stack"></a>🔧 技术栈

本项目采用现代化的前端开发技术栈：

### 核心技术

- **TypeScript** - 类型安全的 JavaScript 超集
- **VSCode Extension API** - VSCode 插件开发接口
- **Webpack** - 模块打包工具

### 开发工具

- **ESLint** - 代码质量检查工具
    - `@typescript-eslint/eslint-plugin` - TypeScript ESLint 插件
    - `eslint-plugin-prettier` - Prettier 集成
- **Prettier** - 代码格式化工具
- **Husky** - Git hooks 管理工具
- **lint-staged** - Git 暂存文件代码检查

### 测试工具

- **Mocha** - 测试框架
- **@vscode/test-electron** - VSCode 插件测试工具
- **@vscode/test-cli** - VSCode 测试命令行工具

### 构建工具

- **Webpack** - 代码打包和优化
- **ts-loader** - TypeScript loader for Webpack

## <a id="development-guide"></a>🛠️ 开发指南

### 📋 环境要求

**基础环境**：

- **Node.js** >= 16.0.0（推荐使用 LTS 版本）
- **pnpm** >= 7.0.0（包管理器）
- **编辑器** >= VSCode 1.50.0（支持 VSCode、Cursor、VSCodium 等）
- **Git** >= 2.0.0（版本控制）

**开发工具**（可选但推荐）：

- **编辑器扩展**：TypeScript Importer、ESLint、Prettier
- **调试工具**：编辑器内置调试器
- **测试工具**：Mocha + @vscode/test-electron（已集成）

### 🔌 YAPI API 依赖

插件依赖以下 YAPI 开放接口进行数据同步，开发时请注意这些接口的兼容性：

| API端点                     | 功能                 | 参数                              |
| --------------------------- | -------------------- | --------------------------------- |
| `/api/project/get`          | 获取项目信息         | `token`                           |
| `/api/interface/getCatMenu` | 获取接口分类菜单     | `token`                           |
| `/api/interface/list_cat`   | 获取分类下的接口列表 | `token`, `catid`, `page`, `limit` |
| `/api/interface/get`        | 获取接口详情         | `token`, `id`                     |

### 🏗️ 项目结构

```
yapi2ts/
├── src/                        # 源代码目录
│   ├── extension.ts            # 插件入口文件，激活插件和注册命令
│   ├── webviewProvider.ts      # Webview 提供者，处理 UI 渲染和消息通信
│   ├── yapiService.ts          # YAPI API 服务，封装所有 YAPI 接口调用
│   ├── codeGenerator.ts        # 代码生成器，负责生成 TS 类型和 API 代码
│   ├── types.ts                # TypeScript 类型定义，定义项目使用的所有类型
│   └── test/                   # 测试文件目录
│       ├── extension.test.ts   # 插件激活和命令测试
│       ├── yapiService.test.ts # YAPI 服务单元测试
│       ├── codeGenerator.test.ts # 代码生成器单元测试
│       ├── webviewProvider.test.ts # Webview 提供者测试
│       └── integration.test.ts # 集成测试
├── media/                      # 静态资源目录
│   ├── main.js                 # Webview 前端脚本（纯 JavaScript）
│   ├── main.css                # 主样式文件
│   ├── reset.css               # CSS 重置文件
│   ├── vscode.css              # 编辑器主题样式变量
│   ├── icon.svg                # 插件图标（SVG）
│   └── icon.png                # 插件图标（PNG）
├── dist/                       # 编译输出目录（Webpack 打包）
│   └── extension.js            # 打包后的插件代码（生产环境）
├── out/                        # 测试编译输出目录
├── package.json                # 项目配置和依赖管理
├── tsconfig.json               # TypeScript 编译配置
├── webpack.config.js           # Webpack 打包配置
├── eslint.config.mjs           # ESLint 代码检查配置
├── .prettierrc.json            # Prettier 格式化配置
└── README.md                   # 项目文档
```

### 📚 核心组件说明

#### 1. extension.ts - 插件入口

- 插件的激活入口点
- 注册 Webview 视图提供者
- 注册插件命令（如重置模板）
- 管理插件的生命周期

#### 2. webviewProvider.ts - Webview 提供者

- 实现 `WebviewViewProvider` 接口
- 渲染插件的用户界面
- 处理前端和后端的消息通信
- 管理项目和模板的状态持久化
- 协调 YapiService 和 CodeGenerator

#### 3. yapiService.ts - YAPI 服务

- 封装所有 YAPI API 调用
- 处理 HTTP 请求和错误
- 提供以下功能：
    - 获取项目信息
    - 获取接口分类菜单
    - 获取接口列表
    - 获取接口详情
    - 批量获取接口

#### 4. codeGenerator.ts - 代码生成器

- 生成 TypeScript 类型定义
- 生成 API 接口代码
- 支持模板系统
- 智能处理命名冲突
- 解析 JSON Schema
- 处理多种请求类型（query、body、form）

#### 5. types.ts - 类型定义

定义项目中使用的所有 TypeScript 类型：

- `YapiProject` - YAPI 项目信息
- `YapiCategory` - 接口分类
- `YapiInterface` - 接口基本信息
- `YapiInterfaceDetail` - 接口详细信息
- `TemplateConfig` - 模板配置
- `ProjectConfig` - 项目配置

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
# 编译 TypeScript（使用 Webpack）
pnpm run compile

# 监听文件变化（开发模式）
pnpm run watch

# 类型检查（不输出文件）
pnpm run compile:check

# 打包生产版本
pnpm run package

# 代码检查（自动修复）
pnpm run lint

# 代码检查（仅检查不修复）
pnpm run lint:check

# 格式化代码
pnpm run format

# 检查代码格式
pnpm run format:check

# 运行测试
pnpm run test

# 编译测试文件
pnpm run compile-tests

# 监听测试文件变化
pnpm run watch-tests
```

#### 3. 开发工作流

1. **启动开发环境**：

    ```bash
    pnpm run watch
    ```

2. **在编辑器中打开项目**：

    ```bash
    # VSCode / Cursor
    code .

    # VSCodium
    codium .
    ```

3. **按 `F5` 启动调试模式**，这会：
    - 编译 TypeScript 代码
    - 启动新的编辑器窗口（Extension Development Host）
    - 在新窗口中加载开发中的插件

4. **在新窗口中测试功能**：
    - 点击侧边栏的 YAPI 图标
    - 测试各项功能
    - 查看控制台输出和错误信息

### 🐛 调试指南

#### 1. 插件调试

**启动调试**：

- 在主编辑器窗口中按 `F5`
- 或者使用 `Ctrl+Shift+P` 输入 "Debug: Start Debugging"

**调试技巧**：

- 在代码中设置断点
- 使用 `console.log()` 输出调试信息
- 查看 "Developer Tools" 中的控制台输出
- 使用调试面板查看变量值

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

- 打开编辑器输出面板：`Ctrl+Shift+U`（或 `View` → `Output`）
- 选择 "YAPI TypeScript" 输出通道
- 查看详细的运行日志和错误信息

**常见问题排查**：

- YAPI 连接失败：检查网络和 Token 配置
- 代码生成错误：查看接口数据格式和模板配置
- 插件加载失败：检查 TypeScript 编译错误

### 📦 打包和发布

#### 1. 本地打包

```bash
# 代码检查和格式化
pnpm run lint
pnpm run format

# 运行测试
pnpm run test

# 打包插件（生产模式）
pnpm run package
```

打包后的文件位于 `dist/` 目录，包含优化后的生产代码。

#### 2. 发布到市场

```bash
# 安装 vsce（如果未安装）
npm install -g @vscode/vsce

# 登录到 Open VSX（首次需要）
npx ovsx login

# 发布到 Open VSX
npx ovsx publish
```

**注意**：本项目发布到 Open VSX Registry，与 VSCode、Cursor、VSCodium 等兼容编辑器完美兼容。

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
```

> 💡 测试使用 `@vscode/test-cli` 和 Mocha 框架，测试文件位于 `src/test/` 目录

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

- **TypeScript 严格模式**：项目启用了 TypeScript 严格类型检查
- **ESLint**：使用 `@typescript-eslint` 插件进行代码检查
- **Prettier**：自动格式化代码，配置文件：`.prettierrc.json`
- **Husky + lint-staged**：Git 提交前自动运行代码检查和格式化
- **命名规范**：遵循 camelCase 和 PascalCase 命名约定
- 添加适当的类型注解和 JSDoc 注释

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

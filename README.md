# YAPI to TypeScript

一个VSCode插件，用于从YAPI接口文档生成TypeScript类型定义和API接口代码。

## 功能特性

- 🔗 连接YAPI项目，获取接口文档
- 📋 树形展示接口分类和接口列表
- 🎯 选择性生成TypeScript类型定义
- 🛠️ 基于模板生成API接口代码
- 📝 自定义代码生成模板
- 💾 模板管理功能

## 安装

1. 在VSCode扩展市场搜索 "YAPI to TypeScript"
2. 点击安装

## 使用方法

### 1. 打开插件面板

- 在VSCode左侧活动栏找到 "YAPI to TypeScript" 图标
- 或使用命令面板 (`Ctrl+Shift+P`) 搜索 "Open YAPI Panel"

### 2. 配置YAPI连接

1. 在插件面板的 "接口列表" 标签页中
2. 填写YAPI地址 (如: `http://yapi.example.com`)
3. 填写项目Token (在YAPI项目设置中获取)
4. 点击 "连接" 按钮

### 3. 浏览接口

- 连接成功后，左侧会显示接口分类树
- 点击分类查看该分类下的接口列表
- 右侧表格显示接口详情 (方法、标题、路径)

### 4. 生成代码

#### 生成类型定义

1. 在接口列表中勾选需要生成类型的接口
2. 点击 "生成参数" 按钮
3. 插件会自动生成TypeScript接口类型定义

#### 生成API接口代码

1. 在接口列表中勾选需要生成API的接口
2. 在模板下拉框中选择代码模板
3. 点击 "生成API定义" 按钮
4. 插件会根据模板生成API调用代码

### 5. 管理模板

1. 切换到 "我的模板" 标签页
2. 查看、编辑或删除现有模板
3. 点击 "新增模板" 创建自定义模板

## 模板变量

在自定义模板中，可以使用以下变量：

- `{{methodName}}` - 方法名 (根据接口路径生成)
- `{{title}}` - 接口标题
- `{{description}}` - 接口描述
- `{{path}}` - 接口路径
- `{{method}}` - HTTP方法 (GET, POST等)
- `{{requestType}}` - 请求参数类型名
- `{{responseType}}` - 响应数据类型名
- `{{queryType}}` - 查询参数类型名

## 内置模板

插件提供两个内置模板：

### Axios模板

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

### Fetch模板

```typescript
/**
 * {{description}}
 */
export const {{methodName}} = async (params: {{queryType}}, data: {{requestType}}): Promise<{{responseType}}> => {
  const url = new URL('{{path}}', baseURL);
  // ... fetch实现
};
```

## 支持的YAPI API

插件使用以下YAPI开放接口：

- `/api/project/get` - 获取项目信息
- `/api/interface/getCatMenu` - 获取接口分类菜单
- `/api/interface/list_cat` - 获取分类下的接口列表
- `/api/interface/get` - 获取接口详情

## 配置

插件支持以下VSCode配置项：

```json
{
    "yapi2ts.yapiUrl": "http://yapi.example.com",
    "yapi2ts.projectToken": "your-project-token"
}
```

## 开发

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd yapi2ts

# 安装依赖
pnpm install

# 编译
pnpm run compile

# 监听模式
pnpm run watch

# 运行测试
pnpm run test
```

### 打包发布

```bash
# 打包
pnpm run package

# 发布到VSCode市场
vsce publish
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 更新日志

### 0.0.1

- 初始版本
- 基础的YAPI接口获取功能
- TypeScript类型生成
- 模板化API代码生成
- 模板管理功能

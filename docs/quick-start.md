# 快速开始

## <a id="quick-start"></a> 快速开始

### 安装插件

#### 方式一：扩展市场安装（推荐）

1. 打开编辑器，按 `Ctrl+Shift+X`（Mac: `Cmd+Shift+X`）打开扩展面板
2. 在搜索框中输入 "yapi-ts" 或 "YAPI TypeScript"
3. 找到插件后点击 "安装" 按钮
4. 安装完成后重启编辑器（如需要）

#### 方式二：命令行安装

```bash
# VSCode / Cursor
code --install-extension zhoujian.yapi-ts

# VSCodium
codium --install-extension zhoujian.yapi-ts
```

### 首次使用

安装完成后，您会在编辑器左侧活动栏看到 **YAPI TypeScript** 图标。

#### 1. 打开插件面板

- 点击左侧活动栏的 YAPI TypeScript 图标。
- 插件界面包含两个主要标签页：
    - **接口列表** - 浏览接口数据，生成 TypeScript 代码。
    - **我的模板** - 管理和定制代码生成模板（EJS 格式）。

#### 2. 配置 YAPI 项目

项目配置全面切换为以 `.vscode/settings.json` 为核心的协同配置模式：

1. 在项目根目录下打开或创建 `.vscode/settings.json` 文件（可以在插件“接口列表”标签页中点击“一键打开/创建”按钮）。
2. 在该文件中添加 `yapi2ts.projects` 字段。为了避免 Token 泄露到公共 Git 仓库，推荐在配置中省略 `projectToken`，首次连接时插件会安全地提示您在本地输入：

    ```json
    "yapi2ts.projects": [
      {
        "id": "user-service",
        "name": "用户中心 API",
        "yapiUrl": "http://yapi.example.com"
      }
    ]
    ```

    > 提示：如果是私有仓库，也可以直接在此处加上 `"projectToken": "your-token"`。

3. 保存文件后，插件会自动读取配置，您可以在插件面板的下拉菜单中看到该项目。

#### 3. 开始使用

1. 切换到 **“接口列表”** 标签页。
2. 在项目下拉框中选择刚才配置的项目。
3. 点击 **“连接”** 按钮。如果未配置明文 Token，插件会弹出输入框提示您输入 Token，并将其加密保存到系统 Keychain 中（后续连接无需重复输入）。
4. 连接成功后，左侧显示接口分类树，右侧以表格形式展示选定分类下的接口列表。
5. 勾选需要的接口，在下拉框中选择生成模板（默认提供 Axios 模板），然后点击右下角的生成按钮生成代码。

### 快速体验

以下是一个完整的使用流程示例：

```text
1. 配置项目 (settings.json) → 2. 连接项目 (输入并保存 Token) → 3. 浏览接口 → 4. 一键生成代码 → 5. 复制使用
```

**示例场景**：为用户管理相关接口生成 TypeScript 代码

1. **添加配置**：在 `.vscode/settings.json` 中配置项目，填写 ID、名称和 YAPI 地址。
2. **连接项目**：在下拉框中选中该项目，点击“连接”。在弹窗中输入该 YAPI 项目的 Token，完成安全校验与本地存储。
3. **选择接口**：在左侧树中选择“用户管理”分类，右侧表格中显示该分类下的所有接口。
4. **生成代码**：勾选“获取用户信息”接口，在模板下拉框选择 Axios 模板，点击“生成完整代码”按钮。
5. **使用代码**：生成的 TypeScript 类型定义和 API 请求方法已自动复制到剪贴板，可以直接粘贴到项目文件中使用。

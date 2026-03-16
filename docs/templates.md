# 模板系统

## <a id="template-system"></a>模板系统

模板系统基于 **EJS** 引擎。

### EJS 语法（推荐）

| 语法              | 说明               | 示例                               |
| ----------------- | ------------------ | ---------------------------------- |
| `<%- variable %>` | 输出变量（不转义） | `<%- methodName %>`                |
| `<% code %>`      | 执行 JS 代码       | `<% if (isGet) { %>`               |
| `<%- expr %>`     | 输出表达式结果     | `<%- isGet ? 'params' : 'data' %>` |

> 也支持 ES6 模板字符串语法 `${variable}`（会自动转换为 EJS，兼容旧模板）

### 可用变量

| 变量名             | 描述                           | 示例                                                    |
| ------------------ | ------------------------------ | ------------------------------------------------------- |
| `methodName`       | 方法名（根据接口路径自动生成） | `getUserInfo`                                           |
| `title`            | 接口标题                       | `获取用户信息`                                          |
| `path`             | 接口路径                       | `/api/user/info`                                        |
| `method`           | HTTP方法（大写）               | `GET`, `POST`, `PUT`, `DELETE`                          |
| `lowerCaseMethod`  | HTTP方法（小写）               | `get`, `post`, `put`, `delete`                          |
| `responseTypeName` | 响应数据类型名                 | `GetUserInfoResponse`                                   |
| `paramsTypeName`   | 参数类型名                     | `GetUserInfoParams`                                     |
| `interfaceUrl`     | YAPI接口详情页URL              | `http://yapi.example.com/project/123/interface/api/456` |
| `isGet`            | 是否为GET请求                  | `true` 或 `false`                                       |
| `isPost`           | 是否为POST请求                 | `true` 或 `false`                                       |
| `isPut`            | 是否为PUT请求                  | `true` 或 `false`                                       |
| `isDelete`         | 是否为DELETE请求               | `true` 或 `false`                                       |
| `isPatch`          | 是否为PATCH请求                | `true` 或 `false`                                       |
| `isHead`           | 是否为HEAD请求                 | `true` 或 `false`                                       |
| `isOptions`        | 是否为OPTIONS请求              | `true` 或 `false`                                       |
| `isNotGet`         | 是否为非GET请求                | `true` 或 `false`                                       |
| `iface`            | 完整的接口对象                 | 包含所有YAPI接口属性的对象                              |

### 语法示例

```typescript
// 输出变量
export const <%- methodName %> = () => {};

// 条件判断
<% if (isGet) { %>
  // GET 请求逻辑
<% } else { %>
  // 非 GET 请求逻辑
<% } %>

// 三元表达式
<%- isGet ? 'params' : 'data' %>

// 访问接口对象属性
<%- iface.status %>  // 接口状态: done | undone | deprecated
<%- iface.catid %>   // 分类ID
<%- iface._id %>     // 接口ID
```

### 内置模板

插件内置了三个常用模板：

#### 1. Axios Template

基于 Axios 的请求模板，自动区分 GET/非GET 请求参数：

```typescript
export const <%- methodName %> = (params: <%- paramsTypeName %>, config?: Omit<AxiosRequestConfig, <%- isNotGet ? '"data"' : '"params"' %>>): Promise<<%- responseTypeName %>> => {
  return axios.<%- lowerCaseMethod %>('<%- path %>', <%- isNotGet ? 'params, config' : '{ params, ...config }' %>);
};
```

#### 2. Fetch Template

基于原生 Fetch API 的请求模板，使用 EJS 条件语法：

```typescript
export async function <%- methodName %>(params: <%- paramsTypeName %>): Promise<<%- responseTypeName %>> {
<% if (isGet) { %>
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const response = await fetch(`<%- path %>?${query}`);
<% } else { %>
  const response = await fetch('<%- path %>', {
    method: '<%- method %>',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
<% } %>
  return response.json();
}
```

#### 3. Simple Request

简洁的请求模板，适用于自定义 request 封装：

```typescript
export const <%- methodName %> = (params: <%- paramsTypeName %>) => {
  return request<<%- responseTypeName %>>({
    url: '<%- path %>',
    method: '<%- lowerCaseMethod %>',
    <%- isGet ? 'params' : 'data' %>: params
  });
};
```

#### 生成示例

**GET 请求生成结果**：

```typescript
/**
 * 获取用户信息
 * @description 根据用户ID获取用户详细信息
 * @url https://yapi.example.com/project/123/interface/api/456
 * @param {string} params.userId 用户ID
 */
export const getUserInfo = (
    params: GetUserInfoParams,
    config?: Omit<AxiosRequestConfig, 'params'>
): Promise<GetUserInfoResponse> => {
    return axios.get('/api/user/info', { params, ...config });
};
```

**POST 请求生成结果**：

```typescript
/**
 * 创建订单
 * @description 创建新的订单记录
 * @url https://yapi.example.com/project/123/interface/api/789
 * @param {string} params.productId 商品ID
 * @param {number} params.quantity 购买数量
 */
export const createOrder = (
    params: CreateOrderParams,
    config?: Omit<AxiosRequestConfig, 'data'>
): Promise<CreateOrderResponse> => {
    return axios.post('/api/order/create', params, config);
};
```

# 管理API

<cite>
**本文档中引用的文件**  
- [WorksManagement.tsx](file://src/components/admin/WorksManagement.tsx)
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx)
- [approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts)
- [reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts)
- [featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts)
- [users/route.ts](file://src/app/api/admin/users/route.ts)
- [users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts)
- [stats/route.ts](file://src/app/api/admin/stats/route.ts)
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts)
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts)
</cite>

## 目录
1. [简介](#简介)
2. [API端点详情](#api端点详情)
   - [作品审核：批准](#作品审核批准)
   - [作品审核：拒绝](#作品审核拒绝)
   - [作品管理：设为精选](#作品管理设为精选)
   - [用户管理：获取用户列表](#用户管理获取用户列表)
   - [用户管理：获取单个用户](#用户管理获取单个用户)
   - [用户管理：更新用户信息](#用户管理更新用户信息)
   - [用户管理：删除用户](#用户管理删除用户)
   - [数据统计：获取统计信息](#数据统计获取统计信息)
   - [平台配置：获取配置](#平台配置获取配置)
   - [平台配置：更新配置](#平台配置更新配置)
   - [在线人数配置：获取配置](#在线人数配置获取配置)
   - [在线人数配置：更新配置](#在线人数配置更新配置)
   - [在线人数配置：重置人数](#在线人数配置重置人数)
3. [前端调用示例](#前端调用示例)
4. [安全控制机制](#安全控制机制)
5. [curl命令示例](#curl命令示例)

## 简介
本文档详细描述了管理员专用API的功能、接口规范及使用方式。涵盖作品审核（批准/拒绝/设为精选）、用户管理、数据统计和平台配置等核心功能。所有API均需管理员身份认证，确保系统安全。文档同时说明了前端组件如何调用这些API，并提供实际curl命令示例。

## API端点详情

### 作品审核：批准
- **HTTP方法**: POST
- **路径**: `/api/admin/works/[id]/approve`
- **认证要求**: 必须为管理员角色
- **请求体**: 无
- **成功响应**: `200 OK`，返回更新后的作品信息
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 作品不存在
  - `422 Unprocessable Entity`: 仅待审核状态的作品可被批准
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts#L1-L76)

### 作品审核：拒绝
- **HTTP方法**: POST
- **路径**: `/api/admin/works/[id]/reject`
- **认证要求**: 必须为管理员角色
- **请求体**: 
  ```json
  {
    "reason": "string (必填，拒绝理由)"
  }
  ```
- **成功响应**: `200 OK`，返回更新后的作品信息
- **错误响应**:
  - `400 Bad Request`: 输入数据无效（如理由为空）
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 作品不存在
  - `422 Unprocessable Entity`: 仅待审核状态的作品可被拒绝
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts#L1-L95)

### 作品管理：设为精选
- **HTTP方法**: PATCH
- **路径**: `/api/admin/works/[id]/featured`
- **认证要求**: 必须为管理员角色
- **请求体**: 
  ```json
  {
    "featured": "boolean (是否设为精选)"
  }
  ```
- **成功响应**: `200 OK`，返回更新后的作品信息
- **错误响应**:
  - `400 Bad Request`: 请求参数无效或仅已审核通过的作品可设为精选
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 作品不存在
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts#L1-L91)

### 用户管理：获取用户列表
- **HTTP方法**: GET
- **路径**: `/api/admin/users`
- **认证要求**: 必须为管理员角色
- **查询参数**:
  - `page`: 页码（可选，默认1）
  - `limit`: 每页数量（可选，默认10）
  - `role`: 角色过滤（USER/ADMIN，可选）
  - `search`: 搜索关键词（可选，按姓名或邮箱模糊匹配）
- **成功响应**: `200 OK`，返回用户列表及分页信息
- **错误响应**:
  - `400 Bad Request`: 查询参数无效
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [users/route.ts](file://src/app/api/admin/users/route.ts#L1-L95)

### 用户管理：获取单个用户
- **HTTP方法**: GET
- **路径**: `/api/admin/users/[id]`
- **认证要求**: 必须为管理员角色
- **成功响应**: `200 OK`，返回用户详细信息（含作品列表）
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 用户不存在
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts#L1-L60)

### 用户管理：更新用户信息
- **HTTP方法**: PUT
- **路径**: `/api/admin/users/[id]`
- **认证要求**: 必须为管理员角色
- **请求体**: 
  ```json
  {
    "name": "string (可选)",
    "email": "string (可选，邮箱格式)",
    "role": "USER|ADMIN (可选)"
  }
  ```
- **成功响应**: `200 OK`，返回更新后的用户信息
- **错误响应**:
  - `400 Bad Request`: 输入数据无效
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 用户不存在
  - `409 Conflict`: 邮箱已被使用
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts#L62-L140)

### 用户管理：删除用户
- **HTTP方法**: DELETE
- **路径**: `/api/admin/users/[id]`
- **认证要求**: 必须为管理员角色
- **成功响应**: `200 OK`，返回删除成功消息
- **错误响应**:
  - `403 Forbidden`: 权限不足或不能删除自己
  - `404 Not Found`: 用户不存在
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts#L142-L226)

### 数据统计：获取统计信息
- **HTTP方法**: GET
- **路径**: `/api/admin/stats`
- **认证要求**: 必须为管理员角色
- **成功响应**: `200 OK`，返回统计信息，包括：
  - 总用户数、总作品数、各状态作品数
  - 最近7天新增用户和作品数
  - 最近30天每日数据趋势
  - 热门作品和活跃用户列表
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [stats/route.ts](file://src/app/api/admin/stats/route.ts#L1-L163)

### 平台配置：获取配置
- **HTTP方法**: GET
- **路径**: `/api/platform-config`
- **认证要求**: 无（公开接口）
- **成功响应**: `200 OK`，返回平台配置（如主标题）
- **错误响应**:
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts#L1-L40)

### 平台配置：更新配置
- **HTTP方法**: POST
- **路径**: `/api/platform-config`
- **认证要求**: 必须为管理员角色
- **请求体**: 
  ```json
  {
    "title": "string (必填，平台主标题，1-100字符)"
  }
  ```
- **成功响应**: `200 OK`，返回更新后的配置信息
- **错误响应**:
  - `400 Bad Request`: 输入数据无效
  - `401 Unauthorized`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts#L42-L114)

### 在线人数配置：获取配置
- **HTTP方法**: GET
- **路径**: `/api/admin/online-counter`
- **认证要求**: 必须为管理员角色
- **成功响应**: `200 OK`，返回在线人数配置（如当前人数、增长率等）
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts#L1-L50)

### 在线人数配置：更新配置
- **HTTP方法**: PUT
- **路径**: `/api/admin/online-counter`
- **认证要求**: 必须为管理员角色
- **请求体**: 
  ```json
  {
    "currentCount": "number (可选)",
    "baseCount": "number (可选)",
    "maxCount": "number (可选)",
    "growthRate": "number (可选)",
    "isEnabled": "boolean (可选)",
    "displayText": "string (可选)"
  }
  ```
- **成功响应**: `200 OK`，返回更新后的配置信息
- **错误响应**:
  - `400 Bad Request`: 输入数据无效
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts#L52-L120)

### 在线人数配置：重置人数
- **HTTP方法**: POST
- **路径**: `/api/admin/online-counter/reset`
- **认证要求**: 必须为管理员角色
- **请求体**: 无
- **成功响应**: `200 OK`，返回重置后的配置信息（当前人数重置为基础人数）
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误

**Section sources**
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts#L122-L176)

## 前端调用示例
管理员API主要通过 `WorksManagement.tsx` 和 `AdminDashboard.tsx` 组件调用。

- **作品管理**: `WorksManagement.tsx` 使用 `fetch` 调用作品审核、拒绝和精选API。例如，点击“通过”按钮会调用 `/api/admin/works/[id]/approve` 的POST接口。
- **用户管理**: 用户列表和详情通过 `GET /api/admin/users` 和 `GET /api/admin/users/[id]` 获取，更新和删除操作分别调用PUT和DELETE接口。
- **平台配置**: `PlatformConfigManagement.tsx` 组件通过 `GET /api/platform-config` 获取当前配置，并通过 `POST /api/platform-config` 提交更新。
- **标签页导航**: `AdminDashboard.tsx` 实现了管理员后台的标签页导航，根据当前标签加载不同的管理组件（作品、上传配置、在线人数、平台配置）。

**Section sources**
- [WorksManagement.tsx](file://src/components/admin/WorksManagement.tsx#L12-L570)
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx#L12-L89)

## 安全控制机制
所有管理员API均实施严格的安全控制：
- **角色验证**: 使用 `getServerSession(authOptions)` 获取会话信息，并检查 `session.user.role === 'ADMIN'`，确保只有管理员可访问。
- **输入验证**: 使用 `zod` 库对所有请求体进行严格验证，防止无效或恶意数据。
- **资源存在性检查**: 在操作前检查作品或用户是否存在，避免对不存在的资源进行操作。
- **权限边界**: 管理员不能删除自己的账户，防止系统失去管理员。
- **敏感操作保护**: 如删除用户时，会先删除其所有作品，确保数据一致性。

**Section sources**
- [approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts#L1-L76)
- [users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts#L142-L226)
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts#L42-L114)

## curl命令示例
以下为管理员操作的curl命令示例：

```bash
# 批准作品（假设作品ID为work_123）
curl -X POST http://localhost:3000/api/admin/works/work_123/approve \
  -H "Authorization: Bearer <admin_token>"

# 拒绝作品
curl -X POST http://localhost:3000/api/admin/works/work_123/reject \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "内容不符合规范"}'

# 将作品设为精选
curl -X PATCH http://localhost:3000/api/admin/works/work_123/featured \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"featured": true}'

# 更新平台配置
curl -X POST http://localhost:3000/api/platform-config \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "新平台标题"}'

# 获取用户列表
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer <admin_token>"
```

**Section sources**
- [approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts#L1-L76)
- [reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts#L1-L95)
- [featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts#L1-L91)
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts#L42-L114)
- [users/route.ts](file://src/app/api/admin/users/route.ts#L1-L95)
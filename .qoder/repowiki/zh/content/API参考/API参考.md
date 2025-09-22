
# API参考

<cite>
**本文档中引用的文件**  
- [src/app/api/admin/online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts)
- [src/app/api/admin/stats/route.ts](file://src/app/api/admin/stats/route.ts)
- [src/app/api/admin/upload-config/route.ts](file://src/app/api/admin/upload-config/route.ts)
- [src/app/api/admin/users/route.ts](file://src/app/api/admin/users/route.ts)
- [src/app/api/admin/users/[id]/route.ts](file://src/app/api/admin/users/[id]/route.ts)
- [src/app/api/admin/works/route.ts](file://src/app/api/admin/works/route.ts)
- [src/app/api/admin/works/[id]/route.ts](file://src/app/api/admin/works/[id]/route.ts)
- [src/app/api/admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts)
- [src/app/api/admin/works/[id]/reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts)
- [src/app/api/admin/works/[id]/featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts)
- [src/app/api/auth[...nextauth]/route.ts](file://src/app/api/auth[...nextauth]/route.ts)
- [src/app/api/health/route.ts](file://src/app/api/health/route.ts)
- [src/app/api/online-counter/route.ts](file://src/app/api/online-counter/route.ts)
- [src/app/api/platform-config/route.ts](file://src/app/api/platform-config/route.ts)
- [src/app/api/register/route.ts](file://src/app/api/register/route.ts)
- [src/app/api/upload/route.ts](file://src/app/api/upload/route.ts)
- [src/app/api/user/profile/route.ts](file://src/app/api/user/profile/route.ts)
- [src/app/api/user/works/route.ts](file://src/app/api/user/works/route.ts)
- [src/app/api/works/route.ts](file://src/app/api/works/route.ts)
- [src/app/api/works/[id]/route.ts](file://src/app/api/works/[id]/route.ts)
- [src/app/api/works/[id]/like/route.ts](file://src/app/api/works/[id]/like/route.ts)
- [src/app/api/works/[id]/view/route.ts](file://src/app/api/works/[id]/view/route.ts)
- [src/app/api/works/user-count/route.ts](file://src/app/api/works/user-count/route.ts)
</cite>

## 目录
1. [简介](#简介)
2. [admin API 组](#admin-api-组)
3. [auth API 组](#auth-api-组)
4. [user API 组](#user-api-组)
5. [works API 组](#works-api-组)
6. [系统 API](#系统-api)

## 简介
本文档为“数字化作品互动展示平台”提供完整的公共API端点参考。文档按功能模块分组，详细描述每个端点的HTTP方法、路径、认证要求、请求/响应格式及使用示例。所有信息均与代码实现同步，确保开发者能够准确调用API。

## admin API 组

### GET /api/admin/online-counter - 获取在线人数配置
- **方法**: GET
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "clxyz123",
    "currentCount": 150,
    "baseCount": 100,
    "maxCount": 1000,
    "growthRate": 5,
    "isEnabled": true,
    "displayText": "当前在线人数",
    "createdBy": "clwxyz789",
    "createdAt": "2025-08-31T08:49:47.000Z",
    "lastUpdated": "2025-09-05T14:31:57.000Z"
  }
}
```
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X GET "http://localhost:3000/api/admin/online-counter" \
  -H "Authorization: Bearer your-jwt-token"
```

### PUT /api/admin/online-counter - 更新在线人数配置
- **方法**: PUT
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体 (JSON Schema)**:
```json
{
  "currentCount": 180,
  "baseCount": 120,
  "maxCount": 1200,
  "growthRate": 6,
  "isEnabled": true,
  "displayText": "实时在线人数"
}
```
- **成功响应**:
```json
{
  "success": true,
  "data": { /* 配置对象 */ },
  "message": "在线人数配置更新成功"
}
```
- **错误响应**:
  - `400 Bad Request`: 输入数据无效（含验证错误详情）
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X PUT "http://localhost:3000/api/admin/online-counter" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "currentCount": 180,
    "baseCount": 120,
    "maxCount": 1200,
    "growthRate": 6,
    "isEnabled": true,
    "displayText": "实时在线人数"
  }'
```

### POST /api/admin/online-counter/reset - 重置在线人数
- **方法**: POST
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "data": { /* 当前配置 */ },
  "message": "在线人数已重置"
}
```
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X POST "http://localhost:3000/api/admin/online-counter/reset" \
  -H "Authorization: Bearer your-jwt-token"
```

### GET /api/admin/stats - 获取统计数据
- **方法**: GET
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalWorks": 320,
      "pendingWorks": 15,
      "approvedWorks": 290,
      "rejectedWorks": 15,
      "recentUsers": 12,
      "recentWorks": 25
    },
    "charts": {
      "dailyWorks": [
        { "date": "2025-09-05", "count": 8, "type": "works" }
      ],
      "dailyUsers": [
        { "date": "2025-09-05", "count": 3, "type": "users" }
      ]
    },
    "lists": {
      "popularWorks": [
        {
          "id": "wk123",
          "name": "digital-art-1.jpg",
          "title": "数字艺术作品1",
          "author": "艺术家A",
          "createdAt": "2025-09-05T10:00:00Z",
          "user": { "name": "用户A" }
        }
      ],
      "activeUsers": [
        {
          "id": "usr123",
          "name": "活跃用户1",
          "email": "user1@example.com",
          "createdAt": "2025-08-01T08:00:00Z",
          "_count": { "works": 15 }
        }
      ]
    }
  }
}
```
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X GET "http://localhost:3000/api/admin/stats" \
  -H "Authorization: Bearer your-jwt-token"
```

### GET /api/admin/upload-config - 获取上传配置
- **方法**: GET
- **认证要求**: 无（公开）
- **请求头**: 无
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "startTime": "2025-09-01T00:00:00Z",
    "endTime": "2025-09-30T23:59:59Z",
    "maxUploadsPerUser": 5,
    "maxFileSize": 10485760,
    "allowedFormats": ["jpg", "jpeg", "png", "gif"],
    "announcement": "上传功能已开启！",
    "creator": {
      "id": "usr123",
      "name": "管理员",
      "email": "admin@example.com"
    },
    "createdAt": "2025-09-05T15:08:39.000Z"
  }
}
```
- **错误响应**:
  - `500 Internal Server Error`: 获取失败
- **curl 示例**:
```bash
curl -X GET "http://localhost:3000/api/admin/upload-config"
```

### POST /api/admin/upload-config - 创建上传配置
- **方法**: POST
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体 (JSON Schema)**:
```json
{
  "isEnabled": true,
  "startTime": "2025-09-01T00:00:00Z",
  "endTime": "2025-09-30T23:59:59Z",
  "maxUploadsPerUser": 5,
  "maxFileSize": 10485760,
  "allowedFormats": ["jpg", "jpeg", "png"],
  "announcement": "新上传周期开始"
}
```
- **成功响应**:
```json
{
  "success": true,
  "data": { /* 新创建的配置 */ },
  "message": "上传配置创建成功"
}
```
- **错误响应**:
  - `400 Bad Request`: 输入数据无效或时间逻辑错误
  - `401 Unauthorized`: 用户不存在
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 创建失败
- **curl 示例**:
```bash
curl -X POST "http://localhost:3000/api/admin/upload-config" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "isEnabled": true,
    "startTime": "2025-09-01T00:00:00Z",
    "endTime": "2025-09-30T23:59:59Z",
    "maxUploadsPerUser": 5,
    "maxFileSize": 10485760,
    "allowedFormats": ["jpg", "jpeg", "png"],
    "announcement": "新上传周期开始"
  }'
```

### GET /api/admin/users - 获取用户列表
- **方法**: GET
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page` (可选): 页码，默认1
  - `limit` (可选): 每页数量，默认10
  - `role` (可选): 角色过滤（USER/ADMIN）
  - `search` (可选): 搜索关键词
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr123",
        "name": "张三",
        "email": "zhangsan@example.com",
        "role": "USER",
        "createdAt": "2025-08-01T08:00:00Z",
        "_count": { "works": 5 }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```
- **错误响应**:
  - `400 Bad Request`: 查询参数无效
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10&role=USER&search=张三" \
  -H "Authorization: Bearer your-jwt-token"
```

### GET /api/admin/users/[id] - 获取用户详情
- **方法**: GET
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "usr123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "role": "USER",
    "createdAt": "2025-08-01T08:00:00Z",
    "works": [
      {
        "id": "wk123",
        "name": "artwork1.jpg",
        "title": "我的作品",
        "status": "APPROVED",
        "createdAt": "2025-08-05T10:00:00Z"
      }
    ]
  }
}
```
- **错误响应**:
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 用户不存在
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X GET "http://localhost:3000/api/admin/users/usr123" \
  -H "Authorization: Bearer your-jwt-token"
```

### PUT /api/admin/users/[id] - 更新用户信息
- **方法**: PUT
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体 (JSON Schema)**:
```json
{
  "name": "张三三",
  "email": "zhangsan_new@example.com",
  "role": "ADMIN"
}
```
- **成功响应**:
```json
{
  "success": true,
  "data": { /* 更新后的用户信息 */ },
  "message": "用户信息更新成功"
}
```
- **错误响应**:
  - `400 Bad Request`: 输入数据无效
  - `403 Forbidden`: 权限不足
  - `404 Not Found`: 用户不存在
  - `409 Conflict`: 邮箱已被使用
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X PUT "http://localhost:3000/api/admin/users/usr123" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三三",
    "email": "zhangsan_new@example.com",
    "role": "ADMIN"
  }'
```

### DELETE /api/admin/users/[id] - 删除用户
- **方法**: DELETE
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: 无
- **成功响应**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```
- **错误响应**:
  - `403 Forbidden`: 权限不足或不能删除自己
  - `404 Not Found`: 用户不存在
  - `500 Internal Server Error`: 服务器内部错误
- **curl 示例**:
```bash
curl -X DELETE "http://localhost:3000/api/admin/users/usr123" \
  -H "Authorization: Bearer your-jwt-token"
```

### GET /api/admin/works - 获取作品列表
- **方法**: GET
- **认证要求**: 管理员登录
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page`, `limit`: 分页
  - `status`: 状态过滤（PENDING/APPROVED/REJECTED）
  - `search`: 搜索关键词
  - `sortBy`: 排序字段（createdAt/approvedAt/likeCount/viewCount）
  - `sortOrder`: 排序方向（asc/desc）
- **成功响应**:
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "wk123",
        "name": "artwork1.jpg",
        "title": "作品标题",
        "author": "作者名",
        "status": "PENDING",
        "createdAt": "2025-09-01T10:00:00Z",
        "approvedAt": null,
        "likeCount": 0,
        "viewCount": 0,
        "user": {
          "id": "usr123",
          "name": "张三",
          "email": "zhangsan@example.com"
        }
      }
    ],
    "pagination": { /* 分页信息 */ }
  }
}
```
- **错误响应**:
  - `400 Bad Request`: 查询参数无效
  - `403 Forbidden`: 权限不足
  - `500 Internal Server Error`: 服务器内部错误
-
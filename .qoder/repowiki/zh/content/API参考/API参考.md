# API参考

<cite>
**本文档中引用的文件**  
- [register/route.ts](file://src/app/api/register/route.ts)
- [auth\[...nextauth]/route.ts](file://src/app/api/auth\[...nextauth]/route.ts)
- [works/route.ts](file://src/app/api/works/route.ts)
- [works/[id]/like/route.ts](file://src/app/api/works/[id]/like/route.ts)
- [works/[id]/view/route.ts](file://src/app/api/works/[id]/view/route.ts)
- [user/profile/route.ts](file://src/app/api/user/profile/route.ts)
- [user/works/route.ts](file://src/app/api/user/works/route.ts)
- [admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts)
- [work.d.ts](file://src/types/work.d.ts)
- [health/route.ts](file://src/app/api/health/route.ts) - *新增于提交 bb373925*
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts) - *新增于提交 6fe8c1f1*
- [admin/performance/route.ts](file://src/app/api/admin/performance/route.ts) - *新增于提交 bb373925*
</cite>

## 更新摘要
**已做更改**  
- 新增健康检查API部分
- 新增平台配置API部分
- 新增性能监控API部分
- 更新通用响应格式以包含新错误代码
- 更新TypeScript类型定义以包含新接口
- 所有内容已按语言转换规则完全汉化

## 目录
1. [简介](#简介)
2. [认证API](#认证api)
   - [POST /api/register](#post-apiregister)
   - [POST /api/auth/\[...nextauth\]](#post-apiauthnextauth)
3. [作品API](#作品api)
   - [GET /api/works](#get-apiworks)
   - [POST /api/works](#post-apiworks)
   - [POST /api/works/[id]/like](#post-apiworksidlike)
   - [POST /api/works/[id]/view](#post-apiworksidsview)
4. [用户API](#用户api)
   - [GET /api/user/profile](#get-apiuserprofile)
   - [PUT /api/user/profile](#put-apiuserprofile)
   - [GET /api/user/works](#get-apiuserworks)
5. [管理API](#管理api)
   - [POST /api/admin/works/[id]/approve](#post-apiadminworksidapprove)
   - [GET /api/health](#get-apihealth)
   - [GET/POST /api/platform-config](#getpost-apiplatform-config)
   - [GET/DELETE /api/admin/performance](#getdelete-apiadminperformance)
6. [通用响应格式](#通用响应格式)
7. [TypeScript类型定义](#typescript类型定义)

## 简介
本API参考文档为前端开发者提供权威的接口集成指南。文档按功能模块组织，涵盖认证、作品、用户和管理四大API类别。所有接口均基于Next.js App Router实现，使用Prisma进行数据库操作，并通过Zod进行请求验证。文档整合了`work.d.ts`中的TypeScript类型定义，确保前后端类型一致。

## 认证API

### POST /api/register
用户注册接口，允许新用户创建账户。

**HTTP方法**  
`POST`

**URL路径**  
`/api/register`

**请求头**  
- `Content-Type: application/json`

**请求体Schema**  
```json
{
  "name": "string, 1-50字符",
  "email": "string, 有效邮箱格式",
  "password": "string, 至少6位",
  "confirmPassword": "string, 与password一致"
}
```

**成功响应（201）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "USER",
    "createdAt": "string, ISO格式"
  },
  "message": "注册成功，请登录"
}
```

**错误响应**  
- `409 Conflict`: 邮箱已被注册
- `400 Bad Request`: 输入验证失败

**curl示例**  
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "123456",
    "confirmPassword": "123456"
  }'
```

**JavaScript fetch示例**  
```javascript
fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '张三',
    email: 'zhangsan@example.com',
    password: '123456',
    confirmPassword: '123456'
  })
})
```

**Section sources**
- [register/route.ts](file://src/app/api/register/route.ts)

### POST /api/auth/[...nextauth]
NextAuth认证入口，处理登录、登出等身份验证操作。

**HTTP方法**  
`POST`, `GET`

**URL路径**  
`/api/auth/[...nextauth]`

**说明**  
该端点由NextAuth.js自动处理，支持多种认证方式（如凭证登录）。前端应使用`next-auth/react`的`signIn`和`signOut`函数进行调用。

**JavaScript示例**  
```javascript
import { signIn, signOut } from 'next-auth/react';

// 登录
signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false
});

// 登出
signOut();
```

**Section sources**
- [auth\[...nextauth]/route.ts](file://src/app/api/auth\[...nextauth]/route.ts)
- [auth.ts](file://src/lib/auth.ts)

## 作品API

### GET /api/works
获取作品列表，支持分页、排序和状态过滤。

**HTTP方法**  
`GET`

**URL路径**  
`/api/works`

**查询参数**  
- `status`: `PENDING` | `APPROVED` | `REJECTED`
- `sortBy`: `latest` | `popular` | `default`
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "string",
        "name": "string",
        "author": "string",
        "imageUrl": "string",
        "status": "APPROVED",
        "featured": false,
        "likeCount": 0,
        "viewCount": 0,
        "createdAt": "string",
        "updatedAt": "string",
        "user": {
          "id": "string",
          "name": "string",
          "email": "string"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

**JavaScript示例**  
```javascript
fetch('/api/works?sortBy=popular&limit=20')
  .then(res => res.json())
  .then(data => console.log(data.data.works));
```

**Section sources**
- [works/route.ts](file://src/app/api/works/route.ts)

### POST /api/works
创建新作品，允许游客和登录用户提交。

**HTTP方法**  
`POST`

**URL路径**  
`/api/works`

**请求头**  
- `Content-Type: application/json`

**请求体Schema**  
```json
{
  "name": "string, 作品名称（必需）",
  "author": "string, 作者名（可选）",
  "prompt": "string, 提示词（可选）",
  "imageUrl": "string, 图片URL（必需）"
}
```

**成功响应（201）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "author": "string",
    "imageUrl": "string",
    "status": "PENDING",
    "createdAt": "string"
  },
  "message": "作品提交成功，等待管理员审核"
}
```

**错误响应**  
- `403 Forbidden`: 上传功能关闭或超出时间窗口
- `400 Bad Request`: 必需字段缺失

**curl示例**  
```bash
curl -X POST http://localhost:3000/api/works \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的AI画作",
    "author": "艺术家",
    "imageUrl": "https://example.com/image.jpg"
  }'
```

**Section sources**
- [works/route.ts](file://src/app/api/works/route.ts)

### POST /api/works/[id]/like
为指定作品点赞，随机增加1-10个点赞数。

**HTTP方法**  
`POST`

**URL路径**  
`/api/works/[id]/like`

**路径参数**  
- `id`: 作品ID

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "likeCount": 15,
    "increment": 3
  }
}
```

**错误响应**  
- `404 Not Found`: 作品不存在或未审核通过

**JavaScript示例**  
```javascript
fetch('/api/works/123/like', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(`点赞数: ${data.data.likeCount}`));
```

**Section sources**
- [works/[id]/like/route.ts](file://src/app/api/works/[id]/like/route.ts)

### POST /api/works/[id]/view
增加指定作品的浏览量。

**HTTP方法**  
`POST`

**URL路径**  
`/api/works/[id]/view`

**路径参数**  
- `id`: 作品ID

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "viewCount": 100
  }
}
```

**错误响应**  
- `404 Not Found`: 作品不存在或未审核通过

**JavaScript示例**  
```javascript
fetch('/api/works/123/view', { method: 'POST' });
```

**Section sources**
- [works/[id]/view/route.ts](file://src/app/api/works/[id]/view/route.ts)

## 用户API

### GET /api/user/profile
获取当前登录用户信息。

**HTTP方法**  
`GET`

**URL路径**  
`/api/user/profile`

**请求头**  
- `Authorization: Bearer <token>`（通过session自动处理）

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "USER",
    "image": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "_count": {
      "works": 5
    }
  }
}
```

**错误响应**  
- `401 Unauthorized`: 未登录

**JavaScript示例**  
```javascript
fetch('/api/user/profile')
  .then(res => res.json())
  .then(data => console.log(data.data.name));
```

**Section sources**
- [user/profile/route.ts](file://src/app/api/user/profile/route.ts)

### PUT /api/user/profile
更新用户信息，支持修改姓名、邮箱和密码。

**HTTP方法**  
`PUT`

**URL路径**  
`/api/user/profile`

**请求头**  
- `Content-Type: application/json`

**请求体Schema**  
```json
{
  "name": "string",
  "email": "string",
  "currentPassword": "string, 修改密码时必需",
  "newPassword": "string, 至少6位",
  "confirmNewPassword": "string, 与newPassword一致"
}
```

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "USER",
    "_count": {
      "works": 5
    }
  },
  "message": "用户信息更新成功"
}
```

**JavaScript示例**  
```javascript
fetch('/api/user/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: '新名字',
    currentPassword: '旧密码',
    newPassword: '新密码',
    confirmNewPassword: '新密码'
  })
});
```

**Section sources**
- [user/profile/route.ts](file://src/app/api/user/profile/route.ts)

### GET /api/user/works
获取当前用户的作品列表，支持分页和搜索。

**HTTP方法**  
`GET`

**URL路径**  
`/api/user/works`

**查询参数**  
- `page`: 页码
- `limit`: 每页数量
- `status`: `PENDING` | `APPROVED` | `REJECTED`
- `search`: 搜索关键词

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "string",
        "name": "string",
        "author": "string",
        "imageUrl": "string",
        "status": "APPROVED",
        "likeCount": 10,
        "viewCount": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**JavaScript示例**  
```javascript
fetch('/api/user/works?status=APPROVED')
  .then(res => res.json())
  .then(data => console.log(data.data.works));
```

**Section sources**
- [user/works/route.ts](file://src/app/api/user/works/route.ts)

## 管理API

### POST /api/admin/works/[id]/approve
管理员审核通过作品，仅管理员可访问。

**HTTP方法**  
`POST`

**URL路径**  
`/api/admin/works/[id]/approve`

**路径参数**  
- `id`: 作品ID

**权限要求**  
- 用户角色必须为 `ADMIN`

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "status": "APPROVED",
    "approvedAt": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  },
  "message": "作品审核通过"
}
```

**错误响应**  
- `403 Forbidden`: 权限不足
- `404 Not Found`: 作品不存在
- `422 Unprocessable Entity`: 作品状态不是待审核

**JavaScript示例**  
```javascript
fetch('/api/admin/works/123/approve', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data.message));
```

**Section sources**
- [admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts)

### GET /api/health
健康检查接口，用于监控API服务状态。

**HTTP方法**  
`GET`

**URL路径**  
`/api/health`

**成功响应（200）**  
```json
{
  "success": true,
  "message": "API服务正常",
  "timestamp": "string, ISO格式",
  "database": "connected"
}
```

**错误响应（500）**  
```json
{
  "success": false,
  "message": "API服务异常",
  "timestamp": "string, ISO格式",
  "database": "disconnected",
  "error": "string"
}
```

**JavaScript示例**  
```javascript
fetch('/api/health')
  .then(res => res.json())
  .then(data => console.log(data.message));
```

**Section sources**
- [health/route.ts](file://src/app/api/health/route.ts)

### GET/POST /api/platform-config
平台配置管理接口，用于获取和更新平台主标题。

**HTTP方法**  
`GET`, `POST`

**URL路径**  
`/api/platform-config`

**权限要求**  
- `GET`: 无特殊权限要求
- `POST`: 用户角色必须为 `ADMIN`

**GET请求 - 获取配置**
**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "updatedAt": "string, ISO格式"
  }
}
```

**POST请求 - 更新配置**
**请求头**  
- `Content-Type: application/json`

**请求体Schema**  
```json
{
  "title": "string, 1-100字符"
}
```

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "updatedAt": "string, ISO格式"
  },
  "message": "平台配置更新成功"
}
```

**错误响应**  
- `401 Unauthorized`: 权限不足
- `400 Bad Request`: 输入验证失败

**JavaScript示例**  
```javascript
// 获取配置
fetch('/api/platform-config')
  .then(res => res.json())
  .then(data => console.log(data.data.title));

// 更新配置
fetch('/api/platform-config', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '新平台标题' })
});
```

**Section sources**
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts)
- [PlatformConfigManagement.tsx](file://src/components/admin/PlatformConfigManagement.tsx)

### GET/DELETE /api/admin/performance
性能监控接口，用于获取服务器性能指标和清理监控数据。

**HTTP方法**  
`GET`, `DELETE`

**URL路径**  
`/api/admin/performance`

**权限要求**  
- 用户角色必须为 `ADMIN`

**GET请求 - 获取性能指标**
**查询参数**  
- `minutes`: 统计时间范围（默认5分钟）
- `history`: 是否包含历史数据（true/false）

**成功响应（200）**  
```json
{
  "success": true,
  "data": {
    "current": {
      "timestamp": "number",
      "cpu": {
        "usage": "number",
        "loadAverage": "number[]",
        "cores": "number"
      },
      "memory": {
        "used": "number",
        "free": "number",
        "total": "number",
        "usagePercent": "number",
        "heapUsed": "number",
        "heapTotal": "number"
      },
      "uptime": "number",
      "responseTime": "number"
    },
    "stats": {
      "avgCpuUsage": "number",
      "avgMemoryUsage": "number",
      "avgResponseTime": "number",
      "maxMemoryUsage": "number",
      "maxCpuUsage": "number",
      "maxResponseTime": "number"
    },
    "alerts": [
      {
        "type": "warning|critical|info",
        "message": "string"
      }
    ],
    "serverInfo": {
      "nodeVersion": "string",
      "platform": "string",
      "arch": "string",
      "pid": "number"
    },
    "history": [
      // 历史性能指标数组
    ]
  }
}
```

**DELETE请求 - 清理性能数据**
**成功响应（200）**  
```json
{
  "success": true,
  "message": "性能监控数据已清理"
}
```

**JavaScript示例**  
```javascript
// 获取性能指标
fetch('/api/admin/performance?minutes=10&history=true')
  .then(res => res.json())
  .then(data => console.log(data.data));

// 清理性能数据
fetch('/api/admin/performance', { method: 'DELETE' })
  .then(res => res.json())
  .then(data => console.log(data.message));
```

**Section sources**
- [admin/performance/route.ts](file://src/app/api/admin/performance/route.ts)
- [performance-monitor.ts](file://src/lib/performance-monitor.ts)

## 通用响应格式
所有API响应遵循统一格式：

```json
{
  "success": "boolean",
  "data": "object | array | null",
  "message": "string | null",
  "error": "string | null",
  "code": "string | null",
  "details": "any | null"
}
```

- `success`: 请求是否成功
- `data`: 成功时返回的数据
- `message`: 人类可读的消息
- `error`: 错误信息
- `code`: 错误代码，用于前端处理
- `details`: 错误详情，如验证错误信息

## TypeScript类型定义
关键类型定义来自`work.d.ts`，确保前后端类型一致。

### WorkWithUser
扩展作品类型，包含关联的用户信息。

```typescript
type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};
```

### WorksResponse
作品列表响应格式。

```typescript
interface WorksResponse {
  works: WorkWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
```

### UserWork
用户作品展示格式。

```typescript
interface UserWork {
  id: string;
  name: string;
  author: string;
  imageUrl: string;
  status: WorkStatus;
  featured: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### UploadConfig
上传配置类型。

```typescript
interface UploadConfig {
  id: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  maxUploadsPerUser: number;
  maxFileSize: number;
  allowedFormats: string[];
  announcement: string | null;
  createdAt: string;
}
```

### PerformanceMetrics
性能监控指标类型。

```typescript
interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usagePercent: number;
    heapUsed: number;
    heapTotal: number;
  };
  uptime: number;
  responseTime?: number;
}
```

### PlatformConfig
平台配置类型。

```typescript
interface PlatformConfig {
  id: string;
  title: string;
  updatedAt: string;
}
```

**Section sources**
- [work.d.ts](file://src/types/work.d.ts)
- [performance-monitor.ts](file://src/lib/performance-monitor.ts)
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts)
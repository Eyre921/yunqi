# 作品API

<cite>
**本文档引用的文件**
- [useApi.ts](file://src/hooks/useApi.ts)
- [route.ts](file://src/app/api/works/route.ts)
- [\[id\]/route.ts](file://src/app/api/works/[id]/route.ts)
- [\[id\]/like/route.ts](file://src/app/api/works/[id]/like/route.ts)
- [\[id\]/view/route.ts](file://src/app/api/works/[id]/view/route.ts)
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts)
- [work.d.ts](file://src/types/work.d.ts)
- [serialize.ts](file://src/lib/serialize.ts)
- [auth.ts](file://src/lib/auth.ts)
</cite>

## 目录
1. [简介](#简介)
2. [作品列表获取](#作品列表获取)
3. [作品上传](#作品上传)
4. [点赞功能](#点赞功能)
5. [浏览计数](#浏览计数)
6. [用户作品数量统计](#用户作品数量统计)
7. [前端集成说明](#前端集成说明)

## 简介
本API文档详细描述了数字化作品互动展示平台的核心作品相关接口。系统支持游客上传作品，所有作品需经管理员审核后方可展示。普通用户可浏览和点赞已审核通过的作品，管理员拥有审核、设置精选等额外权限。API采用统一的响应格式，包含`success`、`data`、`error`等字段，并通过`Authorization`机制进行身份验证。

## 作品列表获取

### 端点信息
- **HTTP方法**: `GET`
- **URL路径**: `/api/works`
- **认证要求**: 无需登录（游客可访问）

### 查询参数
| 参数名 | 类型 | 必需 | 描述 |
|-------|------|------|------|
| `status` | string | 否 | 作品状态过滤（PENDING, APPROVED, REJECTED），默认返回已审核通过的作品 |
| `sortBy` | string | 否 | 排序方式：`latest`（最新）、`popular`（热门）、`default`（默认） |
| `page` | number | 否 | 页码，从1开始，默认为1 |
| `limit` | number | 否 | 每页数量，默认为10 |

### 响应格式（成功）
```json
{
  "success": true,
  "data": {
    "works": [
      {
        "id": "clz1a2b3c4d5e6f7g8h9i0j1k",
        "name": "数字艺术作品1",
        "author": "艺术家A",
        "imageUrl": "https://oss.example.com/uploads/image1.jpg",
        "likeCount": 45,
        "viewCount": 120,
        "status": "APPROVED",
        "featured": true,
        "createdAt": "2025-09-17T08:00:00.000Z",
        "user": {
          "id": "clz1a2b3c4d5e6f7g8h9i0j1l",
          "name": "上传者1",
          "email": "user1@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  },
  "message": "获取作品列表成功"
}
```

### curl示例
```bash
curl -X GET "http://localhost:3000/api/works?sortBy=popular&page=1&limit=5"
```

### 分页机制说明
系统使用`page`和`limit`参数实现分页。实际查询中通过`skip = (page - 1) * limit`计算偏移量，结合`take: limit`实现高效分页查询。`pagination`对象返回总记录数和总页数，便于前端实现分页控件。

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L1-L194)
- [work.d.ts](file://src/types/work.d.ts#L1-L95)

## 作品上传

### 端点信息
- **HTTP方法**: `POST`
- **URL路径**: `/api/works`
- **认证要求**: 无需登录（游客可上传）

### 请求头
```
Content-Type: application/json
```

### 请求体结构
```json
{
  "name": "作品名称",
  "author": "作者名（可选）",
  "prompt": "AI提示词（可选）",
  "imageUrl": "图片URL"
}
```

### 响应格式（成功）
```json
{
  "success": true,
  "data": {
    "id": "clz1a2b3c4d5e6f7g8h9i0j1m",
    "name": "新上传作品",
    "author": "游客",
    "imageUrl": "https://oss.example.com/uploads/new.jpg",
    "status": "PENDING",
    "createdAt": "2025-09-17T10:30:00.000Z"
  },
  "message": "作品提交成功，等待管理员审核"
}
```

### 上传限制
- 上传功能是否开启由管理员在后台配置
- 存在可配置的开始时间和结束时间窗口
- 无需登录，因此不设用户上传数量限制

### curl示例
```bash
curl -X POST "http://localhost:3000/api/works" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的数字作品",
    "author": "张三",
    "prompt": "cyberpunk style, neon lights",
    "imageUrl": "https://oss.example.com/uploads/mywork.jpg"
  }'
```

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L100-L194)
- [work.d.ts](file://src/types/work.d.ts#L1-L95)

## 点赞功能

### 端点信息
- **HTTP方法**: `POST`
- **URL路径**: `/api/works/[id]/like`
- **认证要求**: 无需登录（游客可点赞）

### 路径参数
| 参数名 | 类型 | 必需 | 描述 |
|-------|------|------|------|
| `id` | string | 是 | 作品的唯一标识符 |

### 响应格式（成功）
```json
{
  "success": true,
  "data": {
    "likeCount": 56,
    "increment": 7
  }
}
```

### 功能说明
- 点赞操作会随机增加1-10个点赞数，增加趣味性
- 只有状态为`APPROVED`的作品才能被点赞
- 系统通过Prisma的`increment`操作原子性地更新点赞数

### curl示例
```bash
curl -X POST "http://localhost:3000/api/works/clz1a2b3c4d5e6f7g8h9i0j1k/like"
```

**Section sources**
- [\[id\]/like/route.ts](file://src/app/api/works/[id]/like/route.ts#L1-L64)
- [work.d.ts](file://src/types/work.d.ts#L1-L95)

## 浏览计数

### 端点信息
- **HTTP方法**: `POST`
- **URL路径**: `/api/works/[id]/view`
- **认证要求**: 无需登录（游客可触发）

### 路径参数
| 参数名 | 类型 | 必需 | 描述 |
|-------|------|------|------|
| `id` | string | 是 | 作品的唯一标识符 |

### 响应格式（成功）
```json
{
  "success": true,
  "data": {
    "viewCount": 121
  }
}
```

### 功能说明
- 每次调用该接口，作品的浏览量增加1
- 只有状态为`APPROVED`的作品才能增加浏览量
- 通常在作品详情页加载时触发

### curl示例
```bash
curl -X POST "http://localhost:3000/api/works/clz1a2b3c4d5e6f7g8h9i0j1k/view"
```

**Section sources**
- [\[id\]/view/route.ts](file://src/app/api/works/[id]/view/route.ts#L1-L61)
- [work.d.ts](file://src/types/work.d.ts#L1-L95)

## 用户作品数量统计

### 端点信息
- **HTTP方法**: `GET`
- **URL路径**: `/api/works/user-count`
- **认证要求**: 需要登录

### 请求头
```
Authorization: Bearer <your-jwt-token>
```

### 响应格式（成功）
```json
{
  "success": true,
  "data": {
    "count": 3,
    "userId": "clz1a2b3c4d5e6f7g8h9i0j1l"
  },
  "message": "查询成功"
}
```

### 响应格式（失败 - 未登录）
```json
{
  "success": false,
  "error": "请先登录",
  "code": "UNAUTHORIZED"
}
```

### 功能说明
- 返回当前登录用户已上传的作品总数
- 用于个人中心展示用户上传情况
- 管理员也可使用此接口查看自己上传的作品数

### curl示例
```bash
curl -X GET "http://localhost:3000/api/works/user-count" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Section sources**
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts#L1-L41)
- [auth.ts](file://src/lib/auth.ts#L1-L71)

## 前端集成说明

### useApi Hook 使用
前端通过`useApi`自定义Hook与后端API交互，该Hook封装了状态管理（数据、加载、错误）和错误处理。

```typescript
const { data, loading, error, execute, reset } = useApi<WorksResponse>();
```

### 获取作品列表示例
```typescript
const { execute } = useApi<WorksResponse>();

const fetchWorks = async () => {
  const result = await execute('/api/works?sortBy=popular&page=1&limit=10');
  if (result?.success) {
    console.log('作品列表:', result.data);
  } else {
    console.error('获取失败:', result?.error);
  }
};
```

### 点赞操作示例
```typescript
const { execute } = useApi<{ likeCount: number; increment: number }>();

const handleLike = async (workId: string) => {
  const result = await execute(`/api/works/${workId}/like`, {
    method: 'POST'
  });
  if (result?.success) {
    console.log(`点赞成功，当前点赞数: ${result.data?.likeCount}`);
  }
};
```

### 认证处理
- 普通用户操作（如查看个人作品数）需要登录，系统通过NextAuth管理会话
- JWT令牌自动包含在请求中
- 管理员用户在`session.user.role`中标识为`Role.ADMIN`，拥有额外权限

**Section sources**
- [useApi.ts](file://src/hooks/useApi.ts#L1-L85)
- [auth.ts](file://src/lib/auth.ts#L1-L71)
- [serialize.ts](file://src/lib/serialize.ts#L1-L52)
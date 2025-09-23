# 作品API

<cite>
**本文档引用文件**  
- [work.d.ts](file://src/types/work.d.ts)
- [route.ts](file://src/app/api/works/route.ts)
- [like/route.ts](file://src/app/api/works/[id]/like/route.ts)
- [view/route.ts](file://src/app/api/works/[id]/view/route.ts)
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts)
- [InfiniteScrollWorks.tsx](file://src/components/InfiniteScrollWorks.tsx)
</cite>

## 目录
1. [简介](#简介)
2. [核心API接口](#核心api接口)
   - [获取作品流（GET /api/works）](#获取作品流get-apipworks)
   - [上传新作品（POST /api/works）](#上传新作品post-apipworks)
   - [点赞作品（POST /api/works/[id]/like）](#点赞作品post-apipworkssidlike)
   - [增加查看次数（POST /api/works/[id]/view）](#增加查看次数post-apipworkssidview)
   - [获取用户作品数量（GET /api/works/user-count）](#获取用户作品数量get-apipworksuser-count)
3. [数据结构定义](#数据结构定义)
4. [权限控制机制](#权限控制机制)
5. [字段验证规则](#字段验证规则)
6. [错误处理示例](#错误处理示例)
7. [InfiniteScrollWorks组件实现原理](#infinitescrollworks组件实现原理)
8. [性能优化建议](#性能优化建议)

## 简介
本文档详细说明数字化作品互动展示平台的核心交互API，涵盖作品列表获取、点赞、查看计数和用户作品统计功能。所有接口均基于Next.js App Router实现，采用Prisma操作数据库，并通过TypeScript严格定义数据结构。文档包含请求参数、响应格式、权限控制、验证规则及性能优化策略。

## 核心API接口

### 获取作品流（GET /api/works）
获取已审核通过的作品列表，支持分页、排序和状态筛选。

**请求参数**
- `status` (可选): 作品状态（PENDING, APPROVED, REJECTED），默认APPROVED
- `sortBy` (可选): 排序方式（latest, popular, default）
- `page` (可选): 当前页码，默认1
- `limit` (可选): 每页数量，默认10

**响应结构**
```json
{
  "success": true,
  "data": {
    "works": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  },
  "message": "获取作品列表成功"
}
```

**权限控制**
- 允许游客访问
- 仅返回`APPROVED`状态的作品

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L1-L207)

### 上传新作品（POST /api/works）
创建新作品并提交审核。

**请求参数**
- `name` (必需): 作品名称
- `author` (可选): 作者名
- `prompt` (可选): 提示词
- `imageUrl` (必需): 图片URL

**权限控制**
- 无需登录即可上传
- 受上传配置限制（启用状态、时间窗口、用户上传上限）

**验证规则**
- 作品名称和图片URL为必需字段
- 已登录用户受`maxUploadsPerUser`限制

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L108-L207)

### 点赞作品（POST /api/works/[id]/like）
为指定作品增加点赞数，含防重复机制。

**实现机制**
- 随机增加1-10之间的点赞数
- 仅允许对已审核通过的作品点赞
- 无用户身份验证，允许游客点赞

**响应结构**
```json
{
  "success": true,
  "data": {
    "likeCount": 45,
    "increment": 7
  }
}
```

**Section sources**
- [like/route.ts](file://src/app/api/works/[id]/like/route.ts#L1-L65)

### 增加查看次数（POST /api/works/[id]/view）
为指定作品增加查看次数。

**实现机制**
- 查看次数每次增加1
- 仅允许对已审核通过的作品计数
- 无身份验证，每次访问均可计数

**响应结构**
```json
{
  "success": true,
  "data": {
    "viewCount": 123
  }
}
```

**Section sources**
- [view/route.ts](file://src/app/api/works/[id]/view/route.ts#L1-L62)

### 获取用户作品数量（GET /api/works/user-count）
获取当前登录用户已上传的作品数量。

**权限控制**
- 必须登录才能访问
- 仅返回当前用户的作品计数

**响应结构**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "userId": "clxyz123"
  },
  "message": "查询成功"
}
```

**Section sources**
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts#L1-L42)

## 数据结构定义
基于`work.d.ts`类型定义，核心数据结构如下：

### WorkWithUser
扩展Prisma生成的Work类型，包含关联用户信息。
```typescript
export type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};
```

### WorksResponse
作品列表响应数据结构。
```typescript
export interface WorksResponse {
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

### InfiniteScrollWorksProps
无限滚动组件的Props定义。
```typescript
export interface InfiniteScrollWorksProps {
  onWorkClick: (work: WorkWithUser) => void;
  worksPerRow?: number;
  refreshTrigger?: number;
  onNewContent?: (count: number) => void;
}
```

**Section sources**
- [work.d.ts](file://src/types/work.d.ts#L1-L96)

## 权限控制机制
各接口采用不同的权限控制策略：

| 接口 | 权限要求 | 实现方式 |
|------|---------|---------|
| GET /api/works | 允许游客 | 无session验证 |
| POST /api/works | 允许游客 | 依赖上传配置而非用户身份 |
| POST /like | 允许游客 | 无用户验证，仅检查作品状态 |
| POST /view | 允许游客 | 无用户验证，仅检查作品状态 |
| GET /user-count | 必须登录 | 验证session.user.id存在 |

权限验证通过`getServerSession(authOptions)`实现，确保用户会话有效。

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L1-L207)
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts#L7-L12)

## 字段验证规则
上传作品时的字段验证规则：

| 字段 | 是否必需 | 长度/格式限制 | 验证时机 |
|------|---------|-------------|---------|
| name | 是 | 无明确长度限制 | 后端验证 |
| imageUrl | 是 | 有效URL格式 | 后端验证 |
| author | 否 | 无明确长度限制 | 后端验证 |
| prompt | 否 | 无明确长度限制 | 后端验证 |

此外，系统级验证包括：
- 上传功能是否启用
- 当前时间是否在允许上传的时间窗口内
- 已登录用户是否超过最大上传数量限制

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L108-L207)

## 错误处理示例
常见错误响应示例：

### 作品不存在（404）
```json
{
  "success": false,
  "error": "作品不存在或未审核通过"
}
```
**触发条件**: 请求未审核或不存在的作品ID

### 未登录错误（401）
```json
{
  "success": false,
  "error": "请先登录",
  "code": "UNAUTHORIZED"
}
```
**触发条件**: 访问需要登录的接口时未提供有效会话

### 上传限制（403）
```json
{
  "success": false,
  "error": "每个用户最多只能上传5个作品",
  "code": "UPLOAD_LIMIT_EXCEEDED"
}
```
**触发条件**: 已登录用户超过配置的上传上限

**Section sources**
- [like/route.ts](file://src/app/api/works/[id]/like/route.ts#L15-L22)
- [user-count/route.ts](file://src/app/api/works/user-count/route.ts#L7-L14)
- [route.ts](file://src/app/api/works/route.ts#L135-L141)

## InfiniteScrollWorks组件实现原理
`InfiniteScrollWorks`组件实现无限滚动加载作品流。

### 核心功能
- 自动分页加载作品数据
- Intersection Observer实现滚动触底加载
- 支持手动加载更多
- 错误重试机制

### 工作流程
1. 初始加载第一页数据
2. 监听加载指示器元素的可见性
3. 当指示器进入视口时自动加载下一页
4. 更新作品列表和分页状态
5. 提供错误处理和重试功能

### 关键技术点
- 使用`useRef`避免闭包问题
- `IntersectionObserver`配置`rootMargin: '200px'`提前触发加载
- 状态同步到ref确保异步操作获取最新状态

```mermaid
flowchart TD
A[组件初始化] --> B[加载第一页数据]
B --> C{是否有更多数据?}
C --> |是| D[创建IntersectionObserver]
D --> E[监听加载指示器]
E --> F[指示器进入视口?]
F --> |是| G[加载下一页]
G --> H[更新作品列表]
H --> C
F --> |否| I[等待用户滚动]
C --> |否| J[显示"已加载完毕"]
```

**Diagram sources**
- [InfiniteScrollWorks.tsx](file://src/components/InfiniteScrollWorks.tsx#L7-L267)

**Section sources**
- [InfiniteScrollWorks.tsx](file://src/components/InfiniteScrollWorks.tsx#L7-L267)

## 性能优化建议
针对高频访问场景的性能优化策略：

### 缓存策略
- **CDN缓存**: 静态资源（作品图片）通过OSS+CDN分发
- **HTTP缓存**: 对统计类接口设置`Cache-Control: public, s-maxage=300`
- **数据库查询优化**: 使用`select`字段限制返回数据量

### 数据库优化
- 为`status`、`approvedAt`、`likeCount`等查询字段创建索引
- 分页查询使用`skip`和`take`避免全表扫描
- 聚合查询（count, sum）独立执行并合并结果

### 接口优化
- 批量操作减少请求次数
- 响应数据精简，仅返回必要字段
- 异步处理非关键操作（如日志记录）

### 前端优化
- 无限滚动减少初始加载量
- 图片懒加载
- 请求防抖和节流

**Section sources**
- [route.ts](file://src/app/api/works/route.ts#L1-L207)
- [admin/stats/route.ts](file://src/app/api/admin/stats/route.ts#L134-L162)
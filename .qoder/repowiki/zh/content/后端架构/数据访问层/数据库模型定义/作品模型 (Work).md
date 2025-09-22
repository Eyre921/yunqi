# 作品模型 (Work)

<cite>
**本文档引用文件**  
- [prisma/schema.prisma](file://prisma/schema.prisma)
- [src/types/work.d.ts](file://src/types/work.d.ts)
- [src/app/api/works/[id]/route.ts](file://src/app/api/works/[id]/route.ts)
- [src/app/api/works/[id]/like/route.ts](file://src/app/api/works/[id]/like/route.ts)
- [src/app/api/admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts)
- [src/app/api/admin/works/[id]/featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts)
- [src/app/api/admin/works/[id]/reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts)
- [src/lib/db-utils.ts](file://src/lib/db-utils.ts)
- [prisma/seed.ts](file://prisma/seed.ts)
- [src/数字化作品互动展示平台 - 开发文档.md](file://src/数字化作品互动展示平台 - 开发文档.md)
</cite>

## 目录
1. [简介](#简介)
2. [作品模型字段详解](#作品模型字段详解)
3. [外键约束与级联行为](#外键约束与级联行为)
4. [审核与精选业务逻辑](#审核与精选业务逻辑)
5. [前后端类型一致性](#前后端类型一致性)
6. [Prisma操作示例](#prisma操作示例)
7. [性能优化策略](#性能优化策略)
8. [结论](#结论)

## 简介
本技术文档深入解析数字化作品互动展示平台中的核心数据模型——作品（Work）。该模型承载了用户上传的AI创作内容，是平台内容展示与互动功能的基础。文档将详细阐述其在Prisma中的字段定义、外键关系、业务逻辑实现、前后端类型同步机制以及关键的性能优化策略，为开发者提供全面的技术参考。

## 作品模型字段详解

作品模型（Work）定义了平台中所有作品的核心属性，其在Prisma Schema中的定义位于`prisma/schema.prisma`文件中。以下是各字段的详细说明：

- **id**: `String`类型，作为主键，使用`cuid()`函数生成唯一标识符。
- **title**: `String`类型，作品的简述信息，用于展示和搜索，最大长度300字符。
- **description**: 在`prisma/schema.prisma`中实际字段名为`title`，其注释明确为“作品简述”，是作品的核心描述字段。
- **imageUrl**: `String`类型，存储作品图片的URL地址，通常指向CDN资源，确保快速加载。
- **viewCount**: `Int`类型，整数，用于记录作品的总浏览次数，默认值为0。
- **likeCount**: `Int`类型，整数，用于记录作品的总点赞数，默认值为0。
- **isApproved**: 在`prisma/schema.prisma`中，该功能由`status`字段实现。`status`是一个`WorkStatus`枚举类型，包含`PENDING`（待审核）、`APPROVED`（已通过）、`REJECTED`（已拒绝）三种状态，用于精确控制作品的审核生命周期。
- **isFeatured**: `Boolean`类型，布尔值，用于标记作品是否为“精选”或“热门”，默认值为`false`，为运营活动提供支持。
- **userId**: `String?`类型，可选的字符串，作为外键关联到`User`模型的`id`字段，表示作品的上传者。该字段可为空，以支持匿名上传场景。
- **platformConfigId**: 在现有代码库中，未发现`platformConfigId`字段。平台配置由独立的`platform_configs`表管理，与`Work`模型无直接关联。

**Section sources**
- [prisma/schema.prisma](file://prisma/schema.prisma#L39-L160)

## 外键约束与级联行为

作品模型通过外键与用户模型（User）建立关联，其定义方式和级联行为如下：

在`prisma/schema.prisma`中，`Work`模型通过以下方式定义与`User`的关联：
```prisma
userId          String?
user            User?       @relation("UserWorks", fields: [userId], references: [id])
```
- **定义方式**: 使用`@relation`属性显式声明关系。`fields: [userId]`指定了当前模型（Work）中作为外键的字段，`references: [id]`指定了被引用模型（User）中的主键字段。
- **级联行为**: 在`prisma/schema.prisma`中，`Work`模型的`userId`字段是可选的（`String?`），这意味着一个作品可以没有关联的用户（匿名上传）。当关联的用户被删除时，由于`Work`模型中未使用`onDelete`指令，Prisma将使用数据库的默认行为。在SQLite中，这通常意味着外键约束会阻止删除仍有作品关联的用户，从而保护数据完整性。这种设计确保了即使用户注销，其上传的作品记录依然存在。

**Section sources**
- [prisma/schema.prisma](file://prisma/schema.prisma#L39-L160)

## 审核与精选业务逻辑

作品的审核与精选状态是平台内容管理的核心，其业务逻辑主要通过API路由实现。

- **isApproved (审核状态控制)**:
  作品的审核状态由`status`字段控制。管理员通过访问`/api/admin/works/[id]/approve`和`/api/admin/works/[id]/reject`这两个API端点来执行审核操作。当管理员点击“通过”时，`approve/route.ts`会将`status`更新为`WorkStatus.APPROVED`，并设置`approvedAt`时间戳。此操作会触发作品进入前台展示池。审核逻辑在`src/app/api/admin/works/[id]/approve/route.ts`中实现，确保只有管理员角色才能执行此操作。

- **isFeatured (精选展示)**:
  `isFeatured`字段用于标记作品是否为精选。管理员可以通过`/api/admin/works/[id]/featured`端点来切换此状态。在`src/app/api/admin/works/[id]/featured/route.ts`中，后端会接收请求并更新指定作品的`isFeatured`布尔值。前端在展示作品时，可以根据`isFeatured`字段的值对精选作品进行特殊样式渲染或优先排序，从而实现运营推广的目的。

**Section sources**
- [src/app/api/admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts#L45-L75)
- [src/app/api/admin/works/[id]/featured/route.ts](file://src/app/api/admin/works/[id]/featured/route.ts#L45-L75)
- [src/app/api/admin/works/[id]/reject/route.ts](file://src/app/api/admin/works/[id]/reject/route.ts#L45-L75)

## 前后端类型一致性

为了确保前后端数据交互的类型安全，项目通过`src/types/work.d.ts`文件定义了共享的TypeScript接口。

- **类型定义**: `work.d.ts`文件中定义了`WorkWithUser`类型，它通过交叉类型（`&`）将Prisma生成的`Work`类型与一个包含用户信息的对象合并。这使得前端在获取作品数据时，能同时获得作品及其关联用户的`id`、`name`、`email`等信息，而无需进行额外的类型断言。
- **保障机制**: 后端API在返回包含用户信息的作品列表时（如`/api/admin/works`），会使用`include`选项在Prisma查询中包含`user`关系。返回的JSON数据结构与前端定义的`WorkWithUser`接口完全匹配。这种基于共享`.d.ts`文件的类型定义，实现了前后端在数据结构上的契约，极大地减少了因数据格式不一致导致的运行时错误，提升了开发效率和代码健壮性。

**Section sources**
- [src/types/work.d.ts](file://src/types/work.d.ts#L0-L73)

## Prisma操作示例

以下是使用Prisma Client对作品模型进行常见操作的代码示例：

- **增删改查 (CRUD)**:
  - **创建**: 使用`prisma.work.create()`方法，传入包含`title`、`imageUrl`、`userId`等字段的数据对象。
  - **查询**: 使用`prisma.work.findMany()`或`prisma.work.findUnique()`，可通过`where`条件筛选（如`status: 'APPROVED'`），通过`orderBy`排序（如`{ likeCount: 'desc' }`），并通过`include: { user: true }`来包含关联的用户信息。
  - **更新**: 使用`prisma.work.update()`，例如更新审核状态：`data: { status: WorkStatus.APPROVED, approvedAt: new Date() }`。
  - **删除**: 使用`prisma.work.delete()`，通常通过`where: { id: '...' }`来指定删除哪个作品。

- **点赞计数更新**:
  为避免并发更新导致的计数错误，应使用Prisma的原子操作。在`src/app/api/works/[id]/like/route.ts`中，通过`{ increment: 1 }`来原子性地增加`likeCount`，确保即使在高并发下，计数也是准确的。

- **审核状态变更**:
  审核状态的变更在`src/app/api/admin/works/[id]/approve/route.ts`中完成。代码示例为：
  ```typescript
  const updatedWork = await prisma.work.update({
    where: { id },
    data: {
      status: WorkStatus.APPROVED,
      approvedAt: new Date()
    },
    include: { user: true } // 同时返回用户信息
  });
  ```

**Section sources**
- [src/app/api/works/[id]/route.ts](file://src/app/api/works/[id]/route.ts#L236-L291)
- [src/app/api/works/[id]/like/route.ts](file://src/app/api/works/[id]/like/route.ts#L45-L75)
- [src/app/api/admin/works/[id]/approve/route.ts](file://src/app/api/admin/works/[id]/approve/route.ts#L45-L75)

## 性能优化策略

针对作品模型的高频操作，项目采用了以下性能优化策略：

- **并发更新处理**:
  对于`viewCount`和`likeCount`这类高频更新的计数器，直接使用`increment`原子操作是关键。这避免了“读取-修改-写入”的竞态条件，确保了数据的一致性。例如，在`src/lib/db-utils.ts`中，`incrementViewCount`函数就使用了`{ increment: 1 }`来安全地增加浏览数。

- **索引设计**:
  为了加速高频查询，应在数据库中为关键字段创建索引。虽然Prisma Schema中未显式定义，但根据查询模式，应在以下字段上创建索引：
  - `status`: 用于快速筛选已通过、待审核的作品。
  - `likeCount` 和 `viewCount`: 用于按热度排序。
  - `createdAt` 和 `approvedAt`: 用于按时间排序。
  - `userId`: 用于快速查询特定用户的所有作品。
  这些索引能显著提升`findMany`查询的性能，尤其是在数据量大的情况下。

**Section sources**
- [src/lib/db-utils.ts](file://src/lib/db-utils.ts#L51-L67)
- [src/app/api/admin/works/route.ts](file://src/app/api/admin/works/route.ts#L34-L79)

## 结论
作品模型（Work）是数字化作品互动展示平台的核心。通过Prisma的强类型Schema定义，实现了清晰的数据结构和外键约束。`status`和`isFeatured`字段分别支撑了内容审核和运营精选两大核心业务。前后端通过共享的TypeScript类型定义保证了数据交互的安全性。在性能层面，利用Prisma的原子操作处理并发计数，并建议通过索引优化高频查询，确保了平台在高并发场景下的稳定与高效。该模型设计兼顾了功能性、安全性和可扩展性，为平台的长期发展奠定了坚实基础。
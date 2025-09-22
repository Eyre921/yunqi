# UI组件

<cite>
**本文档中引用的文件**
- [WorkCard.tsx](file://src/components/WorkCard.tsx)
- [OnlineCounter.tsx](file://src/components/OnlineCounter.tsx)
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx)
- [work.d.ts](file://src/types/work.d.ts)
</cite>

## 目录
1. [简介](#简介)
2. [核心组件](#核心组件)
3. [组件详细说明](#组件详细说明)
   - [WorkCard 组件](#workcard-组件)
   - [OnlineCounter 组件](#onlinecounter-组件)
   - [AdminDashboard 组件](#admindashboard-组件)
4. [可访问性与响应式设计](#可访问性与响应式设计)
5. [总结](#总结)

## 简介
本文档为数字化作品互动展示平台的前端组件库提供开发者文档。重点介绍三个关键UI组件：`WorkCard`、`OnlineCounter` 和 `AdminDashboard`。文档涵盖每个组件的视觉设计、交互行为、使用场景、属性（Props）、事件（Events）和插槽（Slots），并提供代码示例和最佳实践指导。

## 核心组件
本文档重点介绍以下三个核心UI组件：
- **WorkCard**: 用于展示单个作品的卡片式UI组件。
- **OnlineCounter**: 显示实时在线人数的动态计数器组件。
- **AdminDashboard**: 管理员后台的主界面容器组件。

**Section sources**
- [WorkCard.tsx](file://src/components/WorkCard.tsx)
- [OnlineCounter.tsx](file://src/components/OnlineCounter.tsx)
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx)

## 组件详细说明

### WorkCard 组件

#### 视觉设计与交互行为
`WorkCard` 是一个响应式卡片组件，用于展示作品的缩略图、名称、作者及互动数据（点赞数和浏览数）。卡片具有以下视觉特征：
- 悬停时轻微放大并提升阴影，增强交互反馈。
- 图片区域为16:9的视频比例，支持响应式加载。
- 若作品被标记为“精选”，右上角会显示渐变色徽章。
- 内置图片加载状态指示：加载中显示旋转动画，加载失败显示占位符。

交互行为：
- 点击卡片主体触发 `onClick` 回调，通常用于打开作品详情。
- 点击点赞按钮触发 `onLike` 回调，且阻止事件冒泡以避免触发卡片点击。

#### 使用场景
适用于作品列表、推荐流、用户个人中心等需要展示作品摘要信息的场景。

#### Props 说明
| 属性名 | 类型 | 默认值 | 含义 |
|-------|------|--------|------|
| work | `WorkWithUser` | 必填 | 作品数据对象，包含作品信息及关联用户信息 |
| onClick | `() => void` | 可选 | 卡片点击事件回调函数 |
| onLike | `() => void` | 可选 | 点赞按钮点击事件回调函数 |

**Section sources**
- [WorkCard.tsx](file://src/components/WorkCard.tsx#L7-L92)
- [work.d.ts](file://src/types/work.d.ts#L69-L73)

### OnlineCounter 组件

#### 视觉设计与交互行为
`OnlineCounter` 是一个动态数字显示组件，用于展示当前在线创作人数。其设计特点包括：
- 数字变化时带有平滑的滚动动画（缓动效果）。
- 数字变化时伴有缩放和发光效果，吸引用户注意。
- 右侧配有火箭表情符号，增加视觉趣味性。
- 加载时显示脉冲动画，避免空白等待。

交互行为：
- 组件在客户端自动从 `/api/online-counter` 接口获取数据。
- 每10秒自动刷新一次数据。
- 若在线人数功能被禁用，则组件不渲染任何内容。

#### 使用场景
适用于首页、活动页面等需要展示实时活跃用户数的场景，增强平台的活跃氛围。

#### Props 说明
| 属性名 | 类型 | 默认值 | 含义 |
|-------|------|--------|------|
| className | `string` | `''` | 自定义CSS类名，用于外部样式控制 |

**Section sources**
- [OnlineCounter.tsx](file://src/components/OnlineCounter.tsx#L15-L157)
- [OnlineCounter.tsx](file://src/components/OnlineCounter.tsx#L4-L6)

### AdminDashboard 组件

#### 视觉设计与交互行为
`AdminDashboard` 是管理员后台的主界面，采用标签页布局，包含以下功能模块：
- **作品管理**: 审核和管理用户提交的作品。
- **上传配置**: 配置作品上传的规则和限制。
- **在线人数**: 查看和管理在线人数计数器。
- **平台配置**: 配置平台级参数。

界面设计：
- 顶部为固定导航栏，包含“管理员后台”标题和主题切换、退出登录按钮。
- 中部为标签页导航，通过点击切换不同功能模块。
- 内容区域动态渲染当前选中的管理模块。

交互行为：
- 用户点击标签页时，通过 `setActiveTab` 更新状态并渲染对应内容。
- 支持深色/浅色主题切换。
- 点击“退出登录”按钮调用 `signOut` 函数。

#### 使用场景
作为管理员的唯一入口，集中管理平台各项核心功能。

#### Props 说明
该组件无外部Props，为独立的页面级组件。

**Section sources**
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx#L12-L89)

## 可访问性与响应式设计

### 可访问性 (a11y)
- **WorkCard**: 使用语义化HTML标签（`<div>` 作为容器，`<h3>` 作为标题），确保屏幕阅读器能正确解析内容结构。图片均提供 `alt` 属性。
- **OnlineCounter**: 动态数字变化对屏幕阅读器用户透明，但可通过ARIA属性增强。当前实现可考虑添加 `aria-live` 区域以通知数字变化。
- **AdminDashboard**: 标签页导航使用 `aria-label="Tabs"` 提供上下文，按钮有明确的文本标签。

### 响应式设计
- **WorkCard**: 使用Tailwind CSS的响应式类（如 `text-lg`、`md:text-xl`），图片加载使用 `sizes` 属性优化不同屏幕的资源加载。
- **OnlineCounter**: 文字大小根据屏幕尺寸调整（`text-lg md:text-xl`），确保在移动设备上清晰可读。
- **AdminDashboard**: 使用 `w-full px-4 sm:px-6 lg:px-8` 实现响应式内边距，适配不同屏幕宽度。

**Section sources**
- [WorkCard.tsx](file://src/components/WorkCard.tsx)
- [OnlineCounter.tsx](file://src/components/OnlineCounter.tsx)
- [AdminDashboard.tsx](file://src/components/admin/AdminDashboard.tsx)

## 总结
本文档详细介绍了 `WorkCard`、`OnlineCounter` 和 `AdminDashboard` 三个核心UI组件的设计、使用和实现细节。这些组件共同构成了数字化作品互动展示平台的前端基础，提供了良好的用户体验和可维护的代码结构。开发者在使用时应遵循文档中的Props规范和最佳实践，确保一致性和可访问性。
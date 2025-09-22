# 配置管理API

<cite>
**本文档引用的文件**   
- [upload-config/route.ts](file://src/app/api/admin/upload-config/route.ts)
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts)
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts)
- [UploadConfigManagement.tsx](file://src/components/admin/UploadConfigManagement.tsx)
- [OnlineCounterManagement.tsx](file://src/components/admin/OnlineCounterManagement.tsx)
- [PlatformConfigManagement.tsx](file://src/components/admin/PlatformConfigManagement.tsx)
</cite>

## 目录
1. [简介](#简介)
2. [上传配置管理](#上传配置管理)
3. [在线人数配置管理](#在线人数配置管理)
4. [平台基础配置管理](#平台基础配置管理)
5. [配置变更持久化与前端影响](#配置变更持久化与前端影响)
6. [curl请求示例](#curl请求示例)

## 简介
本文档详细说明数字化作品互动展示平台的三大核心配置类API：上传配置、在线人数配置和平台基础配置。所有配置接口均需管理员身份验证，通过`PUT`或`POST`方法更新配置，返回更新后的完整配置对象。结合前端管理组件，阐述表单提交逻辑与API调用方式，并说明配置变更的持久化机制及其对前端行为的实时影响。

## 上传配置管理

该模块通过`PUT /api/admin/upload-config`（实际为`POST`）端点管理用户上传作品的相关设置。管理员可控制上传功能的启用状态、时间范围、数量与大小限制、允许的文件格式及公告信息。

### 请求体结构
```json
{
  "isEnabled": true,
  "startTime": "2025-09-01T00:00:00Z",
  "endTime": "2025-09-30T23:59:59Z",
  "maxUploadsPerUser": 5,
  "maxFileSize": 52428800,
  "allowedFormats": ["jpg", "jpeg", "png", "gif", "webp"],
  "announcement": "新一期作品征集开始啦！"
}
```

**字段说明**：
- `isEnabled`: 布尔值，控制上传功能是否开启。
- `startTime` / `endTime`: ISO 8601格式的日期时间字符串，定义上传开放的时间窗口。
- `maxUploadsPerUser`: 整数，限制每个用户可上传的作品数量（1-1000）。
- `maxFileSize`: 整数，限制单个文件的最大大小（字节，1KB-100MB）。
- `allowedFormats`: 字符串数组，指定允许上传的文件扩展名。
- `announcement`: 字符串，可选，向用户展示的公告信息。

### 响应示例
成功更新后，返回包含完整配置信息的对象，包括创建者和时间戳。
```json
{
  "success": true,
  "data": {
    "id": "clx123",
    "isEnabled": true,
    "startTime": "2025-09-01T00:00:00.000Z",
    "endTime": "2025-09-30T23:59:59.000Z",
    "maxUploadsPerUser": 5,
    "maxFileSize": 52428800,
    "allowedFormats": ["jpg", "jpeg", "png", "gif", "webp"],
    "announcement": "新一期作品征集开始啦！",
    "creator": {
      "id": "usr456",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-08-31T10:00:00.000Z",
    "updatedAt": "2025-08-31T10:05:00.000Z"
  },
  "message": "上传配置创建成功"
}
```

**前端实现**：`UploadConfigManagement.tsx`组件在加载时通过`GET /api/admin/upload-config`获取当前配置，并在用户修改表单后，通过`POST`请求提交更新。表单包含开关、时间选择器、数值输入、文件格式复选框和公告文本域。

**Section sources**
- [upload-config/route.ts](file://src/app/api/admin/upload-config/route.ts#L1-L151)
- [UploadConfigManagement.tsx](file://src/components/admin/UploadConfigManagement.tsx#L1-L333)

## 在线人数配置管理

该模块通过`PUT /api/admin/online-counter`端点管理首页显示的虚拟在线人数。管理员可动态调整人数基数、增长速率、显示文本及功能开关。

### 请求体结构
```json
{
  "currentCount": 1500,
  "baseCount": 1000,
  "maxCount": 3000,
  "growthRate": 2.5,
  "isEnabled": true,
  "displayText": "人正在创作中"
}
```

**字段说明**：
- `currentCount`: 整数，当前立即显示的人数。
- `baseCount`: 整数，重置时的最小人数。
- `maxCount`: 整数，自动增长的上限。
- `growthRate`: 浮点数，每10秒随机增加的人数上限（0-100）。
- `isEnabled`: 布尔值，控制在线人数显示功能是否启用。
- `displayText`: 字符串，显示在人数后的描述文本。

### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "occ789",
    "currentCount": 1500,
    "baseCount": 1000,
    "maxCount": 3000,
    "growthRate": 2.5,
    "isEnabled": true,
    "displayText": "人正在创作中",
    "lastUpdated": "2025-08-31T10:10:00.000Z",
    "createdAt": "2025-08-31T09:00:00.000Z",
    "updatedAt": "2025-08-31T10:10:00.000Z"
  },
  "message": "在线人数配置更新成功"
}
```

**前端实现**：`OnlineCounterManagement.tsx`组件提供一个管理界面，左侧显示当前状态，右侧为配置表单。除了`PUT`更新配置外，还支持`POST /api/admin/online-counter`（无请求体）来重置人数至`baseCount`。

**Section sources**
- [online-counter/route.ts](file://src/app/api/admin/online-counter/route.ts#L1-L176)
- [OnlineCounterManagement.tsx](file://src/components/admin/OnlineCounterManagement.tsx#L1-L323)

## 平台基础配置管理

该模块通过`PUT /api/admin/platform-config`（实际为`POST`）端点管理平台的基础信息，目前主要支持平台标题的修改。

### 请求体结构
```json
{
  "title": "我的AI作品展示平台"
}
```

**字段说明**：
- `title`: 字符串，平台的主标题，长度限制1-100字符。

### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "pc101",
    "title": "我的AI作品展示平台",
    "updatedAt": "2025-08-31T10:15:00.000Z"
  },
  "message": "平台配置更新成功"
}
```

**前端实现**：`PlatformConfigManagement.tsx`组件提供一个简单的输入框用于修改标题。保存成功后，会调用`window.location.reload()`强制刷新页面，以确保新标题在页面头部（Header）等位置立即生效。

**Section sources**
- [platform-config/route.ts](file://src/app/api/platform-config/route.ts#L1-L113)
- [PlatformConfigManagement.tsx](file://src/components/admin/PlatformConfigManagement.tsx#L1-L143)

## 配置变更持久化与前端影响

所有配置变更均通过Prisma ORM持久化存储至数据库。每次更新都会创建新的配置记录或更新现有记录，并记录操作者和时间戳，确保了配置的历史可追溯性。

配置变更对前端行为有直接且实时的影响：
- **上传配置**：前端上传页面会根据`isEnabled`、`startTime`/`endTime`、`maxFileSize`等字段动态调整UI和功能，例如在非开放时段禁用上传按钮，或在用户选择文件时检查大小。
- **在线人数配置**：当`isEnabled`为`true`时，前端`OnlineCounter`组件会启动一个定时器（每10秒），根据`currentCount`、`growthRate`和`maxCount`计算并显示一个动态增长的人数，增强平台活跃度的视觉效果。
- **平台基础配置**：标题变更后，通过页面刷新，确保所有使用该标题的组件（如Header、页面标题）都能获取到最新值。

## curl请求示例

以下示例展示了如何使用curl命令调用这些API。**注意**：需要提供有效的管理员会话Cookie。

### 更新上传配置
```bash
curl -X POST "http://localhost:3000/api/admin/upload-config" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your_admin_session_token_here" \
  -d '{
    "isEnabled": true,
    "startTime": "2025-09-01T00:00:00Z",
    "endTime": "2025-09-30T23:59:59Z",
    "maxUploadsPerUser": 3,
    "maxFileSize": 20971520,
    "allowedFormats": ["jpg", "png"],
    "announcement": "重要：仅接受JPG和PNG格式！"
  }'
```

### 更新在线人数配置
```bash
curl -X PUT "http://localhost:3000/api/admin/online-counter" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your_admin_session_token_here" \
  -d '{
    "currentCount": 1200,
    "baseCount": 800,
    "maxCount": 2500,
    "growthRate": 1.8,
    "isEnabled": true,
    "displayText": "人正在云栖大会创作"
  }'
```

### 更新平台基础配置
```bash
curl -X POST "http://localhost:3000/api/platform-config" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your_admin_session_token_here" \
  -d '{
    "title": "Qoder和通义灵码 AI Coding 作品秀"
  }'
```
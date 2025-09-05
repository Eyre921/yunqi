# 数字化作品互动展示平台

一个基于 Next.js 15 和 Prisma 构建的现代化数字作品展示平台，支持用户上传、浏览和互动。

## 功能特性

### 核心功能
- 🎨 **作品展示**: 支持图片作品的上传、展示和浏览
- 👥 **用户系统**: 完整的用户注册、登录和个人资料管理
- 💖 **互动功能**: 点赞、收藏和评论系统
- 📱 **响应式设计**: 适配桌面端和移动端
- 🌙 **主题切换**: 支持明暗主题切换

### 高级功能
- 🔄 **无限滚动**: 流畅的作品加载体验
- 📊 **实时统计**: 在线人数统计和数字滚动动画
- 🎯 **智能推荐**: 热门作品和最新作品分类展示
- ⚡ **自动刷新**: 作品数据自动更新（热门作品5分钟，最新作品1分钟）
- 🛡️ **权限管理**: 管理员后台和用户权限控制

## 技术栈

- **前端**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, NextAuth.js
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: NextAuth.js (支持邮箱/密码登录)
- **文件上传**: 本地文件系统存储
- **UI组件**: 自定义组件 + Tailwind CSS

## 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- PostgreSQL 数据库
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd yunqi
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **环境配置**
   
   复制环境变量模板：
   ```bash
   cp .env.example .env.local
   ```
   
   配置以下环境变量：
   ```env
   # 数据库连接
   DATABASE_URL="postgresql://username:password@localhost:5432/yunqi"
   
   # NextAuth 配置
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # 文件上传路径
   UPLOAD_DIR="./public/uploads"
   ```

4. **数据库设置**
   ```bash
   # 运行数据库迁移
   npx prisma migrate dev
   
   # 生成 Prisma 客户端
   npx prisma generate
   
   # (可选) 填充示例数据
   npx prisma db seed
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 http://localhost:3000 查看应用

## 项目结构

```
yunqi/
├── src/
│   ├── app/                 # Next.js 13+ App Router
│   │   ├── api/             # API 路由
│   │   ├── admin/           # 管理员页面
│   │   ├── auth/            # 认证页面
│   │   ├── profile/         # 用户资料页面
│   │   └── upload/          # 上传页面
│   ├── components/          # React 组件
│   │   ├── admin/           # 管理员组件
│   │   ├── Header.tsx       # 头部导航
│   │   ├── WorkCard.tsx     # 作品卡片
│   │   └── ...
│   ├── contexts/            # React Context
│   ├── hooks/               # 自定义 Hooks
│   ├── lib/                 # 工具库
│   └── types/               # TypeScript 类型定义
├── prisma/                  # 数据库相关
│   ├── schema.prisma        # 数据库模式
│   ├── migrations/          # 数据库迁移
│   └── seed.ts              # 种子数据
├── public/                  # 静态资源
│   ├── images/              # 图片资源
│   └── uploads/             # 用户上传文件
└── ...
```

## 主要功能使用说明

### 用户功能

1. **注册/登录**
   - 访问 `/auth/register` 注册新账户
   - 访问 `/auth/login` 登录现有账户
   - 支持邮箱和密码认证

2. **上传作品**
   - 访问 `/upload` 页面
   - 支持 JPG、PNG、GIF 格式图片
   - 填写作品标题、描述等信息

3. **浏览作品**
   - 首页展示所有作品，支持无限滚动加载
   - 点击作品查看详情和大图
   - 支持点赞和收藏功能

4. **个人中心**
   - 访问 `/profile` 管理个人信息
   - 查看自己上传的作品
   - 查看收藏的作品

### 管理员功能

1. **后台管理**
   - 访问 `/admin` 进入管理后台
   - 管理用户账户和权限
   - 管理作品内容
   - 配置平台设置

2. **数据统计**
   - 查看用户注册统计
   - 查看作品上传统计
   - 实时在线人数监控

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 Hooks
- API 路由使用标准的 HTTP 状态码

### 数据库操作

```bash
# 创建新的迁移
npx prisma migrate dev --name migration-name

# 重置数据库
npx prisma migrate reset

# 查看数据库
npx prisma studio
```

### 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 作品相关
- `GET /api/works` - 获取作品列表
- `POST /api/works` - 上传新作品
- `GET /api/works/[id]` - 获取作品详情
- `PUT /api/works/[id]` - 更新作品信息
- `DELETE /api/works/[id]` - 删除作品

### 用户相关
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `GET /api/users/works` - 获取用户作品

### 互动相关
- `POST /api/works/[id]/like` - 点赞/取消点赞
- `POST /api/works/[id]/favorite` - 收藏/取消收藏
- `GET /api/works/[id]/comments` - 获取评论
- `POST /api/works/[id]/comments` - 添加评论

## 常见问题

### Q: 如何修改上传文件大小限制？
A: 在 `next.config.ts` 中修改 `api.bodyParser.sizeLimit` 配置。

### Q: 如何添加新的文件类型支持？
A: 在上传组件中修改 `accept` 属性和后端验证逻辑。

### Q: 如何自定义主题样式？
A: 修改 `tailwind.config.js` 中的主题配置和 CSS 变量。

### Q: 数据库连接失败怎么办？
A: 检查 `DATABASE_URL` 环境变量配置，确保数据库服务正在运行。

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

感谢使用数字化作品互动展示平台！🎨✨
# 项目开发规则和最佳实践

## TypeScript 类型安全规则

### 1. 禁止使用 any 类型
- **规则**: 严禁在代码中使用 `any` 类型
- **替代方案**: 使用具体类型、联合类型、泛型或 `unknown` 类型
- **例外**: 仅在处理第三方库未提供类型定义时临时使用，必须添加 TODO 注释

```typescript
// ❌ 错误
const data: any = response.data;

// ✅ 正确
interface ApiResponse {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}
const data: ApiResponse = response.data;

// ✅ 临时使用（需要后续完善）
// TODO: 为第三方库添加类型定义
const legacyData: any = thirdPartyLib.getData();
```

### 2. 严格的函数参数和返回值类型
- **规则**: 所有函数必须明确定义参数类型和返回值类型
- **API路由**: 必须使用 NextRequest 和 NextResponse 类型

```typescript
// ❌ 错误
function processUser(user) {
  return user.name;
}

// ✅ 正确
function processUser(user: User): string {
  return user.name;
}

// ✅ API路由正确示例
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 实现逻辑
}
```

### 3. Prisma 类型使用规范
- **规则**: 使用 Prisma 生成的类型，避免手动定义数据库模型类型
- **导入**: 从 `@prisma/client` 导入所需的类型和枚举

```typescript
// ✅ 正确
import { User, Role, WorkStatus } from '@prisma/client';

// 使用 Prisma 生成的类型
const createUser = async (userData: Prisma.UserCreateInput): Promise<User> => {
  return await prisma.user.create({ data: userData });
};
```

## Next.js 15 兼容性规则

### 1. 动态路由参数处理
- **规则**: Next.js 15 中动态路由的 params 参数是 Promise 类型
- **必须**: 使用 await 访问 params 参数

```typescript
// ❌ Next.js 14 写法（已过时）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
}

// ✅ Next.js 15 正确写法
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

### 2. 认证中间件函数签名
- **规则**: withAuth 函数必须兼容静态路由和动态路由
- **实现**: context 参数设为可选

```typescript
// ✅ 正确的 withAuth 函数定义
export function withAuth<T extends Record<string, string | string[]>>(
  handler: (
    request: NextRequest,
    context?: { params: Promise<T> }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<T> }
  ): Promise<NextResponse> => {
    // 认证逻辑
    return handler(request, context);
  };
}
```

## 数据验证和错误处理规则

### 1. 输入验证
- **规则**: 所有用户输入必须进行类型验证和格式验证
- **工具**: 使用 Zod 或类似的验证库

```typescript
import { z } from 'zod';

// ✅ 定义验证模式
const UserCreateSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(8, '密码至少8位'),
  name: z.string().min(1, '姓名不能为空'),
  phone: z.string().regex(/^[1-9]\d{10}$/, '请输入有效的11位手机号')
});

// ✅ 使用验证
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UserCreateSchema.parse(body);
    // 处理验证通过的数据
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '输入数据无效', details: error.errors },
        { status: 400 }
      );
    }
  }
}
```

### 2. 错误处理标准
- **规则**: 所有API错误响应必须使用统一的JSON格式
- **格式**: 统一的错误响应结构，便于前端解析
- **日志**: 记录详细错误信息用于调试

#### 标准错误响应格式
```typescript
// 错误响应接口定义
interface ApiErrorResponse {
  success: false;
  error: string;           // 用户友好的错误信息
  code?: string;          // 错误代码（可选）
  details?: any;          // 详细错误信息（可选，开发环境使用）
  timestamp?: string;     // 错误时间戳（可选）
}

// 成功响应接口定义
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;       // 成功信息（可选）
}

type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
```

#### 错误处理实现示例
```typescript
// ✅ 标准错误处理
try {
  // 业务逻辑
  const result = await someOperation();
  
  // 成功响应
  return NextResponse.json({
    success: true,
    data: result,
    message: '操作成功'
  }, { status: 200 });
  
} catch (error) {
  console.error('API错误:', error);
  
  // 输入验证错误
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: '输入数据无效',
      code: 'VALIDATION_ERROR',
      details: error.errors
    }, { status: 400 });
  }
  
  // 数据库错误
  if (error instanceof PrismaClientKnownRequestError) {
    return NextResponse.json({
      success: false,
      error: '数据库操作失败',
      code: 'DATABASE_ERROR'
    }, { status: 500 });
  }
  
  // 权限错误
  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json({
      success: false,
      error: '未授权访问',
      code: 'UNAUTHORIZED'
    }, { status: 401 });
  }
  
  // 资源不存在
  if (error.message === 'NOT_FOUND') {
    return NextResponse.json({
      success: false,
      error: '资源不存在',
      code: 'NOT_FOUND'
    }, { status: 404 });
  }
  
  // 通用服务器错误
  return NextResponse.json({
    success: false,
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  }, { status: 500 });
}
```

#### 常见HTTP状态码和错误格式
```typescript
// 400 - 请求参数错误
return NextResponse.json({
  success: false,
  error: '请求参数无效',
  code: 'BAD_REQUEST',
  details: validationErrors
}, { status: 400 });

// 401 - 未认证
return NextResponse.json({
  success: false,
  error: '请先登录',
  code: 'UNAUTHORIZED'
}, { status: 401 });

// 403 - 权限不足
return NextResponse.json({
  success: false,
  error: '权限不足',
  code: 'FORBIDDEN'
}, { status: 403 });

// 404 - 资源不存在
return NextResponse.json({
  success: false,
  error: '资源不存在',
  code: 'NOT_FOUND'
}, { status: 404 });

// 409 - 资源冲突
return NextResponse.json({
  success: false,
  error: '资源已存在',
  code: 'CONFLICT'
}, { status: 409 });

// 422 - 业务逻辑错误
return NextResponse.json({
  success: false,
  error: '业务逻辑错误',
  code: 'UNPROCESSABLE_ENTITY'
}, { status: 422 });

// 500 - 服务器错误
return NextResponse.json({
  success: false,
  error: '服务器内部错误',
  code: 'INTERNAL_ERROR'
}, { status: 500 });
```

#### 前端错误处理示例
```typescript
// 前端API调用和错误处理
async function apiCall(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      // 统一的错误处理
      throw new Error(data.error);
    }
    
    return data.data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}
```

## 代码组织和结构规则

### 1. 文件命名规范
- **API路由**: 使用 `route.ts` 作为文件名
- **组件**: 使用 PascalCase，如 `UserCard.tsx`
- **工具函数**: 使用 kebab-case，如 `auth-utils.ts`
- **类型定义**: 使用 `.d.ts` 后缀

### 2. 导入顺序
```typescript
// 1. React 和 Next.js 相关
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// 2. 第三方库
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// 3. 项目内部模块
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { User, Role } from '@prisma/client';

// 4. 类型定义
import type { ApiResponse } from '@/types/api';
```

### 3. 环境变量管理
- **规则**: 所有环境变量必须在 `.env.example` 中声明
- **类型**: 为环境变量创建类型定义

```typescript
// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
  }
}
```

## 性能和安全规则

### 1. 数据库查询优化
- **规则**: 避免 N+1 查询问题
- **使用**: Prisma 的 include 和 select 优化查询

```typescript
// ❌ 可能导致 N+1 问题
const users = await prisma.user.findMany();
for (const user of users) {
  const works = await prisma.work.findMany({ where: { userId: user.id } });
}

// ✅ 正确的关联查询
const users = await prisma.user.findMany({
  include: {
    works: true
  }
});
```

### 2. 权限检查
- **规则**: 所有需要认证的 API 必须进行权限验证
- **实现**: 使用 withAuth 中间件

```typescript
// ✅ 正确的权限检查
export const DELETE = withAuth(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    // 检查用户权限
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      );
    }
    
    // 执行删除操作
  }
);
```

## 测试规则

### 1. 单元测试
- **规则**: 所有工具函数必须有单元测试
- **覆盖率**: 核心业务逻辑测试覆盖率不低于 80%

### 2. 类型测试
- **规则**: 使用 TypeScript 的类型测试确保类型安全

```typescript
// 类型测试示例
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// 测试 API 响应类型
type TestApiResponse = AssertEqual<
  ApiResponse<User>,
  { data: User; message: string }
>;
```

## 部署前检查清单

- [ ] 运行 `npm run type-check` 确保无类型错误
- [ ] 运行 `npm run lint` 确保代码规范
- [ ] 运行 `npm run build` 确保构建成功
- [ ] 检查所有环境变量已正确配置
- [ ] 确认数据库迁移已执行
- [ ] 验证 API 路由功能正常

## 常见问题和解决方案

### 1. Prisma 类型错误
**问题**: 使用字符串而非枚举类型  
**解决**: 导入并使用 Prisma 生成的枚举类型

### 2. Next.js 15 动态路由错误
**问题**: params 不是 Promise 类型  
**解决**: 使用 `await params` 访问参数

### 3. 认证中间件类型错误
**问题**: 静态路由和动态路由函数签名不一致  
**解决**: 使用可选的 context 参数

---

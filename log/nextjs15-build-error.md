# Next.js 15 构建错误问题总结

## 问题描述
在运行 `npm run build` 时出现错误：
- `/auth/signin` 页面：`useSearchParams()` 未被 `Suspense` 边界包裹
- `/upload` 页面：同样的 `useSearchParams()` 问题
- 多个 React Hook `useEffect` 的依赖警告

## 错误原因
Next.js 15 要求在预渲染时使用 `useSearchParams()` 必须被 `Suspense` 边界包裹。

## 解决方案

### 1. 修复 signin 页面
```tsx
// 提取使用 useSearchParams 的逻辑到单独组件
function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  // ... 其他逻辑
}

// 主页面组件用 Suspense 包裹
export default function SignInPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <SignInForm />
    </Suspense>
  );
}
```

### 2. 修复 upload 页面
```tsx
// 同样的模式
function UploadForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  // ... 其他逻辑
}

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UploadForm />
    </Suspense>
  );
}
```

## 技术要点
- 将使用 `useSearchParams` 的逻辑提取到子组件
- 用 `Suspense` 包裹子组件
- 提供合适的 fallback 加载状态

## 状态
🔄 进行中（upload 页面待修复）
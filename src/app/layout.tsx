// 顶部 import：删除 ErrorBoundary 引入
// 该文件的 module 作用域
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SessionWrapper from '@/components/SessionWrapper';
import { Toaster } from 'react-hot-toast';

// 删除以下整段（如果仍然存在的话）
// export const metadata: Metadata = {
//   title: 'Qcoder AI Coding 作品秀',
//   description: 'Qcoder AI Coding 作品秀',
// };

// 回退标题（与站点默认标题一致）
const DEFAULT_TITLE = 'Qcoder AI Coding 作品秀';

type PlatformConfigResponse = {
  success: boolean;
  data?: { title: string };
};

// 动态生成页面标题：优先使用平台配置的标题，失败则回退为 DEFAULT_TITLE
export async function generateMetadata(): Promise<Metadata> {
  try {
    const h = await headers(); // 这里加上 await，修复“Promise 上不存在 get”的错误
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';

    // 优先用请求头拼出来的 origin，无法获取时降级到环境变量或本地默认
    const envOrigin = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_ORIGIN;
    const origin = host ? `${proto}://${host}` : envOrigin ?? 'http://localhost:3000';

    try {
      const res = await fetch(`${origin}/api/platform-config`, { cache: 'no-store' });
      if (res.ok) {
        const json: { success: boolean; data?: { title?: string } } = await res.json();
        const titleFromConfig = json?.data?.title;
        return { title: titleFromConfig || DEFAULT_TITLE };
      }
    } catch (err) {
      console.error('加载平台标题失败:', err);
    }

    // 兜底标题
    return { title: DEFAULT_TITLE };
  } catch {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_TITLE,
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* 移除了 <ErrorBoundary> 顶层包裹 */}
        <SessionWrapper>
          <ThemeProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                },
              }}
            />
          </ThemeProvider>
        </SessionWrapper>
        {/* 移除了 </ErrorBoundary> */}
      </body>
    </html>
  );
}
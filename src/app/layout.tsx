import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SessionWrapper from '@/components/SessionWrapper';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: '数字化作品互动展示平台',
  description: '展示和管理数字化作品的互动平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
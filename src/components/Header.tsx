'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import OnlineCounter from './OnlineCounter';

// 平台配置 - 便于后续修改
const PLATFORM_CONFIG = {
  name: 'Qoder和通义灵码 AI Coding 作品秀',
  homeUrl: '/'
};

interface HeaderProps {
  pageTitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backText?: string;
}

export default function Header({ 
  pageTitle, 
  showBackButton = false, 
  backUrl = '/', 
  backText = '返回首页' 
}: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handlePlatformNameClick = () => {
    router.push(PLATFORM_CONFIG.homeUrl);
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleAuthClick = () => {
    if (session) {
      window.location.href = '/api/auth/signout';
    } else {
      router.push('/auth/signin?callbackUrl=/');
    }
  };

  const handleUploadClick = () => {
    router.push('/upload');
  };

  const handleAdminClick = () => {
    router.push('/admin');
  };

  return (
    <>
      {/* 主导航栏 */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧：平台名称和页面标题 */}
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <button
                  onClick={() => router.push(backUrl)}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>{backText}</span>
                </button>
              )}
              
              <button
                onClick={handlePlatformNameClick}
                className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
              >
                {PLATFORM_CONFIG.name}
              </button>
              
              {pageTitle && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {pageTitle}
                  </h1>
                </>
              )}
            </div>

            {/* 右侧：导航和用户操作 */}
            <div className="flex items-center space-x-4">
              {/* 隐藏主题切换和登录组件 */}
              {session?.user?.role === 'ADMIN' && (
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  onClick={handleAdminClick}
                >
                  管理后台
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* 在线人数大横幅 - 紧接着顶栏 */}
      <OnlineCounter />
    </>
  );
}

// 导出平台配置，便于其他组件使用
export { PLATFORM_CONFIG };
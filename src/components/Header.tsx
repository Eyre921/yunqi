'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

// 平台配置 - 便于后续修改
const PLATFORM_CONFIG = {
  name: '数字化作品展示平台',
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
            <ThemeToggle />
            
            {session ? (
              <div className="flex items-center space-x-4">
                {/* 上传按钮 */}
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  onClick={handleUploadClick}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>上传作品</span>
                </button>
                
                {/* 个人中心 */}
                <button 
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={handleProfileClick}
                >
                  个人中心
                </button>
                
                <span className="text-gray-700 dark:text-gray-300">
                  欢迎，{session.user?.name || session.user?.email}
                </span>
                
                {/* 管理后台（仅管理员可见） */}
                {session.user?.role === 'ADMIN' && (
                  <button 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    onClick={handleAdminClick}
                  >
                    管理后台
                  </button>
                )}
                
                {/* 退出登录 */}
                <button 
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  onClick={handleAuthClick}
                >
                  退出登录
                </button>
              </div>
            ) : (
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                onClick={handleAuthClick}
              >
                注册/登录
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// 导出平台配置，便于其他组件使用
export { PLATFORM_CONFIG };
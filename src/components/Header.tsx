'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import OnlineCounter from './OnlineCounter';

// 平台配置 - 便于后续修改
const PLATFORM_CONFIG = {
  name: 'Qcoder和通义灵码 AI Coding 作品秀',
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
  const [platformTitle, setPlatformTitle] = useState(PLATFORM_CONFIG.name);

  // 获取动态平台标题
  useEffect(() => {
    const fetchPlatformConfig = async () => {
      try {
        const response = await fetch('/api/platform-config');
        const data = await response.json();
        if (data.success) {
          setPlatformTitle(data.data.title);
        }
      } catch (error) {
        console.error('获取平台配置失败:', error);
        // 保持默认标题
      }
    };

    fetchPlatformConfig();
  }, []);

  const handlePlatformNameClick = () => {
    window.location.href = 'https://qoder.com/download';
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
      {/* 主标题和在线人数横幅 - 作为主要导航区域 */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-6 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* 主标题、页面标题和在线人数 */}
          <div className="flex justify-between items-center">
            {/* 左侧：主标题和页面标题 */}
            <div className="flex items-center space-x-4">
              <h1 
                className="text-xl md:text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handlePlatformNameClick}
              >
                {platformTitle}
              </h1>
              
              {pageTitle && (
                <>
                  <span className="text-white/60">|</span>
                  <h2 className="text-lg md:text-xl font-semibold text-white/90">
                    {pageTitle}
                  </h2>
                </>
              )}
            </div>
            
            {/* 右侧：在线人数 */}
            <div>
              <OnlineCounter />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// 导出平台配置，便于其他组件使用
export { PLATFORM_CONFIG };
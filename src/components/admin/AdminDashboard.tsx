'use client';

import { useState } from 'react';
import { AdminStats } from './AdminStats';
import { WorksManagement } from './WorksManagement';
import { UsersManagement } from './UsersManagement';
import UploadConfigManagement from './UploadConfigManagement';
import ThemeToggle from '@/components/ThemeToggle';
import { signOut } from 'next-auth/react';

type TabType = 'stats' | 'works' | 'users' | 'upload-config';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');

  const tabs = [
    { id: 'stats' as TabType, name: '统计面板', icon: '📊' },
    { id: 'works' as TabType, name: '作品管理', icon: '🎨' },
    { id: 'users' as TabType, name: '用户管理', icon: '👥' },
    { id: 'upload-config' as TabType, name: '上传配置', icon: '⚙️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <AdminStats />;
      case 'works':
        return <WorksManagement />;
      case 'users':
        return <UsersManagement />;
      case 'upload-config':
        return <UploadConfigManagement />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                管理员后台
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签页导航 */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
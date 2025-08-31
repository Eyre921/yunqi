'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import WorkCard from '@/components/WorkCard';
import WorkMarquee from '@/components/WorkMarquee';
import WorkModal from '@/components/WorkModal';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useApi } from '@/hooks/useApi';
import { Work } from '@prisma/client';

// 扩展 Work 类型以包含用户信息
type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

// 上传配置类型
type UploadConfig = {
  id: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  maxUploadsPerUser: number;
  maxFileSize: number;
  allowedFormats: string[];
  announcement: string | null;
  createdAt: string;
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const [works, setWorks] = useState<WorkWithUser[]>([]);
  const [selectedWork, setSelectedWork] = useState<WorkWithUser | null>(null);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isAnnouncementClosed, setIsAnnouncementClosed] = useState(false);
  const { data, loading, error, execute } = useApi<WorkWithUser[]>();

  useEffect(() => {
    fetchWorks();
    fetchUploadConfig();
  }, []);

  useEffect(() => {
    if (data) {
      setWorks(data);
    }
  }, [data]);

  const fetchWorks = async () => {
    await execute('/api/works');
  };

  const fetchUploadConfig = async () => {
    try {
      const response = await fetch('/api/admin/upload-config');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUploadConfig(result.data);
        }
      }
    } catch (err) {
      console.error('获取上传配置失败:', err);
    }
  };

  const getUploadButtonStatus = () => {
    if (!uploadConfig) {
      return { disabled: true, text: '加载中...', reason: '正在加载配置' };
    }

    if (!uploadConfig.isEnabled) {
      return { disabled: true, text: '上传已关闭', reason: '管理员已关闭上传功能' };
    }

    const now = new Date();
    const startTime = uploadConfig.startTime ? new Date(uploadConfig.startTime) : null;
    const endTime = uploadConfig.endTime ? new Date(uploadConfig.endTime) : null;

    if (startTime && now < startTime) {
      return { 
        disabled: true, 
        text: '上传未开始', 
        reason: `上传将于 ${startTime.toLocaleString()} 开始` 
      };
    }

    if (endTime && now > endTime) {
      return { 
        disabled: true, 
        text: '上传已结束', 
        reason: `上传已于 ${endTime.toLocaleString()} 结束` 
      };
    }

    return { disabled: false, text: '上传作品', reason: null };
  };

  const handleUploadClick = () => {
    const status = getUploadButtonStatus();
    if (status.disabled) {
      alert(status.reason || '当前无法上传作品');
      return;
    }
    
    // 跳转到上传页面或打开上传模态框
    window.location.href = '/upload';
  };

  const handleWorkClick = (work: WorkWithUser) => {
    setSelectedWork(work);
  };

  const handleCloseModal = () => {
    setSelectedWork(null);
  };

  const handleLike = async (workId: string) => {
    try {
      const response = await fetch(`/api/works/${workId}/like`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('点赞失败');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setWorks(prev => prev.map(work => 
          work.id === workId 
            ? { ...work, likeCount: work.likeCount + 1 }
            : work
        ));
      }
    } catch (err) {
      console.error('点赞失败:', err);
      // 这里可以添加用户友好的错误提示
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="lg" text="正在加载作品..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <ErrorMessage 
          message={error} 
          onRetry={fetchWorks}
          className="max-w-md"
        />
      </div>
    );
  }

  const uploadButtonStatus = getUploadButtonStatus();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* 头部导航 */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold gradient-text">
                  数字化作品展示平台
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                {session ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative group">
                      <button 
                        className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          uploadButtonStatus.disabled
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        onClick={handleUploadClick}
                        disabled={uploadButtonStatus.disabled}
                        title={uploadButtonStatus.reason || undefined}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>{uploadButtonStatus.text}</span>
                      </button>
                      {uploadButtonStatus.disabled && uploadButtonStatus.reason && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                          {uploadButtonStatus.reason}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-gray-700 dark:text-gray-300">
                      欢迎，{session.user?.name || session.user?.email}
                    </span>
                    {session.user?.role === 'ADMIN' && (
                      <button 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        onClick={() => {
                          window.location.href = '/admin';
                        }}
                      >
                        管理后台
                      </button>
                    )}
                    <button 
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                      onClick={() => {
                        window.location.href = '/api/auth/signout';
                      }}
                    >
                      退出登录
                    </button>
                  </div>
                ) : (
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    onClick={() => {
                      window.location.href = '/auth/signin?callbackUrl=/';
                    }}
                  >
                    登录
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 公告展示区域 - 在标题下方单独一行 */}
        {uploadConfig?.announcement && !isAnnouncementClosed && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-amber-600 dark:text-amber-400">📢</span>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 transition-colors text-left flex-1 truncate"
                  >
                    <span className="font-medium">公告：</span>
                    <span className="ml-1">{uploadConfig.announcement}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    title="查看详情"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsAnnouncementClosed(true)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    title="关闭公告"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主要内容 */}
        <main className="relative">
          {/* 作品轮播 */}
          {works.length > 0 && (
            <section className="py-8">
              <WorkMarquee works={works} onWorkClick={handleWorkClick} />
            </section>
          )}

          {/* 作品网格 */}
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                精选作品
              </h2>
              
              {works.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    暂无作品展示
                  </p>
                </div>
              ) : (
                <div className="responsive-grid">
                  {works.map((work) => (
                    <WorkCard
                      key={work.id}
                      work={work}
                      onClick={() => handleWorkClick(work)}
                      onLike={() => handleLike(work.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* 公告详情模态框 */}
        {showAnnouncementModal && uploadConfig?.announcement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <span className="text-amber-500 mr-2">📢</span>
                  平台公告
                </h3>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {uploadConfig.announcement}
                  </p>
                </div>
              </div>
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 作品详情模态框 */}
        {selectedWork && (
          <WorkModal
            work={selectedWork}
            isOpen={!!selectedWork}
            onClose={handleCloseModal}
            onLike={() => handleLike(selectedWork.id)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
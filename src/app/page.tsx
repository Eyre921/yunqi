'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import WorkCard from '@/components/WorkCard';
import WorkMarquee from '@/components/WorkMarquee';
import InfiniteScrollWorks from '@/components/InfiniteScrollWorks';
import WorkModal from '@/components/WorkModal';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ErrorBoundary from '@/components/ErrorBoundary';
// import OnlineCounter from '@/components/OnlineCounter'; // 新增导入
import { useApi } from '@/hooks/useApi';
import type { WorkWithUser, UploadConfig } from '@/types/work';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [latestWorks, setLatestWorks] = useState<WorkWithUser[]>([]);
  const [selectedWork, setSelectedWork] = useState<WorkWithUser | null>(null);
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isAnnouncementClosed, setIsAnnouncementClosed] = useState(false);
  const [hotWorksRefreshTrigger, setHotWorksRefreshTrigger] = useState(0);
  const { data, loading, error, execute } = useApi<WorkWithUser[]>();

  useEffect(() => {
    fetchLatestWorks();
    fetchUploadConfig();
    
    // 设置最新作品自动刷新 - 每3分钟
    const latestWorksInterval = setInterval(() => {
      fetchLatestWorks();
    }, 3 * 60 * 1000); // 3分钟
    
    // 设置热门作品自动刷新 - 每10分钟
    const hotWorksInterval = setInterval(() => {
      setHotWorksRefreshTrigger(prev => prev + 1);
    }, 10 * 60 * 1000); // 10分钟
    
    return () => {
      clearInterval(latestWorksInterval);
      clearInterval(hotWorksInterval);
    };
  }, []);

  useEffect(() => {
    if (data) {
      setLatestWorks(data);
    }
  }, [data]);

  const fetchLatestWorks = async () => {
    // 明确指定获取最新作品，按审核时间排序
    await execute('/api/works?limit=20&status=APPROVED&sortBy=latest');
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

  const handleWorkUpdate = (updatedWork: WorkWithUser) => {
    // 更新最新作品列表中的作品数据
    setLatestWorks(prev => prev.map(work => 
      work.id === updatedWork.id ? updatedWork : work
    ));
    
    // 更新当前选中的作品
    if (selectedWork && selectedWork.id === updatedWork.id) {
      setSelectedWork(updatedWork);
    }
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
        // 使用后端返回的实际点赞数，确保前后端一致
        setLatestWorks(prev => prev.map(work => 
          work.id === workId 
            ? { ...work, likeCount: result.data.likeCount }
            : work
        ));
        
        // 显示点赞成功提示
        const increment = result.data.increment;
        let message;
        if (increment >= 8) {
          message = `哇！获得了 ${increment} 个赞！作品太棒了！🎉`;
        } else if (increment >= 5) {
          message = `太好了！获得了 ${increment} 个赞！❤️`;
        } else {
          message = `点赞成功！+${increment} 👍`;
        }
        console.log(message); // 或者使用toast组件显示
      }
    } catch (err) {
      console.error('点赞失败:', err);
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
          onRetry={fetchLatestWorks}
          className="max-w-md"
        />
      </div>
    );
  }

  const uploadButtonStatus = getUploadButtonStatus();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* 使用统一的顶栏组件 */}
        <Header />
        
        {/* 移除原来的在线人数计数器位置 */}
        
        {/* 主要内容区域 */}
        
        {/* 最新作品轮播 - 突破容器限制，占满整个页面宽度 */}
        {latestWorks.length > 0 && (
          <section className="py-4">
            {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                🔥 最新作品
              </h2>
            </div> */}
            {/* 跑马灯容器不受宽度限制 */}
            <div className="w-full">
              <WorkMarquee works={latestWorks} onWorkClick={handleWorkClick} />
            </div>
          </section>
        )}

        {/* 主要内容区域 */}
        {/* <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <section className="py-4">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                ⭐ 热门作品
              </h2>                                                                                                                                                                                                                                                                                                                                                                                               
            </div>
          </section>
        </main> */}
        
        {/* 热门作品区域移到main外面，占满页面宽度 */}
        <section className="w-full">
          <InfiniteScrollWorks 
            onWorkClick={handleWorkClick}
            worksPerRow={8}
            refreshTrigger={hotWorksRefreshTrigger}
          />
        </section>
        
        {/* 作品详情模态框 */}
        <WorkModal
          work={selectedWork}
          isOpen={!!selectedWork}
          onClose={handleCloseModal}
          onLike={() => selectedWork && handleLike(selectedWork.id)}
          onWorkUpdate={handleWorkUpdate}
        />
        
        {/* 悬浮上传按钮 */}
        <button
          onClick={handleUploadClick}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-3 z-50 font-semibold text-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>上传作品</span>
        </button>
      </div>
    </ErrorBoundary>
  );
}
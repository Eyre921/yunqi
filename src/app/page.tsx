'use client';

import { useEffect, useState } from 'react';
import WorkMarquee from '@/components/WorkMarquee';
import WorkModal from '@/components/WorkModal';
import { Work } from '@prisma/client';

type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function HomePage() {
  const [latestWorks, setLatestWorks] = useState<WorkWithUser[]>([]);
  const [popularWorks, setPopularWorks] = useState<WorkWithUser[]>([]);
  const [selectedWork, setSelectedWork] = useState<WorkWithUser | null>(null);
  const [onlineCount, setOnlineCount] = useState(1024);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 模拟在线人数变化
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 10) - 4; // -4 到 +5 的变化
        return Math.max(800, prev + change); // 最少保持800人在线
      });
    }, 15000); // 每15秒更新一次
    
    return () => clearInterval(interval);
  }, []);
  
  // 获取作品数据
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取最新作品
        const worksResponse = await fetch('/api/works?status=APPROVED&limit=20');
        if (!worksResponse.ok) {
          throw new Error('获取作品数据失败');
        }
        
        const worksData = await worksResponse.json();
        const works = worksData.works || [];
        
        // 分配作品到不同的展示区域
        setLatestWorks(works.slice(0, 10));
        setPopularWorks(works.slice(5, 25)); // 取一部分重叠，模拟热门作品
        
      } catch (error) {
        console.error('获取作品数据失败:', error);
        setError(error instanceof Error ? error.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorks();
  }, []);
  
  // 将热门作品分成多行
  const popularRows = [];
  const worksPerRow = 8;
  for (let i = 0; i < popularWorks.length; i += worksPerRow) {
    popularRows.push(popularWorks.slice(i, i + worksPerRow));
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">加载失败</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* 头部 */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎨 云栖数字作品展示平台
              </h1>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>在线 {onlineCount.toLocaleString()} 人</span>
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                上传作品
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* 主内容 */}
      <main className="space-y-12 py-8">
        {/* 最新作品区域 */}
        {latestWorks.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                🔥 最新作品
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                发现最新的创意灵感
              </p>
            </div>
            <WorkMarquee 
              works={latestWorks} 
              onWorkClick={setSelectedWork}
              direction="left"
              speed={25}
            />
          </section>
        )}
        
        {/* 热门作品区域 */}
        {popularRows.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                ⭐ 热门作品
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                社区最受欢迎的精选作品
              </p>
            </div>
            
            {popularRows.map((rowWorks, index) => (
              <div key={index} className="mb-8">
                <WorkMarquee 
                  works={rowWorks} 
                  onWorkClick={setSelectedWork}
                  direction={index % 2 === 0 ? 'left' : 'right'}
                  speed={30 + index * 2}
                />
              </div>
            ))}
          </section>
        )}
        
        {/* 空状态 */}
        {latestWorks.length === 0 && popularWorks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-4">🎨</div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              暂无作品
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              成为第一个分享创意的人吧！
            </p>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg">
              上传第一个作品
            </button>
          </div>
        )}
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>© 2025 云栖数字作品展示平台 - 让创意无界流动</p>
          </div>
        </div>
      </footer>
      
      {/* 作品详情弹窗 */}
      <WorkModal
        work={selectedWork}
        isOpen={!!selectedWork}
        onClose={() => setSelectedWork(null)}
      />
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import WorkMarquee from './WorkMarquee';
import LoadingSpinner from './LoadingSpinner';
import type { WorkWithUser, InfiniteScrollWorksProps } from '@/types/work';

export default function InfiniteScrollWorks({ 
  onWorkClick, 
  worksPerRow = 8,
  refreshTrigger = 0,
  onNewContent
}: InfiniteScrollWorksProps) {
  const [allWorks, setAllWorks] = useState<WorkWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // 使用ref来避免闭包问题
  const loadingRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const currentPageRef = useRef(1);
  
  // 同步状态到ref
  useEffect(() => {
    isLoadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  // 严格按照顺序将作品分组为行，保持原始顺序
  const workRows: WorkWithUser[][] = [];
  for (let i = 0; i < allWorks.length; i += worksPerRow) {
    const row = allWorks.slice(i, i + worksPerRow);
    workRows.push(row);
  }

  // 加载作品数据 - 移除useCallback避免依赖问题
  const loadWorks = async (pageNum: number, isRefresh = false) => {
    // 防止重复加载
    if (isLoadingRef.current) {
      console.log('正在加载中，跳过请求');
      return;
    }
    
    // 防止无效请求
    if (!isRefresh && !hasMoreRef.current && pageNum > 1) {
      console.log('没有更多数据，跳过请求', { pageNum, hasMore: hasMoreRef.current });
      return;
    }
    
    console.log('开始加载第', pageNum, '页');
    setLoading(true);
    setError(null);
    
    try {
      const pageSize = 24;
      const response = await fetch(`/api/works?page=${pageNum}&limit=${pageSize}&status=APPROVED&sortBy=popular`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '加载失败');
      }
      
      const newWorks = result.data.works || [];
      console.log(`第${pageNum}页加载完成，获得${newWorks.length}个作品`);
      
      if (pageNum === 1) {
        setAllWorks(newWorks);
      } else {
        setAllWorks(prev => [...prev, ...newWorks]);
      }
      
      // 更新hasMore状态
      if (result.data.pagination) {
        const hasMoreData = pageNum < result.data.pagination.pages && newWorks.length > 0;
        console.log(`分页信息: ${pageNum}/${result.data.pagination.pages}页，hasMore=${hasMoreData}`);
        setHasMore(hasMoreData);
      } else {
        const hasMoreData = newWorks.length === pageSize;
        setHasMore(hasMoreData);
      }
      
      // 通知父组件有新内容
      if (onNewContent && newWorks.length > 0) {
        onNewContent(newWorks.length);
      }
      
    } catch (err) {
      console.error('加载作品失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 手动加载下一页
  const handleManualLoad = () => {
    if (!isLoadingRef.current && hasMoreRef.current) {
      const nextPage = currentPageRef.current + 1;
      console.log('手动触发加载第', nextPage, '页');
      setPage(nextPage);
      loadWorks(nextPage);
    }
  };

  // 初始加载
  useEffect(() => {
    loadWorks(1);
  }, []);
  
  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('刷新触发，重新加载数据');
      setPage(1);
      setHasMore(true);
      loadWorks(1, true);
    }
  }, [refreshTrigger]);

  // 设置IntersectionObserver
  useEffect(() => {
    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // 检查浏览器支持
    if (!window.IntersectionObserver) {
      console.warn('浏览器不支持IntersectionObserver');
      return;
    }

    // 只有在有更多数据且元素存在时才创建观察器
    if (!hasMore || !loadingRef.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          const nextPage = currentPageRef.current + 1;
          console.log('自动加载第', nextPage, '页');
          setPage(nextPage);
          loadWorks(nextPage);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // 增加边距提高触发概率
      }
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, allWorks.length]); // 依赖hasMore和作品数量变化

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (allWorks.length === 0 && loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="正在加载热门作品..." />
      </div>
    );
  }

  if (allWorks.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎨</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          暂无热门作品
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {workRows.map((rowWorks, rowIndex) => {
        const globalStartIndex = rowIndex * worksPerRow;
        
        return (
          <div key={`row-${rowIndex}`} className="relative">
            <WorkMarquee 
              works={rowWorks} 
              onWorkClick={onWorkClick}
              direction={rowIndex % 2 === 0 ? 'left' : 'right'}
              speed={25 + (rowIndex % 3) * 5}
            />
          </div>
        );
      })}
      
      {/* 加载更多指示器 */}
      {hasMore && (
        <div 
          ref={loadingRef} 
          className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 rounded-lg"
        >
          {loading ? (
            <LoadingSpinner size="md" text="加载更多作品..." />
          ) : (
            <>
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                滚动查看更多作品
              </div>
              <button 
                onClick={handleManualLoad}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                手动加载更多
              </button>
            </>
          )}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={() => loadWorks(currentPageRef.current)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      )}
      
      {/* 到底提示 */}
      {!hasMore && allWorks.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            🎉 所有热门作品已加载完毕 (共 {allWorks.length} 个作品)
          </div>
        </div>
      )}
    </div>
  );
}
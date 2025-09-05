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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const lastRefreshTime = useRef<number>(0);
  const lastLoadTime = useRef<number>(0);
  const refreshDebounceTime = 5000; // 5秒防抖间隔
  const loadDebounceTime = 1000; // 1秒加载防抖间隔

  // 严格按照顺序将作品分组为行，保持原始顺序
  const workRows: WorkWithUser[][] = [];
  for (let i = 0; i < allWorks.length; i += worksPerRow) {
    const row = allWorks.slice(i, i + worksPerRow);
    workRows.push(row);
  }

  // 加载作品数据
  const loadWorks = useCallback(async (pageNum: number, isRefresh: boolean = false, isSeamlessRefresh: boolean = false) => {
    if (loading) return;
    
    // 只对刷新操作进行防抖，正常滚动加载不防抖
    if (isRefresh) {
      const now = Date.now();
      if (now - lastLoadTime.current < loadDebounceTime) {
        console.log('刷新请求被防抖跳过，调用过于频繁');
        return;
      }
      lastLoadTime.current = now;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 明确指定获取热门作品，按点赞数排序
      const response = await fetch(`/api/works?page=${pageNum}&limit=${worksPerRow * 3}&status=APPROVED&sortBy=popular`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '加载失败');
      }
      
      const newWorks = result.data || [];
      
      if (pageNum === 1) {
        if (isSeamlessRefresh) {
          // 无缝刷新：智能合并数据
          setAllWorks(prev => {
            // 创建一个Map来快速查找现有作品
            const existingWorksMap = new Map(prev.map((work: WorkWithUser) => [work.id, work]));
            
            // 更新现有作品的数据（如点赞数等可能变化的字段）
            const updatedWorks = prev.map((work: WorkWithUser) => {
              const updatedWork = newWorks.find((newWork: WorkWithUser) => newWork.id === work.id);
              return updatedWork || work;
            });
            
            // 找出真正的新作品（不在现有列表中的）
            const reallyNewWorks = newWorks.filter((work: WorkWithUser) => !existingWorksMap.has(work.id));
            
            // 如果有新作品，将它们添加到适当位置
             if (reallyNewWorks.length > 0) {
               // 通知父组件有新内容
               onNewContent?.(reallyNewWorks.length);
               
               // 对于热门作品，新作品可能需要根据点赞数插入到合适位置
               // 这里简化处理：将新作品添加到开头，然后重新排序
               const allCombinedWorks = [...reallyNewWorks, ...updatedWorks];
               // 按点赞数重新排序，保持热门作品的正确顺序
               return allCombinedWorks.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
             }
            
            return updatedWorks;
          });
        } else {
          // 首次加载或普通刷新，直接设置
          setAllWorks(newWorks);
        }
      } else {
        // 后续加载，严格按照顺序追加到末尾
        setAllWorks(prev => [...prev, ...newWorks]);
      }
      
      // 检查是否还有更多数据
      setHasMore(newWorks.length === worksPerRow * 3);
      
    } catch (err) {
      console.error('加载作品失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [worksPerRow, onNewContent]); // 添加onNewContent依赖

  // 初始加载
  useEffect(() => {
    loadWorks(1);
  }, [loadWorks]);
  
  // 监听刷新触发器，重新加载数据
  useEffect(() => {
    if (refreshTrigger > 0) {
      setPage(1);
      setHasMore(true);
      loadWorks(1, true, true); // 传递isRefresh=true和isSeamlessRefresh=true
    }
  }, [refreshTrigger, loadWorks]);

  // 设置无限滚动观察器
  useEffect(() => {
    if (loading || !hasMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadWorks(nextPage);
            return nextPage;
          });
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore]); // 移除loadWorks依赖，避免频繁重创建观察器

  // 当loadWorks函数变化时，重新设置观察器
  useEffect(() => {
    if (observerRef.current && loadingRef.current && !loading && hasMore) {
      observerRef.current.disconnect();
      observerRef.current.observe(loadingRef.current);
    }
  }, [loadWorks, loading, hasMore]);

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
        // 计算当前行在全局的起始位置
        const globalStartIndex = rowIndex * worksPerRow;
        
        return (
          <div key={`row-${rowIndex}`} className="relative">
            {/* 行标题显示全局顺序信息 - 保持居中但不限制宽度 */}
            {/* <div className="text-center mb-4 px-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                第 {rowIndex + 1} 行 (作品 {globalStartIndex + 1}-{globalStartIndex + rowWorks.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                严格按照数据库顺序排列
              </p>
            </div> */}
            
            {/* 跑马灯展示，保持作品在行内的顺序 */}
            <WorkMarquee 
              works={rowWorks} 
              onWorkClick={onWorkClick}
              direction={rowIndex % 2 === 0 ? 'left' : 'right'} // 交替方向
              speed={25 + (rowIndex % 3) * 5} // 不同速度
            />
          </div>
        );
      })}
      
      {/* 加载更多指示器 */}
      {hasMore && (
        <div 
          ref={loadingRef} 
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            <LoadingSpinner size="md" text="加载更多作品..." />
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              滚动查看更多作品
            </div>
          )}
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={() => loadWorks(page)}
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
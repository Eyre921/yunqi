'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

// 保持接口定义不变
interface ApiStatsResponse {
  overview: {
    totalUsers: number;
    totalWorks: number;
    pendingWorks: number;
    approvedWorks: number;
    rejectedWorks: number;
    recentUsers: number;
    recentWorks: number;
  };
  charts: {
    dailyWorks: Array<{ date: Date; count: number; type: string }>;
    dailyUsers: Array<{ date: Date; count: number; type: string }>;
  };
  lists: {
    popularWorks: any[];
    activeUsers: any[];
  };
}

export function AdminStats() {
  const [stats, setStats] = useState<ApiStatsResponse | null>(null);
  const { loading, error, execute } = useApi<ApiStatsResponse>();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await execute('/api/admin/stats');
      if (response?.success && response.data) {
        // 修复：直接使用 response.data，而不是 response.data.data
        setStats(response.data);
      } else {
        // 添加错误处理，确保 stats 不会是 undefined
        setStats(null);
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
      setStats(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={loadStats} />
      </div>
    );
  }

  // 添加更安全的检查
  if (!stats || !stats.overview) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        暂无统计数据
      </div>
    );
  }

  // 使用实际的API数据结构
  const statCards = [
    {
      title: '总作品数',
      value: stats.overview.totalWorks,
      icon: '🎨',
      color: 'bg-blue-500'
    },
    {
      title: '待审核',
      value: stats.overview.pendingWorks,
      icon: '⏳',
      color: 'bg-yellow-500'
    },
    {
      title: '已通过',
      value: stats.overview.approvedWorks,
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      title: '已拒绝',
      value: stats.overview.rejectedWorks,
      icon: '❌',
      color: 'bg-red-500'
    },
    {
      title: '总用户数',
      value: stats.overview.totalUsers,
      icon: '👥',
      color: 'bg-purple-500'
    },
    {
      title: '最近用户',
      value: stats.overview.recentUsers,
      icon: '👑',
      color: 'bg-indigo-500'
    },
    {
      title: '最近作品',
      value: stats.overview.recentWorks,
      icon: '📈',
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          数据统计
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          平台整体运营数据概览
        </p>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`${card.color} rounded-full p-3 text-white text-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 今日数据 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">最近数据</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.overview.recentWorks}</p>
            <p className="text-blue-100">最近7天新作品</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.overview.recentUsers}</p>
            <p className="text-blue-100">最近7天新用户</p>
          </div>
        </div>
      </div>
    </div>
  );
}
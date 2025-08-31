'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { Work, WorkStatus } from '@prisma/client';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';

type WorkWithUser = Work & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface WorksResponse {
  works: WorkWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortBy = 'createdAt' | 'approvedAt' | 'likeCount' | 'viewCount';
type SortOrder = 'asc' | 'desc';

export function WorksManagement() {
  const [works, setWorks] = useState<WorkWithUser[]>([]);
  const [pagination, setPagination] = useState<WorksResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<WorkStatus>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  const { data, loading, error, execute } = useApi<WorksResponse>();

  // 修复 loadWorks 函数中的数据访问
  const loadWorks = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        sortBy,
        sortOrder,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });
      
      const response = await execute(`/api/admin/works?${params}`);
      if (response) {
        setWorks(response.works);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('加载作品列表失败:', err);
    }
  }, [execute, currentPage, statusFilter, debouncedSearchTerm, sortBy, sortOrder]);

  // 更新 useEffect 依赖项
  useEffect(() => {
    loadWorks();
  }, [loadWorks]);

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, debouncedSearchTerm, sortBy, sortOrder]);

  // 处理状态变更
  const handleStatusChange = async (workId: string, newStatus: WorkStatus, rejectReason?: string) => {
    try {
      const response = await fetch(`/api/admin/works/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(rejectReason && { rejectReason })
        }),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      // 重新加载数据
      await loadWorks();
    } catch (err) {
      console.error('更新作品状态失败:', err);
      alert('更新失败，请重试');
    }
  };

  // 状态徽章组件
  const getStatusBadge = (status: WorkStatus) => {
    const statusConfig = {
      PENDING: { text: '待审核', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      APPROVED: { text: '已通过', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      REJECTED: { text: '已拒绝', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 格式化时间到分钟
  const formatDateTime = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && works.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          作品管理
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          审核和管理用户提交的作品
        </p>
      </div>

      {/* 筛选和搜索 */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索作品名称、标题或作者..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
            </select>
          </div>
        </div>
        
        {/* 排序控件 */}
        {statusFilter === 'APPROVED' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序方式
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="createdAt">提交时间</option>
                <option value="approvedAt">审批时间</option>
                <option value="likeCount">点赞量</option>
                <option value="viewCount">浏览量</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序顺序
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={loadWorks} />
        </div>
      )}

      {/* 作品列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {works.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            暂无作品数据
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    作品信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    数据
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    提交时间
                  </th>
                  {statusFilter === 'APPROVED' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      审批时间
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {works.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <Image
                            src={work.imageUrl}
                            alt={work.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {work.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {work.title}
                          </div>
                          {work.description && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs truncate">
                              {work.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {work.author}
                      </div>
                      {work.user && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {work.user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(work.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>👁️ {work.viewCount}</div>
                      <div>❤️ {work.likeCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(work.createdAt)}
                    </td>
                    {statusFilter === 'APPROVED' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {work.approvedAt ? formatDateTime(work.approvedAt) : '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {work.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(work.id, 'APPROVED')}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('请输入拒绝理由:');
                              if (reason) {
                                handleStatusChange(work.id, 'REJECTED', reason);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                      {work.status !== 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(work.id, 'PENDING')}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          重新审核
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            显示第 {(pagination.page - 1) * pagination.limit + 1} 到{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
            共 {pagination.total} 条记录
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              上一页
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              第 {currentPage} 页，共 {pagination.totalPages} 页
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
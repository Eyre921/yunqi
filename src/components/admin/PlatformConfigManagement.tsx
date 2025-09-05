'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface PlatformConfig {
  id: string;
  title: string;
  updatedAt: string;
}

export default function PlatformConfigManagement() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 获取当前配置
  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/platform-config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        setTitle(data.data.title);
      } else {
        toast.error('获取配置失败');
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      toast.error('获取配置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    if (!title.trim()) {
      toast.error('标题不能为空');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/platform-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        toast.success('配置保存成功');
        // 刷新页面以更新Header中的标题
        window.location.reload();
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          平台配置管理
        </h2>
        
        <div className="space-y-6">
          {/* 主标题设置 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              平台主标题
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入平台主标题"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={100}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              当前字符数: {title.length}/100
            </p>
          </div>

          {/* 当前配置信息 */}
          {config && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                当前配置信息
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p><span className="font-medium">当前标题:</span> {config.title}</p>
                <p><span className="font-medium">最后更新:</span> {new Date(config.updatedAt).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          )}

          {/* 保存按钮 */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              disabled={isSaving || !title.trim() || title === config?.title}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
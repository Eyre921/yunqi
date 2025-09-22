'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UploadConfig {
  id?: string;
  isEnabled: boolean;
  startTime: string | null;
  endTime: string | null;
  maxUploadsPerUser: number;
  maxFileSize: number;
  allowedFormats: string[];
  announcement: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

const UploadConfigManagement: React.FC = () => {
  const { data: session } = useSession();
  const [config, setConfig] = useState<UploadConfig>({
    isEnabled: false,
    startTime: null,
    endTime: null,
    maxUploadsPerUser: 1,
    maxFileSize: 10485760, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif'],
    announcement: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载当前配置
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/upload-config');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || '加载配置失败' });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: '加载配置失败' });
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/upload-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setMessage({ type: 'success', text: result.message || '配置保存成功' });
      } else {
        setMessage({ type: 'error', text: result.error || '保存配置失败' });
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage({ type: 'error', text: '保存配置失败' });
    } finally {
      setSaving(false);
    }
  };

  // 格式化文件大小显示
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 处理文件格式变更
  const handleFormatChange = (format: string, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        allowedFormats: [...prev.allowedFormats, format]
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        allowedFormats: prev.allowedFormats.filter(f => f !== format)
      }));
    }
  };

  // 格式化日期时间为本地时间字符串
  const formatDateTimeLocal = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            权限不足
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            只有管理员可以访问此页面
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            上传作品配置管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            管理用户上传作品的相关设置
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 消息提示 */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* 功能开关 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                上传功能开关
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                控制用户是否可以上传作品
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 时间设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(config.startTime)}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  startTime: e.target.value ? new Date(e.target.value).toISOString() : null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(config.endTime)}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  endTime: e.target.value ? new Date(e.target.value).toISOString() : null 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* 上传限制 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                每用户最大上传数量
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                value={config.maxUploadsPerUser}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxUploadsPerUser: parseInt(e.target.value) || 1 
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最大文件大小 ({formatFileSize(config.maxFileSize)})
              </label>
              <input
                type="range"
                min="1048576"  // 1MB
                max="104857600" // 100MB
                step="1048576"  // 1MB steps
                value={config.maxFileSize}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  maxFileSize: parseInt(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>

          {/* 允许的文件格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              允许的文件格式
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].map(format => (
                <label key={format} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allowedFormats.includes(format)}
                    onChange={(e) => handleFormatChange(format, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 uppercase">
                    {format}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 公告信息 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              公告信息
            </label>
            <textarea
              rows={4}
              value={config.announcement || ''}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                announcement: e.target.value || null 
              }))}
              placeholder="输入给用户的公告信息..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 配置信息 */}
          {config.creator && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                配置信息
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>创建者: {config.creator.name} ({config.creator.email})</p>
                {config.createdAt && (
                  <p>创建时间: {new Date(config.createdAt).toLocaleString('zh-CN')}</p>
                )}
                {config.updatedAt && (
                  <p>更新时间: {new Date(config.updatedAt).toLocaleString('zh-CN')}</p>
                )}
              </div>
            </div>
          )}

          {/* 保存按钮 */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{saving ? '保存中...' : '保存配置'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadConfigManagement;
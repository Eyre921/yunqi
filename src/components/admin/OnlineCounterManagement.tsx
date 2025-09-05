'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface OnlineCounterConfig {
  id: string;
  currentCount: number;
  baseCount: number;
  maxCount: number;
  growthRate: number;
  isEnabled: boolean;
  displayText: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export default function OnlineCounterManagement() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<OnlineCounterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    currentCount: 1075,
    baseCount: 1000,
    maxCount: 2000,
    growthRate: 0.5,
    isEnabled: true,
    displayText: '人正在云栖大会创作'
  });

  // 获取当前配置
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/online-counter');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setFormData({
          currentCount: result.data.currentCount,
          baseCount: result.data.baseCount,
          maxCount: result.data.maxCount,
          growthRate: result.data.growthRate,
          isEnabled: result.data.isEnabled,
          displayText: result.data.displayText
        });
      } else {
        setMessage(`获取配置失败: ${result.error}`);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      setMessage('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/online-counter', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setMessage('配置保存成功');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`保存失败: ${result.error}`);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置在线人数
  const resetCount = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/online-counter', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setFormData(prev => ({ ...prev, currentCount: result.data.currentCount }));
        setMessage('在线人数已重置');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`重置失败: ${result.error}`);
      }
    } catch (error) {
      console.error('重置失败:', error);
      setMessage('重置失败');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchConfig();
    }
  }, [session]);

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">权限不足，仅管理员可访问</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">在线人数管理</h1>
        
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.includes('成功') || message.includes('重置') 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 当前状态 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">当前状态</h2>
              
              {config && (
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <p><span className="font-medium">当前显示人数:</span> {config.currentCount.toLocaleString()}</p>
                  <p><span className="font-medium">功能状态:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      config.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config.isEnabled ? '启用' : '禁用'}
                    </span>
                  </p>
                  <p><span className="font-medium">最后更新:</span> {new Date(config.lastUpdated).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* 配置表单 */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">配置设置</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前人数
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={formData.currentCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentCount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    基础人数
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={formData.baseCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseCount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大人数
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={formData.maxCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxCount: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    增长速率 (每10秒最大增加人数)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.growthRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, growthRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    显示文本
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.displayText}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="人正在云栖大会创作"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-900">
                    启用在线人数显示
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex space-x-4">
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
            
            <button
              onClick={resetCount}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              重置人数
            </button>
            
            <button
              onClick={fetchConfig}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              刷新数据
            </button>
          </div>

          {/* 说明 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 当前人数: 立即显示的人数</li>
              <li>• 基础人数: 重置时的最小人数</li>
              <li>• 最大人数: 自动增长的上限</li>
              <li>• 增长速率: 每10秒随机增加0到该数值之间的人数</li>
              <li>• 显示文本: 在线人数后显示的文字内容</li>
              <li>• 系统每10秒检查一次并随机增加人数，前端有滚动动画效果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

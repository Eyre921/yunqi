'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Work } from '@prisma/client';
import ImageViewer from './ImageViewer';

interface WorkModalProps {
  work: (Work & {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }) | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void; // 已经是可选的，保持不变
}

export default function WorkModal({ work, isOpen, onClose, onLike }: WorkModalProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  // 移除 isLiking 状态，不显示加载圈
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  const handleLike = async () => {
    if (!work) return;
    
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 使用后端返回的实际点赞数
          setLikeCount(data.data.likeCount);
          onLike?.(); // 通知父组件更新
          
          // 根据增加的点赞数显示不同的提示信息（参考示例逻辑）
          const increment = data.data.increment;
          let message;
          if (increment >= 8) {
            message = `哇！获得了 ${increment} 个赞！作品太棒了！🎉`;
          } else if (increment >= 5) {
            message = `太好了！获得了 ${increment} 个赞！❤️`;
          } else {
            message = `点赞成功！+${increment} 👍`;
          }
          
          // 显示toast提示
          showToast(message);
        }
      }
    } catch (error) {
      console.error('点赞失败:', error);
      showToast('点赞失败，请稍后重试');
    }
  };
  
  // 添加toast提示函数
  const showToast = (message: string) => {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg z-50 transition-opacity duration-300';
    toast.textContent = message;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  
  useEffect(() => {
    if (work) {
      setLikeCount(work.likeCount || 0);
      setViewCount(work.viewCount || 0);
      setImageError(false);
      
      // 增加浏览量
      fetch(`/api/works/${work.id}/view`, {
        method: 'POST',
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
      }).then(data => {
        if (data?.viewCount) {
          setViewCount(data.viewCount);
        }
      }).catch(console.error);
    }
  }, [work]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !work) return null;
  
  const handleCopyPrompt = async () => {
    if (!work.prompt) return;
    
    try {
      await navigator.clipboard.writeText(work.prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
        >
          ✕
        </button>
        
        {/* 精选徽章 - 模态框版本 */}
        {work.featured && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
              <span className="mr-1">⭐</span>
              精选作品
            </div>
          </div>
        )}
        
        {/* 图片区域 */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
          {!imageError ? (
            <Image
              src={work.imageUrl}
              alt={work.name || work.title}
              fill
              className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onError={() => setImageError(true)}
              onClick={() => setShowImageViewer(true)}
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <div className="text-lg">图片加载失败</div>
              </div>
            </div>
          )}
          
          {/* 点击查看提示 */}
          {!imageError && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              点击查看大图
            </div>
          )}
        </div>
        
        {/* 内容区域 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {work.name || work.title}
                </h2>
                {/* 精选标识 - 标题旁版本 */}
                {work.featured && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <span className="mr-1">⭐</span>
                    精选
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {work.title}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                作者: {work.author || work.user?.name || '匿名'}
              </p>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-4 ml-4">
              {/* 点赞按钮 */}
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                {likeCount}
              </button>
              {/* 浏览量显示 */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <span className="mr-1">👁️</span>
                  {viewCount}
                </span>
              </div>
            </div>
          </div>
          
          {/* Prompt区域 */}
          {work.prompt && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  创作提示词
                </h3>
                <button
                  onClick={handleCopyPrompt}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    copySuccess
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  {copySuccess ? '已复制!' : '复制'}
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {work.prompt}
                </pre>
              </div>
            </div>
          )}
          
          {/* 创建时间 */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            创建时间: {new Date(work.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>
      {/* 图片查看器 */}
      <ImageViewer
        src={work.imageUrl}
        alt={work.name || work.title}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </div>
  );
}
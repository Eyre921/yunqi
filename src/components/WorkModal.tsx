'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageViewer from './ImageViewer';
import { getImageUrl } from '@/lib/image-url';
import { toast } from 'react-hot-toast';
import type { WorkModalProps } from '@/types/work';

export default function WorkModal({ work, isOpen, onClose, onLike, onWorkUpdate }: WorkModalProps) {
  const [likeCount, setLikeCount] = useState(work?.likeCount || 0);
  const [viewCount, setViewCount] = useState(work?.viewCount || 0);
  const [imageError, setImageError] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const imageUrl = work ? getImageUrl(work.imageUrl) : '';
  
  const handleLike = async () => {
    if (isLiking || !work) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.data.likeCount);
        
        // 通知父组件更新作品数据
        if (onWorkUpdate) {
          onWorkUpdate({
            ...work,
            likeCount: data.data.likeCount
          });
        }

        // 显示点赞成功提示
        const increment = data.data.increment || 1;
        let message: string;
        if (increment >= 3) {
          message = `哇！获得了 ${increment} 个赞！作品太棒了！🎉`;
        } else if (increment >= 2) {
          message = `太好了！获得了 ${increment} 个赞！❤️`;
        } else {
          message = `点赞成功！+${increment} 👍`;
        }
        toast.success(message);
      } else {
        toast.error('点赞失败，请稍后重试');
      }
    } catch (error) {
      console.error('点赞失败:', error);
      toast.error('点赞失败，请稍后重试');
    } finally {
      setTimeout(() => {
        setIsLiking(false);
      }, 1000);
    }
  };
  
  useEffect(() => {
    if (work) {
      setLikeCount(work.likeCount || 0);
      setViewCount(work.viewCount || 0);
      setImageError(false);
      
      // 检查是否已经浏览过这个作品（在当前会话中）
      const viewedWorksKey = 'viewedWorks';
      const viewedWorks = JSON.parse(sessionStorage.getItem(viewedWorksKey) || '[]');
      
      if (!viewedWorks.includes(work.id)) {
        // 增加浏览量
        fetch(`/api/works/${work.id}/view`, {
          method: 'POST',
        }).then(response => {
          if (response.ok) {
            return response.json();
          }
        }).then(data => {
          if (data?.success && data?.data?.viewCount) {
            setViewCount(data.data.viewCount);
            
            // 记录已浏览的作品ID
            const updatedViewedWorks = [...viewedWorks, work.id];
            sessionStorage.setItem(viewedWorksKey, JSON.stringify(updatedViewedWorks));
            
            // 通知父组件更新作品数据
            if (onWorkUpdate) {
              const updatedWork = {
                ...work,
                viewCount: data.data.viewCount
              };
              onWorkUpdate(updatedWork);
            }
          }
        }).catch(console.error);
      }
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
      // 检查是否支持 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        // 使用现代 Clipboard API
        await navigator.clipboard.writeText(work.prompt);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        toast.success('提示词已复制到剪贴板！');
      } else {
        // 降级到传统方法
        const textArea = document.createElement('textarea');
        textArea.value = work.prompt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            toast.success('提示词已复制到剪贴板！');
          } else {
            throw new Error('复制命令执行失败');
          }
        } catch (err) {
          console.error('传统复制方法失败:', err);
          toast.error('复制失败，请手动选择文本进行复制');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('复制失败:', error);
      toast.error('复制失败，请手动选择文本进行复制');
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
              src={imageUrl}
              alt={work.name || '作品图片'}
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
                  {work.name}
                </h2>
                {/* 精选标识 - 标题旁版本 */}
                {work.featured && (
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <span className="mr-1">⭐</span>
                    精选
                  </div>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                作者: {work.author || '匿名'}
              </p>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-4 ml-4">
              {/* 点赞按钮 */}
              <button
                onClick={handleLike}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <span className="text-lg">👍</span>
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
        src={imageUrl}
        alt={work.name}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
      />
    </div>
  );
}
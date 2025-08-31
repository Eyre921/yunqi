'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Work } from '@prisma/client';

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
}

export default function WorkModal({ work, isOpen, onClose }: WorkModalProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [imageError, setImageError] = useState(false);
  
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
  
  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const response = await fetch(`/api/works/${work.id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount || likeCount + 1);
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setTimeout(() => setIsLiking(false), 500);
    }
  };
  
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
        
        {/* 图片区域 */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
          {!imageError ? (
            <Image
              src={work.imageUrl}
              alt={work.name || work.title}
              fill
              className="object-contain"
              onError={() => setImageError(true)}
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
        </div>
        
        {/* 内容区域 */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {work.name || work.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {work.title}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                作者: {work.author || work.user?.name || '匿名'}
              </p>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center space-x-4 ml-4">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  isLiking 
                    ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed' 
                    : 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400'
                }`}
              >
                <span className={isLiking ? 'animate-pulse' : ''}>
                  {isLiking ? '💖' : '❤️'}
                </span>
                <span>{likeCount}</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <span>👁️</span>
                <span>{viewCount}</span>
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
    </div>
  );
}
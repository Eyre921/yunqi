'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Work } from '@prisma/client';

interface WorkCardProps {
  work: Work & {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  onClick?: () => void;
  onLike?: () => void;
}

export default function WorkCard({ work, onClick, onLike }: WorkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击事件
    onLike?.();
  };
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        {!imageError ? (
          <Image
            src={work.imageUrl}
            alt={work.name || work.title}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">🖼️</div>
              <div className="text-sm">图片加载失败</div>
            </div>
          </div>
        )}
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900 dark:text-white">
          {work.name || work.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">
          {work.title}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>by {work.author || work.user?.name || '匿名'}</span>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLikeClick}
              className="flex items-center hover:text-red-500 transition-colors"
              disabled={!onLike}
            >
              <span className="mr-1">❤️</span>
              {work.likeCount || 0}
            </button>
            <span className="flex items-center">
              <span className="mr-1">👁️</span>
              {work.viewCount || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
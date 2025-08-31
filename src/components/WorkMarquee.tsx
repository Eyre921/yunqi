'use client';

import { useState, useEffect } from 'react';
import WorkCard from './WorkCard';
import { Work } from '@prisma/client';

interface WorkMarqueeProps {
  works: (Work & {
    user?: {
      id: string;
      name: string;
      email: string;
    };
  })[];
  onWorkClick: (work: Work) => void;
  direction?: 'left' | 'right';
  speed?: number;
}

export default function WorkMarquee({ 
  works, 
  onWorkClick, 
  direction = 'left',
  speed = 30 
}: WorkMarqueeProps) {
  // 移除 isPaused 状态，因为我们将使用CSS来控制暂停
  
  // 确保有足够的作品进行无缝滚动
  const minWorksForScroll = 8;
  const duplicatedWorks = works.length < minWorksForScroll 
    ? [...works, ...works, ...works].slice(0, minWorksForScroll)
    : [...works, ...works];
  
  if (works.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📭</div>
          <div>暂无作品</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-hidden py-4">
      {/* 渐变遮罩 */}
      <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
      
      <div className="relative">
        <div 
          className={`flex space-x-6 ${
            direction === 'right' ? 'animate-marquee-reverse' : 'animate-marquee'
          }`}
          style={{
            width: `${duplicatedWorks.length * 340}px`,
            '--marquee-duration': `${speed}s`
          } as React.CSSProperties}
        >
          {duplicatedWorks.map((work, index) => (
            <div key={`${work.id}-${index}`} className="flex-shrink-0 w-80">
              <WorkCard 
                work={work} 
                onClick={() => onWorkClick(work)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
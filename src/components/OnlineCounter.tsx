'use client';

import { useState, useEffect } from 'react';

interface OnlineCounterProps {
  className?: string;
}

export default function OnlineCounter({ className = '' }: OnlineCounterProps) {
  const [onlineCount, setOnlineCount] = useState(1024); // 基数1024

  useEffect(() => {
    // 每10秒随机增加1-5人
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 5) + 1; // 随机1-5
      setOnlineCount(prev => prev + increment);
    }, 10000); // 10秒

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white py-4 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-lg font-bold tracking-wide">
              <span className="font-black text-3xl">{onlineCount.toLocaleString()}</span> 人正在云栖大会创作
            </span>
            <div className="text-yellow-300 animate-bounce text-2xl">🚀</div>
          </div>
        </div>
      </div>
    </div>
  );
}
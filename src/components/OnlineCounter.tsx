'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OnlineCounterProps {
  className?: string;
}

interface OnlineCounterData {
  count: number;
  displayText: string;
  isEnabled: boolean;
  lastUpdated?: string;
}

export default function OnlineCounter({ className = '' }: OnlineCounterProps) {
  const [counterData, setCounterData] = useState<OnlineCounterData>({
    count: 1075,
    displayText: '人正在云栖大会创作',
    isEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(1075);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(1075);
  const targetValueRef = useRef<number>(1075);
  const [currentAnimatedValue, setCurrentAnimatedValue] = useState(1075);

  // 缓动函数 - 创建平滑的动画效果
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };

  // 格式化数字显示（添加千位分隔符）
  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString();
  };

  // 数字滚动动画
  const animateCount = useCallback((from: number, to: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (from === to) {
      setCurrentAnimatedValue(to);
      setDisplayCount(to);
      return;
    }
    
    setIsAnimating(true);
    startTimeRef.current = 0;
    startValueRef.current = from;
    targetValueRef.current = to;
    setCurrentAnimatedValue(from);
    
    const duration = 1500; // 1.5秒动画，更平滑
    
    const animate = (currentTime: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }
      
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数创建平滑效果
      const easedProgress = easeOutCubic(progress);
      const currentValue = startValueRef.current + (targetValueRef.current - startValueRef.current) * easedProgress;
      
      // 只更新一个状态，避免冲突
      setCurrentAnimatedValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 动画结束时确保精确值
        setCurrentAnimatedValue(to);
        setDisplayCount(to);
        setIsAnimating(false);
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // 获取在线人数数据
  const fetchOnlineCount = async () => {
    try {
      const response = await fetch('/api/online-counter');
      const result = await response.json();
      
      if (result.success) {
        const newCount = result.data.count;
        const oldCount = counterData.count;
        
        setCounterData(result.data);
        
        // 如果数字有变化且不是初始加载，执行动画
        if (!loading && newCount !== oldCount) {
          animateCount(currentAnimatedValue, newCount);
        } else if (loading) {
          setDisplayCount(newCount);
          setCurrentAnimatedValue(newCount);
        }
      }
    } catch (error) {
      console.error('获取在线人数失败:', error);
      // 保持默认值
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初始加载
    fetchOnlineCount();

    // 每10秒更新一次数据
    const interval = setInterval(() => {
      fetchOnlineCount();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // 如果功能未启用，不显示组件
  if (!counterData.isEnabled) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg md:text-xl font-bold">
           {loading ? (
             <span className="animate-pulse">加载中...</span>
           ) : (
            <>
              <span className={`font-bold text-xl transition-all duration-300 ${isAnimating ? 'scale-105 text-yellow-300 drop-shadow-lg' : 'scale-100'}`}>
                {isAnimating ? formatNumber(currentAnimatedValue) : displayCount.toLocaleString()}
              </span> {counterData.displayText}
            </>
          )}
        </span>
        <div className="text-yellow-300 animate-bounce text-lg">🚀</div>
      </div>
    </div>
  );
}
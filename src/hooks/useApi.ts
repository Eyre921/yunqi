'use client';

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
  code?: string;
  message?: string;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    url: string, 
    options?: RequestInit
  ): Promise<ApiResponse<T> | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });
      
      const result: ApiResponse<T> = await response.json();
      
      // 更新状态但不抛出异常，让调用者处理错误
      if (result.success) {
        setState({
          data: result.data || null,
          loading: false,
          error: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error || '请求失败'
        });
      }
      
      // 返回完整的响应对象
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '网络错误';
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });
      
      // 返回错误响应格式
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}
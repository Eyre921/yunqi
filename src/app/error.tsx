'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          出现了一些问题
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          页面遇到了意外错误，请重试或返回首页
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="btn btn-primary"
          >
            重试
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="btn btn-outline"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
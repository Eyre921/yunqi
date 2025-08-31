'use client';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`text-center p-6 ${className}`}>
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
        出现错误
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-outline"
        >
          重试
        </button>
      )}
    </div>
  );
}
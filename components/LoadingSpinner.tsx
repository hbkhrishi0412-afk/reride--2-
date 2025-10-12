import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`min-h-[calc(100vh-140px)] flex items-center justify-center ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`${sizeClasses[size]} border-4 border-dashed rounded-full animate-spin border-spinny-orange`}></div>
        <span className={`${textSizeClasses[size]} font-semibold text-brand-gray-600 dark:text-brand-gray-300`}>
          {text}
        </span>
      </div>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
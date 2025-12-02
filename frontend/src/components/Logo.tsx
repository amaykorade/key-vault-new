import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'icon-only';
}

export function Logo({ className = '', showText = true, size = 'md', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  if (variant === 'icon-only') {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center ${className}`}>
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.5"
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg 
          className={iconSizes[size]} 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.5"
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizes[size]} font-bold text-white`}>APIVault</h1>
          {size !== 'sm' && (
            <p className="text-xs text-gray-400">Secure Secrets</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Logo;


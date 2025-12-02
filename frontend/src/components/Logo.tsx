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
      <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src="/Vector.svg"
          alt="APIVault logo"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden`}>
        <img
          src="/Vector.svg"
          alt="APIVault logo"
          className="w-full h-full object-contain"
        />
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


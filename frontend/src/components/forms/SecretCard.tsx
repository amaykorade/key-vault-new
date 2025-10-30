import { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Secret } from '../../types';

interface SecretCardProps {
  secret: Secret;
  onEdit: (secret: Secret) => void;
  onDelete: (secret: Secret) => void;
  onView: (secret: Secret) => void;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

const SECRET_TYPE_LABELS: Record<string, string> = {
  API_KEY: 'API Key',
  DATABASE_URL: 'Database URL',
  JWT_SECRET: 'JWT Secret',
  OAUTH_CLIENT_SECRET: 'OAuth Client Secret',
  WEBHOOK_SECRET: 'Webhook Secret',
  SSH_KEY: 'SSH Key',
  CERTIFICATE: 'Certificate',
  PASSWORD: 'Password',
  OTHER: 'Other',
};

const ENVIRONMENT_COLORS: Record<string, string> = {
  development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  staging: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  production: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function SecretCard({ secret, onEdit, onDelete, onView, isLoading, canEdit = true, canDelete = true }: SecretCardProps) {
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if secret value is valid (not just masked)
  const hasValidValue = secret.value && secret.value !== '****';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const maskValue = (value: string) => {
    if (value.length <= 4) return '••••';
    return value.slice(0, 4) + '••••••••••••••••••••••••••••••••';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formatName = (name: string) => {
    // Convert UPPER_CASE to Title Case and handle common patterns
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  const formatEnvironment = (env: string) => {
    return env.charAt(0).toUpperCase() + env.slice(1).toLowerCase();
  };

  return (
    <Card className="hover-lift group transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-4">
          {/* Name */}
          <div className="mb-1.5">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors duration-200">
              {formatName(secret.name)}
            </h3>
          </div>

          {/* Description */}
          {secret.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-2.5">
              {secret.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mb-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(secret)}
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-500/10 hover:border-blue-500/50"
              title="View Details"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Button>
            
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(secret)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-yellow-500/10 hover:border-yellow-500/50"
                disabled={isLoading}
                title="Edit Secret"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            )}
            
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(secret)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                disabled={isLoading}
                title="Delete Secret"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex items-center space-x-2 mb-2.5">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ENVIRONMENT_COLORS[secret.environment || 'unknown'] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
              {formatEnvironment(secret.environment || 'unknown')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {formatName(secret.folder || 'default')}
            </span>
          </div>
          
          {/* Date and Type Info */}
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            <span className="flex items-center flex-shrink-0">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span className="whitespace-nowrap">{SECRET_TYPE_LABELS[secret.type] || secret.type}</span>
            </span>
            <span className="flex items-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium whitespace-nowrap">{formatDate(secret.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* Description */}
        {secret.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
              {secret.description}
            </p>
          </div>
        )}

        {/* Secret Value Section */}
        <div className="bg-gray-800/30 rounded-lg p-3.5 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Secret Value
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowValue(!showValue)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
              >
                <svg className={`w-3 h-3 mr-1 transition-transform duration-200 ${showValue ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showValue ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {showValue ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => copyToClipboard(secret.value)}
                className="text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center"
                disabled={copied}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="relative overflow-hidden">
            {hasValidValue ? (
              <>
                <div className={`font-mono text-sm p-3 rounded-md border transition-all duration-200 break-all overflow-wrap-anywhere ${
                  showValue 
                    ? 'bg-gray-900/50 border-gray-600 text-gray-200' 
                    : 'bg-gray-800/50 border-gray-700 text-transparent'
                }`}>
                  {secret.value}
                </div>
                {!showValue && (
                  <div className="absolute inset-0 flex items-center px-3 font-mono text-sm text-gray-500 bg-gray-800/50 rounded-md border border-gray-700 break-all overflow-hidden">
                    <span className="truncate">{maskValue(secret.value)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="font-mono text-sm p-3 rounded-md border border-gray-700 bg-gray-800/50 text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Secret value not available - please recreate this secret</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

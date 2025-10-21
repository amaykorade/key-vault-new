import { useState } from 'react';
import { Button } from '../ui/Button';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { SecretForm } from './SecretForm';
import type { Secret } from '../../types';

interface SecretModalProps {
  secret: Secret | null;
  onClose: () => void;
  onEdit: (data: any) => Promise<void>;
  onDelete: (secret: Secret) => void;
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

export function SecretModal({ secret, onClose, onEdit, onDelete, canEdit = true, canDelete = true }: SecretModalProps) {
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!secret) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      await onEdit(data);
      setIsEditMode(false);
    } catch (err) {
      console.error('Failed to update secret:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setShowValue(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">{secret.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${ENVIRONMENT_COLORS[secret.environment || 'unknown'] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
              {secret.environment}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isEditMode ? (
            <SecretForm
              onSubmit={handleEditSubmit}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
              title="Edit Secret"
              initialData={{
                name: secret.name,
                description: secret.description,
                type: secret.type,
                environment: secret.environment,
                value: secret.value,
              }}
            />
          ) : (
            <>
              {/* Secret Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secret Type</label>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-white">{SECRET_TYPE_LABELS[secret.type] || secret.type}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Created By</label>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-white">{secret.createdBy?.name || secret.createdBy?.email || 'Unknown'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Created At</label>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white">{formatDate(secret.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Updated</label>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-white">{formatDate(secret.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {secret.description && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <p className="text-white bg-gray-800/50 rounded-lg p-3">
                {secret.description}
              </p>
            </div>
          )}

          {/* Secret Value */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Secret Value</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowValue(!showValue)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showValue ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => copyToClipboard(secret.value)}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={copied}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={secret.value}
                readOnly
                className="w-full min-h-[120px] rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm font-mono resize-none text-white"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                }}
              />
              {!showValue && (
                <div className="absolute inset-0 flex items-center px-4 py-3 text-sm text-gray-500 font-mono bg-gray-800/50 rounded-lg">
                  ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditMode && (
          <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <div>
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(secret)}
                className="text-red-400 hover:text-red-300 hover:border-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Secret
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button variant="gradient" onClick={() => setIsEditMode(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Secret
              </Button>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

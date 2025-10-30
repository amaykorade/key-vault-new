import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Input } from './ui/Input';
import type { Secret } from '../types';

interface SecretRowProps {
  secret: Secret;
  onEdit: (secret: Secret) => void;
  onDelete: (secret: Secret) => void;
  canEdit: boolean;
  canDelete: boolean;
  forceEditNameId?: string | null;
}

const SECRET_TYPES = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'DATABASE_URL', label: 'Database URL' },
  { value: 'JWT_SECRET', label: 'JWT Secret' },
  { value: 'OAUTH_CLIENT_SECRET', label: 'OAuth Client Secret' },
  { value: 'WEBHOOK_SECRET', label: 'Webhook Secret' },
  { value: 'SSH_KEY', label: 'SSH Key' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'JSON', label: 'JSON' },
  { value: 'URL', label: 'URL' },
  // Map OTHER to display as "String" for a simpler default label
  { value: 'OTHER', label: 'String' },
];

export function SecretRow({ secret, onEdit, onDelete, canEdit, canDelete, forceEditNameId }: SecretRowProps) {
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(secret.name);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editedValue, setEditedValue] = useState(secret.value);
  const isEditing = isEditingName || isEditingValue;

  useEffect(() => {
    setEditedName(secret.name);
    setEditedValue(secret.value);
  }, [secret.name, secret.value]);

  useEffect(() => {
    if (!canEdit) return;
    if (forceEditNameId && forceEditNameId === secret.id) {
      setIsEditingName(true);
      return;
    }
    if (!secret.name || secret.name.trim() === '') {
      setIsEditingName(true);
    }
  }, [secret.id, secret.name, canEdit, forceEditNameId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className={`flex items-stretch gap-3 bg-gray-900/40 rounded-xl border border-gray-800/80 p-4 shadow-lg transition-all duration-200 group ${
      isEditing ? '' : 'hover:shadow-xl hover:border-gray-700'
    }`}>
      {/* Name first */}
      <div className="w-96 flex-shrink-0">
        {/* Name Field */}
        {isEditingName ? (
          <div className={`flex items-center h-9 px-3 rounded-lg bg-gray-800/60 border border-gray-700/50 transition-all`}>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={async () => {
                if (editedName.trim() && editedName !== secret.name) {
                  try {
                    await onEdit({ ...secret, name: editedName.trim() });
                    toast.success('Name updated');
                  } catch (err) {
                    toast.error('Failed to update name');
                    console.error('Failed to update name:', err);
                    setEditedName(secret.name);
                  }
                } else {
                  setEditedName(secret.name);
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setEditedName(secret.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="h-7 text-sm font-semibold flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none px-0"
            />
            <div className="relative ml-2 pl-2 border-l border-gray-700 w-20">
              <select
                value={secret.type}
                onChange={async (e) => {
                  try {
                    await onEdit({ ...secret, type: e.target.value as any });
                    toast.success('Type updated');
                  } catch (err) {
                    toast.error('Failed to update type');
                    console.error('Failed to update type:', err);
                  }
                }}
                disabled={!canEdit}
                className="h-7 w-full text-xs font-semibold text-gray-300 bg-transparent rounded-md pr-5 appearance-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25em 1.25em',
                }}
              >
                {SECRET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div
            onClick={() => canEdit && setIsEditingName(true)}
            className={`flex items-center h-9 px-3 rounded-lg bg-gray-800/60 border border-gray-700/50 transition-all ${
              canEdit ? 'cursor-pointer' : ''
            }`}
            title={canEdit ? 'Click to edit name' : undefined}
          >
            <span className="text-sm font-semibold text-white truncate flex-1">
              {formatName(secret.name)}
            </span>
            <div 
              className="relative ml-2 pl-2 border-l border-gray-700 flex-shrink-0 w-20"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <select
                value={secret.type}
                onChange={async (e) => {
                  try {
                    await onEdit({ ...secret, type: e.target.value as any });
                    toast.success('Type updated');
                  } catch (err) {
                    toast.error('Failed to update type');
                    console.error('Failed to update type:', err);
                  }
                }}
                disabled={!canEdit}
                className="h-7 w-full text-xs font-semibold text-gray-300 bg-transparent rounded-md pr-5 appearance-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.1rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25em 1.25em',
                }}
              >
                {SECRET_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Secret Value Box - Larger, takes remaining space */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Secret Value Display */}
        <div 
          className="flex-1 min-w-0 relative"
          onClick={() => { if (canEdit && !isEditingValue) { setEditedValue(secret.value === ' ' ? '' : secret.value); setIsEditingValue(true); } }}
          title={canEdit ? 'Click to edit value' : undefined}
        >
          {isEditingValue ? (
            <input
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onBlur={async () => {
                if (editedValue !== secret.value) {
                  try {
                    await onEdit({ ...secret, value: editedValue });
                    toast.success('Value updated');
                  } catch (err) {
                    toast.error('Failed to update value');
                    console.error('Failed to update value:', err);
                    setEditedValue(secret.value);
                  }
                }
                setIsEditingValue(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setEditedValue(secret.value);
                  setIsEditingValue(false);
                }
              }}
              autoFocus
              className="w-full h-10 font-mono text-sm text-gray-100 bg-gray-900/90 px-4 rounded-lg border border-gray-700/80 focus:outline-none focus:ring-0 focus:border-gray-700/80"
              style={{ letterSpacing: '0.03em' }}
            />
          ) : showValue ? (
            <div className="font-mono text-sm text-gray-100 bg-gray-900/90 px-4 py-2.5 rounded-lg border border-gray-700/80 break-all shadow-inner">
              {secret.value}
            </div>
          ) : (
            <div className="font-mono text-sm text-gray-600 bg-gray-900/90 px-4 py-2.5 rounded-lg border border-gray-700/80 select-none">
              <span className="tracking-wider">••••••••••••••••••••••••••••••••</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowValue(!showValue)}
            className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
            title={showValue ? 'Hide value' : 'Show value'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showValue ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
          <button
            onClick={() => copyToClipboard(secret.value)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              copied 
                ? 'text-emerald-400 bg-emerald-500/20' 
                : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
            }`}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {/* Edit button removed per request; inline editing remains */}
          {canDelete && (
            <button
              onClick={() => onDelete(secret)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
              title="Delete secret"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


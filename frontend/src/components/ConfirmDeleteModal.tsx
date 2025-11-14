import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
  isLoading = false,
  className = ''
}: ConfirmDeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setIsValid(confirmText === itemName);
  }, [confirmText, itemName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className={`bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-xl shadow-2xl border border-gray-700 p-8 w-full max-w-lg mx-4 animate-slide-up ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-red-400 font-medium mb-2">This action cannot be undone</h4>
                <p className="text-red-300 text-sm">
                  {description || `This will permanently delete the ${itemType} "${itemName}" and all of its data.`}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium text-gray-300 mb-2">
                Please type <span className="font-mono text-white bg-gray-800 px-2 py-1 rounded">{itemName}</span> to confirm:
              </label>
              <input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${itemName}" here`}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                autoComplete="off"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={!isValid || isLoading}
                loading={isLoading}
                className="bg-red-600 hover:bg-red-700 border-red-600 text-white disabled:bg-gray-600 disabled:border-gray-600 disabled:text-gray-400"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isLoading ? 'Deleting...' : `Delete ${itemType}`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

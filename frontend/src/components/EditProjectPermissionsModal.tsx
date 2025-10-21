import React, { useState } from 'react';
import type { UpdateTeamProjectPermissionsRequest, ProjectPermission } from '../types/index';
import { Button } from './ui/Button';

interface EditProjectPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateTeamProjectPermissionsRequest) => Promise<void>;
  projectName: string;
  currentPermissions: ProjectPermission[];
  loading?: boolean;
}

const PERMISSION_OPTIONS: { value: ProjectPermission; label: string; description: string }[] = [
  {
    value: 'READ_SECRETS',
    label: 'Read Secrets',
    description: 'View and read secret values'
  },
  {
    value: 'WRITE_SECRETS',
    label: 'Write Secrets',
    description: 'Create and update secrets'
  },
  {
    value: 'DELETE_SECRETS',
    label: 'Delete Secrets',
    description: 'Delete existing secrets'
  },
  {
    value: 'MANAGE_ENVIRONMENTS',
    label: 'Manage Environments',
    description: 'Create and manage environment settings'
  },
  {
    value: 'MANAGE_FOLDERS',
    label: 'Manage Folders',
    description: 'Create and organize secret folders'
  }
];

export const EditProjectPermissionsModal: React.FC<EditProjectPermissionsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  currentPermissions,
  loading = false
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<ProjectPermission[]>(currentPermissions);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update selected permissions when currentPermissions change
  React.useEffect(() => {
    setSelectedPermissions(currentPermissions);
  }, [currentPermissions]);

  const handlePermissionToggle = (permission: ProjectPermission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
    
    // Clear errors when user makes changes
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onSubmit({
        permissions: selectedPermissions
      });
      
      // Clear errors and close modal
      setErrors({});
      onClose();
    } catch (error: any) {
      // Handle validation errors from API
      if (error.response?.data?.details) {
        const apiErrors: Record<string, string> = {};
        error.response.data.details.forEach((detail: any) => {
          apiErrors[detail.field] = detail.message;
        });
        setErrors(apiErrors);
      } else {
        setErrors({ general: error.response?.data?.error || 'An error occurred' });
      }
    }
  };

  const handleClose = () => {
    setSelectedPermissions(currentPermissions);
    setErrors({});
    onClose();
  };

  const hasChanges = () => {
    return JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(currentPermissions.sort());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Project Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {projectName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Permissions
              </label>
              <div className="space-y-3">
                {PERMISSION_OPTIONS.map((permission) => (
                  <div key={permission.value} className="flex items-start">
                    <input
                      type="checkbox"
                      id={permission.value}
                      checked={selectedPermissions.includes(permission.value)}
                      onChange={() => handlePermissionToggle(permission.value)}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="ml-3">
                      <label 
                        htmlFor={permission.value}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.permissions && (
                <p className="mt-1 text-sm text-red-600">{errors.permissions}</p>
              )}
              
              {selectedPermissions.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-700">
                    <strong>Warning:</strong> No permissions selected. The team will have no access to this project.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges()}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Permissions'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

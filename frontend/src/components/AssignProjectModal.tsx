import React, { useState, useEffect } from 'react';
import type { AssignProjectToTeamRequest, ProjectPermission, Project } from '../types/index';
import { Button } from './ui/Button';
import { apiService } from '../services/api';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssignProjectToTeamRequest) => Promise<void>;
  organizationId: string;
  assignedProjectIds: string[];
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

export const AssignProjectModal: React.FC<AssignProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  organizationId,
  assignedProjectIds,
  loading = false
}) => {
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<ProjectPermission[]>(['READ_SECRETS']);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch organization projects when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchOrganizationProjects();
    }
  }, [isOpen, organizationId]);

  const fetchOrganizationProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await apiService.getProjects(organizationId);
      // Filter out projects that are already assigned
      const filteredProjects = response.projects.filter(
        (project: Project) => !assignedProjectIds.includes(project.id)
      );
      setAvailableProjects(filteredProjects);
    } catch (error) {
      console.error('Failed to fetch organization projects:', error);
      setErrors({ general: 'Failed to load organization projects' });
    } finally {
      setLoadingProjects(false);
    }
  };

  const handlePermissionToggle = (permission: ProjectPermission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      setErrors({ project: 'Please select a project' });
      return;
    }

    if (selectedPermissions.length === 0) {
      setErrors({ permissions: 'Please select at least one permission' });
      return;
    }

    try {
      await onSubmit({
        projectId: selectedProjectId,
        permissions: selectedPermissions
      });
      
      // Reset form and close modal
      setSelectedProjectId('');
      setSelectedPermissions(['READ_SECRETS']);
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
    setSelectedProjectId('');
    setSelectedPermissions(['READ_SECRETS']);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Assign Project to Team
          </h2>
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

          <div className="space-y-6">
            {/* Project Selection */}
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Project *
              </label>
              {loadingProjects ? (
                <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              ) : availableProjects.length === 0 ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                  No available projects to assign. All organization projects are already assigned to this team.
                </div>
              ) : (
                <select
                  id="project"
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (errors.project) {
                      setErrors(prev => ({ ...prev, project: '' }));
                    }
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a project...</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.description && ` - ${project.description}`}
                    </option>
                  ))}
                </select>
              )}
              {errors.project && (
                <p className="mt-1 text-sm text-red-600">{errors.project}</p>
              )}
            </div>

            {/* Permissions Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions *
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
              disabled={loading || availableProjects.length === 0}
              className="flex-1"
            >
              {loading ? 'Assigning...' : 'Assign Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

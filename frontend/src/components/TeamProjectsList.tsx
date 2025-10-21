import React from 'react';
import type { TeamProject, ProjectPermission } from '../types/index';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface TeamProjectsListProps {
  projects: TeamProject[];
  canManage: boolean;
  onEditPermissions: (projectId: string, currentPermissions: ProjectPermission[]) => void;
  onRemoveProject: (projectId: string, projectName: string) => void;
  loading?: boolean;
}

export const TeamProjectsList: React.FC<TeamProjectsListProps> = ({
  projects,
  canManage,
  onEditPermissions,
  onRemoveProject,
  loading = false
}) => {
  const getPermissionBadgeColor = (permission: ProjectPermission) => {
    switch (permission) {
      case 'READ_SECRETS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'WRITE_SECRETS':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'DELETE_SECRETS':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MANAGE_ENVIRONMENTS':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'MANAGE_FOLDERS':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getPermissionLabel = (permission: ProjectPermission) => {
    switch (permission) {
      case 'READ_SECRETS':
        return 'Read Secrets';
      case 'WRITE_SECRETS':
        return 'Write Secrets';
      case 'DELETE_SECRETS':
        return 'Delete Secrets';
      case 'MANAGE_ENVIRONMENTS':
        return 'Manage Environments';
      case 'MANAGE_FOLDERS':
        return 'Manage Folders';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                ))}
              </div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
        <p>No projects assigned to this team yet</p>
        {canManage && (
          <p className="text-sm mt-1">Use the "Assign Project" button to get started</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((teamProject) => (
        <Card key={teamProject.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {teamProject.project.name}
              </h4>
              {teamProject.project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {teamProject.project.description}
                </p>
              )}
            </div>
            
            {canManage && (
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditPermissions(teamProject.project.id, teamProject.permissions)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900"
                >
                  Edit Permissions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveProject(teamProject.project.id, teamProject.project.name)}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Permissions:
            </div>
            <div className="flex flex-wrap gap-2">
              {teamProject.permissions.length === 0 ? (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  No permissions assigned
                </span>
              ) : (
                teamProject.permissions.map((permission) => (
                  <span
                    key={permission}
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionBadgeColor(permission)}`}
                  >
                    {getPermissionLabel(permission)}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Assignment date */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Assigned {formatDate(teamProject.assignedAt)}
          </div>
        </Card>
      ))}
    </div>
  );
};

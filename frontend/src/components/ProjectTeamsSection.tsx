import React, { useState, useEffect } from 'react';
import type { ProjectTeam, ProjectPermission } from '../types/index';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { apiService } from '../services/api';

interface ProjectTeamsSectionProps {
  projectId: string;
  canManage: boolean;
}

export const ProjectTeamsSection: React.FC<ProjectTeamsSectionProps> = ({
  projectId,
  canManage
}) => {
  const [projectTeams, setProjectTeams] = useState<ProjectTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectTeams();
  }, [projectId]);

  const fetchProjectTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getProjectTeams(projectId);
      setProjectTeams(response.teams);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch project teams';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to remove team "${teamName}" from this project?`)) {
      try {
        await apiService.removeProjectFromTeam(teamId, projectId);
        // Refresh the list
        await fetchProjectTeams();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to remove team from project');
      }
    }
  };

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
        return 'Read';
      case 'WRITE_SECRETS':
        return 'Write';
      case 'DELETE_SECRETS':
        return 'Delete';
      case 'MANAGE_ENVIRONMENTS':
        return 'Environments';
      case 'MANAGE_FOLDERS':
        return 'Folders';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center">
          <svg className="w-6 h-6 mr-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Assigned Teams ({projectTeams.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-800 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projectTeams.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No teams assigned to this project yet</p>
            <p className="text-sm mt-1">Teams can be assigned from the team management page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectTeams.map((projectTeam) => (
              <div
                key={projectTeam.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {projectTeam.team.name}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {projectTeam.team.memberCount} members
                      </span>
                    </div>
                    {projectTeam.team.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {projectTeam.team.description}
                      </p>
                    )}
                  </div>
                  
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTeam(projectTeam.team.id, projectTeam.team.name)}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {/* Permissions */}
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Permissions:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {projectTeam.permissions.length === 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        No permissions
                      </span>
                    ) : (
                      projectTeam.permissions.map((permission) => (
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
                  Assigned {formatDate(projectTeam.assignedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

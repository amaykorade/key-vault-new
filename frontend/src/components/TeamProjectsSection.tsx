import React, { useState, useEffect } from 'react';
import type { ProjectPermission, AssignProjectToTeamRequest, UpdateTeamProjectPermissionsRequest } from '../types/index';
import { useTeamStore } from '../stores/teams';
import { TeamProjectsList } from './TeamProjectsList';
import { AssignProjectModal } from './AssignProjectModal';
import { EditProjectPermissionsModal } from './EditProjectPermissionsModal';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface TeamProjectsSectionProps {
  teamId: string;
  organizationId: string;
  canManage: boolean;
}

export const TeamProjectsSection: React.FC<TeamProjectsSectionProps> = ({
  teamId,
  organizationId,
  canManage
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    name: string;
    permissions: ProjectPermission[];
  } | null>(null);

  const {
    teamProjects,
    loading,
    error,
    fetchTeamProjects,
    assignProjectToTeam,
    removeProjectFromTeam,
    updateTeamProjectPermissions,
    clearError
  } = useTeamStore();

  useEffect(() => {
    fetchTeamProjects(teamId);
  }, [teamId, fetchTeamProjects]);

  const handleAssignProject = async (data: AssignProjectToTeamRequest) => {
    await assignProjectToTeam(teamId, data);
  };

  const handleRemoveProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to remove "${projectName}" from this team? This action cannot be undone.`)) {
      await removeProjectFromTeam(teamId, projectId);
    }
  };

  const handleEditPermissions = (projectId: string, currentPermissions: ProjectPermission[]) => {
    const project = teamProjects.find(tp => tp.project.id === projectId);
    if (project) {
      setEditingProject({
        id: projectId,
        name: project.project.name,
        permissions: currentPermissions
      });
      setShowEditPermissionsModal(true);
    }
  };

  const handleUpdatePermissions = async (data: UpdateTeamProjectPermissionsRequest) => {
    if (editingProject) {
      await updateTeamProjectPermissions(teamId, editingProject.id, data);
      setEditingProject(null);
    }
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    clearError();
  };

  const handleCloseEditModal = () => {
    setShowEditPermissionsModal(false);
    setEditingProject(null);
    clearError();
  };

  const assignedProjectIds = teamProjects.map(tp => tp.project.id);

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Assigned Projects ({teamProjects.length})
          </CardTitle>
          {canManage && (
            <Button
              onClick={() => setShowAssignModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign Project
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <TeamProjectsList
          projects={teamProjects}
          canManage={canManage}
          onEditPermissions={handleEditPermissions}
          onRemoveProject={handleRemoveProject}
          loading={loading}
        />
      </CardContent>

      {/* Assign Project Modal */}
      <AssignProjectModal
        isOpen={showAssignModal}
        onClose={handleCloseAssignModal}
        onSubmit={handleAssignProject}
        organizationId={organizationId}
        assignedProjectIds={assignedProjectIds}
        loading={loading}
      />

      {/* Edit Permissions Modal */}
      {editingProject && (
        <EditProjectPermissionsModal
          isOpen={showEditPermissionsModal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdatePermissions}
          projectName={editingProject.name}
          currentPermissions={editingProject.permissions}
          loading={loading}
        />
      )}
    </Card>
  );
};

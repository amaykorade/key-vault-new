import React, { useState, useEffect } from 'react';
import type { Team, CreateTeamRequest, UpdateTeamRequest } from '../types/index';
import { useTeamStore } from '../stores/teams';
import { TeamCard } from './TeamCard';
import { CreateTeamModal } from './CreateTeamModal';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useNavigate } from 'react-router-dom';

interface TeamsSectionProps {
  organizationId: string;
  canCreateTeam: boolean;
}

export const TeamsSection: React.FC<TeamsSectionProps> = ({
  organizationId,
  canCreateTeam
}) => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  // const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const {
    teams,
    loading,
    error,
    fetchOrganizationTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    clearError
  } = useTeamStore();

  useEffect(() => {
    fetchOrganizationTeams(organizationId);
  }, [organizationId, fetchOrganizationTeams]);

  const handleCreateTeam = async (data: CreateTeamRequest | UpdateTeamRequest) => {
    await createTeam(organizationId, data as CreateTeamRequest);
  };

  const handleEditTeam = async (data: CreateTeamRequest | UpdateTeamRequest) => {
    if (teamToEdit) {
      await updateTeam(teamToEdit.id, data);
      setTeamToEdit(null);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      await deleteTeam(teamId);
    }
  };

  const handleViewTeamDetails = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const handleEditClick = (team: Team) => {
    setTeamToEdit(team);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setTeamToEdit(null);
    clearError();
  };

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Teams
          </CardTitle>
          {canCreateTeam && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Team
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

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-48"></div>
                      <div className="h-3 bg-gray-800 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">No teams yet</h3>
            <p className="text-gray-500 mb-4">Create your first team to organize your members and projects.</p>
            {canCreateTeam && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Create First Team
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onViewDetails={handleViewTeamDetails}
                onEdit={handleEditClick}
                onDelete={handleDeleteTeam}
                showActions={true}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={teamToEdit ? handleEditTeam : handleCreateTeam}
        team={teamToEdit || undefined}
        loading={loading}
      />
    </Card>
  );
};

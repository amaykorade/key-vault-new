import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeamStore } from '../stores/teams';
import { useAuthStore } from '../stores/auth';
import { TeamMembersList } from '../components/TeamMembersList';
import { InviteTeamMemberModal } from '../components/InviteTeamMemberModal';
import { PendingInvitations } from '../components/PendingInvitations';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { TeamProjectsSection } from '../components/TeamProjectsSection';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import type { UpdateTeamMemberRoleRequest, UpdateTeamRequest } from '../types/index';

export const TeamDetailsPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);

  const {
    currentTeam,
    loading,
    error,
    fetchTeamById,
    updateTeam,
    deleteTeam,
    // addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    clearCurrentTeam,
    clearError
  } = useTeamStore();

  useEffect(() => {
    if (teamId) {
      fetchTeamById(teamId);
    }
    
    return () => {
      clearCurrentTeam();
    };
  }, [teamId, fetchTeamById, clearCurrentTeam]);


  const handleRemoveMember = async (userId: string) => {
    if (teamId) {
      await removeTeamMember(teamId, userId);
    }
  };

  const handleUpdateMemberRole = async (userId: string, role: UpdateTeamMemberRoleRequest['role']) => {
    if (teamId) {
      await updateTeamMemberRole(teamId, userId, { role });
    }
  };

  const handleUpdateTeam = async (data: UpdateTeamRequest) => {
    if (teamId) {
      await updateTeam(teamId, data);
    }
  };

  const handleDeleteTeam = async () => {
    if (teamId && window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      await deleteTeam(teamId);
      navigate(`/organizations/${currentTeam?.organizationId}`);
    }
  };

  const canManageTeam = currentTeam?.members?.some(
    (member: any) => member.user.id === user?.id && member.role === 'LEAD'
  );

  const currentUserRole = currentTeam?.members?.find(
    (member: any) => member.user.id === user?.id
  )?.role || null;

  if (loading && !currentTeam) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-gray-400">Loading team...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-red-400 mb-4">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-gray-400 mb-4">Team not found</div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {currentTeam.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentTeam.name}</h1>
            <p className="text-gray-400">
              {currentTeam.organization?.name} • {currentTeam.members?.length || 0} members
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/organizations/${currentTeam.organizationId}`)}
            className="hover:bg-gray-700"
          >
            Back to Organization
          </Button>
          {canManageTeam && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowEditTeam(true)}
                className="hover:bg-blue-600 hover:border-blue-600 hover:text-white"
              >
                Edit Team
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDeleteTeam}
                className="hover:bg-red-600 hover:border-red-600 hover:text-white"
              >
                Delete Team
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Name</span>
                <span className="text-sm text-white font-medium">{currentTeam.name}</span>
              </div>
              {currentTeam.description && (
                <div className="flex justify-between items-start py-2 border-b border-gray-800">
                  <span className="text-sm font-medium text-gray-400">Description</span>
                  <span className="text-sm text-gray-300 text-right max-w-xs">{currentTeam.description}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Created</span>
                <span className="text-sm text-gray-300">
                  {new Date(currentTeam.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-400">Created By</span>
                <span className="text-sm text-gray-300">
                  {currentTeam.createdBy.name || currentTeam.createdBy.email}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {currentUserRole && (
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm font-medium text-gray-400">Role</span>
                  <span className="text-sm font-medium text-purple-400 bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-800">
                    {currentUserRole}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Organization</span>
                <span className="text-sm text-gray-300">{currentTeam.organization?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-400">Member Count</span>
                <span className="text-sm text-gray-300">{currentTeam.members?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Team Members ({currentTeam.members?.length || 0})
            </CardTitle>
            {canManageTeam && (
              <Button
                onClick={() => setShowInviteMember(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <TeamMembersList
            members={currentTeam.members || []}
            currentUserId={user?.id || ''}
            userRole={currentUserRole}
            onUpdateRole={handleUpdateMemberRole}
            onRemoveMember={handleRemoveMember}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <PendingInvitations
        teamId={currentTeam.id}
        canManage={canManageTeam || false}
      />

      {/* Team Projects */}
      <TeamProjectsSection
        teamId={currentTeam.id}
        organizationId={currentTeam.organizationId}
        canManage={canManageTeam || false}
      />

      {/* Modals */}
      <InviteTeamMemberModal
        isOpen={showInviteMember}
        onClose={() => setShowInviteMember(false)}
        onSuccess={() => {
          // Refresh team data
          if (teamId) {
            fetchTeamById(teamId);
          }
        }}
        teamId={currentTeam.id}
        organizationId={currentTeam.organizationId}
        existingMemberIds={currentTeam.members?.map((m: any) => m.user.id) || []}
        loading={loading}
      />

      <CreateTeamModal
        isOpen={showEditTeam}
        onClose={() => setShowEditTeam(false)}
        onSubmit={handleUpdateTeam}
        team={currentTeam}
        loading={loading}
      />
    </div>
  );
};

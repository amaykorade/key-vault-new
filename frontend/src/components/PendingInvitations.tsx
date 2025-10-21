import React, { useState, useEffect } from 'react';
import type { Invitation } from '../types/index';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { apiService } from '../services/api';

interface PendingInvitationsProps {
  organizationId?: string;
  teamId?: string;
  canManage: boolean;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  organizationId,
  teamId,
  canManage
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId || teamId) {
      fetchInvitations();
    }
  }, [organizationId, teamId]);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (teamId) {
        response = await apiService.getTeamInvitations(teamId);
      } else if (organizationId) {
        response = await apiService.getOrganizationInvitations(organizationId);
      }
      
      if (response) {
        setInvitations(response.invitations);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      return;
    }

    setActionLoading(`cancel-${invitationId}`);
    try {
      await apiService.cancelInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(`resend-${invitationId}`);
    try {
      const message = await apiService.resendInvitation(invitationId);
      console.log("resend email :", message)
      // Refresh invitations to get updated expiry
      await fetchInvitations();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to resend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const copyInvitationLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(invitationUrl).then(() => {
      // You could show a toast notification here
      alert('Invitation link copied to clipboard!');
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEMBER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-white">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show the section if there are no invitations
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <svg className="w-5 h-5 mr-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
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

        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {invitation.email}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                      {invitation.role}
                    </span>
                    {invitation.teamRole && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(invitation.teamRole)}`}>
                        Team {invitation.teamRole}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {invitation.team ? (
                      <>Invited to team: <strong>{invitation.team.name}</strong></>
                    ) : (
                      <>Invited to organization: <strong>{invitation.organization.name}</strong></>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div>Invited by {invitation.invitedBy.name || invitation.invitedBy.email}</div>
                    <div className={isExpiringSoon(invitation.expiresAt) ? 'text-orange-600 dark:text-orange-400' : ''}>
                      Expires {formatDate(invitation.expiresAt)}
                      {isExpiringSoon(invitation.expiresAt) && ' (Soon!)'}
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInvitationLink(invitation.id)} // Note: This should use the token, but we need to get it from the API
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900"
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={actionLoading === `resend-${invitation.id}`}
                      className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900"
                    >
                      {actionLoading === `resend-${invitation.id}` ? 'Resending...' : 'Resend'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                      disabled={actionLoading === `cancel-${invitation.id}`}
                      className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
                    >
                      {actionLoading === `cancel-${invitation.id}` ? 'Canceling...' : 'Cancel'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

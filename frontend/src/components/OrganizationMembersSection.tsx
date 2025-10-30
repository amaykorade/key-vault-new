import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface OrganizationMembersSectionProps {
  organizationId: string;
  userRole?: string;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MEMBER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  VIEWER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function OrganizationMembersSection({ organizationId, userRole }: OrganizationMembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const canManageMembers = userRole === 'OWNER' || userRole === 'ADMIN';

  useEffect(() => {
    if (organizationId) {
      fetchMembers();
      if (userRole === 'OWNER' || userRole === 'ADMIN') {
        fetchInvitations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, userRole]);

  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await apiService.getOrganizationMembers(organizationId);
      setMembers(response.members || []);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      // Don't show error toast, just fail silently
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await apiService.getOrganizationInvitations(organizationId);
      // Backend already filters for pending invitations (acceptedAt: null, not expired)
      setInvitations(response.invitations || []);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      setInvitations([]);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await apiService.cancelInvitation(invitationId);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await apiService.resendInvitation(invitationId);
      toast.success('Invitation resent');
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm font-semibold flex items-center">
            <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Members
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoadingMembers ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-3 h-12"></div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No members yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.filter(m => m.user).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {member.user?.name?.charAt(0).toUpperCase() || member.user?.email?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">
                      {member.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{member.user?.email || 'No email'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${ROLE_COLORS[member.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pending Invitations */}
        {canManageMembers && invitations.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white flex items-center">
                <div className="w-7 h-7 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Pending Invitations
              </h4>
              <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">
                {invitations.length}
              </span>
            </div>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-yellow-900/10 rounded-lg border border-yellow-500/20 hover:border-yellow-500/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm">{invitation.email}</p>
                    <p className="text-[11px] text-gray-400">
                      Invited {formatDate(invitation.createdAt)} • Expires {formatDate(invitation.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[invitation.role]}`}>
                      {invitation.role}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      title="Resend invitation email"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      title="Cancel this invitation"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


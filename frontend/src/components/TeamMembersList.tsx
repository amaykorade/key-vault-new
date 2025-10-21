import React, { useState } from 'react';
import type { TeamMember, TeamRole } from '../types/index';
import { Button } from './ui/Button';

interface TeamMembersListProps {
  members: TeamMember[];
  currentUserId: string;
  userRole: TeamRole | null;
  onUpdateRole: (userId: string, role: TeamRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  loading?: boolean;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  currentUserId,
  userRole,
  onUpdateRole,
  onRemoveMember,
  loading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManageMembers = userRole === 'LEAD';

  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MEMBER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: TeamRole) => {
    setActionLoading(`role-${userId}`);
    try {
      await onUpdateRole(userId, newRole);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    setActionLoading(`remove-${userId}`);
    try {
      await onRemoveMember(userId);
    } finally {
      setActionLoading(null);
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
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <p>No team members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {member.user.image ? (
                <img
                  src={member.user.image}
                  alt={member.user.name || member.user.email}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Member Info */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {member.user.name || member.user.email}
                  {member.user.id === currentUserId && (
                    <span className="text-xs text-gray-500 ml-2">(You)</span>
                  )}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                  {member.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {member.user.email} • Joined {formatDate(member.joinedAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          {canManageMembers && member.user.id !== currentUserId && (
            <div className="flex items-center gap-2">
              {/* Role Toggle */}
              <select
                value={member.role}
                onChange={(e) => handleRoleUpdate(member.user.id, e.target.value as TeamRole)}
                disabled={actionLoading === `role-${member.user.id}`}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="MEMBER">Member</option>
                <option value="LEAD">Lead</option>
              </select>

              {/* Remove Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMember(member.user.id)}
                disabled={actionLoading === `remove-${member.user.id}`}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
              >
                {actionLoading === `remove-${member.user.id}` ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          )}

          {/* Self-leave option */}
          {member.user.id === currentUserId && members.filter(m => m.role === 'LEAD').length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveMember(member.user.id)}
              disabled={actionLoading === `remove-${member.user.id}`}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
            >
              {actionLoading === `remove-${member.user.id}` ? 'Leaving...' : 'Leave Team'}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import type { Team, TeamRole } from '../types/index';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface TeamCardProps {
  team: Team;
  onViewDetails: (teamId: string) => void;
  onEdit?: (team: Team) => void;
  onDelete?: (teamId: string) => void;
  showActions?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onViewDetails,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const getRoleBadgeColor = (role: TeamRole | null) => {
    switch (role) {
      case 'LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MEMBER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEdit = team.userRole === 'LEAD';
  const canDelete = team.userRole === 'LEAD';

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {team.name}
            </h3>
            {team.userRole && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(team.userRole)}`}>
                {team.userRole}
              </span>
            )}
          </div>
          {team.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {team.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
          </span>
          <span>Created {formatDate(team.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Created by {team.createdBy.name || team.createdBy.email}
        </span>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(team.id)}
            className="flex-1"
          >
            View Details
          </Button>
          {canEdit && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(team)}
            >
              Edit
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(team.id)}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

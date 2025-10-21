import React, { useState, useEffect } from 'react';
import type { AddTeamMemberRequest, TeamRole, User } from '../types/index';
import { Button } from './ui/Button';
import { apiService } from '../services/api';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddTeamMemberRequest) => Promise<void>;
  organizationId: string;
  existingMemberIds: string[];
  loading?: boolean;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  organizationId,
  existingMemberIds,
  loading = false
}) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('MEMBER');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch organization members when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchOrganizationMembers();
    }
  }, [isOpen, organizationId]);

  const fetchOrganizationMembers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiService.getOrganizationMembers(organizationId);
      // Filter out users who are already team members
      const filteredUsers = response.members
        .filter((member: any) => !existingMemberIds.includes(member.user.id))
        .map((member: any) => member.user);
      
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to fetch organization members:', error);
      setErrors({ general: 'Failed to load organization members' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      setErrors({ user: 'Please select a user' });
      return;
    }

    try {
      await onSubmit({
        userId: selectedUserId,
        role: selectedRole
      });
      
      // Reset form and close modal
      setSelectedUserId('');
      setSelectedRole('MEMBER');
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
    setSelectedUserId('');
    setSelectedRole('MEMBER');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add Team Member
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

          <div className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select User *
              </label>
              {loadingUsers ? (
                <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              ) : availableUsers.length === 0 ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400">
                  No available users to add. All organization members are already in this team.
                </div>
              ) : (
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    if (errors.user) {
                      setErrors(prev => ({ ...prev, user: '' }));
                    }
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              {errors.user && (
                <p className="mt-1 text-sm text-red-600">{errors.user}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="MEMBER">Member</option>
                <option value="LEAD">Lead</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {selectedRole === 'LEAD' 
                  ? 'Leads can manage team members and settings' 
                  : 'Members can participate in team activities'
                }
              </p>
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
              disabled={loading || availableUsers.length === 0}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

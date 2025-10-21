import React, { useState, useEffect } from 'react';
import type { TeamRole, User } from '../types/index';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { apiService } from '../services/api';

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  organizationId: string;
  existingMemberIds: string[];
  loading?: boolean;
}

export const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  organizationId,
  existingMemberIds,
  // loading = false
}) => {
  const [inviteType, setInviteType] = useState<'email' | 'existing'>('email');
  const [email, setEmail] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamRole>('MEMBER');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch organization members when switching to existing user mode
  useEffect(() => {
    if (isOpen && inviteType === 'existing' && organizationId) {
      fetchOrganizationMembers();
    }
  }, [isOpen, inviteType, organizationId]);

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
    setErrors({});
    setSuccessMessage('');

    if (inviteType === 'email') {
      if (!email.trim()) {
        setErrors({ email: 'Email is required' });
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setErrors({ email: 'Please enter a valid email address' });
        return;
      }
    } else {
      if (!selectedUserId) {
        setErrors({ user: 'Please select a user' });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (inviteType === 'email') {
        // Send email invitation
        const response = await apiService.sendTeamInvitation(teamId, {
          email: email.trim(),
          role: 'MEMBER', // Default org role for team invitations
          teamRole: selectedRole
        });

        if (response.message) {
          setSuccessMessage(response.message);
          setTimeout(() => {
            handleClose();
            onSuccess();
          }, 2000);
        } else {
          setSuccessMessage('Invitation sent successfully!');
          setTimeout(() => {
            handleClose();
            onSuccess();
          }, 2000);
        }
      } else {
        // Add existing user directly
        await apiService.addTeamMember(teamId, {
          userId: selectedUserId,
          role: selectedRole
        });
        
        setSuccessMessage('Member added successfully!');
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 1500);
      }
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedUserId('');
    setSelectedRole('MEMBER');
    setErrors({});
    setSuccessMessage('');
    onClose();
  };

  const isFormValid = () => {
    if (inviteType === 'email') {
      return email.trim() && /\S+@\S+\.\S+/.test(email);
    } else {
      return selectedUserId;
    }
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

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Invitation Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Member By
              </label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setInviteType('email')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                    inviteType === 'email'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  disabled={submitting}
                >
                  Email Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setInviteType('existing')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    inviteType === 'existing'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  } ${inviteType === 'email' ? 'border-l-0' : ''}`}
                  disabled={submitting}
                >
                  Existing Member
                </button>
              </div>
            </div>

            {/* Email Invitation */}
            {inviteType === 'email' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="Enter email address"
                  error={errors.email}
                  disabled={submitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  An invitation link will be sent to this email address
                </p>
              </div>
            )}

            {/* Existing User Selection */}
            {inviteType === 'existing' && (
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
                    disabled={submitting}
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
            )}

            {/* Team Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Team Role
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TeamRole)}
                disabled={submitting}
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
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !isFormValid() || (inviteType === 'existing' && availableUsers.length === 0)}
              className="flex-1"
            >
              {submitting 
                ? (inviteType === 'email' ? 'Sending...' : 'Adding...') 
                : (inviteType === 'email' ? 'Send Invitation' : 'Add Member')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

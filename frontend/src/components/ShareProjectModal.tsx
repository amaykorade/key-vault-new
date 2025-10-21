import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { ProjectRole } from '../types/index';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onMemberAdded?: () => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onMemberAdded,
}) => {
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('READ');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers();
      setSearchQuery('');
      setSelectedUserId('');
      setSelectedRole('READ');
    }
  }, [isOpen, projectId]);

  const fetchAvailableMembers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAvailableProjectMembers(projectId);
      setAvailableMembers(response.members);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.addProjectMember(projectId, {
        userId: selectedUserId,
        role: selectedRole,
      });

      toast.success('Member added successfully');
      onMemberAdded?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: ProjectRole) => {
    const colors = {
      OWNER: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      WRITE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      READ: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[role];
  };

  const getRoleDescription = (role: ProjectRole) => {
    const descriptions = {
      OWNER: 'Full control - can manage members and delete project',
      ADMIN: 'Can manage members and all secrets',
      WRITE: 'Can create and edit secrets',
      READ: 'Can only view secrets',
    };
    return descriptions[role];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Share "{projectName}"
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Add organization members to this project
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['OWNER', 'ADMIN', 'WRITE', 'READ'] as ProjectRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedRole === role
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {role}
                    </span>
                    {selectedRole === role && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getRoleDescription(role)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Search Members */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No members found' : 'All organization members have access to this project'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedUserId(member.id)}
                  className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    selectedUserId === member.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {member.name?.[0] || member.email[0].toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {member.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>

                  {/* Org Role Badge */}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    member.orgRole === 'OWNER' ? 'bg-red-100 text-red-800' :
                    member.orgRole === 'ADMIN' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Org {member.orgRole}
                  </span>

                  {selectedUserId === member.id && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedUserId && (
              <span>
                Will add as <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(selectedRole)}`}>
                  {selectedRole}
                </span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId || submitting}
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


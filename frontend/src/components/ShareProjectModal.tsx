import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
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
      OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      ADMIN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      WRITE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      READ: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Share "{projectName}"
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Add organization members to this project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['OWNER', 'ADMIN', 'WRITE', 'READ'] as ProjectRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedRole === role
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${selectedRole === role ? 'text-emerald-400' : 'text-white'}`}>
                      {role}
                    </span>
                    {selectedRole === role && (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {getRoleDescription(role)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Search Members */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search organization members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-4 h-16"></div>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">
                  {searchQuery ? 'No members found' : 'All organization members have access to this project'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedUserId(member.id)}
                  className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    selectedUserId === member.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {member.name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-white truncate">
                      {member.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {member.email}
                    </div>
                  </div>

                  {/* Org Role Badge */}
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 flex-shrink-0">
                    Org {member.orgRole}
                  </span>

                  {selectedUserId === member.id && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-700">
          <div className="text-sm text-gray-300">
            {selectedUserId && (
              <span className="flex items-center space-x-2">
                <span>Will add as</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(selectedRole)}`}>
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
              className="hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleAddMember}
              disabled={!selectedUserId || submitting}
              loading={submitting}
              className="shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Member
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


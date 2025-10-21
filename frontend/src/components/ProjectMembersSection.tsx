import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, UserPlus, MoreVertical, Crown, Shield, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ShareProjectModal } from './ShareProjectModal';
import type { ProjectMember, ProjectRole } from '../types/index';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface ProjectMembersSectionProps {
  projectId: string;
  projectName: string;
  canManageMembers: boolean;
  currentUserId: string;
}

export const ProjectMembersSection: React.FC<ProjectMembersSectionProps> = ({
  projectId,
  projectName,
  canManageMembers,
  currentUserId,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowRoleMenu(null);
    if (showRoleMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showRoleMenu]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getProjectMembers(projectId);
      setMembers(response.members);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    try {
      await apiService.updateProjectMemberRole(projectId, userId, { role: newRole });
      toast.success('Member role updated');
      fetchMembers();
      setShowRoleMenu(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this project?`)) {
      return;
    }

    try {
      await apiService.removeProjectMember(projectId, userId);
      toast.success('Member removed');
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const getRoleIcon = (role: ProjectRole) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4" />;
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'WRITE':
        return <Edit className="w-4 h-4" />;
      case 'READ':
        return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: ProjectRole) => {
    const colors = {
      OWNER: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ADMIN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      WRITE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      READ: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[role];
  };

  return (
    <>
      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Project Members ({members.length})
          </CardTitle>
          {canManageMembers && (
            <Button
              onClick={() => setShowShareModal(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </Button>
          )}
        </CardHeader>

        <CardContent className="overflow-visible">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No members yet</p>
              {canManageMembers && (
                <Button
                  onClick={() => setShowShareModal(true)}
                  size="sm"
                  variant="outline"
                  className="mt-3"
                >
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 relative">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 relative"
                  style={{ zIndex: showRoleMenu === member.id ? 80 : 1 }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {member.user.name || 'No name'}
                      </span>
                      {member.user.id === currentUserId && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {member.user.email}
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageMembers) {
                          if (showRoleMenu === member.id) {
                            setShowRoleMenu(null);
                            setMenuPosition(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 8,
                              left: rect.right - 192, // 192px = w-48
                            });
                            setShowRoleMenu(member.id);
                          }
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getRoleBadge(member.role)} ${
                        canManageMembers ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      }`}
                    >
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                      {canManageMembers && member.user.id !== currentUserId && (
                        <MoreVertical className="w-3 h-3 ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Menu Portal - Renders at document.body level */}
      {showRoleMenu && canManageMembers && menuPosition && createPortal(
        <>
          <div 
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => {
              setShowRoleMenu(null);
              setMenuPosition(null);
            }}
          />
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-1"
            style={{ 
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999,
            }}
          >
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              Change Role
            </div>
            {(['OWNER', 'ADMIN', 'WRITE', 'READ'] as ProjectRole[]).map((role) => {
              const currentMember = members.find(m => m.id === showRoleMenu);
              return (
                <button
                  key={role}
                  onClick={() => {
                    if (currentMember) {
                      handleUpdateRole(currentMember.user.id, role);
                    }
                  }}
                  disabled={currentMember?.role === role}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                    currentMember?.role === role ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {getRoleIcon(role)}
                  {role}
                  {currentMember?.role === role && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              );
            })}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1"></div>
            <button
              onClick={() => {
                const currentMember = members.find(m => m.id === showRoleMenu);
                if (currentMember) {
                  handleRemoveMember(currentMember.user.id, currentMember.user.name || currentMember.user.email);
                }
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </>
      , document.body)}

      {/* Share Modal */}
      <ShareProjectModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectId={projectId}
        projectName={projectName}
        onMemberAdded={fetchMembers}
      />
    </>
  );
};


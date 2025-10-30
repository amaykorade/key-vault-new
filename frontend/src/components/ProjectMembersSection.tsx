import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Crown, Shield, Edit, Eye, Trash2 } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(`pm_collapsed:${projectId}`);
      return stored ? stored === 'true' : true; // default collapsed
    } catch {
      return true;
    }
  });

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
      OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      ADMIN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      WRITE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      READ: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[role];
  };

  return (
    <>
      <Card className="overflow-visible hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const next = !isCollapsed;
                setIsCollapsed(next);
                try { localStorage.setItem(`pm_collapsed:${projectId}`, String(next)); } catch {}
              }}
              className="flex items-center flex-1 text-left hover:opacity-80 transition-opacity"
            >
              <CardTitle className="text-white text-sm font-semibold flex items-center">
                <svg 
                  className={`w-4 h-4 mr-2 text-indigo-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 9.288 0M15 7a3 3 0 1-6 0 3 3 0 0 6 0zm6 3a2 2 0 1-4 0 2 2 0 0 4 0zM7 10a2 2 0 1-4 0 2 2 0 0 4 0z" />
                </svg>
                Project Members
                {!isCollapsed && members.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full">
                    {members.length}
                  </span>
                )}
              </CardTitle>
            </button>
            {!isCollapsed && canManageMembers && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setShowShareModal(true)}
                className="flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Add Member</span>
              </Button>
            )}
          </div>
        </CardHeader>

        {!isCollapsed && (
        <CardContent className="overflow-visible pt-0">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-3 h-12"></div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 09.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-400 mb-3 text-sm">No members yet</p>
              {canManageMembers && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                  className="shadow-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 relative">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all relative"
                  style={{ zIndex: showRoleMenu === member.id ? 80 : 1 }}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-white truncate text-sm">
                          {member.user.name || 'Unknown'}
                        </p>
                        {member.user.id === currentUserId && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">You</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                    </div>
                  </div>

                  {/* Role Badge & Menu */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageMembers && member.user.id !== currentUserId) {
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
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(member.role)} ${
                        canManageMembers && member.user.id !== currentUserId ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
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
        )}
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
            className="fixed w-48 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 py-1"
            style={{ 
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: 9999,
            }}
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">
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
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                    currentMember?.role === role ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'
                  } disabled:cursor-not-allowed`}
                >
                  {getRoleIcon(role)}
                  {role}
                  {currentMember?.role === role && (
                    <svg className="ml-auto w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
            <div className="border-t border-gray-700 mt-1"></div>
            <button
              onClick={() => {
                const currentMember = members.find(m => m.id === showRoleMenu);
                if (currentMember) {
                  handleRemoveMember(currentMember.user.id, currentMember.user.name || currentMember.user.email);
                }
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Member
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


import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '../../constants';
// import { useLayoutStore } from '../../stores/layout';
import { useAuthStore } from '../../stores/auth';
import { useOrganizationsStore } from '../../stores/organizations';
import { SidebarLink } from '../ui/SidebarLink';
import { apiService } from '../../services/api';
import type { Project } from '../../types';

// legacy helper removed; kept for compatibility in older code references

export function Sidebar() {
  const collapsed = false;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { organizations, currentOrganization, setCurrentOrganization, fetchOrganizations } = useOrganizationsStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Restore last selected workspace from localStorage
  useEffect(() => {
    const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
    if (lastWorkspaceId && organizations.length > 0) {
      const workspace = organizations.find((org) => org.id === lastWorkspaceId);
      if (workspace && !currentOrganization) {
        setCurrentOrganization(workspace);
      }
    }
  }, [organizations, currentOrganization, setCurrentOrganization]);

  // Persist workspace selection
  useEffect(() => {
    if (currentOrganization?.id) {
      localStorage.setItem('lastWorkspaceId', currentOrganization.id);
    }
  }, [currentOrganization]);

  // Detect and fetch current project from URL
  useEffect(() => {
    const match = location.pathname.match(/^\/projects\/([^\/]+)/);
    if (match) {
      const projectId = match[1];
      // Fetch project details
      apiService.getProject(projectId).then((res) => {
        setCurrentProject(res.project);
      }).catch(() => {
        setCurrentProject(null);
      });
    } else {
      setCurrentProject(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      setIsCreatingWorkspace(true);
      const slug = newWorkspaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await apiService.createOrganization({ name: newWorkspaceName.trim(), slug });
      await fetchOrganizations();
      setCurrentOrganization(res.organization);
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };

    if (showUserMenu || showWorkspaceMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showWorkspaceMenu]);

  return (
    <>
    <aside className={`hidden lg:block w-64 flex-none bg-gray-900/50 backdrop-blur-sm h-screen sticky top-0 border-r border-gray-800 flex flex-col overflow-y-auto`}>
      {/* Brand/Logo Section */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Key Vault</h1>
            <p className="text-xs text-gray-400">Secure Secrets</p>
          </div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="p-4 border-b border-gray-800 relative" ref={workspaceMenuRef}>
        <button
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-sm font-medium text-white truncate">
                {currentOrganization?.name || 'Select workspace'}
              </div>
              <div className="text-xs text-gray-400">Workspace</div>
            </div>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showWorkspaceMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Workspace Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute left-4 right-4 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              {organizations.length > 0 ? (
                <>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setCurrentOrganization(org);
                        setShowWorkspaceMenu(false);
                        navigate(`/organizations/${org.id}`);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentOrganization?.id === org.id
                          ? 'bg-emerald-600/20 text-emerald-400'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{org.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="truncate">{org.name}</div>
                      </div>
                      {currentOrganization?.id === org.id && (
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-700 my-2"></div>
                </>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">No workspaces</div>
              )}
              <button
                onClick={() => {
                  setShowWorkspaceMenu(false);
                  setShowCreateWorkspace(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-emerald-400 hover:bg-emerald-600/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-1">
        <nav className="p-4 space-y-1">
          <div>
            <SidebarLink
              to={ROUTES.PROJECTS}
              collapsed={collapsed}
              label="Projects"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
            />
            {currentProject && (
              <SidebarLink
                to={`/projects/${currentProject.id}`}
                collapsed={collapsed}
                label={currentProject.name}
                nested
              />
            )}
          </div>
          <SidebarLink
            to={ROUTES.API}
            collapsed={collapsed}
            label="Documentation"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <SidebarLink
            to={ROUTES.SETTINGS}
            collapsed={collapsed}
            label="Settings"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </nav>

        {/* User Account Section - This will be pushed to the bottom */}
        <div className="mt-auto p-4 border-t border-gray-800 relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-all duration-200 group`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name || user.email} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              getUserInitials(user?.name, user?.email)
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* User Menu Dropdown */}
        {showUserMenu && !collapsed && (
          <div className="absolute bottom-20 left-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-2">
              <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700 mb-2">
                Account
              </div>
              <div className="px-3 py-2 text-sm text-gray-300">
                <div className="font-medium text-white">{user?.name || 'User'}</div>
                <div className="text-gray-400">{user?.email}</div>
                {user?.lastLoginAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsed User Menu */}
        {showUserMenu && collapsed && (
          <div className="absolute bottom-20 left-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

    </aside>

    {/* Create Workspace Modal - Full Page */}
    {showCreateWorkspace && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100] animate-fade-in">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-white font-semibold text-lg">Create Workspace</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Workspace name</label>
              <input
                className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none focus:border-gray-700 focus-visible:border-gray-700 appearance-none"
                placeholder="e.g., My Company"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateWorkspace();
                  } else if (e.key === 'Escape') {
                    setShowCreateWorkspace(false);
                    setNewWorkspaceName('');
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
            <button 
              className="px-4 py-2 text-sm rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800" 
              onClick={() => {
                setShowCreateWorkspace(false);
                setNewWorkspaceName('');
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
              disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
              onClick={handleCreateWorkspace}
            >
              {isCreatingWorkspace ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Sidebar;
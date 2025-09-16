import { NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { ROUTES } from '../../constants';
import { useLayoutStore } from '../../stores/layout';
import { useAuthStore } from '../../stores/auth';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return (
    'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover-lift ' +
    (isActive
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
      : 'text-gray-300 hover:bg-gray-800 hover:text-white')
  );
}

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <aside className={`hidden lg:block ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-gray-900/50 backdrop-blur-sm min-h-screen border-r border-gray-800 flex flex-col`}>
      {/* Brand/Logo Section */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
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
          )}
          <button
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-1">
        <nav className="p-4 space-y-2">
          <NavLink to={ROUTES.DASHBOARD} className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink to={ROUTES.ORGANIZATIONS} className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {!collapsed && <span>Organizations</span>}
          </NavLink>
          <NavLink to={ROUTES.PROJECTS} className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            {!collapsed && <span>Projects</span>}
          </NavLink>
          <NavLink to={ROUTES.SECRETS} className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {!collapsed && <span>Secrets</span>}
          </NavLink>
          <NavLink to={ROUTES.SETTINGS} className={navLinkClass}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        {/* User Account Section - This will be pushed to the bottom */}
        <div className="mt-auto p-4 border-t border-gray-800 relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-all duration-200 group"
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
  );
}

export default Sidebar;
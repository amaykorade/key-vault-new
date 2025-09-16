import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🔐</span>
              </div>
              <span className="font-bold text-xl gradient-text">Key Vault</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-300">
              Welcome, <span className="font-medium text-white">{user?.name || user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={logout}
              className="hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-200"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
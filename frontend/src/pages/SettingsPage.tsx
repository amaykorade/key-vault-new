import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      logout();
      toast.success('Logged out successfully');
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedMemberSince =
    user?.createdAt &&
    new Date(user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your account details and security preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Account overview */}
        <Card className="md:col-span-2 border border-gray-800 bg-gray-900/60">
          <CardHeader>
            <CardTitle className="text-base text-white">Account</CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Basic information about your Key Vault account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                <p className="text-sm text-white">
                  {user?.name || '—'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Used across workspaces, teams and audit logs.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                <p className="text-sm text-white">
                  {user?.email || 'N/A'}
                </p>
                <p className="text-[11px] text-gray-500">
                  Primary login and notification address.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-800 pt-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Member since</p>
                <p className="text-sm text-white">
                  {formattedMemberSince || '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Account ID</p>
                <p className="text-sm text-gray-400 truncate">
                  {user?.id || 'Hidden'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / session */}
        <Card className="border border-gray-800 bg-gray-900/60">
          <CardHeader>
            <CardTitle className="text-base text-white">Session</CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Sign out from this browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-400">
              Logging out will revoke access for this browser. Your teams, projects and
              secrets are not affected.
            </p>
            <Button
              variant="danger"
              onClick={handleLogout}
              loading={isLoading}
              className="w-full"
            >
              Log out of this device
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ROUTES } from '../constants';

export function CliAuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const userCode = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    if (!userCode) {
      setStatus('error');
      setError('No authorization code provided');
      return;
    }

    // Check if we're coming back from login (check sessionStorage)
    const storedRedirect = sessionStorage.getItem('cliAuthRedirect');
    if (storedRedirect && storedRedirect.includes(userCode)) {
      // We're coming back from login, clear the stored redirect after a moment
      setTimeout(() => {
        sessionStorage.removeItem('cliAuthRedirect');
      }, 1000);
    }

    // Reload token from localStorage (in case it was just set by OAuth callback)
    apiService.reloadToken();

    // Small delay to ensure token is loaded after OAuth redirect
    const checkAuth = async () => {
      // Wait a bit for token to be available after OAuth redirect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reload token again after delay
      apiService.reloadToken();
      
      // Check if user is authenticated by checking both store and API service
      const apiServiceAuthenticated = apiService.isAuthenticated();
      
      if (!isAuthenticated && !apiServiceAuthenticated) {
        setStatus('unauthorized');
        return;
      }

      // If store says not authenticated but API service has token, reload user
      if (!isAuthenticated && apiServiceAuthenticated) {
        // Token exists but user state not loaded, try to get user
        try {
          await useAuthStore.getState().getCurrentUser();
          setStatus('loading');
        } catch {
          setStatus('unauthorized');
        }
        return;
      }

      // User is authenticated and has a code, ready to authorize
      setStatus('loading');
    };
    
    checkAuth();
  }, [userCode, isAuthenticated]);

  const handleAuthorize = async () => {
    if (!userCode) return;

    try {
      setAuthorizing(true);
      
      // Reload token before authorizing (in case it was just set)
      apiService.reloadToken();
      
      // Verify we have a token
      if (!apiService.isAuthenticated()) {
        setStatus('error');
        setError('Not authenticated. Please log in and try again.');
        setAuthorizing(false);
        return;
      }
      
      const result = await apiService.authorizeCliDeviceCode(userCode, tokenName || undefined);

      if (result.success) {
        setStatus('success');
        // Close window after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        setStatus('error');
        setError('Failed to authorize device');
      }
    } catch (err: any) {
      setStatus('error');
      // Provide more detailed error message
      if (err.status === 401) {
        setError('Authentication failed. Please try logging in again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to authorize device. Please check your connection and try again.');
      }
      console.error('Authorization error:', err);
    } finally {
      setAuthorizing(false);
    }
  };

  const handleLogin = () => {
    // Store the current URL (with user code) in sessionStorage
    // This ensures we can redirect back after login, even with OAuth
    const currentUrl = window.location.href;
    sessionStorage.setItem('cliAuthRedirect', currentUrl);
    
    // Redirect to login with current URL as redirect parameter
    window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  };

  if (!userCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white">Invalid Authorization Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">No authorization code provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white">Login Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              You need to be logged in to authorize the CLI device.
            </p>
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Card className="max-w-md w-full border-emerald-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Device Authorized
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-emerald-300">
              Your CLI device has been successfully authorized!
            </p>
            <p className="text-sm text-gray-400">
              You can close this window and return to your terminal. The CLI will automatically receive the authorization token.
            </p>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-300">
                This window will close automatically in a few seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Card className="max-w-md w-full border-red-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Authorization Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-300">{error || 'Failed to authorize device'}</p>
            <button
              onClick={() => window.close()}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-white">Authorize CLI Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <h3 className="font-semibold text-blue-300 mb-1">CLI Authorization Request</h3>
                <p className="text-sm text-blue-200">
                  A CLI device is requesting access to your APIVault account.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Authorization Code</span>
                <code className="px-2 py-1 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-emerald-400 font-mono text-sm rounded">
                  {userCode}
                </code>
              </div>
              {user && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Authorizing as</span>
                  <span className="text-sm text-white font-medium">{user.email}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Token Name (Optional)
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g., MacBook Pro, CI/CD Pipeline"
              className="w-full px-4 py-2 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Give this CLI token a descriptive name to identify it later
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              ⚠️ <strong>Security Notice:</strong> Only authorize devices you trust. This will grant the CLI full access to your account based on your current permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.close()}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAuthorize}
              disabled={authorizing}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authorizing ? 'Authorizing...' : 'Authorize Device'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CliAuthPage;


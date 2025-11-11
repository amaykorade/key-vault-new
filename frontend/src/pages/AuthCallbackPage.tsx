import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { ROUTES } from '../constants';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUserAfterToken = useAuthStore((state) => state.getCurrentUser);

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') || undefined;
    const redirectUrl = params.get('redirect') || sessionStorage.getItem('cliAuthRedirect');

    if (accessToken) {
      apiService.applyTokens(accessToken, refreshToken);
      // Clear the stored redirect if it was from sessionStorage
      if (sessionStorage.getItem('cliAuthRedirect')) {
        sessionStorage.removeItem('cliAuthRedirect');
      }
      
      // Fetch current user and redirect
      setUserAfterToken().finally(() => {
        // If there's a redirect URL, use it; otherwise go to projects
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          navigate(ROUTES.PROJECTS, { replace: true });
        }
      });
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [params, navigate, setUserAfterToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default AuthCallbackPage;



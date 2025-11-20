/**
 * GitHub OAuth utilities for private repository access
 */

export function getGitHubClientId(): string {
  // In Next.js, NEXT_PUBLIC_ variables are available on both client and server
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
  
  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[GitHub Auth] Reading NEXT_PUBLIC_GITHUB_CLIENT_ID:', {
      exists: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      value: clientId ? `${clientId.substring(0, 4)}...` : 'empty',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('GITHUB'))
    });
  }
  
  return clientId;
}

export function getGitHubClientSecret(): string {
  return process.env.GITHUB_CLIENT_SECRET || '';
}

export function getGitHubCallbackUrl(): string {
  // Server-side: use environment variable
  if (typeof window === 'undefined') {
    const callbackUrl = process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL;
    if (!callbackUrl) {
      console.warn('NEXT_PUBLIC_GITHUB_CALLBACK_URL not set. OAuth may not work correctly.');
    }
    return callbackUrl || '';
  }
  
  // Client-side: use environment variable or construct from current origin (auto-detects port)
  return process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || `${window.location.origin}/api/auth/github/callback`;
}

/**
 * Get GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(state?: string): string {
  const clientId = getGitHubClientId();
  const callbackUrl = getGitHubCallbackUrl();
  
  // Debug logging
  console.log('[GitHub Auth] Client ID:', clientId ? `${clientId.substring(0, 4)}...` : 'NOT SET');
  console.log('[GitHub Auth] Callback URL:', callbackUrl || 'NOT SET');
  
  // Check if Client ID is missing or is a placeholder
  if (!clientId || 
      clientId === 'your_github_client_id_here' || 
      clientId.trim() === '' ||
      clientId.length < 10) {
    console.error('[GitHub Auth] Client ID validation failed:', { 
      hasClientId: !!clientId, 
      length: clientId?.length,
      value: clientId 
    });
    throw new Error(`GitHub Client ID not configured. Current value: "${clientId || 'empty'}". Please set NEXT_PUBLIC_GITHUB_CLIENT_ID in your .env.local file and restart the dev server.`);
  }
  
  if (!callbackUrl || callbackUrl.trim() === '') {
    console.error('[GitHub Auth] Callback URL validation failed:', { callbackUrl });
    throw new Error('GitHub Callback URL not configured. Please set NEXT_PUBLIC_GITHUB_CALLBACK_URL in your .env.local file.');
  }
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: 'repo', // Access to private repositories
    state: state || Math.random().toString(36).substring(7),
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange GitHub OAuth code for access token
 */
export async function exchangeGitHubCode(code: string): Promise<{ access_token: string; scope: string }> {
  const clientId = getGitHubClientId();
  const clientSecret = getGitHubClientSecret();
  
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.');
  }
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const responseText = await response.text();
  let data: any;
  
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('Failed to parse GitHub response:', responseText);
    throw new Error(`GitHub API returned invalid response: ${response.status} ${response.statusText}`);
  }

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || `HTTP ${response.status}: ${response.statusText}`;
    console.error('GitHub OAuth exchange error:', { 
      status: response.status, 
      error: data.error, 
      errorDescription: data.error_description,
      response: responseText 
    });
    throw new Error(errorMsg);
  }

  if (!data.access_token) {
    throw new Error('GitHub OAuth response missing access_token');
  }

  return {
    access_token: data.access_token,
    scope: data.scope || '',
  };
}

/**
 * Get GitHub user info from access token
 */
export async function getGitHubUser(accessToken: string): Promise<{ login: string; name: string; avatar_url: string }> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  return response.json();
}

/**
 * Check if a repository is private
 */
export async function isPrivateRepo(owner: string, repo: string, accessToken?: string): Promise<boolean> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found');
    }
    if (response.status === 403) {
      // Rate limit or no access
      throw new Error('Access denied. Repository may be private or rate limit exceeded.');
    }
    throw new Error('Failed to check repository status');
  }

  const data = await response.json();
  return data.private === true;
}

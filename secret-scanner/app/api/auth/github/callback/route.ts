import { NextRequest, NextResponse } from 'next/server';
import { exchangeGitHubCode, getGitHubUser } from '@/lib/github-auth';

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for GitHub OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorDescription || error || 'GitHub OAuth authorization failed')}`, request.url)
      );
    }

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('GitHub OAuth code not provided')}`, request.url)
      );
    }

    // Check if environment variables are set
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth not configured:', { hasClientId: !!clientId, hasClientSecret: !!clientSecret });
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.')}`, request.url)
      );
    }

    // Exchange code for access token
    let access_token: string;
    let scope: string;
    
    try {
      const result = await exchangeGitHubCode(code);
      access_token = result.access_token;
      scope = result.scope;
    } catch (error: any) {
      console.error('Failed to exchange code:', error);
      const errorMsg = error?.message || 'Failed to exchange GitHub OAuth code';
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    // Get user info
    let user: { login: string; name: string; avatar_url: string };
    try {
      user = await getGitHubUser(access_token);
    } catch (error: any) {
      console.error('Failed to get user info:', error);
      const errorMsg = error?.message || 'Failed to fetch GitHub user information';
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }

    // Parse redirect URL from state
    let redirectUrl = '/';
    if (state && state.includes(':')) {
      const parts = state.split(':');
      if (parts.length > 1) {
        redirectUrl = decodeURIComponent(parts.slice(1).join(':'));
      }
    }

    // Redirect to frontend with token (store in sessionStorage on client)
    const frontendUrl = new URL(redirectUrl, request.url);
    frontendUrl.searchParams.set('github_token', access_token);
    frontendUrl.searchParams.set('github_user', user.login);
    frontendUrl.searchParams.set('github_scope', scope);

    return NextResponse.redirect(frontendUrl);
  } catch (error) {
    console.error('GitHub callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'GitHub OAuth failed';
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}


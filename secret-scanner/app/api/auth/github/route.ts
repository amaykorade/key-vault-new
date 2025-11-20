import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAuthUrl } from '@/lib/github-auth';

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Debug: Check environment variables on server
    console.log('[API] Environment check:', {
      hasClientId: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      clientIdPreview: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ? `${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID.substring(0, 4)}...` : 'NOT SET',
      hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
      hasCallbackUrl: !!process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL,
      callbackUrl: process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL || 'NOT SET',
    });

    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || Math.random().toString(36).substring(7);
    const redirectUrl = searchParams.get('redirect') || '/';

    // Store redirect URL in state (encode it)
    const stateWithRedirect = `${state}:${encodeURIComponent(redirectUrl)}`;

    const authUrl = getGitHubAuthUrl(stateWithRedirect);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[API] GitHub auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate GitHub OAuth';
    return NextResponse.json(
      { 
        error: errorMessage,
        message: 'Please configure GitHub OAuth credentials in your .env.local file and restart the dev server. See GITHUB_OAUTH_SETTINGS.md for instructions.',
        debug: process.env.NODE_ENV === 'development' ? {
          hasClientId: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
          hasCallbackUrl: !!process.env.NEXT_PUBLIC_GITHUB_CALLBACK_URL,
        } : undefined,
      },
      { status: 500 }
    );
  }
}


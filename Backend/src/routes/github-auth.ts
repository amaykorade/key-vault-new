import { Router } from 'express';
import passport from '../lib/passport';
import { generateTokens } from '../lib/auth';
import { db } from '../lib/db';
import { loadEnv } from '../config/env';

const router = Router();

// Check if GitHub OAuth is configured (using same env loader as passport)
const isGitHubConfigured = () => {
  try {
    const env = loadEnv();
    return !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  } catch {
    return false;
  }
};

// Check if GitHub strategy is registered in passport
const isGitHubStrategyRegistered = () => {
  try {
    // Try to get the strategy - if it doesn't exist, this will throw
    const strategy = (passport as any)._strategies?.github;
    return !!strategy;
  } catch {
    return false;
  }
};

// GitHub OAuth login
router.get('/github', (req, res, next) => {
  if (!isGitHubConfigured() || !isGitHubStrategyRegistered()) {
    return res.status(503).json({ 
      error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.' 
    });
  }
  passport.authenticate('github', {
    scope: ['user:email']
  })(req, res, next);
});

// GitHub OAuth callback
router.get('/github/callback', (req, res, next) => {
  if (!isGitHubConfigured() || !isGitHubStrategyRegistered()) {
    return res.status(503).json({ 
      error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.' 
    });
  }
  passport.authenticate('github', { session: false })(req, res, async (err) => {
    if (err) {
      return res.status(401).json({ error: 'GitHub authentication failed' });
    }
    
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: 'GitHub authentication failed' });
      }

      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Redirect to frontend callback
      // The frontend will check sessionStorage for cliAuthRedirect
      const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  });
});

// Get GitHub OAuth URL (for frontend to redirect to)
router.get('/github/url', (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback';
  
  if (!githubClientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${githubClientId}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `scope=user:email`;

  res.json({ authUrl: githubAuthUrl });
});

export default router;


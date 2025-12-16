import { Router } from 'express';
import passport from '../lib/passport';
import { generateTokens } from '../lib/auth';
import { db } from '../lib/db';

const router = Router();

// Google OAuth login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: 'Google authentication failed' });
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
      console.error('Google callback error:', error);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  }
);

// Get Google OAuth URL (for frontend to redirect to)
router.get('/google/url', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';
  
  if (!googleClientId) {
    return res.status(500).json({ error: 'Google OAuth not configured' });
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleClientId}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `scope=profile email&` +
    `response_type=code&` +
    `access_type=offline`;

  res.json({ authUrl: googleAuthUrl });
});

export default router;

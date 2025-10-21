import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from './lib/passport';
import authRoutes from './routes/auth';
import googleAuthRoutes from './routes/google-auth';
import organizationRoutes from './routes/organizations';
import projectRoutes from './routes/projects';
import secretRoutes from './routes/secrets';
import teamRoutes from './routes/teams';
import invitationRoutes from './routes/invitations';
import { requireAuth, AuthRequest } from './middleware/auth';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin, credentials: true }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);

// Organization routes
app.use('/api/organizations', organizationRoutes);

// Project routes
app.use('/api/projects', projectRoutes);

// Secret routes
app.use('/api/secrets', secretRoutes);

// Team routes
app.use('/api', teamRoutes);

// Invitation routes
app.use('/api', invitationRoutes);

// Protected route example
app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
	res.json({ user: req.user });
});

// Debug email configuration (temporarily without auth for testing)
app.get('/api/debug/email-config', (req, res) => {
	const { loadEnv } = require('./config/env');
	const env = loadEnv();
	
	res.json({
		emailConfigured: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
		config: {
			SMTP_HOST: env.SMTP_HOST || 'Not set',
			SMTP_PORT: env.SMTP_PORT || 'Not set',
			SMTP_SECURE: env.SMTP_SECURE || 'Not set',
			SMTP_USER: env.SMTP_USER || 'Not set',
			SMTP_PASS: env.SMTP_PASS ? '***' : 'Not set',
			FROM_EMAIL: env.FROM_EMAIL || 'Not set',
			FROM_NAME: env.FROM_NAME || 'Not set',
			FRONTEND_URL: env.FRONTEND_URL || 'Not set'
		}
	});
});

// Test invitation email sending (temporarily without auth)
app.post('/api/debug/test-invitation-email', async (req, res) => {
	try {
		const { EmailService } = require('./services/email');
		
		await EmailService.sendTeamInvitationEmail({
			inviteeEmail: req.body.email || 'test@example.com',
			inviterName: 'Test User',
			organizationName: 'Test Organization',
			teamName: 'Test Team',
			role: 'MEMBER',
			teamRole: 'MEMBER',
			invitationToken: 'test-token-123',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
		});
		
		res.json({ success: true, message: 'Test invitation email sent!' });
	} catch (error) {
		console.error('Test invitation email error:', error);
		res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
	}
});

export default app;

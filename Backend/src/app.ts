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
import auditRoutes from './routes/audit';
import publicSecretsRoutes from './routes/public-secrets';
import apiKeysRoutes from './routes/api-keys';
import tokensRoutes from './routes/tokens';
import vercelRoutes from './routes/vercel';
import { requireAuth, AuthRequest } from './middleware/auth';
import cliRoutes from './routes/cli';
import folderRoutes from './routes/folders';
import publicRoutes from './routes/public';
import path from 'path';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve Google Search Console verification file
app.get('/googlec41d96065722b6ef.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/googlec41d96065722b6ef.html'));
});

// Serve robots.txt and sitemap.xml if needed
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /api/\n');
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.api.apivault.it.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// CORS configuration - allow frontend origin(s)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Support multiple origins (comma-separated) or single origin
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost origins
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    console.warn('[CORS] Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware for OAuth
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction, // Trust proxy in production (Render)
  cookie: { 
    secure: isProduction, // Use secure cookies in production
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax', // Required for cross-origin cookies
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check with detailed information
app.get('/health', async (_req, res) => {
	try {
		// Check database connection
		const { db } = require('./lib/db');
		await db.$queryRaw`SELECT 1`;
		
		res.status(200).json({ 
			status: 'ok',
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV || 'development',
			database: 'connected'
		});
	} catch (error) {
		res.status(503).json({ 
			status: 'error',
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV || 'development',
			database: 'disconnected',
			error: error instanceof Error ? error.message : 'Unknown error'
		});
	}
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
app.use('/api/projects', folderRoutes);

// Team routes
app.use('/api', teamRoutes);

// Invitation routes
app.use('/api', invitationRoutes);

// Audit routes
app.use('/api/audit', auditRoutes);

// Public API (API key auth)
app.use('/api/v1', publicSecretsRoutes);
app.use('/api', apiKeysRoutes);
app.use('/api', tokensRoutes);
app.use('/api/public', publicRoutes);

// Vercel integration routes
app.use('/api/vercel', vercelRoutes);
app.use('/api/auth/vercel', vercelRoutes); // OAuth callback
app.use('/api', cliRoutes);

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

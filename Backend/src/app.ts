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

// Protected route example
app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
	res.json({ user: req.user });
});

export default app;

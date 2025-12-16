import { Router } from 'express';
import { db } from '../lib/db';
import { AuthSchema, hashPassword, verifyPassword, generateTokens } from '../lib/auth';
import { AuditService } from '../services/audit';

const router = Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = AuthSchema.signup.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = AuthSchema.login.parse(req.body);

    // Find user
    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Log failed login attempt
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');
      AuditService.logUserLogin('unknown', false, ipAddress, userAgent).catch(console.error);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Log failed login attempt
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');
      AuditService.logUserLogin(user.id, false, ipAddress, userAgent).catch(console.error);
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Log successful login
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    AuditService.logUserLogin(user.id, true, ipAddress, userAgent).catch(console.error);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

export default router;

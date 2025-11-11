import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/auth';
import { db } from '../lib/db';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string | null;
    }
  }
}

export interface AuthRequest extends Request {
  user?: Express.User;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const authHeader = req.headers.authorization;
    console.error('Auth error details:', {
      error: errorMessage,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) || 'none',
    });
    res.status(401).json({ error: 'Invalid token', details: errorMessage });
  }
}

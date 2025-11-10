import { NextFunction, Response } from 'express';
import crypto from 'crypto';
import { db } from '../lib/db';
import { AuthRequest } from './auth';

export interface CliAuthRequest extends AuthRequest {
  cliTokenId?: string;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requireCliAuth(req: CliAuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'CLI token required' });
    }

    const token = header.substring(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'CLI token required' });
    }

    const tokenHash = hashToken(token);
    const record = await db.cliToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!record || !record.user) {
      return res.status(401).json({ error: 'Invalid CLI token' });
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      await db.cliToken.delete({ where: { id: record.id } }).catch(() => {});
      return res.status(401).json({ error: 'CLI token expired' });
    }

    req.user = record.user;
    req.cliTokenId = record.id;

    await db.cliToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    next();
  } catch (error) {
    console.error('[cli-auth] error verifying token', error);
    res.status(401).json({ error: 'Invalid CLI token' });
  }
}


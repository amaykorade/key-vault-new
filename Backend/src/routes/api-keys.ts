import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { db } from '../lib/db';
import { z } from 'zod';
import { AccessControlService } from '../services/access-control';

const router = Router();

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
  environments: z.array(z.string()).optional(),
  folders: z.array(z.string()).optional(),
  ipAllowlist: z.array(z.string()).optional(),
});

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 chars
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Create project API key (owner/admin only). Returns token ONCE.
router.post('/projects/:projectId/api-keys', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const canManage = await AccessControlService.canManageProject(req.user!.id, projectId);
    if (!canManage) return res.status(403).json({ error: 'Insufficient permissions' });

    const body = CreateApiKeySchema.parse(req.body);

    const token = generateToken();
    const tokenHash = sha256Hex(token);

    const key = await db.projectApiKey.create({
      data: {
        projectId,
        name: body.name,
        tokenHash,
        environments: body.environments || [],
        folders: body.folders || [],
        ipAllowlist: body.ipAllowlist || [],
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: req.user!.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.status(201).json({
      apiKey: {
        id: key.id,
        name: key.name,
        last4: token.slice(-4),
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
      },
      token, // show once
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed' });
    }
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;



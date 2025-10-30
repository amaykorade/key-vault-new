import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { db } from '../lib/db';

const router = Router();

const CreateTokenSchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
  projects: z.array(z.string()).optional(),
  environments: z.array(z.string()).optional(),
  folders: z.array(z.string()).optional(),
  ipAllowlist: z.array(z.string()).optional(),
});

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Create PAT
router.post('/tokens', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = CreateTokenSchema.parse(req.body);
    const token = generateToken();
    const tokenHash = sha256Hex(token);

    const pat = await db.userApiToken.create({
      data: {
        userId: req.user!.id,
        name: body.name,
        tokenHash,
        projects: body.projects || [],
        environments: body.environments || [],
        folders: body.folders || [],
        ipAllowlist: body.ipAllowlist || [],
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
      select: { id: true, name: true, createdAt: true, expiresAt: true },
    });

    res.status(201).json({ token, tokenMeta: pat });
  } catch (error: any) {
    if (error?.name === 'ZodError') return res.status(400).json({ error: 'Validation failed' });
    console.error('Create PAT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List own PATs (no token string), include first project info if present
router.get('/tokens', requireAuth, async (req: AuthRequest, res) => {
  const pats = await db.userApiToken.findMany({
    where: { userId: req.user!.id },
    select: { id: true, name: true, createdAt: true, expiresAt: true, lastUsedAt: true, projects: true },
    orderBy: { createdAt: 'desc' },
  });

  const projectIds = Array.from(new Set(pats.map(p => p.projects?.[0]).filter(Boolean))) as string[];
  const projects = projectIds.length ? await db.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } }) : [];
  const idToName = new Map(projects.map(p => [p.id, p.name] as const));

  const tokens = pats.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt,
    lastUsedAt: p.lastUsedAt,
    projectId: p.projects?.[0] || null,
    projectName: p.projects?.[0] ? (idToName.get(p.projects[0]) || 'Unknown') : null,
  }));

  res.json({ tokens });
});

// Revoke
router.delete('/tokens/:id', requireAuth, async (req: AuthRequest, res) => {
  await db.userApiToken.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Regenerate (rotate) token: returns new token once
router.post('/tokens/:id/regenerate', requireAuth, async (req: AuthRequest, res) => {
  const existing = await db.userApiToken.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!existing) return res.status(404).json({ error: 'Token not found' });

  const token = generateToken();
  const tokenHash = sha256Hex(token);

  await db.userApiToken.update({ where: { id: existing.id }, data: { tokenHash } });
  res.json({ token });
});

export default router;



import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireCliAuth, CliAuthRequest } from '../middleware/cli-auth';
import { CliTokenService } from '../services/cli-token';
import { db } from '../lib/db';
import { AccessControlService } from '../services/access-control';
import { decryptSecret } from '../lib/encryption';

const router = Router();

const CreateCliTokenSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

router.post('/cli/token', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = CreateCliTokenSchema.parse(req.body ?? {});
    const { token, record } = await CliTokenService.createToken(req.user!.id, name);
    res.status(201).json({ token, tokenMeta: record });
  } catch (error) {
    console.error('[cli] create token error', error);
    res.status(500).json({ error: 'Failed to create CLI token' });
  }
});

router.get('/cli/tokens', requireAuth, async (req: AuthRequest, res) => {
  const tokens = await CliTokenService.listTokens(req.user!.id);
  res.json({ tokens });
});

router.delete('/cli/token/:id', requireAuth, async (req: AuthRequest, res) => {
  const success = await CliTokenService.deleteToken(req.user!.id, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Token not found' });
  }
  res.status(204).send();
});

router.get('/cli/profile', requireCliAuth, async (req: CliAuthRequest, res) => {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      name: req.user!.name,
    },
  });
});

router.get('/cli/organizations', requireCliAuth, async (req: CliAuthRequest, res) => {
  const memberships = await db.membership.findMany({
    where: { userId: req.user!.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.role,
  }));

  res.json({ organizations });
});

router.get('/cli/projects', requireCliAuth, async (req: CliAuthRequest, res) => {
  const organizationId = req.query.organizationId ? String(req.query.organizationId) : undefined;
  const projects = await AccessControlService.getUserProjects(req.user!.id);
  const filtered = organizationId
    ? projects.filter((project: any) => project.organizationId === organizationId)
    : projects;

  res.json({
    projects: filtered.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      organizationId: project.organizationId,
      role: project.role,
      accessType: project.accessType,
    })),
  });
});

router.get('/cli/environments', requireCliAuth, async (req: CliAuthRequest, res) => {
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  if (!(await AccessControlService.canRead(req.user!.id, projectId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const [folders, secrets] = await Promise.all([
    db.folder.findMany({
      where: { projectId },
      distinct: ['environment'],
      select: { environment: true },
    }),
    db.secret.findMany({
      where: { projectId },
      distinct: ['environment'],
      select: { environment: true },
    }),
  ]);

  const environments = new Set<string>();
  folders.forEach((f) => environments.add((f.environment || 'development').toLowerCase()));
  secrets.forEach((s) => environments.add((s.environment || 'development').toLowerCase()));

  if (environments.size === 0) {
    ['development', 'staging', 'production'].forEach((env) => environments.add(env));
  }

  res.json({
    environments: Array.from(environments).sort().map((env) => ({
      slug: env,
      label: env.replace(/[-_]/g, ' ').replace(/^./, (ch) => ch.toUpperCase()),
    })),
  });
});

router.get('/cli/folders', requireCliAuth, async (req: CliAuthRequest, res) => {
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  if (!(await AccessControlService.canRead(req.user!.id, projectId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const environment = req.query.environment ? String(req.query.environment).toLowerCase() : undefined;

  const folders = await db.folder.findMany({
    where: {
      projectId,
      ...(environment ? { environment } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      environment: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ environment: 'asc' }, { name: 'asc' }],
  });

  res.json({ folders });
});

const SecretsDownloadSchema = z.object({
  projectId: z.string().min(1),
  environment: z.string().optional(),
  folder: z.string().optional(),
  format: z.enum(['json', 'dotenv']).optional(),
});

router.get('/cli/secrets/download', requireCliAuth, async (req: CliAuthRequest, res) => {
  const params = SecretsDownloadSchema.safeParse(req.query);
  if (!params.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  const { projectId, environment, folder, format = 'json' } = params.data;

  if (!(await AccessControlService.canRead(req.user!.id, projectId))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const secrets = await db.secret.findMany({
    where: {
      projectId,
      ...(environment ? { environment } : {}),
      ...(folder ? { folder } : {}),
    },
    orderBy: { name: 'asc' },
  });

  const secretMap = secrets.reduce<Record<string, string>>((acc, secret) => {
    acc[secret.name] = decryptSecret(secret.value);
    return acc;
  }, {});

  if (format === 'dotenv') {
    const dotenv = Object.entries(secretMap)
      .map(([key, value]) => `${key}=${JSON.stringify(value).slice(1, -1)}`)
      .join('\n');
    res.type('text/plain').send(dotenv);
    return;
  }

  res.json({ secrets: secretMap });
});

export default router;


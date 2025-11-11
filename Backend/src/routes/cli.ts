import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireCliAuth, CliAuthRequest } from '../middleware/cli-auth';
import { CliTokenService } from '../services/cli-token';
import { CliDeviceCodeService } from '../services/cli-device-code';
import { db } from '../lib/db';
import { AccessControlService } from '../services/access-control';
import { decryptSecret } from '../lib/encryption';
import { AuditService } from '../services/audit';

const router = Router();

const CreateCliTokenSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

router.post('/cli/token', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = CreateCliTokenSchema.parse(req.body ?? {});
    const { token, record } = await CliTokenService.createToken(req.user!.id, name);
    await AuditService.logCliTokenCreate(
      req.user!.id,
      record.id,
      name,
      req.ip || req.connection?.remoteAddress,
      req.headers['user-agent']
    ).catch(console.error);
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
  const token = await db.cliToken.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    select: { id: true, name: true },
  });

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  await CliTokenService.deleteToken(req.user!.id, req.params.id);
  await AuditService.logCliTokenDelete(
    req.user!.id,
    token.id,
    token.name || undefined,
    req.ip || req.connection?.remoteAddress
  ).catch(console.error);
  res.status(204).send();
});

// Device code flow for CLI OAuth
router.post('/cli/device-code', async (_req, res) => {
  try {
    const deviceCodeInfo = await CliDeviceCodeService.generateDeviceCode();
    res.json(deviceCodeInfo);
  } catch (error) {
    console.error('[cli] device code generation error', error);
    res.status(500).json({ error: 'Failed to generate device code' });
  }
});

router.get('/cli/device-code/:deviceCode', async (req, res) => {
  try {
    const { deviceCode } = req.params;
    const status = await CliDeviceCodeService.getDeviceCodeStatus(deviceCode);

    if (status.status === 'approved' && status.token) {
      return res.json(status);
    }

    res.json(status);
  } catch (error) {
    console.error('[cli] device code status error', error);
    res.status(500).json({ error: 'Failed to check device code status' });
  }
});

router.post('/cli/device-code/:userCode/authorize', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userCode } = req.params;
    const { name } = req.body || {};

    const result = await CliDeviceCodeService.authorizeDeviceCode(userCode, req.user!.id, name);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Get the device code to fetch the token
    const deviceCodeRecord = await db.cliDeviceCode.findUnique({
      where: { userCode },
    });

    if (!deviceCodeRecord) {
      return res.status(404).json({ error: 'Device code not found' });
    }

    res.json({
      success: true,
      message: 'Device authorized successfully. You can return to the CLI.',
    });
  } catch (error) {
    console.error('[cli] device code authorization error', error);
    res.status(500).json({ error: 'Failed to authorize device code' });
  }
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

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

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

  await AuditService.logCliSecretsFetch(
    req.user!.id,
    projectId,
    project?.name || 'Unknown Project',
    project?.organizationId || undefined,
    environment,
    folder,
    secrets.length,
    req.ip || req.connection?.remoteAddress || undefined
  ).catch(console.error);

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


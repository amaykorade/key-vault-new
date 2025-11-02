import { Router } from 'express';
import { requireApiToken, requireUserApiToken, ApiRequest } from '../middleware/token-auth';
import { db } from '../lib/db';
import { AccessControlService } from '../services/access-control';
import { decryptSecret } from '../lib/encryption';

const router = Router();

// GET /api/v1/o/:orgSlug/p/:projectSlug/secrets/:name?env=...&folder=...
// Accept either Project API Key or User PAT
router.get('/o/:orgSlug/p/:projectSlug/secrets/:name', async (req: ApiRequest, res, next) => {
  // Decide auth path: API key header takes precedence; else PAT
  const hasApiKey = !!(req.header('X-API-Key') || req.header('x-api-key'));
  const hasBearer = !!((req.header('authorization') || req.header('Authorization')) || '').toLowerCase().startsWith('bearer ');
  if (hasApiKey) return (requireApiToken as any)(req, res, () => handler(req, res));
  if (hasBearer) return (requireUserApiToken as any)(req, res, () => handler(req, res));
  return res.status(401).json({ error: 'Missing credentials' });
});

async function handler(req: ApiRequest, res: any) {
  try {
    const { name } = req.params as { name: string };
    const env = req.query.env as string;
    const folder = (req.query.folder as string) || 'default';
    
    if (!env) {
      return res.status(400).json({ error: 'Environment parameter (env) is required' });
    }

    const { orgSlug, projectSlug } = req.params as { orgSlug: string; projectSlug: string };
    const project = await db.project.findFirst({
      where: { name: projectSlug, organization: { slug: orgSlug } },
      select: { id: true },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // API key flow
    if (req.apiAuth) {
      const { projectId, environments, folders } = req.apiAuth;
      if (projectId !== project.id) return res.status(403).json({ error: 'Key not allowed for this project' });
      if (environments && environments.length > 0 && !environments.includes(env)) {
        return res.status(403).json({ error: 'Environment not allowed' });
      }
      if (folders && folders.length > 0 && !folders.includes(folder)) {
        return res.status(403).json({ error: 'Folder not allowed' });
      }
    }

    // PAT flow: enforce RBAC + optional constraints on token
    const pat: any = (req as any).pat;
    if (pat) {
      // Optional constraints
      if (pat.projects?.length && !pat.projects.includes(project.id)) {
        return res.status(403).json({ error: 'Token not allowed for this project' });
      }
      if (pat.environments?.length && !pat.environments.includes(env)) {
        return res.status(403).json({ error: 'Environment not allowed' });
      }
      if (pat.folders?.length && !pat.folders.includes(folder)) {
        return res.status(403).json({ error: 'Folder not allowed' });
      }
      if (pat.ipAllowlist?.length) {
        const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
        if (!pat.ipAllowlist.includes(ip)) {
          return res.status(403).json({ error: 'IP not allowed' });
        }
      }
      // RBAC
      const canRead = await AccessControlService.canRead(pat.userId, project.id);
      if (!canRead) return res.status(403).json({ error: 'Insufficient permissions' });
      // update last used
      db.userApiToken.update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    }

    const secret = await db.secret.findFirst({
      where: { projectId: project.id, name, environment: env, folder },
      select: { id: true, name: true, value: true, type: true, environment: true, folder: true, updatedAt: true },
    });
    if (!secret) return res.status(404).json({ error: 'Secret not found' });

    // Decrypt the secret value
    const decryptedValue = decryptSecret(secret.value);

    // Return JSON format if explicitly requested, otherwise return plain value
    if (req.query.format === 'json') {
      return res.json({
        name: secret.name,
        value: decryptedValue,
        environment: secret.environment,
        folder: secret.folder,
        type: secret.type,
        updatedAt: secret.updatedAt,
      });
    }

    // Default: return just the plain value for direct use
    return res.type('text/plain').send(decryptedValue);
  } catch (err) {
    console.error('Public get secret error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Simple endpoint - only token + secret name needed
// GET /api/v1/{secretName}
// Token determines project, environment, and folder automatically
router.get('/:name', async (req: ApiRequest, res, next) => {
  const hasBearer = !!((req.header('authorization') || req.header('Authorization')) || '').toLowerCase().startsWith('bearer ');
  if (hasBearer) return (requireUserApiToken as any)(req, res, () => simpleHandler(req, res));
  return res.status(401).json({ error: 'Missing Bearer token' });
});

async function simpleHandler(req: ApiRequest, res: any) {
  try {
    const { name } = req.params as { name: string };
    const pat: any = (req as any).pat;
    
    if (!pat) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get project, environment, and folder from token scope
    if (!pat.projects || pat.projects.length === 0) {
      return res.status(400).json({ error: 'Token must be scoped to at least one project' });
    }
    
    const projectId = pat.projects[0]; // Use first project
    const env = pat.environments?.[0] || 'development'; // Use first environment or default
    const folder = pat.folders?.[0] || 'default'; // Use first folder or default

    // Check IP allowlist
    if (pat.ipAllowlist?.length) {
      const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
      if (!pat.ipAllowlist.includes(ip)) {
        return res.status(403).json({ error: 'IP not allowed' });
      }
    }

    // Check RBAC
    const canRead = await AccessControlService.canRead(pat.userId, projectId);
    if (!canRead) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update last used
    db.userApiToken.update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    // Fetch the secret
    const secret = await db.secret.findFirst({
      where: { projectId, name, environment: env, folder },
      select: { id: true, name: true, value: true, type: true, environment: true, folder: true, updatedAt: true },
    });
    
    if (!secret) {
      return res.status(404).json({ 
        error: 'Secret not found',
        hint: `Looking for secret "${name}" in project ${projectId}, environment "${env}", folder "${folder}"`
      });
    }

    // Decrypt the secret value
    const decryptedValue = decryptSecret(secret.value);

    // Return JSON format if explicitly requested, otherwise return plain value
    if (req.query.format === 'json') {
      return res.json({
        name: secret.name,
        value: decryptedValue,
        environment: secret.environment,
        folder: secret.folder,
        type: secret.type,
        updatedAt: secret.updatedAt,
      });
    }

    // Default: return just the plain value for direct use
    return res.type('text/plain').send(decryptedValue);
  } catch (err) {
    console.error('Simple get secret error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default router;

// Short endpoint (Project API Key or single-project PAT)
// GET /api/v1/secrets/:name?env=&folder=
router.get('/secrets/:name', async (req: ApiRequest, res, next) => {
  const hasApiKey = !!(req.header('X-API-Key') || req.header('x-api-key'));
  const hasBearer = !!((req.header('authorization') || req.header('Authorization')) || '').toLowerCase().startsWith('bearer ');
  if (hasApiKey) return (requireApiToken as any)(req, res, () => shortHandler(req, res));
  if (hasBearer) return (requireUserApiToken as any)(req, res, () => shortHandler(req, res));
  return res.status(401).json({ error: 'Missing credentials' });
});

async function shortHandler(req: ApiRequest, res: any) {
  try {
    const { name } = req.params as { name: string };
    const env = req.query.env as string;
    const folder = (req.query.folder as string) || 'default';
    
    if (!env) {
      return res.status(400).json({ error: 'Environment parameter (env) is required' });
    }

    let projectId: string | null = null;

    if (req.apiAuth) {
      // Project API Key
      const { environments, folders } = req.apiAuth;
      projectId = req.apiAuth.projectId;
      if (environments && environments.length > 0 && !environments.includes(env)) {
        return res.status(403).json({ error: 'Environment not allowed' });
      }
      if (folders && folders.length > 0 && !folders.includes(folder)) {
        return res.status(403).json({ error: 'Folder not allowed' });
      }
    }

    const pat: any = (req as any).pat;
    if (!projectId && pat) {
      // PAT must be constrained to a single project for short endpoint
      if (!pat.projects || pat.projects.length !== 1) {
        return res.status(400).json({ error: 'Token must be limited to a single project for this endpoint' });
      }
      projectId = pat.projects[0];
      if (pat.environments?.length && !pat.environments.includes(env)) {
        return res.status(403).json({ error: 'Environment not allowed' });
      }
      if (pat.folders?.length && !pat.folders.includes(folder)) {
        return res.status(403).json({ error: 'Folder not allowed' });
      }
      if (pat.ipAllowlist?.length) {
        const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
        if (!pat.ipAllowlist.includes(ip)) return res.status(403).json({ error: 'IP not allowed' });
      }
      const canRead = await AccessControlService.canRead(pat.userId, projectId!);
      if (!canRead) return res.status(403).json({ error: 'Insufficient permissions' });
      db.userApiToken.update({ where: { id: pat.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    }

    if (!projectId) return res.status(400).json({ error: 'Unable to resolve project from token' });

    const secret = await db.secret.findFirst({
      where: { projectId, name, environment: env, folder },
      select: { id: true, name: true, value: true, type: true, environment: true, folder: true, updatedAt: true },
    });
    if (!secret) return res.status(404).json({ error: 'Secret not found' });

    // Decrypt the secret value
    const decryptedValue = decryptSecret(secret.value);

    // Return JSON format if explicitly requested, otherwise return plain value
    if (req.query.format === 'json') {
      return res.json({
        name: secret.name,
        value: decryptedValue,
        environment: secret.environment,
        folder: secret.folder,
        type: secret.type,
        updatedAt: secret.updatedAt,
      });
    }

    // Default: return just the plain value for direct use
    return res.type('text/plain').send(decryptedValue);
  } catch (err) {
    console.error('Short get secret error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}



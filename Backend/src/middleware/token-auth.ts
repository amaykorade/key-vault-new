import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../lib/db';

export interface ApiAuthContext {
  projectId: string;
  keyId: string;
  scopes?: any;
  environments?: string[];
  folders?: string[];
}

export interface ApiRequest extends Request {
  apiAuth?: ApiAuthContext;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function requireApiToken(req: ApiRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.header('X-API-Key') || req.header('x-api-key');
    if (!apiKey) return res.status(401).json({ error: 'Missing API key' });

    const { orgSlug, projectSlug } = req.params as { orgSlug: string; projectSlug: string };
    if (!orgSlug || !projectSlug) return res.status(400).json({ error: 'Invalid path' });

    // Resolve project by org slug and project name (slug optional)
    const project = await db.project.findFirst({
      where: {
        name: projectSlug,
        organization: { slug: orgSlug },
      },
      select: { id: true },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const tokenHash = sha256Hex(apiKey);
    const key = await db.projectApiKey.findFirst({
      where: {
        projectId: project.id,
        tokenHash,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (!key) return res.status(401).json({ error: 'Invalid or expired API key' });

    // Optional IP allowlist
    if (key.ipAllowlist && key.ipAllowlist.length > 0) {
      const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
      if (!key.ipAllowlist.includes(ip)) {
        return res.status(403).json({ error: 'IP not allowed' });
      }
    }

    // Attach context
    req.apiAuth = {
      projectId: project.id,
      keyId: key.id,
      scopes: key.scopes || undefined,
      environments: key.environments || undefined,
      folders: key.folders || undefined,
    };

    // Fire and forget lastUsedAt
    db.projectApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    next();
  } catch (err) {
    console.error('API key auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Bearer PAT for user-scoped access (inherits RBAC)
export async function requireUserApiToken(req: ApiRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.header('authorization') || req.header('Authorization');
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
    const token = auth.slice(7);
    const tokenHash = sha256Hex(token);

    const pat = await db.userApiToken.findFirst({ where: { tokenHash, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    if (!pat) return res.status(401).json({ error: 'Invalid or expired token' });

    // Attach as API auth context (no project yet; resolved per route)
    (req as any).pat = pat;
    next();
  } catch (err) {
    console.error('User API token auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Combined: allow either user auth (requireAuth) or API token
export function requireAuthOrToken(requireAuthMw: (req: Request, res: Response, next: NextFunction) => any) {
  return async (req: ApiRequest, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-Key') || req.header('x-api-key');
    if (apiKey) {
      return requireApiToken(req, res, next);
    }
    const auth = req.header('authorization') || req.header('Authorization');
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      return requireUserApiToken(req, res, next);
    }
    return requireAuthMw(req, res, next);
  };
}



import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { VercelService } from '../services/vercel';
import { AuditService } from '../services/audit';
import { z } from 'zod';
import axios from 'axios';

const router = Router();

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID || '';
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET || '';
const VERCEL_REDIRECT_URI = process.env.VERCEL_REDIRECT_URI || 'http://localhost:4000/api/auth/vercel/callback';

/**
 * GET /vercel/auth/redirect
 * Redirect to Vercel OAuth authorization page
 */
router.get('/auth/redirect', requireAuth, (req: AuthRequest, res) => {
  const state = Buffer.from(JSON.stringify({
    userId: req.user!.id,
    organizationId: req.query.organizationId,
    returnTo: req.query.returnTo || '/projects',
  })).toString('base64');

  const authUrl = `https://vercel.com/oauth/authorize?` +
    `client_id=${VERCEL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(VERCEL_REDIRECT_URI)}&` +
    `state=${state}`;

  res.json({ authUrl });
});

/**
 * GET /auth/vercel/callback
 * Handle Vercel OAuth callback (this goes in auth routes, not /api/vercel)
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/error?message=Missing OAuth parameters`);
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { userId, organizationId, returnTo } = stateData;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.vercel.com/v2/oauth/access_token', {
      client_id: VERCEL_CLIENT_ID,
      client_secret: VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: VERCEL_REDIRECT_URI,
    });

    const { access_token, team_id } = tokenResponse.data;

    // Get team info if applicable
    let teamName;
    if (team_id) {
      try {
        const teamResponse = await axios.get(`https://api.vercel.com/v2/teams/${team_id}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        teamName = teamResponse.data.name;
      } catch (e) {
        console.error('Failed to fetch team info:', e);
      }
    }

    // Store the token
    await VercelService.storeAccessToken(
      userId,
      organizationId,
      access_token,
      team_id,
      teamName
    );

    // Redirect back to frontend
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}${returnTo}?vercel=connected`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Vercel OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/error?message=Failed to connect Vercel`);
  }
});

/**
 * POST /vercel/connect
 * Store Vercel OAuth access token
 */
router.post('/connect', requireAuth, async (req: AuthRequest, res) => {
  try {
    console.log('Vercel connect endpoint hit');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const schema = z.object({
      accessToken: z.string().min(1),
      organizationId: z.string().uuid(),
      teamId: z.string().optional(),
      teamName: z.string().optional(),
    });

    const data = schema.parse(req.body);
    console.log('Parsed data:', { ...data, accessToken: '***' });

    await VercelService.storeAccessToken(
      req.user.id,
      data.organizationId,
      data.accessToken,
      data.teamId,
      data.teamName
    );

    console.log('Vercel token stored successfully');

    res.json({ success: true, message: 'Vercel connected successfully' });
  } catch (error: any) {
    console.error('Failed to connect Vercel:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ZodError') {
      const zodError = error as any;
      console.error('Validation errors:', zodError.errors);
      return res.status(400).json({ error: 'Invalid request data', details: zodError.errors });
    }
    res.status(500).json({ error: error.message || 'Failed to connect Vercel' });
  }
});

/**
 * GET /vercel/status/:organizationId
 * Check if Vercel is connected
 */
router.get('/status/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const isConnected = await VercelService.isConnected(req.user!.id, organizationId);

    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Failed to check Vercel status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

/**
 * GET /vercel/projects/:organizationId
 * List all Vercel projects
 */
router.get('/projects/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;

    const accessToken = await VercelService.getAccessToken(req.user!.id, organizationId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Vercel not connected' });
    }

    // Get team ID from integration
    const integration = await require('../lib/db').db.vercelIntegration.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user!.id,
          organizationId,
        },
      },
    });

    const projects = await VercelService.listProjects(accessToken, integration?.vercelTeamId || undefined);

    res.json({ projects });
  } catch (error) {
    console.error('Failed to list Vercel projects:', error);
    res.status(500).json({ error: 'Failed to fetch Vercel projects' });
  }
});

/**
 * POST /vercel/sync
 * Sync secrets from a folder to Vercel
 */
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      projectId: z.string().uuid(),
      environment: z.string(),
      folder: z.string(),
      vercelProjectId: z.string(),
      vercelProjectName: z.string().optional(),
      vercelEnvTarget: z.enum(['production', 'preview', 'development']),
    });

    const data = schema.parse(req.body);

    const result = await VercelService.syncFolderToVercel(
      req.user!.id,
      data.projectId,
      data.environment,
      data.folder,
      data.vercelProjectId,
      data.vercelEnvTarget
    );

    // Log the sync event
    const project = await require('../lib/db').db.project.findUnique({
      where: { id: data.projectId },
      select: { organizationId: true },
    });

    const ipAddress = req.ip || req.connection?.remoteAddress;
    await AuditService.logVercelSync(
      req.user!.id,
      data.projectId,
      project?.organizationId,
      data.environment,
      data.folder,
      data.vercelProjectName,
      result.synced,
      result.errors.length > 0 ? 'failed' : 'success',
      result.errors,
      ipAddress
    ).catch(console.error);

    res.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Successfully synced ${result.synced} secret(s) to Vercel`,
    });
  } catch (error: any) {
    console.error('Failed to sync to Vercel:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    res.status(500).json({ error: error.message || 'Failed to sync to Vercel' });
  }
});

/**
 * DELETE /vercel/disconnect/:organizationId
 * Disconnect Vercel integration
 */
router.delete('/disconnect/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;

    await VercelService.disconnect(req.user!.id, organizationId);

    res.json({ success: true, message: 'Vercel disconnected successfully' });
  } catch (error) {
    console.error('Failed to disconnect Vercel:', error);
    res.status(500).json({ error: 'Failed to disconnect Vercel' });
  }
});

/**
 * GET /vercel/sync-status/:projectId/:environment/:folder
 * Check if folder has unsynced changes
 */
router.get('/sync-status/:projectId/:environment/:folder', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, environment, folder } = req.params;

    console.log('[Sync API] Checking sync status:', { projectId, environment, folder });
    const hasUnsyncedChanges = await VercelService.hasUnsyncedChanges(projectId, environment, folder);
    console.log('[Sync API] Result:', hasUnsyncedChanges);

    res.json({ hasUnsyncedChanges });
  } catch (error) {
    console.error('[Sync API] Failed to check sync status:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

export default router;


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
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const schema = z.object({
      accessToken: z.string().min(1),
      organizationId: z.string().uuid(),
      name: z.string().optional(), // Optional name for this integration
      teamId: z.string().optional(),
      teamName: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const integration = await VercelService.storeAccessToken(
      req.user.id,
      data.organizationId,
      data.accessToken,
      data.name,
      data.teamId,
      data.teamName
    );

    res.json({ 
      success: true, 
      message: 'Vercel connected successfully',
      integration: {
        id: integration.id,
        name: integration.name,
      },
    });
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
 * GET /vercel/integrations/:organizationId
 * List all Vercel integrations for an organization
 */
router.get('/integrations/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const integrations = await VercelService.listIntegrations(req.user!.id, organizationId);
    res.json({ integrations });
  } catch (error) {
    console.error('Failed to list Vercel integrations:', error);
    res.status(500).json({ error: 'Failed to fetch Vercel integrations' });
  }
});

/**
 * GET /vercel/projects/:integrationId
 * List all Vercel projects for a specific integration
 */
router.get('/projects/:integrationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;

    const accessToken = await VercelService.getAccessToken(integrationId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Vercel integration not found' });
    }

    // Get team ID from integration
    const integration = await require('../lib/db').db.vercelIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const projects = await VercelService.listProjects(accessToken, integration.vercelTeamId || undefined);

    res.json({ projects });
  } catch (error) {
    console.error('Failed to list Vercel projects:', error);
    res.status(500).json({ error: 'Failed to fetch Vercel projects' });
  }
});

/**
 * DELETE /vercel/integrations/:integrationId
 * Delete a Vercel integration
 */
router.delete('/integrations/:integrationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { integrationId } = req.params;
    await VercelService.deleteIntegration(integrationId, req.user!.id);
    res.json({ success: true, message: 'Vercel integration deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete Vercel integration:', error);
    if (error.message === 'Integration not found or access denied') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete Vercel integration' });
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
      vercelIntegrationId: z.string().uuid(), // Required: which integration to use
      vercelProjectId: z.string(),
      vercelProjectName: z.string().optional(),
      vercelEnvTarget: z.enum(['production', 'preview', 'development']),
    });

    const data = schema.parse(req.body);

    // Verify the integration belongs to the user
    const integration = await require('../lib/db').db.vercelIntegration.findUnique({
      where: { id: data.vercelIntegrationId },
    });

    if (!integration || integration.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied to this Vercel integration' });
    }

    const result = await VercelService.syncFolderToVercel(
      data.vercelIntegrationId,
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
 * Disconnect all Vercel integrations for an organization (legacy endpoint)
 * @deprecated Use DELETE /vercel/integrations/:integrationId instead
 */
router.delete('/disconnect/:organizationId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;

    // Delete all integrations for this user/organization
    await require('../lib/db').db.vercelIntegration.deleteMany({
      where: {
        userId: req.user!.id,
        organizationId,
      },
    });

    res.json({ success: true, message: 'All Vercel integrations disconnected successfully' });
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

    const hasUnsyncedChanges = await VercelService.hasUnsyncedChanges(projectId, environment, folder);

    res.json({ hasUnsyncedChanges });
  } catch (error) {
    console.error('Failed to check sync status:', error);
    res.status(500).json({ error: 'Failed to check sync status' });
  }
});

/**
 * GET /vercel/sync-config/:projectId/:environment/:folder
 * Get sync configuration for a folder
 */
router.get('/sync-config/:projectId/:environment/:folder', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, environment, folder } = req.params;

    const config = await VercelService.getSyncConfig(projectId, environment, folder);

    if (!config) {
      return res.json({ config: null });
    }

    // Type assertion needed because Prisma types might not be fully updated in IDE
    const configWithIntegration = config as typeof config & { vercelIntegrationId: string | null };

    res.json({
      config: {
        vercelIntegrationId: configWithIntegration.vercelIntegrationId || null,
        vercelProjectId: config.vercelProjectId,
        vercelProjectName: config.vercelProjectName,
        vercelEnvTarget: config.vercelEnvTarget,
        syncEnabled: config.syncEnabled,
        autoSync: config.autoSync,
        lastSyncedAt: config.lastSyncedAt,
        lastSyncStatus: config.lastSyncStatus,
        lastSyncError: config.lastSyncError,
      },
    });
  } catch (error) {
    console.error('Failed to get sync config:', error);
    res.status(500).json({ error: 'Failed to get sync configuration' });
  }
});

/**
 * POST /vercel/sync-config
 * Save or update sync configuration for a folder
 */
router.post('/sync-config', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      projectId: z.string().uuid(),
      environment: z.string(),
      folder: z.string(),
      vercelIntegrationId: z.string().uuid(), // Required: which integration to use
      vercelProjectId: z.string(),
      vercelProjectName: z.string().optional(),
      vercelEnvTarget: z.enum(['production', 'preview', 'development']),
      syncEnabled: z.boolean().optional().default(true),
      autoSync: z.boolean().optional().default(false),
    });

    const data = schema.parse(req.body);

    // Verify user has access to the project
    const project = await require('../lib/db').db.project.findUnique({
      where: { id: data.projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hasAccess = project.members.some((m: { userId: string }) => m.userId === req.user!.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify the integration belongs to the user
    const integration = await require('../lib/db').db.vercelIntegration.findUnique({
      where: { id: data.vercelIntegrationId },
    });

    if (!integration || integration.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied to this Vercel integration' });
    }

    // Save or update sync configuration
    const config = await require('../lib/db').db.folderVercelSync.upsert({
      where: {
        projectId_environment_folder: {
          projectId: data.projectId,
          environment: data.environment,
          folder: data.folder,
        },
      },
      create: {
        projectId: data.projectId,
        environment: data.environment,
        folder: data.folder,
        vercelIntegrationId: data.vercelIntegrationId,
        vercelProjectId: data.vercelProjectId,
        vercelProjectName: data.vercelProjectName,
        vercelEnvTarget: data.vercelEnvTarget,
        syncEnabled: data.syncEnabled ?? true,
        autoSync: data.autoSync ?? false,
      },
      update: {
        vercelIntegrationId: data.vercelIntegrationId,
        vercelProjectId: data.vercelProjectId,
        vercelProjectName: data.vercelProjectName,
        vercelEnvTarget: data.vercelEnvTarget,
        syncEnabled: data.syncEnabled ?? true,
        autoSync: data.autoSync ?? false,
      },
    });

    // Type assertion needed because Prisma types might not be fully updated in IDE
    const configWithIntegration = config as typeof config & { vercelIntegrationId: string | null };

    res.json({
      success: true,
      config: {
        vercelIntegrationId: configWithIntegration.vercelIntegrationId || null,
        vercelProjectId: config.vercelProjectId,
        vercelProjectName: config.vercelProjectName,
        vercelEnvTarget: config.vercelEnvTarget,
        syncEnabled: config.syncEnabled,
        autoSync: config.autoSync,
      },
    });
  } catch (error: any) {
    console.error('Failed to save sync config:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    res.status(500).json({ error: error.message || 'Failed to save sync configuration' });
  }
});

/**
 * POST /vercel/deploy
 * Trigger a Vercel deployment
 */
router.post('/deploy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      vercelIntegrationId: z.string().uuid(), // Required: which integration to use
      vercelProjectId: z.string(),
    });

    const data = schema.parse(req.body);

    const accessToken = await VercelService.getAccessToken(data.vercelIntegrationId);
    if (!accessToken) {
      return res.status(404).json({ error: 'Vercel integration not found' });
    }

    // Get team ID from integration
    const integration = await require('../lib/db').db.vercelIntegration.findUnique({
      where: { id: data.vercelIntegrationId },
    });

    if (!integration || integration.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied to this Vercel integration' });
    }

    const result = await VercelService.triggerDeployment(
      accessToken,
      data.vercelProjectId,
      integration.vercelTeamId || undefined
    );

    if (result.success) {
      res.json({
        success: true,
        deploymentUrl: result.deploymentUrl,
        message: 'Deployment triggered successfully',
      });
    } else {
      res.status(500).json({ error: result.error || 'Failed to trigger deployment' });
    }
  } catch (error: any) {
    console.error('Failed to trigger deployment:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    res.status(500).json({ error: error.message || 'Failed to trigger deployment' });
  }
});

export default router;


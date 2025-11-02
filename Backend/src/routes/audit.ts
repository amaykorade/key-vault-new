import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AuditService } from '../services/audit';
import { z } from 'zod';

const router = Router();

// Apply authentication to all audit routes
router.use(requireAuth);

// Validation schemas
const GetAuditLogsSchema = z.object({
  organizationId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const GetUserActivitySchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /audit/logs
 * Get audit logs with optional filtering
 */
router.get('/logs', async (req, res) => {
  try {
    const filters = GetAuditLogsSchema.parse(req.query);
    
    // For now, allow users to see logs for organizations they belong to
    // In a production system, you'd want more granular permissions
    const logs = await AuditService.getAuditLogs(filters);
    
    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('Failed to get audit logs:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get audit logs',
    });
  }
});

/**
 * GET /audit/recent
 * Get recent activity for dashboard
 */
router.get('/recent', async (req, res) => {
  try {
    const { organizationId, limit = 20 } = req.query;
    
    const logs = await AuditService.getRecentActivity(
      organizationId as string,
      Number(limit)
    );
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get recent activity:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get recent activity',
    });
  }
});

/**
 * GET /audit/security
 * Get security events (failed logins, etc.)
 */
router.get('/security', async (req, res) => {
  try {
    const { organizationId, limit = 20 } = req.query;
    
    const logs = await AuditService.getSecurityEvents(
      organizationId as string,
      Number(limit)
    );
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get security events:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get security events',
    });
  }
});

/**
 * GET /audit/user/:userId
 * Get activity for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = GetUserActivitySchema.parse({
      userId: req.params.userId,
      ...req.query,
    });
    
    const logs = await AuditService.getAuditLogs({
      userId,
      limit: 50,
    });
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get user activity:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get user activity',
    });
  }
});

/**
 * GET /audit/organization/:organizationId
 * Get activity for a specific organization
 */
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await AuditService.getAuditLogs({
      organizationId,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get organization activity:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get organization activity',
    });
  }
});

/**
 * GET /audit/project/:projectId
 * Get activity for a specific project
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await AuditService.getAuditLogs({
      projectId,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get project activity:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get project activity',
    });
  }
});

/**
 * GET /audit/secret/:secretId
 * Get access history for a specific secret
 */
router.get('/secret/:secretId', async (req, res) => {
  try {
    const { secretId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await AuditService.getAuditLogs({
      secretId,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get secret access history:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get secret access history',
    });
  }
});

/**
 * GET /audit/folder/:projectId/:environment/:folder
 * Get activity for a specific folder
 */
router.get('/folder/:projectId/:environment/:folder', async (req, res) => {
  try {
    const { projectId, environment, folder } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log('Fetching folder logs:', { projectId, environment, folder, limit, offset });
    
    const logs = await AuditService.getFolderLogs(
      projectId,
      environment,
      folder,
      Number(limit),
      Number(offset)
    );
    
    console.log(`Found ${logs.length} logs for folder`);
    
    res.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('Failed to get folder logs:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get folder logs',
    });
  }
});

export default router;

import { Router } from 'express';
import { SecretService, SecretSchema } from '../services/secret';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { auditSecretCreate, auditSecretUpdate, auditSecretDelete, auditSecretAccess } from '../middleware/audit';
import { AuditService } from '../services/audit';
import { parseEnvFile } from '../lib/env-parser';

const router = Router();

// Create secret in project
router.post('/projects/:projectId/secrets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    console.log('Create secret request body:', JSON.stringify(req.body, null, 2));
    console.log('Project ID:', projectId);
    console.log('User:', req.user);
    
    const data = SecretSchema.create.parse(req.body);
    console.log('Parsed data:', data);
    
    const secret = await SecretService.createSecret(projectId, req.user!.id, data);
    
    // Log the secret creation
    const ipAddress = req.ip || req.connection?.remoteAddress;
    
    // Fetch project to get organizationId
    const project = await require('../lib/db').db.project.findUnique({
      where: { id: secret.projectId },
      select: { organizationId: true }
    });
    
    await AuditService.logSecretCreate(
      req.user!.id,
      secret.id,
      secret.name,
      secret.projectId,
      project?.organizationId,
      (secret as any).environment,
      (secret as any).folder,
      secret.type,
      ipAddress
    ).catch(console.error);
    
    res.status(201).json({
      secret: {
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        environment: (secret as any).environment,
        folder: (secret as any).folder,
        projectId: secret.projectId,
        createdById: secret.createdById,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create secret error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      console.error('Zod validation errors:', zodError.errors);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    if (error instanceof Error && (
      error.message === 'Access denied' ||
      error.message.includes('Secret with name')
    )) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get secrets in project
router.get('/projects/:projectId/secrets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const includeValues = req.query.includeValues === 'true';
    const secrets = await SecretService.getProjectSecrets(projectId, req.user!.id, includeValues);
    
    res.json({
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        value: secret.value,
        maskedValue: secret.maskedValue,
        environment: (secret as any).environment,
        folder: (secret as any).folder,
        projectId: secret.projectId,
        createdBy: secret.createdBy,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get project secrets error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific secret
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const includeValue = req.query.includeValue === 'true';
    const secret = await SecretService.getSecretById(req.params.id, req.user!.id, includeValue);
    
    if (!secret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    // Log secret access if value is being viewed
    if (includeValue) {
      const ipAddress = req.ip || req.connection?.remoteAddress;
      
      // Fetch project to get organizationId
      const project = await require('../lib/db').db.project.findUnique({
        where: { id: secret.projectId },
        select: { organizationId: true }
      });
      
      await AuditService.logSecretAccess(
        req.user!.id,
        secret.id,
        secret.name,
        secret.projectId,
        project?.organizationId,
        (secret as any).environment,
        (secret as any).folder,
        'view',
        ipAddress
      ).catch(console.error);
    }

    res.json({
      secret: {
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        value: secret.value,
        maskedValue: secret.maskedValue,
        environment: (secret as any).environment,
        projectId: secret.projectId,
        project: secret.project,
        createdBy: secret.createdBy,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update secret
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = SecretSchema.update.parse(req.body);
    const secret = await SecretService.updateSecret(req.params.id, req.user!.id, data);
    
    // Log the update
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const changedFields = Object.keys(data);
    
    // Fetch project to get organizationId
    const project = await require('../lib/db').db.project.findUnique({
      where: { id: secret.projectId },
      select: { organizationId: true }
    });
    
    await AuditService.logSecretUpdate(
      req.user!.id,
      secret.id,
      secret.name,
      secret.projectId,
      project?.organizationId,
      (secret as any).environment,
      (secret as any).folder,
      changedFields,
      ipAddress
    ).catch(console.error);
    
    res.json({
      secret: {
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        environment: (secret as any).environment,
        projectId: secret.projectId,
        updatedAt: secret.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update secret error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return res.status(400).json({ 
        error: 'Validation failed',
        details: zodError.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    if (error instanceof Error && (
      error.message === 'Access denied' ||
      error.message.includes('Secret with name')
    )) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete secret
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Fetch secret before deletion to log it
    const secretToDelete = await SecretService.getSecretById(req.params.id, req.user!.id, false);
    
    // Log the deletion BEFORE actually deleting (so foreign key is still valid)
    if (secretToDelete) {
      const ipAddress = req.ip || req.connection?.remoteAddress;
      
      // Fetch project to get organizationId
      const project = await require('../lib/db').db.project.findUnique({
        where: { id: secretToDelete.projectId },
        select: { organizationId: true }
      });
      
      await AuditService.logSecretDelete(
        req.user!.id,
        secretToDelete.id,
        secretToDelete.name,
        secretToDelete.projectId,
        project?.organizationId,
        (secretToDelete as any).environment,
        (secretToDelete as any).folder,
        ipAddress
      ).catch(console.error);
    }
    
    // Now delete the secret
    await SecretService.deleteSecret(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete secret error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's secrets across all projects
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const includeValues = req.query.includeValues === 'true';
    const secrets = await SecretService.getUserSecrets(req.user!.id, includeValues);
    
    res.json({
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        value: secret.value,
        maskedValue: secret.maskedValue,
        environment: (secret as any).environment,
        projectId: secret.projectId,
        project: secret.project,
        createdBy: secret.createdBy,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get user secrets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search secrets
router.get('/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { q: query, projectId } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const secrets = await SecretService.searchSecrets(
      req.user!.id, 
      query, 
      typeof projectId === 'string' ? projectId : undefined
    );
    
    res.json({
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        value: secret.value,
        maskedValue: secret.maskedValue,
        projectId: secret.projectId,
        project: secret.project,
        createdBy: secret.createdBy,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Search secrets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get secrets by type
router.get('/projects/:projectId/secrets/type/:type', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, type } = req.params;
    const secrets = await SecretService.getSecretsByType(projectId, req.user!.id, type);
    
    res.json({
      secrets: secrets.map(secret => ({
        id: secret.id,
        name: secret.name,
        description: secret.description,
        type: secret.type,
        value: secret.value,
        maskedValue: secret.maskedValue,
        environment: (secret as any).environment,
        projectId: secret.projectId,
        createdBy: secret.createdBy,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get secrets by type error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk import secrets from .env file
router.post('/projects/:projectId/secrets/import', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const { content, environment, folder, conflictResolution } = req.body;

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'File content is required' });
    }

    if (!environment || typeof environment !== 'string') {
      return res.status(400).json({ error: 'Environment is required' });
    }

    if (!folder || typeof folder !== 'string') {
      return res.status(400).json({ error: 'Folder is required' });
    }

    const resolution = conflictResolution || 'skip';
    if (resolution !== 'skip' && resolution !== 'overwrite') {
      return res.status(400).json({ error: 'Conflict resolution must be "skip" or "overwrite"' });
    }

    // Validate file size (max 1MB)
    if (content.length > 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 1MB)' });
    }

    // Parse .env file
    const parseResult = parseEnvFile(content);

    if (parseResult.errors.length > 0 && parseResult.secrets.length === 0) {
      return res.status(400).json({
        error: 'Failed to parse .env file',
        details: parseResult.errors,
      });
    }

    // Limit to 500 secrets per import
    if (parseResult.secrets.length > 500) {
      return res.status(400).json({ error: 'Too many secrets (max 500 per import)' });
    }

    // Import secrets
    const importResult = await SecretService.importSecrets(
      projectId,
      req.user!.id,
      parseResult.secrets.map(s => ({
        name: s.name,
        value: s.value,
      })),
      environment,
      folder,
      resolution as 'skip' | 'overwrite'
    );

    // Log audit events for imported secrets
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const project = await require('../lib/db').db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    // Log bulk import (one audit log entry for the entire import)
    await AuditService.log({
      userId: req.user!.id,
      projectId,
      organizationId: project?.organizationId,
      eventType: 'secret_bulk_import',
      action: 'import',
      resourceType: 'secrets',
      environment,
      folder,
      metadata: {
        totalSecrets: parseResult.secrets.length,
        imported: importResult.imported,
        skipped: importResult.skipped,
        failed: importResult.failed,
        conflictResolution: resolution,
      },
      description: `Bulk imported ${importResult.imported} secrets (${importResult.skipped} skipped, ${importResult.failed} failed)`,
      ipAddress,
    }).catch(console.error);

    // Also log individual secret creations/updates for audit trail
    for (const imported of importResult.importedSecrets) {
      if (imported.action === 'created') {
        await AuditService.logSecretCreate(
          req.user!.id,
          imported.id,
          imported.name,
          projectId,
          project?.organizationId,
          environment,
          folder,
          'API_KEY', // Type will be auto-detected
          ipAddress
        ).catch(console.error);
      } else if (imported.action === 'updated') {
        await AuditService.logSecretUpdate(
          req.user!.id,
          imported.id,
          imported.name,
          projectId,
          project?.organizationId,
          environment,
          folder,
          ['value'], // Updated field
          ipAddress
        ).catch(console.error);
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        total: importResult.total,
        imported: importResult.imported,
        skipped: importResult.skipped,
        failed: importResult.failed,
      },
      importedSecrets: importResult.importedSecrets,
      skippedSecrets: importResult.skippedSecrets,
      failedSecrets: importResult.failedSecrets,
      parseErrors: parseResult.errors,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

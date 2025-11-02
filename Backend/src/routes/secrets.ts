import { Router } from 'express';
import { SecretService, SecretSchema } from '../services/secret';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { auditSecretCreate, auditSecretUpdate, auditSecretDelete, auditSecretAccess } from '../middleware/audit';
import { AuditService } from '../services/audit';

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

export default router;

import { Router } from 'express';
import { SecretService, SecretSchema } from '../services/secret';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { auditSecretCreate, auditSecretUpdate, auditSecretDelete, auditSecretAccess } from '../middleware/audit';

const router = Router();

// Create secret in project
router.post('/projects/:projectId/secrets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const data = SecretSchema.create.parse(req.body);
    const secret = await SecretService.createSecret(projectId, req.user!.id, data);
    
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
router.put('/:id', requireAuth, auditSecretUpdate, async (req: AuthRequest, res) => {
  try {
    const data = SecretSchema.update.parse(req.body);
    const secret = await SecretService.updateSecret(req.params.id, req.user!.id, data);
    
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
router.delete('/:id', requireAuth, auditSecretDelete, async (req: AuthRequest, res) => {
  try {
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

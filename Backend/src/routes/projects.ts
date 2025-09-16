import { Router } from 'express';
import { ProjectService, ProjectSchema } from '../services/project';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Create project in organization
router.post('/organizations/:organizationId/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const data = ProjectSchema.create.parse(req.body);
    const project = await ProjectService.createProject(organizationId, req.user!.id, data);
    
    res.status(201).json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
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
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get projects in organization
router.get('/organizations/:organizationId/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const projects = await ProjectService.getOrganizationProjects(organizationId, req.user!.id);
    
    res.json({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get organization projects error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific project
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const project = await ProjectService.getProjectById(req.params.id, req.user!.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        organization: {
          ...project.organization,
          role: project.organization.memberships[0]?.role,
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = ProjectSchema.update.parse(req.body);
    const project = await ProjectService.updateProject(req.params.id, req.user!.id, data);
    
    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update project error:', error);
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
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ProjectService.deleteProject(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's projects across all organizations
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projects = await ProjectService.getUserProjects(req.user!.id);
    
    res.json({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        organization: project.organization,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

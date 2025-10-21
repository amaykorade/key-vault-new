import { Router } from 'express';
import { ProjectService, ProjectSchema } from '../services/project';
import { ProjectMemberService, ProjectMemberSchema } from '../services/project-member';
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
      projects: projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        role: project.role,
        accessType: project.accessType,
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
        organization: project.organization,
        userRole: project.userRole,
        userAccess: project.userAccess,
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
      projects: projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        organizationId: project.organizationId,
        role: project.role,
        accessType: project.accessType,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== PROJECT MEMBER MANAGEMENT ====================

// Get project members
router.get('/:projectId/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const members = await ProjectMemberService.getProjectMembers(projectId, req.user!.id);
    
    res.json({
      members: members.map((member: any) => ({
        id: member.id,
        user: member.user,
        role: member.role,
        createdAt: member.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get project members error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available members to add to project
router.get('/:projectId/available-members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const availableMembers = await ProjectMemberService.getAvailableMembers(projectId, req.user!.id);
    
    res.json({ members: availableMembers });
  } catch (error) {
    console.error('Get available members error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to project
router.post('/:projectId/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const data = ProjectMemberSchema.add.parse(req.body);
    const member = await ProjectMemberService.addMember(projectId, req.user!.id, data);
    
    res.status(201).json({
      member: {
        id: member.id,
        user: member.user,
        role: member.role,
        createdAt: member.createdAt,
      },
    });
  } catch (error) {
    console.error('Add project member error:', error);
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
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'User must be a member of the organization first') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'User is already a member of this project') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role
router.put('/:projectId/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, userId } = req.params;
    const data = ProjectMemberSchema.update.parse(req.body);
    const member = await ProjectMemberService.updateMemberRole(projectId, userId, req.user!.id, data);
    
    res.json({
      member: {
        id: member.id,
        user: member.user,
        role: member.role,
        updatedAt: member.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update member role error:', error);
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
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('last project OWNER')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'User is not a member of this project') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from project
router.delete('/:projectId/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, userId } = req.params;
    await ProjectMemberService.removeMember(projectId, userId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Remove project member error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Access denied')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('last project OWNER')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'User is not a member of this project') {
        return res.status(404).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

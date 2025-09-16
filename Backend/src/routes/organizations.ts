import { Router } from 'express';
import { OrganizationService, OrganizationSchema } from '../services/organization';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Create organization
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = OrganizationSchema.create.parse(req.body);
    const organization = await OrganizationService.createOrganization(req.user!.id, data);
    
    res.status(201).json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error('Create organization error:', error);
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's organizations
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const organizations = await OrganizationService.getUserOrganizations(req.user!.id);
    
    res.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        role: org.memberships[0]?.role,
        memberCount: org._count.memberships,
        projectCount: org._count.projects,
        createdAt: org.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization by ID
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const organization = await OrganizationService.getOrganizationById(req.params.id, req.user!.id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        role: organization.memberships[0]?.role,
        memberCount: organization._count.memberships,
        projectCount: organization._count.projects,
        createdAt: organization.createdAt,
      },
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update organization
router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = OrganizationSchema.update.parse(req.body);
    const organization = await OrganizationService.updateOrganization(req.params.id, req.user!.id, data);
    
    res.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        updatedAt: organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update organization error:', error);
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
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get organization members
router.get('/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const members = await OrganizationService.getOrganizationMembers(req.params.id, req.user!.id);
    
    res.json({
      members: members.map(member => ({
        id: member.id,
        userId: member.user.id,
        email: member.user.email,
        name: member.user.name,
        image: member.user.image,
        role: member.role,
        joinedAt: member.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get members error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to organization
router.post('/:id/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = OrganizationSchema.addMember.parse(req.body);
    const membership = await OrganizationService.addMember(req.params.id, req.user!.id, data);
    
    res.status(201).json({
      membership: {
        id: membership.id,
        role: membership.role,
        joinedAt: membership.createdAt,
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
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
    if (error instanceof Error && (error.message === 'Insufficient permissions' || error.message === 'User not found' || error.message === 'User is already a member')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role
router.put('/:id/members/:memberId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const data = OrganizationSchema.updateMemberRole.parse(req.body);
    const membership = await OrganizationService.updateMemberRole(req.params.id, req.params.memberId, req.user!.id, data);
    
    res.json({
      membership: {
        id: membership.id,
        role: membership.role,
        updatedAt: membership.updatedAt,
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
    if (error instanceof Error && (error.message === 'Insufficient permissions' || error.message === 'Cannot change owner role')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete organization (only owner)
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await OrganizationService.deleteOrganization(req.params.id, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete organization error:', error);
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: 'Only the organization owner can delete the organization' });
    }
    if (error instanceof Error && error.message === 'Organization not found') {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from organization
router.delete('/:id/members/:memberId', requireAuth, async (req: AuthRequest, res) => {
  try {
    await OrganizationService.removeMember(req.params.id, req.params.memberId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Remove member error:', error);
    if (error instanceof Error && (error.message === 'Insufficient permissions' || error.message === 'Cannot remove owner')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

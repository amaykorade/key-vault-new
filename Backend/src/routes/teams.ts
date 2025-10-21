import { Router } from 'express';
import { TeamService, TeamSchema } from '../services/team';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Create team in organization
router.post('/organizations/:organizationId/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const data = TeamSchema.create.parse(req.body);
    const team = await TeamService.createTeam(organizationId, req.user!.id, data);
    
    res.status(201).json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        organizationId: team.organizationId,
        createdById: team.createdById,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create team error:', error);
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
      const errorMessages = [
        'Insufficient permissions to create teams',
        'Team name already exists in this organization'
      ];
      if (errorMessages.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teams in organization
router.get('/organizations/:organizationId/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { organizationId } = req.params;
    const teams = await TeamService.getOrganizationTeams(organizationId, req.user!.id);
    
    res.json({
      teams: teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        organizationId: team.organizationId,
        createdBy: team.createdBy,
        memberCount: team._count.members,
        userRole: team.members[0]?.role || null,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get organization teams error:', error);
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team details
router.get('/teams/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const team = await TeamService.getTeamById(teamId, req.user!.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        organizationId: team.organizationId,
        createdBy: team.createdBy,
        organization: team.organization,
        members: team.members.map((member: any) => ({
          id: member.id,
          user: member.user,
          role: member.role,
          joinedAt: member.createdAt,
        })),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get team details error:', error);
    if (error instanceof Error) {
      const errorMessages = ['Team not found', 'Access denied'];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team info
router.put('/teams/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const data = TeamSchema.update.parse(req.body);
    const team = await TeamService.updateTeam(teamId, req.user!.id, data);
    
    res.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        organizationId: team.organizationId,
        createdById: team.createdById,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update team error:', error);
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
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to update team',
        'Team name already exists in this organization'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete team
router.delete('/teams/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    await TeamService.deleteTeam(teamId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete team error:', error);
    if (error instanceof Error) {
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to delete team'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to team
router.post('/teams/:teamId/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const data = TeamSchema.addMember.parse(req.body);
    const membership = await TeamService.addTeamMember(teamId, req.user!.id, data);
    
    res.status(201).json({
      membership: {
        id: membership.id,
        user: membership.user,
        role: membership.role,
        joinedAt: membership.createdAt,
      },
    });
  } catch (error) {
    console.error('Add team member error:', error);
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
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to add team members',
        'User must be a member of the organization first',
        'User is already a member of this team'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove team member
router.delete('/teams/:teamId/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId, userId } = req.params;
    await TeamService.removeTeamMember(teamId, userId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Remove team member error:', error);
    if (error instanceof Error) {
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to remove team members',
        'User is not a member of this team',
        'Cannot remove the last team lead. Assign another lead first.'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team member role
router.put('/teams/:teamId/members/:userId/role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId, userId } = req.params;
    const data = TeamSchema.updateMemberRole.parse(req.body);
    const membership = await TeamService.updateTeamMemberRole(teamId, userId, req.user!.id, data);
    
    res.json({
      membership: {
        id: membership.id,
        user: membership.user,
        role: membership.role,
        updatedAt: membership.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update team member role error:', error);
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
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to update team member roles',
        'User is not a member of this team',
        'Cannot demote the last team lead. Promote another member first.'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's teams across all organizations
router.get('/users/me/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const teams = await TeamService.getUserTeams(req.user!.id);
    
    res.json({
      teams: teams.map((membership: any) => ({
        id: membership.id,
        role: membership.role,
        joinedAt: membership.createdAt,
        team: {
          id: membership.team.id,
          name: membership.team.name,
          description: membership.team.description,
          organizationId: membership.team.organizationId,
          organization: membership.team.organization,
          memberCount: membership.team._count.members,
          createdAt: membership.team.createdAt,
        },
      })),
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign project to team
router.post('/teams/:teamId/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const data = TeamSchema.assignProject.parse(req.body);
    const teamProject = await TeamService.assignProjectToTeam(
      teamId, 
      data.projectId, 
      data.permissions, 
      req.user!.id
    );
    
    res.status(201).json({
      assignment: {
        id: teamProject.id,
        teamId: teamProject.teamId,
        projectId: teamProject.projectId,
        createdAt: teamProject.createdAt,
      },
    });
  } catch (error) {
    console.error('Assign project to team error:', error);
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
      const errorMessages = [
        'Team not found',
        'Project not found or not in the same organization',
        'Insufficient permissions to assign projects to team',
        'Project is already assigned to this team'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove project from team
router.delete('/teams/:teamId/projects/:projectId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId, projectId } = req.params;
    await TeamService.removeProjectFromTeam(teamId, projectId, req.user!.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Remove project from team error:', error);
    if (error instanceof Error) {
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to remove projects from team',
        'Project is not assigned to this team'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team project permissions
router.put('/teams/:teamId/projects/:projectId/permissions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId, projectId } = req.params;
    const data = TeamSchema.updateProjectPermissions.parse(req.body);
    const teamProject = await TeamService.updateTeamProjectPermissions(
      teamId, 
      projectId, 
      data.permissions, 
      req.user!.id
    );
    
    res.json({
      assignment: {
        id: teamProject.id,
        teamId: teamProject.teamId,
        projectId: teamProject.projectId,
        updatedAt: teamProject.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update team project permissions error:', error);
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
      const errorMessages = [
        'Team not found',
        'Insufficient permissions to update team project permissions',
        'Project is not assigned to this team'
      ];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 400;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team's assigned projects
router.get('/teams/:teamId/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { teamId } = req.params;
    const projects = await TeamService.getTeamProjects(teamId, req.user!.id);
    
    res.json({
      projects: projects.map((assignment: any) => ({
        id: assignment.id,
        project: assignment.project,
        permissions: assignment.permissions.map((p: any) => p.permission),
        assignedAt: assignment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get team projects error:', error);
    if (error instanceof Error) {
      const errorMessages = ['Team not found', 'Access denied'];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Team not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project's assigned teams
router.get('/projects/:projectId/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const teams = await TeamService.getProjectTeams(projectId, req.user!.id);
    
    res.json({
      teams: teams.map((assignment: any) => ({
        id: assignment.id,
        team: assignment.team,
        permissions: assignment.permissions.map((p: any) => p.permission),
        assignedAt: assignment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get project teams error:', error);
    if (error instanceof Error) {
      const errorMessages = ['Project not found', 'Access denied'];
      if (errorMessages.includes(error.message)) {
        const status = error.message === 'Project not found' ? 404 : 403;
        return res.status(status).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

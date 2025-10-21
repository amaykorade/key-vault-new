import { db } from '../lib/db';
import { z } from 'zod';

export const TeamSchema = {
  create: z.object({
    name: z.string().min(1, 'Team name is required').max(50, 'Team name must be less than 50 characters'),
    description: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(1, 'Team name is required').max(50, 'Team name must be less than 50 characters').optional(),
    description: z.string().optional(),
  }),
  addMember: z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['LEAD', 'MEMBER']).default('MEMBER'),
  }),
  updateMemberRole: z.object({
    role: z.enum(['LEAD', 'MEMBER']),
  }),
  assignProject: z.object({
    projectId: z.string().uuid('Invalid project ID'),
    permissions: z.array(z.enum(['READ_secrets', 'write_secrets', 'delete_secrets', 'manage_environments', 'manage_folders'])).default([]),
  }),
  updateProjectPermissions: z.object({
    permissions: z.array(z.enum(['read_secrets', 'write_secrets', 'delete_secrets', 'manage_environments', 'manage_folders'])).default([]),
  }),
};

export class TeamService {
  // Create team (only org owners/admins can create teams)
  static async createTeam(organizationId: string, createdById: string, data: z.infer<typeof TeamSchema.create>) {
    // Check if user has permission to create teams in this organization
    const membership = await db.membership.findFirst({
      where: {
        userId: createdById,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Insufficient permissions to create teams');
    }

    // Check if team name already exists in organization
    const existingTeam = await db.team.findFirst({
      where: {
        organizationId,
        name: data.name,
      },
    });

    if (existingTeam) {
      throw new Error('Team name already exists in this organization');
    }

    // Create team and automatically add creator as LEAD
    return await db.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId,
          createdById,
        },
      });

      // Add creator as team lead
      await tx.teamMembership.create({
        data: {
          userId: createdById,
          teamId: team.id,
          role: 'LEAD',
        },
      });

      return team;
    });
  }

  // Get all teams in an organization
  static async getOrganizationTeams(organizationId: string, userId: string) {
    // Check if user has access to this organization
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return await db.team.findMany({
      where: {
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get team details with members
  static async getTeamById(teamId: string, userId: string) {
    // First check if user has access to this team's organization
    const team = await db.team.findFirst({
      where: {
        id: teamId,
      },
      include: {
        organization: {
          include: {
            memberships: {
              where: {
                userId,
              },
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if user is member of the organization
    if (team.organization.memberships.length === 0) {
      throw new Error('Access denied');
    }

    // Get full team details with members
    return await db.team.findUnique({
      where: { id: teamId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' }, // LEAD first, then MEMBER
            { createdAt: 'asc' },
          ],
        },
      },
    });
  }

  // Add existing organization member to team
  static async addTeamMember(teamId: string, requesterId: string, data: z.infer<typeof TeamSchema.addMember>) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: {
                userId: requesterId,
              },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if requester has permission (must be org owner/admin or team lead)
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canAddMembers = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canAddMembers) {
      throw new Error('Insufficient permissions to add team members');
    }

    // Check if target user is a member of the organization
    const targetUserMembership = await db.membership.findFirst({
      where: {
        userId: data.userId,
        organizationId: team.organizationId,
      },
    });

    if (!targetUserMembership) {
      throw new Error('User must be a member of the organization first');
    }

    // Check if user is already a team member
    const existingTeamMembership = await db.teamMembership.findFirst({
      where: {
        userId: data.userId,
        teamId,
      },
    });

    if (existingTeamMembership) {
      throw new Error('User is already a member of this team');
    }

    // Add user to team
    return await db.teamMembership.create({
      data: {
        userId: data.userId,
        teamId,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Remove team member
  static async removeTeamMember(teamId: string, memberId: string, requesterId: string) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if requester has permission
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canRemoveMembers = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD' ||
      requesterId === memberId; // Users can remove themselves

    if (!canRemoveMembers) {
      throw new Error('Insufficient permissions to remove team members');
    }

    // Check if target member exists in team
    const targetMembership = await db.teamMembership.findFirst({
      where: {
        userId: memberId,
        teamId,
      },
    });

    if (!targetMembership) {
      throw new Error('User is not a member of this team');
    }

    // Don't allow removing the last team lead
    if (targetMembership.role === 'LEAD') {
      const leadCount = await db.teamMembership.count({
        where: {
          teamId,
          role: 'LEAD',
        },
      });

      if (leadCount === 1) {
        throw new Error('Cannot remove the last team lead. Assign another lead first.');
      }
    }

    // Remove team member
    return await db.teamMembership.delete({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
    });
  }

  // Update team member role
  static async updateTeamMemberRole(teamId: string, memberId: string, requesterId: string, data: z.infer<typeof TeamSchema.updateMemberRole>) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if requester has permission (org owner/admin or team lead)
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canUpdateRoles = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canUpdateRoles) {
      throw new Error('Insufficient permissions to update team member roles');
    }

    // Check if target member exists
    const targetMembership = await db.teamMembership.findFirst({
      where: {
        userId: memberId,
        teamId,
      },
    });

    if (!targetMembership) {
      throw new Error('User is not a member of this team');
    }

    // If demoting from LEAD to MEMBER, ensure there's at least one other lead
    if (targetMembership.role === 'LEAD' && data.role === 'MEMBER') {
      const leadCount = await db.teamMembership.count({
        where: {
          teamId,
          role: 'LEAD',
        },
      });

      if (leadCount === 1) {
        throw new Error('Cannot demote the last team lead. Promote another member first.');
      }
    }

    // Update role
    return await db.teamMembership.update({
      where: {
        userId_teamId: {
          userId: memberId,
          teamId,
        },
      },
      data: {
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  // Update team info (name, description)
  static async updateTeam(teamId: string, requesterId: string, data: z.infer<typeof TeamSchema.update>) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if requester has permission (org owner/admin or team lead)
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canUpdate = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canUpdate) {
      throw new Error('Insufficient permissions to update team');
    }

    // Check for name conflicts if name is being updated
    if (data.name && data.name !== team.name) {
      const existingTeam = await db.team.findFirst({
        where: {
          organizationId: team.organizationId,
          name: data.name,
          id: { not: teamId },
        },
      });

      if (existingTeam) {
        throw new Error('Team name already exists in this organization');
      }
    }

    // Update team
    return await db.team.update({
      where: { id: teamId },
      data,
    });
  }

  // Delete team
  static async deleteTeam(teamId: string, requesterId: string) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check if requester has permission (org owner/admin or team creator)
    const orgMembership = team.organization.memberships[0];
    
    const canDelete = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      team.createdById === requesterId;

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete team');
    }

    // Delete team (cascade will handle team memberships)
    return await db.team.delete({
      where: { id: teamId },
    });
  }

  // Get user's teams across all organizations
  static async getUserTeams(userId: string) {
    return await db.teamMembership.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Assign project to team with permissions
  static async assignProjectToTeam(
    teamId: string, 
    projectId: string, 
    permissions: string[], 
    requesterId: string
  ) {
    // Get team and project to verify they exist and user has permission
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const project = await db.project.findFirst({
      where: { 
        id: projectId,
        organizationId: team.organizationId, // Ensure project is in same org
      },
    });

    if (!project) {
      throw new Error('Project not found or not in the same organization');
    }

    // Check permissions (org owner/admin or team lead)
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canAssignProject = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canAssignProject) {
      throw new Error('Insufficient permissions to assign projects to team');
    }

    // Check if project is already assigned to team
    const existingAssignment = await db.teamProject.findFirst({
      where: {
        teamId,
        projectId,
      },
    });

    if (existingAssignment) {
      throw new Error('Project is already assigned to this team');
    }

    // Create team-project assignment with permissions
    return await db.$transaction(async (tx) => {
      const teamProject = await tx.teamProject.create({
        data: {
          teamId,
          projectId,
        },
      });

      // Add permissions
      if (permissions.length > 0) {
        await tx.teamProjectPermission.createMany({
          data: permissions.map(permission => ({
            teamProjectId: teamProject.id,
            permission: permission as any, // Cast to ProjectPermission enum
          })),
        });
      }

      return teamProject;
    });
  }

  // Remove project from team
  static async removeProjectFromTeam(teamId: string, projectId: string, requesterId: string) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check permissions
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canRemoveProject = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canRemoveProject) {
      throw new Error('Insufficient permissions to remove projects from team');
    }

    // Find and delete team-project assignment (cascade will handle permissions)
    const teamProject = await db.teamProject.findFirst({
      where: {
        teamId,
        projectId,
      },
    });

    if (!teamProject) {
      throw new Error('Project is not assigned to this team');
    }

    return await db.teamProject.delete({
      where: { id: teamProject.id },
    });
  }

  // Update team project permissions
  static async updateTeamProjectPermissions(
    teamId: string, 
    projectId: string, 
    permissions: string[], 
    requesterId: string
  ) {
    // Get team and check permissions
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        members: {
          where: { userId: requesterId },
          select: { role: true },
        },
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Check permissions
    const orgMembership = team.organization.memberships[0];
    const teamMembership = team.members[0];
    
    const canUpdatePermissions = 
      orgMembership?.role && ['OWNER', 'ADMIN'].includes(orgMembership.role) ||
      teamMembership?.role === 'LEAD';

    if (!canUpdatePermissions) {
      throw new Error('Insufficient permissions to update team project permissions');
    }

    // Find team-project assignment
    const teamProject = await db.teamProject.findFirst({
      where: {
        teamId,
        projectId,
      },
    });

    if (!teamProject) {
      throw new Error('Project is not assigned to this team');
    }

    // Update permissions by deleting all and recreating
    return await db.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.teamProjectPermission.deleteMany({
        where: {
          teamProjectId: teamProject.id,
        },
      });

      // Create new permissions
      if (permissions.length > 0) {
        await tx.teamProjectPermission.createMany({
          data: permissions.map(permission => ({
            teamProjectId: teamProject.id,
            permission: permission as any,
          })),
        });
      }

      return teamProject;
    });
  }

  // Get team's assigned projects with permissions
  static async getTeamProjects(teamId: string, requesterId: string) {
    // Check if user has access to this team
    const team = await db.team.findFirst({
      where: { id: teamId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (team.organization.memberships.length === 0) {
      throw new Error('Access denied');
    }

    return await db.teamProject.findMany({
      where: { teamId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        permissions: {
          select: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get project's assigned teams
  static async getProjectTeams(projectId: string, requesterId: string) {
    // Check if user has access to this project's organization
    const project = await db.project.findFirst({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId: requesterId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.organization.memberships.length === 0) {
      throw new Error('Access denied');
    }

    return await db.teamProject.findMany({
      where: { projectId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            organizationId: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        permissions: {
          select: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

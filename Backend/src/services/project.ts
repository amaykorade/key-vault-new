import { db } from '../lib/db';
import { z } from 'zod';
import { AccessControlService } from './access-control';

export const ProjectSchema = {
  create: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
  }),
  update: z.object({
    name: z.string().min(1, 'Project name is required').optional(),
    description: z.string().optional(),
  }),
};

export class ProjectService {
  // Create project in organization
  static async createProject(organizationId: string, userId: string, data: z.infer<typeof ProjectSchema.create>) {
    // Check if user has access to organization
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: You must be a member of the organization');
    }

    // Create project and automatically add creator as OWNER
    return await db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          organizationId,
        },
      });

      // Add creator as project OWNER
      await (tx as any).projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'OWNER',
        },
      });

      return project;
    });
  }

  // Get projects in organization (only those user has access to)
  static async getOrganizationProjects(organizationId: string, userId: string) {
    // Check if user has access to organization
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new Error('Access denied: You must be a member of the organization');
    }

    // Get all projects user has access to
    const userProjects = await AccessControlService.getUserProjects(userId);
    
    // Filter to only this organization's projects
    return userProjects
      .filter((p: any) => p.organizationId === organizationId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get specific project
  static async getProjectById(projectId: string, userId: string) {
    // Check if user has access to this project
    const access = await AccessControlService.checkProjectAccess(userId, projectId);
    
    if (!access.hasAccess) {
      throw new Error('Access denied: You do not have access to this project');
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!project) {
      return null;
    }

    // Add user's access information to the response
    return {
      ...project,
      userRole: access.role,
      userAccess: {
        canRead: access.canRead,
        canWrite: access.canWrite,
        canDelete: access.canDelete,
        canManageMembers: access.canManageMembers,
        canManageProject: access.canManageProject,
      },
    };
  }

  // Update project (only members with manage access)
  static async updateProject(projectId: string, userId: string, data: z.infer<typeof ProjectSchema.update>) {
    // Check if user can manage members (ADMIN or OWNER)
    const canManage = await AccessControlService.canManageMembers(userId, projectId);
    if (!canManage) {
      throw new Error('Access denied: You need ADMIN or OWNER role to update project details');
    }

    return await db.project.update({
      where: { id: projectId },
      data,
    });
  }

  // Delete project (only project OWNERs or org OWNER/ADMIN)
  static async deleteProject(projectId: string, userId: string) {
    // Check if user can manage the project (OWNER)
    const canManageProject = await AccessControlService.canManageProject(userId, projectId);
    if (!canManageProject) {
      throw new Error('Access denied: You need project OWNER or org OWNER/ADMIN role to delete project');
    }

    return await db.project.delete({
      where: { id: projectId },
    });
  }

  // Get user's projects across all organizations
  static async getUserProjects(userId: string) {
    // Use AccessControlService to get all accessible projects
    return await AccessControlService.getUserProjects(userId);
  }
}

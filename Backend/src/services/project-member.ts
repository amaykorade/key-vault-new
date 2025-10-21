import { db } from '../lib/db';
import { z } from 'zod';
import { AccessControlService } from './access-control';

export const ProjectMemberSchema = {
  add: z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['OWNER', 'ADMIN', 'WRITE', 'READ']).default('READ'),
  }),
  update: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'WRITE', 'READ']),
  }),
};

export class ProjectMemberService {
  /**
   * Add a user to a project (GitHub-style sharing)
   */
  static async addMember(
    projectId: string,
    requesterId: string,
    data: z.infer<typeof ProjectMemberSchema.add>
  ) {
    // Check if requester can manage members
    const canManage = await AccessControlService.canManageMembers(requesterId, projectId);
    if (!canManage) {
      throw new Error('Access denied: You need ADMIN or OWNER role to add members');
    }

    // Get project to verify it exists and get org ID
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify target user is a member of the organization
    const targetUserOrgMembership = await db.membership.findFirst({
      where: {
        userId: data.userId,
        organizationId: project.organizationId,
      },
    });

    if (!targetUserOrgMembership) {
      throw new Error('User must be a member of the organization first');
    }

    // Check if user is already a project member
    const existingMember = await (db as any).projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: data.userId,
        },
      },
    });

    if (existingMember) {
      throw new Error('User is already a member of this project');
    }

    // Add user to project
    return await (db as any).projectMember.create({
      data: {
        projectId,
        userId: data.userId,
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

  /**
   * Update a member's role
   */
  static async updateMemberRole(
    projectId: string,
    targetUserId: string,
    requesterId: string,
    data: z.infer<typeof ProjectMemberSchema.update>
  ) {
    // Check if requester can manage members
    const canManage = await AccessControlService.canManageMembers(requesterId, projectId);
    if (!canManage) {
      throw new Error('Access denied: You need ADMIN or OWNER role to update member roles');
    }

    // Check if target user is a project member
    const existingMember = await (db as any).projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!existingMember) {
      throw new Error('User is not a member of this project');
    }

    // Prevent demoting the last OWNER
    if (existingMember.role === 'OWNER' && data.role !== 'OWNER') {
      const ownerCount = await (db as any).projectMember.count({
        where: {
          projectId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        throw new Error('Cannot change the role of the last project OWNER');
      }
    }

    // Update the member's role
    return await (db as any).projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
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

  /**
   * Remove a member from project
   */
  static async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string
  ) {
    // Check if requester can manage members
    const canManage = await AccessControlService.canManageMembers(requesterId, projectId);
    if (!canManage) {
      throw new Error('Access denied: You need ADMIN or OWNER role to remove members');
    }

    // Check if target user is a project member
    const existingMember = await (db as any).projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!existingMember) {
      throw new Error('User is not a member of this project');
    }

    // Prevent removing the last OWNER
    if (existingMember.role === 'OWNER') {
      const ownerCount = await (db as any).projectMember.count({
        where: {
          projectId,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        throw new Error('Cannot remove the last project OWNER');
      }
    }

    // Remove the member
    return await (db as any).projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });
  }

  /**
   * Get all members of a project
   */
  static async getProjectMembers(projectId: string, requesterId: string) {
    // Check if requester has access to view the project
    const canRead = await AccessControlService.canRead(requesterId, projectId);
    if (!canRead) {
      throw new Error('Access denied: You need access to the project to view members');
    }

    const members = await (db as any).projectMember.findMany({
      where: { projectId },
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
        { role: 'asc' }, // OWNER first, then ADMIN, WRITE, READ
        { createdAt: 'asc' },
      ],
    });

    return members;
  }

  /**
   * Get available organization members to add to project
   */
  static async getAvailableMembers(projectId: string, requesterId: string) {
    // Check if requester can manage members
    const canManage = await AccessControlService.canManageMembers(requesterId, projectId);
    if (!canManage) {
      throw new Error('Access denied: You need ADMIN or OWNER role to view available members');
    }

    // Get project to find organization
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get organization members
    const orgMembers = await db.membership.findMany({
      where: {
        organizationId: project.organizationId,
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

    // Get current project members
    const projectMembers = await (db as any).projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    const projectMemberIds = new Set(projectMembers.map((m: any) => m.userId));

    // Filter to only members not already in project
    return orgMembers
      .filter((m: any) => !projectMemberIds.has(m.userId))
      .map((m: any) => ({
        ...m.user,
        orgRole: m.role,
      }));
  }
}


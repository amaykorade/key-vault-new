import { db } from '../lib/db';
import { z } from 'zod';

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
      throw new Error('Access denied');
    }

    return await db.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId,
      },
    });
  }

  // Get projects in organization
  static async getOrganizationProjects(organizationId: string, userId: string) {
    // Check if user has access to organization
    const membership = await db.membership.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new Error('Access denied');
    }

    return await db.project.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get specific project
  static async getProjectById(projectId: string, userId: string) {
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    return project;
  }

  // Update project (only members with write access)
  static async updateProject(projectId: string, userId: string, data: z.infer<typeof ProjectSchema.update>) {
    // Check if user has access to project's organization
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: {
              userId,
              role: {
                in: ['OWNER', 'ADMIN', 'MEMBER'],
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Access denied');
    }

    return await db.project.update({
      where: { id: projectId },
      data,
    });
  }

  // Delete project (only owners/admins)
  static async deleteProject(projectId: string, userId: string) {
    // Check if user has admin access to project's organization
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          memberships: {
            some: {
              userId,
              role: {
                in: ['OWNER', 'ADMIN'],
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Access denied');
    }

    return await db.project.delete({
      where: { id: projectId },
    });
  }

  // Get user's projects across all organizations
  static async getUserProjects(userId: string) {
    return await db.project.findMany({
      where: {
        organization: {
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

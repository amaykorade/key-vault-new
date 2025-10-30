import { db } from '../lib/db';

/**
 * Access Control Service
 * GitHub-style project member access control
 * 
 * Access Hierarchy:
 * 1. Organization OWNER/ADMIN → Full access to all projects
 * 2. Project Member → Access based on role (OWNER/ADMIN/WRITE/READ)
 * 3. No access otherwise
 */

export type ProjectRole = 'OWNER' | 'ADMIN' | 'WRITE' | 'READ';

export interface ProjectAccess {
  hasAccess: boolean;
  role: ProjectRole | null;
  accessType: 'org_owner' | 'org_admin' | 'project_member' | 'none';
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canManageProject: boolean;
}

export class AccessControlService {
  /**
   * Helper to convert ProjectRole to permissions
   */
  private static roleToPermissions(role: ProjectRole): ProjectAccess {
    switch (role) {
      case 'OWNER':
        return {
          hasAccess: true,
          role: 'OWNER',
          accessType: 'project_member',
          canRead: true,
          canWrite: true,
          canDelete: true,
          canManageMembers: true,
          canManageProject: true,
        };
      case 'ADMIN':
        return {
          hasAccess: true,
          role: 'ADMIN',
          accessType: 'project_member',
          canRead: true,
          canWrite: true,
          canDelete: true,
          canManageMembers: true,
          canManageProject: false,
        };
      case 'WRITE':
        return {
          hasAccess: true,
          role: 'WRITE',
          accessType: 'project_member',
          canRead: true,
          canWrite: true,
          canDelete: false,
          canManageMembers: false,
          canManageProject: false,
        };
      case 'READ':
        return {
          hasAccess: true,
          role: 'READ',
          accessType: 'project_member',
          canRead: true,
          canWrite: false,
          canDelete: false,
          canManageMembers: false,
          canManageProject: false,
        };
    }
  }

  /**
   * Check if user has access to a project and what permissions they have
   * 
   * Access Priority:
   * 1. Org OWNER → Full access (as OWNER)
   * 2. Org ADMIN → Full access (as ADMIN)
   * 3. Project Member → Access based on role
   * 4. No access
   */
  static async checkProjectAccess(
    userId: string,
    projectId: string
  ): Promise<ProjectAccess> {
    // Get project with organization membership
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            memberships: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!project) {
      return {
        hasAccess: false,
        role: null,
        accessType: 'none',
        canRead: false,
        canWrite: false,
        canDelete: false,
        canManageMembers: false,
        canManageProject: false,
      };
    }

    // Get project membership separately
    const projectMembership = await (db as any).projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
      select: { role: true },
    });

    const orgMembership = project.organization.memberships[0];

    // 1. Organization OWNER → Full access
    if (orgMembership?.role === 'OWNER') {
      return {
        hasAccess: true,
        role: 'OWNER',
        accessType: 'org_owner',
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageMembers: true,
        canManageProject: true,
      };
    }

    // 2. Organization ADMIN → Full access
    if (orgMembership?.role === 'ADMIN') {
      return {
        hasAccess: true,
        role: 'ADMIN',
        accessType: 'org_admin',
        canRead: true,
        canWrite: true,
        canDelete: true,
        canManageMembers: true,
        canManageProject: true,
      };
    }

    // 3. Project Member → Check their role
    if (projectMembership) {
      return {
        ...this.roleToPermissions(projectMembership.role as ProjectRole),
      };
    }

    // 4. No access
    return {
      hasAccess: false,
      role: null,
      accessType: 'none',
      canRead: false,
      canWrite: false,
      canDelete: false,
      canManageMembers: false,
      canManageProject: false,
    };
  }

  /**
   * Quick checks for common operations
   */
  static async canRead(userId: string, projectId: string): Promise<boolean> {
    const access = await this.checkProjectAccess(userId, projectId);
    return access.canRead;
  }

  static async canWrite(userId: string, projectId: string): Promise<boolean> {
    const access = await this.checkProjectAccess(userId, projectId);
    return access.canWrite;
  }

  static async canDelete(userId: string, projectId: string): Promise<boolean> {
    const access = await this.checkProjectAccess(userId, projectId);
    return access.canDelete;
  }

  static async canManageMembers(userId: string, projectId: string): Promise<boolean> {
    const access = await this.checkProjectAccess(userId, projectId);
    return access.canManageMembers;
  }

  static async canManageProject(userId: string, projectId: string): Promise<boolean> {
    const access = await this.checkProjectAccess(userId, projectId);
    return access.canManageProject;
  }

  /**
   * Get all projects a user has access to
   * Returns projects where user is:
   * 1. Organization OWNER/ADMIN (all org projects)
   * 2. Direct project member
   */
  static async getUserProjects(userId: string) {
    const projects: any[] = [];

    // Get user's organization memberships
    const orgMemberships = await db.membership.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            projects: {
              select: {
                id: true,
                name: true,
                description: true,
                organizationId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    // Add all projects from orgs where user is OWNER/ADMIN
    for (const membership of orgMemberships) {
      if (membership.role === 'OWNER' || membership.role === 'ADMIN') {
        projects.push(
          ...membership.organization.projects.map((p) => ({
            ...p,
            role: membership.role,
            accessType: membership.role === 'OWNER' ? 'org_owner' : 'org_admin',
          }))
        );
      }
    }

    // Get projects where user is a direct member
    const projectMemberships = await (db as any).projectMember.findMany({
      where: { userId },
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
      },
    });

    // Add project memberships
    projects.push(
      ...projectMemberships.map((pm: any) => ({
        ...pm.project,
        role: pm.role,
        accessType: 'project_member',
      }))
    );

    // Remove duplicates (prefer higher role)
    const uniqueProjects = projects.reduce((acc, project) => {
      const existing = acc.find((p: any) => p.id === project.id);
      if (!existing) {
        acc.push(project);
      } else {
        // Keep the one with higher access
        const roles = ['OWNER', 'ADMIN', 'WRITE', 'READ'];
        if (roles.indexOf(project.role) < roles.indexOf(existing.role)) {
          acc = acc.filter((p: any) => p.id !== project.id);
          acc.push(project);
        }
      }
      return acc;
    }, [] as any[]);

    return uniqueProjects;
  }
}


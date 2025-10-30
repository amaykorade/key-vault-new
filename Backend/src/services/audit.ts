import { db } from '../lib/db';

export interface AuditEvent {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  secretId?: string;
  eventType: string;
  action: string;
  resourceName?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async log(event: AuditEvent): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          userId: event.userId,
          organizationId: event.organizationId,
          projectId: event.projectId,
          secretId: event.secretId,
          eventType: event.eventType,
          action: event.action,
          resourceName: event.resourceName,
          description: event.description,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log user authentication events
   */
  static async logUserLogin(userId: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId: success ? userId : undefined,
      eventType: 'user_login',
      action: success ? 'success' : 'failed',
      resourceName: success ? `User: ${userId}` : 'Unknown User',
      description: success ? 'User logged in successfully' : 'Failed login attempt',
      ipAddress,
      userAgent,
    });
  }

  static async logUserLogout(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      eventType: 'user_logout',
      action: 'success',
      resourceName: `User: ${userId}`,
      description: 'User logged out',
      ipAddress,
    });
  }

  /**
   * Log secret-related events
   */
  static async logSecretAccess(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    action: 'view' | 'copy',
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      eventType: 'secret_access',
      action,
      resourceName: `Secret: ${secretName}`,
      description: `User ${action}ed secret "${secretName}"`,
      ipAddress,
    });
  }

  static async logSecretCreate(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId,
      eventType: 'secret_create',
      action: 'create',
      resourceName: `Secret: ${secretName}`,
      description: `User created secret "${secretName}"`,
      ipAddress,
    });
  }

  static async logSecretUpdate(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId,
      eventType: 'secret_update',
      action: 'update',
      resourceName: `Secret: ${secretName}`,
      description: `User updated secret "${secretName}"`,
      ipAddress,
    });
  }

  static async logSecretDelete(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId,
      eventType: 'secret_delete',
      action: 'delete',
      resourceName: `Secret: ${secretName}`,
      description: `User deleted secret "${secretName}"`,
      ipAddress,
    });
  }

  /**
   * Log project-related events
   */
  static async logProjectCreate(
    userId: string,
    projectId: string,
    projectName: string,
    organizationId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      projectId,
      organizationId,
      eventType: 'project_create',
      action: 'create',
      resourceName: `Project: ${projectName}`,
      description: `User created project "${projectName}"`,
      ipAddress,
    });
  }

  static async logProjectDelete(
    userId: string,
    projectId: string,
    projectName: string,
    organizationId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      projectId,
      organizationId,
      eventType: 'project_delete',
      action: 'delete',
      resourceName: `Project: ${projectName}`,
      description: `User deleted project "${projectName}"`,
      ipAddress,
    });
  }

  /**
   * Log organization-related events
   */
  static async logOrganizationCreate(
    userId: string,
    organizationId: string,
    organizationName: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      eventType: 'organization_create',
      action: 'create',
      resourceName: `Organization: ${organizationName}`,
      description: `User created organization "${organizationName}"`,
      ipAddress,
    });
  }

  static async logMemberInvite(
    userId: string,
    organizationId: string,
    invitedEmail: string,
    role: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      eventType: 'member_invite',
      action: 'invite',
      resourceName: `User: ${invitedEmail}`,
      description: `User invited ${invitedEmail} with role ${role}`,
      ipAddress,
    });
  }

  static async logMemberAcceptInvite(
    userId: string,
    organizationId: string,
    userEmail: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      eventType: 'member_accept_invite',
      action: 'accept',
      resourceName: `User: ${userEmail}`,
      description: `User accepted invitation to organization`,
      ipAddress,
    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: string;
    organizationId?: string;
    projectId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.eventType) where.eventType = filters.eventType;

    const logs = await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        secret: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return logs;
  }

  /**
   * Get recent activity for dashboard
   */
  static async getRecentActivity(organizationId?: string, limit: number = 20) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        secret: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get security events (failed logins, etc.)
   */
  static async getSecurityEvents(organizationId?: string, limit: number = 20) {
    const where: any = {
      OR: [
        { eventType: 'user_login', action: 'failed' },
        { eventType: 'unauthorized_access' },
        { eventType: 'suspicious_activity' },
      ],
    };
    
    if (organizationId) where.organizationId = organizationId;

    return await db.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}

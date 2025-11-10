import { db } from '../lib/db';

export interface AuditEvent {
  userId?: string;
  organizationId?: string;
  projectId?: string;
  secretId?: string;
  tokenId?: string;
  eventType: string;
  action: string;
  resourceName?: string;
  resourceType?: string;
  environment?: string;
  folder?: string;
  metadata?: Record<string, any>;
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
          tokenId: event.tokenId,
          eventType: event.eventType,
          action: event.action,
          resourceName: event.resourceName,
          resourceType: event.resourceType,
          environment: event.environment,
          folder: event.folder,
          metadata: event.metadata || {},
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
    organizationId?: string,
    environment?: string,
    folder?: string,
    action: 'view' | 'copy' = 'view',
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'secret_access',
      action,
      resourceName: `Secret: ${secretName}`,
      resourceType: 'secret',
      environment,
      folder,
      description: `User ${action}ed secret "${secretName}"`,
      ipAddress,
    });
  }

  static async logSecretCreate(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    secretType?: string,
    ipAddress?: string
  ): Promise<void> {
    console.log('AuditService.logSecretCreate called:', {
      userId, secretId, secretName, projectId, organizationId, environment, folder, secretType
    });
    
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'secret_create',
      action: 'create',
      resourceName: `Secret: ${secretName}`,
      resourceType: 'secret',
      environment,
      folder,
      metadata: { type: secretType },
      description: `User created secret "${secretName}" in ${environment}/${folder}`,
      ipAddress,
    });
    
    console.log('AuditService.logSecretCreate completed');
  }

  static async logSecretUpdate(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    changedFields?: string[],
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'secret_update',
      action: 'update',
      resourceName: `Secret: ${secretName}`,
      resourceType: 'secret',
      environment,
      folder,
      metadata: { changedFields: changedFields || [] },
      description: `User updated secret "${secretName}" ${changedFields?.length ? `(${changedFields.join(', ')})` : ''}`,
      ipAddress,
    });
  }

  static async logSecretDelete(
    userId: string,
    secretId: string,
    secretName: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      secretId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'secret_delete',
      action: 'delete',
      resourceName: `Secret: ${secretName}`,
      resourceType: 'secret',
      environment,
      folder,
      description: `User deleted secret "${secretName}" from ${environment}/${folder}`,
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
    secretId?: string;
    eventType?: string;
    environment?: string;
    folder?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.secretId) where.secretId = filters.secretId;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.environment) where.environment = filters.environment;
    if (filters.folder) where.folder = filters.folder;
    if (filters.resourceType) where.resourceType = filters.resourceType;

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
   * Get folder-specific logs
   */
  static async getFolderLogs(
    projectId: string,
    environment: string,
    folder: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return this.getAuditLogs({
      projectId,
      environment,
      folder,
      limit,
      offset,
    });
  }

  /**
   * Log token events
   */
  static async logTokenCreate(
    userId: string,
    tokenId: string,
    tokenName: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    scopes?: string[],
    expiresAt?: Date | null,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      tokenId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'token_create',
      action: 'create',
      resourceName: `Token: ${tokenName}`,
      resourceType: 'token',
      environment,
      folder,
      metadata: { scopes, expiresAt: expiresAt?.toISOString() },
      description: `User created service token "${tokenName}"${scopes ? ` with ${scopes.join(', ')} access` : ''}`,
      ipAddress,
    });
  }

  static async logTokenRevoke(
    userId: string,
    tokenId: string,
    tokenName: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      tokenId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'token_revoke',
      action: 'delete',
      resourceName: `Token: ${tokenName}`,
      resourceType: 'token',
      environment,
      folder,
      description: `User revoked service token "${tokenName}"`,
      ipAddress,
    });
  }

  /**
   * Log Vercel sync events
   */
  static async logVercelSync(
    userId: string,
    projectId: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    vercelProjectName?: string,
    syncedCount?: number,
    status?: 'success' | 'failed',
    errors?: string[],
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      projectId,
      organizationId: organizationId || undefined,
      eventType: 'vercel_sync',
      action: status === 'success' ? 'update' : 'failed',
      resourceName: `Vercel: ${vercelProjectName || 'Unknown Project'}`,
      resourceType: 'integration',
      environment,
      folder,
      metadata: {
        syncedCount,
        errors,
        vercelProjectName,
      },
      description: status === 'success'
        ? `User synced ${syncedCount} secret(s) to Vercel project "${vercelProjectName}"`
        : `Failed to sync secrets to Vercel: ${errors?.join(', ')}`,
      ipAddress,
    });
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

  /**
   * CLI-specific auditing
   */
  static async logCliTokenCreate(
    userId: string,
    tokenId: string,
    tokenName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      tokenId,
      eventType: 'cli_token',
      action: 'create',
      resourceName: tokenName ? `CLI Token: ${tokenName}` : 'CLI Token',
      resourceType: 'cli_token',
      description: 'CLI token created via CLI exchange',
      ipAddress,
      userAgent,
    });
  }

  static async logCliTokenDelete(
    userId: string,
    tokenId: string,
    tokenName?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      tokenId,
      eventType: 'cli_token',
      action: 'delete',
      resourceName: tokenName ? `CLI Token: ${tokenName}` : 'CLI Token',
      resourceType: 'cli_token',
      description: 'CLI token revoked',
      ipAddress,
    });
  }

  static async logCliSecretsFetch(
    userId: string,
    projectId: string,
    projectName: string,
    organizationId?: string,
    environment?: string,
    folder?: string,
    secretCount?: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      projectId,
      organizationId,
      eventType: 'cli_fetch',
      action: 'fetch',
      resourceName: `CLI Secrets Fetch: ${projectName}`,
      resourceType: 'cli_fetch',
      environment,
      folder,
      metadata: {
        secretCount: secretCount ?? 0,
      },
      description: `CLI fetched ${secretCount ?? 0} secrets from ${environment || 'all environments'}/${folder || 'all folders'}`,
      ipAddress,
    });
  }
}

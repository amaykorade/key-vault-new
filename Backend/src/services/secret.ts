import { db } from '../lib/db';
import { z } from 'zod';
import { encryptSecret, decryptSecret, maskSecret } from '../lib/encryption';
import { AccessControlService } from './access-control';

export const SecretSchema = {
  create: z.object({
    name: z.string().min(1, 'Secret name is required').max(100, 'Secret name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    type: z.enum(['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER']).default('API_KEY'),
    environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long').default('development'),
    folder: z.string().max(50, 'Folder name too long').default('default'),
    value: z.string().min(1, 'Secret value is required'),
  }),
  update: z.object({
    name: z.string().min(1, 'Secret name is required').max(100, 'Secret name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    type: z.enum(['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER']).optional(),
    environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long').optional(),
    folder: z.string().max(50, 'Folder name too long').optional(),
    value: z.string().min(1, 'Secret value is required').optional(),
  }),
};

export class SecretService {
  // Create secret in project
  static async createSecret(projectId: string, userId: string, data: z.infer<typeof SecretSchema.create>) {
    console.log('SecretService.createSecret called with:', { projectId, userId, data });
    
    // Check if user has write access to this project
    console.log('Checking write access...');
    const canWrite = await AccessControlService.canWrite(userId, projectId);
    console.log('Write access result:', canWrite);
    
    if (!canWrite) {
      throw new Error('Access denied: You need WRITE permission to create secrets');
    }

    // Check if secret name already exists in project for the same environment and folder
    const existingSecret = await db.secret.findFirst({
      where: {
        projectId,
        name: data.name,
        environment: data.environment,
        folder: data.folder,
      },
    });

    if (existingSecret) {
      throw new Error(`Secret with name "${data.name}" already exists in this project for environment "${data.environment}" and folder "${data.folder}"`);
    }

    // Encrypt the secret value
    const encryptedValue = encryptSecret(data.value);

    return await db.secret.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        environment: data.environment,
        folder: data.folder,
        value: encryptedValue,
        projectId,
        createdById: userId,
      },
    });
  }

  // Get secrets in project
  static async getProjectSecrets(projectId: string, userId: string, includeValues: boolean = false) {
    // Check if user has read access to this project
    const canRead = await AccessControlService.canRead(userId, projectId);
    if (!canRead) {
      throw new Error('Access denied: You need READ permission to view secrets');
    }

    const secrets = await db.secret.findMany({
      where: {
        projectId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mask secret values unless specifically requested
    return secrets.map(secret => ({
      ...secret,
      value: includeValues ? decryptSecret(secret.value) : maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    }));
  }

  // Get specific secret
  static async getSecretById(secretId: string, userId: string, includeValue: boolean = false) {
    const secret = await db.secret.findUnique({
      where: { id: secretId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!secret) {
      return null;
    }

    // Check if user has read access to this project
    const canRead = await AccessControlService.canRead(userId, secret.projectId);
    if (!canRead) {
      throw new Error('Access denied: You need READ permission to view this secret');
    }

    return {
      ...secret,
      value: includeValue ? decryptSecret(secret.value) : maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    };
  }

  // Update secret (only members with write access)
  static async updateSecret(secretId: string, userId: string, data: z.infer<typeof SecretSchema.update>) {
    // Get the secret with all fields we need
    const secret = await db.secret.findUnique({
      where: { id: secretId },
      select: { 
        projectId: true,
        name: true,
        environment: true,
        folder: true,
      },
    });

    if (!secret) {
      throw new Error('Secret not found');
    }

    // Check if user has write access to this project
    const canWrite = await AccessControlService.canWrite(userId, secret.projectId);
    if (!canWrite) {
      throw new Error('Access denied: You need WRITE permission to update secrets');
    }

    // Check if new name conflicts with existing secret (if name is being updated)
    if (data.name && data.name !== secret.name) {
      const existingSecret = await db.secret.findFirst({
        where: {
          projectId: secret.projectId,
          name: data.name,
          environment: data.environment || secret.environment,
          folder: data.folder || secret.folder,
          id: {
            not: secretId,
          },
        },
      });

      if (existingSecret) {
        throw new Error(`Secret with name "${data.name}" already exists in this project for environment "${data.environment || secret.environment}" and folder "${data.folder || secret.folder}"`);
      }
    }

    // Prepare update data
    const updateData: any = {
      name: data.name,
      description: data.description,
      type: data.type,
      environment: data.environment,
    };

    // Encrypt new value if provided
    if (data.value) {
      updateData.value = encryptSecret(data.value);
    }

    return await db.secret.update({
      where: { id: secretId },
      data: updateData,
    });
  }

  // Delete secret (only members with delete access)
  static async deleteSecret(secretId: string, userId: string) {
    // Get the secret to find its project
    const secret = await db.secret.findUnique({
      where: { id: secretId },
      select: { projectId: true },
    });

    if (!secret) {
      throw new Error('Secret not found');
    }

    // Check if user has delete access to this project
    const canDelete = await AccessControlService.canDelete(userId, secret.projectId);
    if (!canDelete) {
      throw new Error('Access denied: You need DELETE permission (ADMIN or OWNER role)');
    }

    return await db.secret.delete({
      where: { id: secretId },
    });
  }

  // Get user's secrets across all projects they have access to
  static async getUserSecrets(userId: string, includeValues: boolean = false) {
    // Get all projects user has access to
    const userProjects = await AccessControlService.getUserProjects(userId);
    const projectIds = userProjects.map((p: any) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    const secrets = await db.secret.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mask secret values unless specifically requested
    return secrets.map(secret => ({
      ...secret,
      value: includeValues ? decryptSecret(secret.value) : maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    }));
  }

  // Search secrets by name or description
  static async searchSecrets(userId: string, query: string, projectId?: string) {
    // Get all projects user has access to
    const userProjects = await AccessControlService.getUserProjects(userId);
    const projectIds = userProjects.map((p: any) => p.id);

    if (projectIds.length === 0) {
      return [];
    }

    const whereClause: any = {
      projectId: {
        in: projectId ? [projectId] : projectIds,
      },
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    // If specific projectId requested, verify user has access
    if (projectId && !projectIds.includes(projectId)) {
      throw new Error('Access denied: You do not have access to this project');
    }

    const secrets = await db.secret.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Always mask values in search results
    return secrets.map(secret => ({
      ...secret,
      value: maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    }));
  }

  // Get secrets by type
  static async getSecretsByType(projectId: string, userId: string, type: string) {
    // Check if user has read access to this project
    const canRead = await AccessControlService.canRead(userId, projectId);
    if (!canRead) {
      throw new Error('Access denied: You need READ permission to view secrets');
    }

    const secrets = await db.secret.findMany({
      where: {
        projectId,
        type: type as any,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Always mask values
    return secrets.map(secret => ({
      ...secret,
      value: maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    }));
  }
}

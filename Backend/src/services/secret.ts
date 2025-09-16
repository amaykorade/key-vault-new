import { db } from '../lib/db';
import { z } from 'zod';
import { encryptSecret, decryptSecret, maskSecret } from '../lib/encryption';

export const SecretSchema = {
  create: z.object({
    name: z.string().min(1, 'Secret name is required').max(100, 'Secret name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    type: z.enum(['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER']).default('API_KEY'),
    environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long').default('development'),
    value: z.string().min(1, 'Secret value is required'),
  }),
  update: z.object({
    name: z.string().min(1, 'Secret name is required').max(100, 'Secret name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    type: z.enum(['API_KEY', 'DATABASE_URL', 'JWT_SECRET', 'OAUTH_CLIENT_SECRET', 'WEBHOOK_SECRET', 'SSH_KEY', 'CERTIFICATE', 'PASSWORD', 'OTHER']).optional(),
    environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long').optional(),
    value: z.string().min(1, 'Secret value is required').optional(),
  }),
};

export class SecretService {
  // Create secret in project
  static async createSecret(projectId: string, userId: string, data: z.infer<typeof SecretSchema.create>) {
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

    // Check if secret name already exists in project for the same environment
    const existingSecret = await db.secret.findFirst({
      where: {
        projectId,
        name: data.name,
        environment: data.environment,
      },
    });

    if (existingSecret) {
      throw new Error(`Secret with name "${data.name}" already exists in this project for environment "${data.environment}"`);
    }

    // Encrypt the secret value
    const encryptedValue = encryptSecret(data.value);

    return await db.secret.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        environment: data.environment,
        value: encryptedValue,
        projectId,
        createdById: userId,
      },
    });
  }

  // Get secrets in project
  static async getProjectSecrets(projectId: string, userId: string, includeValues: boolean = false) {
    // Check if user has access to project's organization
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
    });

    if (!project) {
      throw new Error('Access denied');
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
    const secret = await db.secret.findFirst({
      where: {
        id: secretId,
        project: {
          organization: {
            memberships: {
              some: {
                userId,
              },
            },
          },
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
    });

    if (!secret) {
      return null;
    }

    return {
      ...secret,
      value: includeValue ? decryptSecret(secret.value) : maskSecret(decryptSecret(secret.value)),
      maskedValue: maskSecret(decryptSecret(secret.value)),
    };
  }

  // Update secret (only members with write access)
  static async updateSecret(secretId: string, userId: string, data: z.infer<typeof SecretSchema.update>) {
    // Check if user has access to secret's project organization
    const secret = await db.secret.findFirst({
      where: {
        id: secretId,
        project: {
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
      },
    });

    if (!secret) {
      throw new Error('Access denied');
    }

    // Check if new name conflicts with existing secret (if name is being updated)
    if (data.name && data.name !== secret.name) {
      const existingSecret = await db.secret.findFirst({
        where: {
          projectId: secret.projectId,
          name: data.name,
          environment: data.environment || secret.environment,
          id: {
            not: secretId,
          },
        },
      });

      if (existingSecret) {
        throw new Error(`Secret with name "${data.name}" already exists in this project for environment "${data.environment || secret.environment}"`);
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

  // Delete secret (only members with write access)
  static async deleteSecret(secretId: string, userId: string) {
    // Check if user has write access to secret's project organization
    const secret = await db.secret.findFirst({
      where: {
        id: secretId,
        project: {
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
      },
    });

    if (!secret) {
      throw new Error('Access denied');
    }

    return await db.secret.delete({
      where: { id: secretId },
    });
  }

  // Get user's secrets across all projects
  static async getUserSecrets(userId: string, includeValues: boolean = false) {
    const secrets = await db.secret.findMany({
      where: {
        project: {
          organization: {
            memberships: {
              some: {
                userId,
              },
            },
          },
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
    const whereClause: any = {
      project: {
        organization: {
          memberships: {
            some: {
              userId,
            },
          },
        },
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

    if (projectId) {
      whereClause.projectId = projectId;
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
    // Check if user has access to project's organization
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
    });

    if (!project) {
      throw new Error('Access denied');
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

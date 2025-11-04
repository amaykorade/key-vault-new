import axios from 'axios';
import { db } from '../lib/db';
import { encryptSecret, decryptSecret } from '../lib/encryption';

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
}

export interface VercelEnvVar {
  id: string;
  key: string;
  value: string;
  type: 'encrypted' | 'plain';
  target: ('production' | 'preview' | 'development')[];
  createdAt: number;
  updatedAt: number;
}

export class VercelService {
  /**
   * Get Vercel access token for a user/organization
   */
  static async getAccessToken(userId: string, organizationId: string): Promise<string | null> {
    const integration = await db.vercelIntegration.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!integration) return null;

    // Decrypt the stored token
    return decryptSecret(integration.vercelAccessToken);
  }

  /**
   * Store Vercel OAuth access token
   */
  static async storeAccessToken(
    userId: string,
    organizationId: string,
    accessToken: string,
    teamId?: string,
    teamName?: string
  ): Promise<void> {
    // Encrypt the token before storing
    const encryptedToken = encryptSecret(accessToken);

    await db.vercelIntegration.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      create: {
        userId,
        organizationId,
        vercelAccessToken: encryptedToken,
        vercelTeamId: teamId,
        vercelTeamName: teamName,
      },
      update: {
        vercelAccessToken: encryptedToken,
        vercelTeamId: teamId,
        vercelTeamName: teamName,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * List all Vercel projects accessible to the user
   */
  static async listProjects(accessToken: string, teamId?: string): Promise<VercelProject[]> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v9/projects?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v9/projects`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.projects || [];
    } catch (error) {
      console.error('Failed to list Vercel projects:', error);
      throw new Error('Failed to fetch Vercel projects');
    }
  }

  /**
   * Get environment variables for a Vercel project
   */
  static async getEnvVars(
    accessToken: string,
    projectId: string,
    teamId?: string
  ): Promise<VercelEnvVar[]> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v9/projects/${projectId}/env?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v9/projects/${projectId}/env`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data.envs || [];
    } catch (error) {
      console.error('Failed to get Vercel env vars:', error);
      throw new Error('Failed to fetch Vercel environment variables');
    }
  }

  /**
   * Create a new environment variable in Vercel
   */
  static async createEnvVar(
    accessToken: string,
    projectId: string,
    key: string,
    value: string,
    target: ('production' | 'preview' | 'development')[],
    teamId?: string
  ): Promise<void> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v9/projects/${projectId}/env?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v9/projects/${projectId}/env`;

      await axios.post(
        url,
        {
          key,
          value,
          type: 'encrypted',
          target,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to create Vercel env var:', error.response?.data || error);
      throw new Error(`Failed to create environment variable: ${key}`);
    }
  }

  /**
   * Update an existing environment variable in Vercel
   */
  static async updateEnvVar(
    accessToken: string,
    projectId: string,
    envVarId: string,
    value: string,
    teamId?: string
  ): Promise<void> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${envVarId}?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${envVarId}`;

      await axios.patch(
        url,
        { value },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to update Vercel env var:', error.response?.data || error);
      throw new Error(`Failed to update environment variable`);
    }
  }

  /**
   * Delete an environment variable from Vercel
   */
  static async deleteEnvVar(
    accessToken: string,
    projectId: string,
    envVarId: string,
    teamId?: string
  ): Promise<void> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${envVarId}?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${envVarId}`;

      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error: any) {
      console.error('Failed to delete Vercel env var:', error.response?.data || error);
      throw new Error(`Failed to delete environment variable`);
    }
  }

  /**
   * Sync all secrets from a folder to a Vercel project
   */
  static async syncFolderToVercel(
    userId: string,
    projectId: string,
    environment: string,
    folder: string,
    vercelProjectId: string,
    vercelEnvTarget: 'production' | 'preview' | 'development'
  ): Promise<{ synced: number; errors: string[] }> {
    try {
      // Get Vercel access token
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { organizationId: true },
      });

      if (!project) throw new Error('Project not found');

      const accessToken = await this.getAccessToken(userId, project.organizationId);
      if (!accessToken) throw new Error('Vercel not connected');

      // Get the integration to check for team ID
      const integration = await db.vercelIntegration.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: project.organizationId,
          },
        },
      });

      const teamId = integration?.vercelTeamId || undefined;

      // Fetch all secrets from the folder
      const secrets = await db.secret.findMany({
        where: {
          projectId,
          environment,
          folder,
        },
        select: {
          name: true,
          value: true,
          type: true,
        },
      });

      if (secrets.length === 0) {
        return { synced: 0, errors: ['No secrets found in this folder'] };
      }

      // Get existing Vercel env vars
      const existingEnvVars = await this.getEnvVars(accessToken, vercelProjectId, teamId);

      const errors: string[] = [];
      let synced = 0;

      // Sync each secret
      for (const secret of secrets) {
        try {
          const decryptedValue = decryptSecret(secret.value);

          // Check if env var already exists
          const existing = existingEnvVars.find(
            (ev) => ev.key === secret.name && ev.target.includes(vercelEnvTarget)
          );

          if (existing) {
            // Update existing
            await this.updateEnvVar(accessToken, vercelProjectId, existing.id, decryptedValue, teamId);
          } else {
            // Create new
            await this.createEnvVar(
              accessToken,
              vercelProjectId,
              secret.name,
              decryptedValue,
              [vercelEnvTarget],
              teamId
            );
          }

          synced++;
        } catch (error: any) {
          errors.push(`${secret.name}: ${error.message}`);
        }
      }

      // Update sync status
      await db.folderVercelSync.upsert({
        where: {
          projectId_environment_folder: {
            projectId,
            environment,
            folder,
          },
        },
        create: {
          projectId,
          environment,
          folder,
          vercelProjectId,
          vercelEnvTarget,
          lastSyncedAt: new Date(),
          lastSyncStatus: errors.length > 0 ? 'failed' : 'success',
          lastSyncError: errors.length > 0 ? errors.join('; ') : null,
        },
        update: {
          lastSyncedAt: new Date(),
          lastSyncStatus: errors.length > 0 ? 'failed' : 'success',
          lastSyncError: errors.length > 0 ? errors.join('; ') : null,
        },
      });

      return { synced, errors };
    } catch (error: any) {
      console.error('Sync to Vercel failed:', error);
      throw error;
    }
  }

  /**
   * Get sync configuration for a folder
   */
  static async getSyncConfig(projectId: string, environment: string, folder: string) {
    return db.folderVercelSync.findUnique({
      where: {
        projectId_environment_folder: {
          projectId,
          environment,
          folder,
        },
      },
    });
  }

  /**
   * Disconnect Vercel integration
   */
  static async disconnect(userId: string, organizationId: string): Promise<void> {
    await db.vercelIntegration.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }

  /**
   * Check if Vercel is connected for a user/organization
   */
  static async isConnected(userId: string, organizationId: string): Promise<boolean> {
    const integration = await db.vercelIntegration.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return !!integration;
  }

  /**
   * Check if a folder has unsynced changes
   * Compares last secret modification time with last Vercel sync time
   */
  static async hasUnsyncedChanges(
    projectId: string,
    environment: string,
    folder: string
  ): Promise<boolean> {
    try {
      // Get the last sync time for this folder
      const syncConfig = await db.folderVercelSync.findUnique({
        where: {
          projectId_environment_folder: {
            projectId,
            environment,
            folder,
          },
        },
      });

      // If never synced, check if there are any secrets
      if (!syncConfig || !syncConfig.lastSyncedAt) {
        const secretCount = await db.secret.count({
          where: {
            projectId,
            environment,
            folder,
          },
        });
        return secretCount > 0; // Unsynced if there are secrets but never synced
      }

      // Get the most recently updated secret in this folder
      const latestSecret = await db.secret.findFirst({
        where: {
          projectId,
          environment,
          folder,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          updatedAt: true,
        },
      });

      // If no secrets exist, nothing to sync
      if (!latestSecret) {
        return false;
      }

      // Compare timestamps: unsynced if latest secret is newer than last sync
      return latestSecret.updatedAt > syncConfig.lastSyncedAt;
    } catch (error) {
      console.error('Error checking unsynced changes:', error);
      return false; // Default to false on error
    }
  }

  /**
   * Trigger a deployment for a Vercel project
   */
  static async triggerDeployment(
    accessToken: string,
    projectId: string,
    teamId?: string
  ): Promise<{ success: boolean; deploymentUrl?: string; error?: string }> {
    try {
      const url = teamId
        ? `${VERCEL_API_BASE}/v13/deployments?teamId=${teamId}`
        : `${VERCEL_API_BASE}/v13/deployments`;

      console.log('[Vercel] Triggering deployment for project:', projectId);

      const response = await axios.post(
        url,
        {
          name: projectId,
          project: projectId,
          target: 'production',
          gitSource: {
            type: 'github',
            repoId: projectId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[Vercel] Deployment triggered:', response.data.url);

      return {
        success: true,
        deploymentUrl: response.data.url,
      };
    } catch (error: any) {
      console.error('[Vercel] Deployment trigger failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to trigger deployment',
      };
    }
  }
}


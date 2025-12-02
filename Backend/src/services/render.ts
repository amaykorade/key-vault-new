import axios from 'axios';
import { db } from '../lib/db';
import { encryptSecret, decryptSecret } from '../lib/encryption';

const RENDER_API_BASE = 'https://api.render.com/v1';

export interface RenderServiceInfo {
  id: string;
  name: string;
  type: string;
  serviceDetails: {
    name: string;
    type: string;
  };
  updatedAt: string;
}

export interface RenderEnvVar {
  key: string;
  value: string;
  sync: boolean;
}

export class RenderService {
  /**
   * Get Render API key for a specific integration
   */
  static async getApiKey(integrationId: string): Promise<string | null> {
    const integration = await db.renderIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) return null;

    // Decrypt the stored API key
    return decryptSecret(integration.renderApiKey);
  }

  /**
   * List all Render integrations for a user/organization
   */
  static async listIntegrations(userId: string, organizationId: string): Promise<Array<{
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    const integrations = await db.renderIntegration.findMany({
      where: {
        userId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return integrations;
  }

  /**
   * Store Render API key (creates new integration)
   */
  static async storeApiKey(
    userId: string,
    organizationId: string,
    apiKey: string,
    name?: string
  ): Promise<{ id: string; name: string }> {
    // Encrypt the API key before storing
    const encryptedKey = encryptSecret(apiKey);

    // Generate a default name if not provided
    const integrationName = name || `Render ${new Date().toLocaleDateString()}`;

    const integration = await db.renderIntegration.create({
      data: {
        userId,
        organizationId,
        name: integrationName,
        renderApiKey: encryptedKey,
      },
    });

    return {
      id: integration.id,
      name: integration.name,
    };
  }

  /**
   * Delete a Render integration
   */
  static async deleteIntegration(integrationId: string, userId: string): Promise<Array<{ projectId: string; environment: string; folder: string; renderServiceName: string | null }>> {
    // Verify the integration belongs to the user
    const integration = await db.renderIntegration.findUnique({
      where: { id: integrationId },
      include: {
        syncs: true, // Get all related sync configs before deletion
      },
    });

    if (!integration || integration.userId !== userId) {
      throw new Error('Integration not found or access denied');
    }

    // Collect sync config info before deletion for audit logging
    const deletedSyncs = integration.syncs.map((sync) => ({
      projectId: sync.projectId,
      environment: sync.environment,
      folder: sync.folder,
      renderServiceName: sync.renderServiceName,
    }));

    // Delete the integration (cascade will delete related syncs)
    await db.renderIntegration.delete({
      where: { id: integrationId },
    });

    return deletedSyncs;
  }

  /**
   * Check if user has any Render integration for an organization
   */
  static async isConnected(userId: string, organizationId: string): Promise<boolean> {
    const count = await db.renderIntegration.count({
      where: {
        userId,
        organizationId,
      },
    });

    return count > 0;
  }

  /**
   * Validate a Render API key by making a test API call
   */
  static async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Test the API key by listing services (lightweight call)
      const response = await axios.get(`${RENDER_API_BASE}/services?limit=1`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid API key. Please check your key and try again.' };
      }

      if (response.status >= 400) {
        return { valid: false, error: `API key validation failed: ${response.statusText}` };
      }

      return { valid: true };
    } catch (error: any) {
      console.error('Failed to validate Render API key:', error.response?.data || error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { valid: false, error: 'Invalid API key. Please check your key and try again.' };
      }
      
      return { 
        valid: false, 
        error: error.response?.data?.message || 'Failed to validate API key. Please check your connection and try again.' 
      };
    }
  }

  /**
   * List all Render services accessible to the user
   * Filters to only show web_service and worker types (static sites don't support env vars)
   */
  static async listServices(apiKey: string): Promise<RenderServiceInfo[]> {
    try {
      const response = await axios.get(`${RENDER_API_BASE}/services`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Render API returns services in format: { services: [{ service: {...} }] }
      let services: any[] = [];
      if (Array.isArray(response.data)) {
        services = response.data;
      } else if (response.data?.services && Array.isArray(response.data.services)) {
        services = response.data.services;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        services = response.data.data;
      }

      // Filter to only include services that support environment variables
      // Only web_service and worker types support env vars via API
      const supportedServices = services
        .map((item: any) => {
          // Handle both formats: { service: {...} } and direct service object
          const service = item.service || item;
          
          // Validate service has required fields
          if (!service || !service.id || !service.type) {
            console.warn('Invalid service format:', item);
            return null;
          }
          
          return {
            id: service.id,
            name: service.name,
            type: service.type,
            serviceDetails: service.serviceDetails || {},
            updatedAt: service.updatedAt,
          };
        })
        .filter((service: RenderServiceInfo | null): service is RenderServiceInfo => {
          // Filter out null services and non-supported types
          return service !== null && (service.type === 'web_service' || service.type === 'worker');
        });

      console.log(`Filtered ${services.length} services to ${supportedServices.length} supported services (web_service/worker)`);
      return supportedServices;
    } catch (error: any) {
      console.error('Failed to list Render services:', error.response?.data || error);
      throw new Error('Failed to fetch Render services');
    }
  }

  /**
   * Get environment variables for a Render service
   */
  static async getEnvVars(
    apiKey: string,
    serviceId: string
  ): Promise<RenderEnvVar[]> {
    try {
      const response = await axios.get(`${RENDER_API_BASE}/services/${serviceId}/env-vars`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Render API might return { envVars: [...] } or just an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.envVars) {
        return response.data.envVars;
      } else if (response.data?.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('Failed to get Render env vars:', error.response?.data || error);
      throw new Error('Failed to fetch Render environment variables');
    }
  }

  /**
   * Create or update environment variable in Render service
   */
  static async upsertEnvVar(
    apiKey: string,
    serviceId: string,
    key: string,
    value: string
  ): Promise<void> {
    // Validate value is not empty
    if (!value || value.trim() === '') {
      throw new Error('must provide a value or generateValue must be set to true');
    }

    // Ensure value is a string and not empty
    const stringValue = String(value).trim();
    if (stringValue === '') {
      throw new Error('Value cannot be empty after trimming');
    }
    
    // Render API only supports GET and PUT (not POST)
    // PUT creates or updates the env var in one call
    const putRequestBody = {
      envVarValue: stringValue,
    };
    
    try {
      console.log(`Setting env var ${key} for service ${serviceId}, value: "${stringValue}" (length: ${stringValue.length})`);
      console.log(`PUT request body:`, JSON.stringify(putRequestBody));
      
      const response = await axios.put(
        `${RENDER_API_BASE}/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
        putRequestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      console.log(`PUT successful for env var ${key}, status: ${response.status}`);
    } catch (error: any) {
      console.error('Failed to upsert Render env var:', error.response?.data || error);
      console.error('Request URL:', `${RENDER_API_BASE}/services/${serviceId}/env-vars/${encodeURIComponent(key)}`);
      console.error('Key:', key);
      console.error('Value type:', typeof value);
      console.error('Value length:', value ? value.length : 0);
      console.error('Value preview:', value ? value.substring(0, 50) : 'EMPTY/NULL');
      console.error('String value length:', stringValue.length);
      console.error('String value preview:', stringValue.substring(0, 50));
      console.error('PUT request body that was sent:', JSON.stringify(putRequestBody));
      console.error('Response status:', error.response?.status);
      console.error('Response data:', JSON.stringify(error.response?.data));
      
      // Check if the error is about missing value
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      if (errorMessage.includes('must provide a value')) {
        throw new Error(`must provide a value or generateValue must be set to true`);
      }
      
      throw new Error(`Failed to set environment variable: ${key} - ${errorMessage}`);
    }
  }

  /**
   * Delete an environment variable from Render service
   */
  static async deleteEnvVar(
    apiKey: string,
    serviceId: string,
    key: string
  ): Promise<void> {
    try {
      await axios.delete(
        `${RENDER_API_BASE}/services/${serviceId}/env-vars/${key}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to delete Render env var:', error.response?.data || error);
      throw new Error(`Failed to delete environment variable: ${key}`);
    }
  }

  /**
   * Sync all secrets from a folder to a Render service
   */
  static async syncFolderToRender(
    renderIntegrationId: string,
    projectId: string,
    environment: string,
    folder: string,
    renderServiceId: string
  ): Promise<{ synced: number; errors: string[] }> {
    try {
      // Get Render API key from integration
      const apiKey = await this.getApiKey(renderIntegrationId);
      if (!apiKey) throw new Error('Render integration not found or invalid');

      // Check service type - only web_service and worker support environment variables
      try {
        const serviceResponse = await axios.get(`${RENDER_API_BASE}/services/${renderServiceId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        
        const serviceType = serviceResponse.data?.service?.type || serviceResponse.data?.type;
        if (serviceType === 'static_site') {
          return {
            synced: 0,
            errors: [`Static sites do not support environment variables via the API. Please select a web service or worker instead.`],
          };
        }
        
        if (serviceType && serviceType !== 'web_service' && serviceType !== 'worker') {
          return {
            synced: 0,
            errors: [`Service type "${serviceType}" does not support environment variables. Only web services and workers are supported.`],
          };
        }
      } catch (serviceCheckError: any) {
        console.error('Failed to check service type:', serviceCheckError);
        // Continue anyway - let the sync attempt fail naturally if service type is incompatible
      }

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

      // Get existing Render env vars
      const existingEnvVars = await this.getEnvVars(apiKey, renderServiceId);
      const existingKeys = new Set(existingEnvVars.map((ev) => ev.key));

      const errors: string[] = [];
      let synced = 0;

      // Sync each secret
      for (const secret of secrets) {
        try {
          let decryptedValue: string;
          try {
            decryptedValue = decryptSecret(secret.value);
          } catch (decryptError: any) {
            console.error(`Failed to decrypt secret ${secret.name}:`, decryptError);
            errors.push(`${secret.name}: Failed to decrypt secret value`);
            continue;
          }
          
          // Validate that we have a value
          if (!decryptedValue || typeof decryptedValue !== 'string') {
            console.error(`Secret ${secret.name} has invalid value: type=${typeof decryptedValue}, value=${decryptedValue}`);
            errors.push(`${secret.name}: Secret value is invalid or empty`);
            continue;
          }
          
          const trimmedValue = decryptedValue.trim();
          if (trimmedValue === '') {
            console.error(`Secret ${secret.name} has empty value after trimming`);
            errors.push(`${secret.name}: Secret value is empty`);
            continue;
          }

          console.log(`Syncing secret ${secret.name}, value length: ${trimmedValue.length}`);
          
          // Upsert env var (Render API handles create/update)
          await this.upsertEnvVar(apiKey, renderServiceId, secret.name, trimmedValue);
          synced++;
        } catch (error: any) {
          console.error(`Failed to sync secret ${secret.name}:`, error.message);
          errors.push(`${secret.name}: ${error.message}`);
        }
      }

      // Get service name for logging
      const service = await this.getServiceDetails(apiKey, renderServiceId);

      // Update sync status
      await db.folderRenderSync.upsert({
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
          renderIntegrationId,
          renderServiceId,
          renderServiceName: service?.name || null,
          lastSyncedAt: new Date(),
          lastSyncStatus: errors.length > 0 ? 'failed' : 'success',
          lastSyncError: errors.length > 0 ? errors.join('; ') : null,
        },
        update: {
          renderIntegrationId,
          renderServiceId,
          renderServiceName: service?.name || null,
          lastSyncedAt: new Date(),
          lastSyncStatus: errors.length > 0 ? 'failed' : 'success',
          lastSyncError: errors.length > 0 ? errors.join('; ') : null,
        },
      });

      return { synced, errors };
    } catch (error: any) {
      console.error('Sync to Render failed:', error);
      throw error;
    }
  }

  /**
   * Get service details
   */
  static async getServiceDetails(apiKey: string, serviceId: string): Promise<{ name: string } | null> {
    try {
      const response = await axios.get(`${RENDER_API_BASE}/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      return {
        name: response.data.service?.name || response.data.name || 'Unknown',
      };
    } catch (error) {
      console.error('Failed to get Render service details:', error);
      return null;
    }
  }

  /**
   * Get sync configuration for a folder
   */
  static async getSyncConfig(projectId: string, environment: string, folder: string) {
    return db.folderRenderSync.findUnique({
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
   * Delete a sync configuration for a specific folder
   */
  static async deleteSyncConfig(projectId: string, environment: string, folder: string, userId: string) {
    // Verify the sync config exists and user has access
    const syncConfig = await db.folderRenderSync.findUnique({
      where: {
        projectId_environment_folder: {
          projectId,
          environment,
          folder,
        },
      },
      include: {
        renderIntegration: true,
      },
    });

    if (!syncConfig) {
      throw new Error('Sync configuration not found');
    }

    // Verify the integration belongs to the user
    if (!syncConfig.renderIntegration || syncConfig.renderIntegration.userId !== userId) {
      throw new Error('Access denied to this sync configuration');
    }

    // Delete the sync configuration
    const deleted = await db.folderRenderSync.delete({
      where: {
        projectId_environment_folder: {
          projectId,
          environment,
          folder,
        },
      },
    });

    return {
      projectId: deleted.projectId,
      environment: deleted.environment,
      folder: deleted.folder,
      renderServiceName: deleted.renderServiceName,
    };
  }

  /**
   * Check if a folder has unsynced changes
   */
  static async hasUnsyncedChanges(
    projectId: string,
    environment: string,
    folder: string
  ): Promise<boolean> {
    try {
      // Get the last sync time for this folder
      const syncConfig = await db.folderRenderSync.findUnique({
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
        return secretCount > 0;
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

      if (!latestSecret) {
        return false;
      }

      return latestSecret.updatedAt > syncConfig.lastSyncedAt;
    } catch (error) {
      console.error('Error checking unsynced changes:', error);
      return false;
    }
  }
}


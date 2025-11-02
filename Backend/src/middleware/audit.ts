import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit';
import { db } from '../lib/db';

export interface AuditRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

/**
 * Middleware to log audit events
 */
export const auditLog = (eventType: string, getResourceName?: (req: AuditRequest) => string) => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    // Store original res.end to capture response
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      // Only log successful requests (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const organizationId = req.params.organizationId || req.body?.organizationId;
        const projectId = req.params.projectId || req.body?.projectId;
        const secretId = req.params.secretId || req.body?.secretId;
        
        const resourceName = getResourceName ? getResourceName(req) : undefined;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');

        // Log the event asynchronously (don't wait for it)
        AuditService.log({
          userId,
          organizationId,
          projectId,
          secretId,
          eventType,
          action: getActionFromMethod(req.method),
          resourceName,
          description: `${req.method} ${req.path}`,
          ipAddress,
          userAgent,
        }).catch(console.error);
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

/**
 * Get action from HTTP method
 */
function getActionFromMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'view';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

/**
 * Specific audit middleware for common events
 */
export const auditUserLogin = () => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.get('User-Agent');

        AuditService.logUserLogin(
          userId || 'unknown',
          true,
          ipAddress,
          userAgent
        ).catch(console.error);
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export const auditSecretAccess = () => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const secretId = req.params.secretId;
        const projectId = req.params.projectId;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

        if (userId && secretId) {
          // Get secret name from response or request
          const secretName = req.body?.name || 'Unknown Secret';
          
          AuditService.logSecretAccess(
            userId,
            secretId,
            secretName,
            projectId || '',
            'view',
            ipAddress
          ).catch(console.error);
        }
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export const auditSecretCreate = () => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const projectId = req.params.projectId;
        const organizationId = req.body?.organizationId;
        const secretName = req.body?.name;
        const environment = req.body?.environment;
        const folder = req.body?.folder;
        const secretType = req.body?.type;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

        if (userId && projectId && secretName) {
          // Get the created secret ID from response
          try {
            const responseData = JSON.parse(chunk?.toString() || '{}');
            const secretId = responseData.secret?.id;

            if (secretId) {
              AuditService.logSecretCreate(
                userId,
                secretId,
                secretName,
                projectId,
                organizationId || '',
                environment,
                folder,
                secretType,
                ipAddress
              ).catch(console.error);
            }
          } catch (error) {
            console.error('Failed to parse response for audit logging:', error);
            // Still log the create event without the secret ID
            AuditService.logSecretCreate(
              userId,
              'unknown',
              secretName,
              projectId,
              organizationId || '',
              environment,
              folder,
              secretType,
              ipAddress
            ).catch(console.error);
          }
        }
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export const auditSecretUpdate = () => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const secretId = req.params.id;
        const organizationId = req.body?.organizationId;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

        if (userId && secretId) {
          // Parse response to get secret details
          try {
            const responseData = JSON.parse(chunk?.toString() || '{}');
            const secret = responseData.secret;
            const changedFields = Object.keys(req.body || {});
            
            if (secret) {
              AuditService.logSecretUpdate(
                userId,
                secretId,
                secret.name || 'Unknown',
                secret.projectId || '',
                organizationId || '',
                secret.environment,
                secret.folder,
                changedFields,
                ipAddress
              ).catch(console.error);
            }
          } catch (error) {
            console.error('Failed to parse response for audit logging:', error);
          }
        }
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

export const auditSecretDelete = () => {
  return async (req: AuditRequest, res: Response, next: NextFunction) => {
    // Fetch secret details before deletion to get env/folder
    let secretDetails: any = null;
    try {
      const secretId = req.params.id;
      if (secretId) {
        secretDetails = await db.secret.findUnique({
          where: { id: secretId },
          select: { name: true, environment: true, folder: true, projectId: true },
        });
      }
    } catch (err) {
      // Continue anyway
    }

    const originalEnd = res.end;
    
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const secretId = req.params.id;
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

        if (userId && secretId && secretDetails) {
          AuditService.logSecretDelete(
            userId,
            secretId,
            secretDetails.name || 'Unknown Secret',
            secretDetails.projectId || '',
            '',
            secretDetails.environment,
            secretDetails.folder,
            ipAddress
          ).catch(console.error);
        }
      }
      
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

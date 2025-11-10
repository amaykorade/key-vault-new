import { z } from 'zod';
import { db } from '../lib/db';
import { AccessControlService } from './access-control';

const slugify = (value: string) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'default';
};

const humanize = (value: string) => {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (ch) => ch.toUpperCase());
};

export const FolderSchema = {
  create: z.object({
    name: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long'),
    environment: z.string().min(1, 'Environment is required').max(50, 'Environment name too long'),
    description: z.string().max(200, 'Description too long').optional(),
  }),
  update: z.object({
    name: z.string().min(1, 'Folder name is required').max(50, 'Folder name too long').optional(),
    description: z.string().max(200, 'Description too long').optional(),
  }),
};

export class FolderService {
  static normalizeEnvironment(environment: string) {
    return environment.trim().toLowerCase();
  }

  static normalizeFolderSlug(folder: string) {
    return slugify(folder || 'default');
  }

  static async ensureFolderRecord(projectId: string, environment: string, folderSlug: string, userId?: string | null) {
    const env = this.normalizeEnvironment(environment);
    const slug = this.normalizeFolderSlug(folderSlug);

    let folder = await db.folder.findFirst({
      where: {
        projectId,
        environment: env,
        slug,
      },
    });

    if (!folder) {
      folder = await db.folder.create({
        data: {
          projectId,
          environment: env,
          slug,
          name: humanize(slug),
          createdById: userId ?? null,
        },
      });
    }

    return folder;
  }

  static async syncFoldersFromSecrets(projectId: string) {
    const secretFolders = await db.secret.findMany({
      where: { projectId },
      select: { environment: true, folder: true },
    });

    const seen = new Set<string>();
    for (const { environment, folder } of secretFolders) {
      const env = this.normalizeEnvironment(environment || 'development');
      const slug = this.normalizeFolderSlug(folder || 'default');
      const key = `${env}:${slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await this.ensureFolderRecord(projectId, env, slug);
    }
  }

  static async getFolders(projectId: string, userId: string) {
    const canRead = await AccessControlService.canRead(userId, projectId);
    if (!canRead) {
      throw new Error('Access denied: You need READ permission to view folders');
    }

    await this.syncFoldersFromSecrets(projectId);

    const [folders, secretCounts] = await Promise.all([
      db.folder.findMany({
        where: { projectId },
        orderBy: [
          { environment: 'asc' },
          { name: 'asc' },
        ],
      }),
      db.secret.groupBy({
        by: ['environment', 'folder'],
        where: { projectId },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map<string, number>();
    secretCounts.forEach((entry) => {
      const env = this.normalizeEnvironment(entry.environment || 'development');
      const slug = this.normalizeFolderSlug(entry.folder || 'default');
      countMap.set(`${env}:${slug}`, entry._count._all);
    });

    return folders.map((folder) => ({
      ...folder,
      secretCount: countMap.get(`${folder.environment}:${folder.slug}`) ?? 0,
    }));
  }

  static async createFolder(projectId: string, userId: string, data: z.infer<typeof FolderSchema.create>) {
    const canWrite = await AccessControlService.canWrite(userId, projectId);
    if (!canWrite) {
      throw new Error('Access denied: You need WRITE permission to create folders');
    }

    const env = this.normalizeEnvironment(data.environment);
    const slug = this.normalizeFolderSlug(data.name);

    const existing = await db.folder.findFirst({
      where: { projectId, environment: env, slug },
    });

    if (existing) {
      throw new Error(`Folder "${data.name}" already exists in ${env}`);
    }

    const folder = await db.folder.create({
      data: {
        projectId,
        environment: env,
        name: data.name.trim(),
        slug,
        description: data.description,
        createdById: userId,
      },
    });

    return { ...folder, secretCount: 0 };
  }

  static async renameFolder(projectId: string, folderId: string, userId: string, data: z.infer<typeof FolderSchema.update>) {
    const folder = await db.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.projectId !== projectId) {
      throw new Error('Folder not found');
    }

    const canWrite = await AccessControlService.canWrite(userId, projectId);
    if (!canWrite) {
      throw new Error('Access denied: You need WRITE permission to update folders');
    }

    if (!data.name && !data.description) {
      return folder;
    }

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name.trim();
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    return await db.folder.update({
      where: { id: folderId },
      data: updateData,
    });
  }

  static async deleteFolder(projectId: string, folderId: string, userId: string) {
    const folder = await db.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.projectId !== projectId) {
      throw new Error('Folder not found');
    }

    const canWrite = await AccessControlService.canWrite(userId, projectId);
    if (!canWrite) {
      throw new Error('Access denied: You need WRITE permission to delete folders');
    }

    const secretCount = await db.secret.count({
      where: {
        projectId,
        environment: folder.environment,
        folder: folder.slug,
      },
    });

    if (secretCount > 0) {
      throw new Error('Cannot delete folder while it still contains secrets');
    }

    await db.folder.delete({
      where: { id: folderId },
    });
  }
}


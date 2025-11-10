import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { FolderService, FolderSchema } from '../services/folder';

const router = Router({ mergeParams: true });

router.get('/:projectId/folders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const folders = await FolderService.getFolders(projectId, req.user!.id);
    res.json({ folders });
  } catch (error: any) {
    console.error('[folders] list error', error);
    res.status(error?.message === 'Access denied' ? 403 : 500).json({
      error: error?.message || 'Failed to fetch folders',
    });
  }
});

router.post('/:projectId/folders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId } = req.params;
    const data = FolderSchema.create.parse(req.body);
    const folder = await FolderService.createFolder(projectId, req.user!.id, data);
    res.status(201).json({ folder });
  } catch (error: any) {
    console.error('[folders] create error', error);
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    const status = error?.message?.startsWith('Access denied') ? 403 : 400;
    res.status(status).json({ error: error?.message || 'Failed to create folder' });
  }
});

router.put('/:projectId/folders/:folderId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, folderId } = req.params;
    const data = FolderSchema.update.parse(req.body);
    const folder = await FolderService.renameFolder(projectId, folderId, req.user!.id, data);
    res.json({ folder });
  } catch (error: any) {
    console.error('[folders] update error', error);
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    const status = error?.message?.startsWith('Access denied') ? 403 : 400;
    res.status(status).json({ error: error?.message || 'Failed to update folder' });
  }
});

router.delete('/:projectId/folders/:folderId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, folderId } = req.params;
    await FolderService.deleteFolder(projectId, folderId, req.user!.id);
    res.status(204).send();
  } catch (error: any) {
    console.error('[folders] delete error', error);
    let status = 400;
    if (error?.message?.startsWith('Access denied')) status = 403;
    else if (error?.message?.includes('not found')) status = 404;
    res.status(status).json({ error: error?.message || 'Failed to delete folder' });
  }
});

export default router;


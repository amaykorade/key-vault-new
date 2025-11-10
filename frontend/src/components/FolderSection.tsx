import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import type { Secret, Folder } from '../types';

interface FolderSectionProps {
  folder: Folder;
  secrets: Secret[];
  environment: string;
  onFolderClick: (environment: string, folderSlug: string) => void;
  canWrite: boolean;
  defaultCollapsed?: boolean;
  onRenameFolder?: (folderId: string, name: string) => Promise<void> | void;
  onDeleteFolder?: (folderId: string) => Promise<void> | void;
}

export function FolderSection({
  folder,
  secrets,
  environment,
  onFolderClick,
  canWrite,
  defaultCollapsed = true,
  onRenameFolder,
  onDeleteFolder,
}: FolderSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedFolder, setEditedFolder] = useState(folder.name);
  const displayName = folder.slug === 'default' ? 'Default' : folder.name;
  const formattedName = displayName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  const secretCount = folder.secretCount ?? secrets.length;

  useEffect(() => {
    setEditedFolder(folder.name);
  }, [folder.name]);

  const handleHeaderClick = () => {
    if (isRenaming) return;
    onFolderClick(environment, folder.slug);
  };

  const handleRename = async (nextName: string) => {
    if (!onRenameFolder || nextName.trim() === folder.name) return;
    try {
      await Promise.resolve(onRenameFolder(folder.id, nextName.trim()));
    } catch (error) {
      console.error('Failed to rename folder:', error);
      setEditedFolder(folder.name);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteFolder) return;
    try {
      setIsDeleting(true);
      await Promise.resolve(onDeleteFolder(folder.id));
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-visible hover:border-gray-600 transition-colors">
      {/* Folder Header - Clickable */}
      <div 
        className="px-3 py-2.5 flex items-center justify-between hover:bg-gray-800/50 transition-colors cursor-pointer"
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          {isRenaming ? (
            <input
              className="text-sm font-medium text-gray-200 bg-transparent border border-gray-600 rounded px-2 py-1 w-48 focus:outline-none focus:ring-0"
              value={editedFolder}
              onChange={(e) => setEditedFolder(e.target.value)}
              autoFocus
              onBlur={() => {
                const nextName = editedFolder.trim();
                if (nextName) {
                  handleRename(nextName);
                } else {
                  setEditedFolder(folder.name);
                }
                setIsRenaming(false);
                setMenuOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const nextName = editedFolder.trim();
                  if (nextName) {
                    handleRename(nextName);
                  }
                  setIsRenaming(false);
                  setMenuOpen(false);
                } else if (e.key === 'Escape') {
                  setEditedFolder(folder.name);
                  setIsRenaming(false);
                  setMenuOpen(false);
                }
              }}
            />
          ) : (
            <span className="text-left text-sm font-medium text-gray-300 truncate" title={formattedName}>
              {formattedName}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400 flex-shrink-0">
            {secretCount}
          </span>
        </div>
        <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {canWrite && (
            <div className="relative">
              <button
                className="p-1.5 rounded hover:bg-gray-700/50 text-gray-400"
                onClick={() => setMenuOpen((v) => !v)}
                title="Folder options"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    onClick={() => {
                      setIsRenaming(true);
                    }}
                  >
                    Edit name
                  </button>
                  {onDeleteFolder && folder.slug !== 'default' && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


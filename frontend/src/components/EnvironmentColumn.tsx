import { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { FolderSection } from './FolderSection';
import { Input } from './ui/Input';
import type { Secret } from '../types';

interface EnvironmentColumnProps {
  id: string;
  environment: 'development' | 'staging' | 'production';
  secrets: Secret[];
  onAddSecret: (environment: string, folder?: string) => void;
  onFolderClick: (environment: string, folder: string) => void;
  onRenameFolder?: (environment: string, oldFolder: string, newFolder: string) => void;
  onRenameEnvironment?: (environment: string) => void;
  canWrite: boolean;
  canDelete: boolean;
  isLoading?: boolean;
  label?: string;
  onDeleteEnvironment?: (environment: string) => void;
}

const ENV_CONFIG = {
  development: {
    label: 'Development',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  staging: {
    label: 'Staging',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  production: {
    label: 'Production',
    color: 'red',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
};

export function EnvironmentColumn({
  id,
  environment,
  secrets,
  onAddSecret,
  onFolderClick,
  onRenameFolder,
  canWrite,
  canDelete,
  isLoading = false,
  label,
  onRenameEnvironment,
  onDeleteEnvironment,
}: EnvironmentColumnProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [envMenuOpen, setEnvMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Group secrets by folder
  const secretsByFolder = useMemo(() => {
    const grouped: Record<string, Secret[]> = {};
    secrets.forEach(secret => {
      const folder = secret.folder || 'default';
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(secret);
    });
    return grouped;
  }, [secrets]);

  const folders = Object.keys(secretsByFolder).sort((a, b) => {
    // Put 'default' folder first
    if (a === 'default') return -1;
    if (b === 'default') return 1;
    return a.localeCompare(b);
  });

  const displayLabel = label || (environment.charAt(0).toUpperCase() + environment.slice(1));

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    
    const folderName = newFolderName.trim().toLowerCase().replace(/\s+/g, '_');
    setShowCreateFolder(false);
    setNewFolderName('');
    // Open add secret form with the new folder preselected
    onAddSecret(environment, folderName);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-full md:w-[350px] lg:w-[380px]"
    >
      <Card className="h-full flex flex-col bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 text-gray-300">
              <div
                {...attributes}
                {...listeners}
                className="p-1.5 rounded-md hover:bg-gray-800 cursor-grab active:cursor-grabbing"
                title="Drag to reorder columns"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
              <CardTitle className="text-base font-semibold whitespace-nowrap text-gray-200">{displayLabel}</CardTitle>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700 flex-shrink-0">
                {secrets.length}
              </span>
            </div>
            {canWrite && (
              <div className="relative flex-shrink-0 ml-2">
                <button
                  className="p-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={(e) => { e.stopPropagation(); setEnvMenuOpen((v) => !v); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  title="Environment options"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
                {envMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50"
                       onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                      onClick={() => { setEnvMenuOpen(false); onRenameEnvironment && onRenameEnvironment(environment); }}
                    >
                      Rename
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-gray-800"
                      onClick={() => { setEnvMenuOpen(false); onDeleteEnvironment && onDeleteEnvironment(environment); }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-350px)]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-800 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : folders.length === 0 && !showCreateFolder ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-4">No folders yet. Create a folder to add secrets.</p>
              {canWrite && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateFolder(true)}
                  className="border-gray-700 hover:bg-gray-700/50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Folder
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Create Folder Form */}
              {showCreateFolder && (
                <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name (e.g., database, auth)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim()}
                      className="flex-1"
                    >
                      Create
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCreateFolder(false);
                        setNewFolderName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Folder Sections */}
              {folders.map((folderName) => (
                <FolderSection
                  key={folderName}
                  folderName={folderName}
                  secrets={secretsByFolder[folderName]}
                  environment={environment}
                  onFolderClick={onFolderClick}
                  canWrite={canWrite}
                  onRenameFolder={onRenameFolder}
                />
              ))}

              {/* Create Folder Button */}
              {canWrite && !showCreateFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateFolder(true)}
                  className="w-full border-dashed border-gray-700 hover:border-gray-600"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Folder
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


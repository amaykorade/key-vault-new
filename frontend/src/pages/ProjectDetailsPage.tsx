import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../components/ui/Button';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ProjectMembersSection } from '../components/ProjectMembersSection';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EnvironmentColumn } from '../components/EnvironmentColumn';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/auth';
import toast from 'react-hot-toast';
import type { Project, Secret } from '../types';

const ENVIRONMENTS = ['development', 'staging', 'production'] as const;
type Environment = string;

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Secrets state
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  
  // Column order state (persisted in localStorage)
  const [columnOrder, setColumnOrder] = useState<Environment[]>(() => {
    try {
      const stored = id ? localStorage.getItem(`column_order:${id}`) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((e: string) => typeof e === 'string')) {
          return parsed as Environment[];
        }
      }
    } catch {}
    return ['development', 'staging', 'production'];
  });
  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvSlug, setNewEnvSlug] = useState('');
  const [envMeta, setEnvMeta] = useState<Record<string, { label: string }>>(() => {
    try {
      const stored = id ? localStorage.getItem(`env_meta:${id}`) : null;
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      development: { label: 'Development' },
      staging: { label: 'Staging' },
      production: { label: 'Production' },
    };
  });
  
  // UI state
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  const [preselectedEnvironment, setPreselectedEnvironment] = useState<string | null>(null);
  const [preselectedFolder, setPreselectedFolder] = useState<string | null>(null);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Group secrets by environment
  const secretsByEnvironment = secrets.reduce((acc, secret) => {
    const env = (secret.environment?.toLowerCase() || 'development') as Environment;
    if (!acc[env]) acc[env] = [];
    acc[env].push(secret);
    return acc;
  }, {} as Record<Environment, Secret[]>);
  
  // Delete confirmation state
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<Secret | null>(null);
  const [isDeletingSecret, setIsDeletingSecret] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchSecrets();
    }
  }, [id]);

  // Persist column order when it changes
  useEffect(() => {
    if (id) {
      try {
        localStorage.setItem(`column_order:${id}`, JSON.stringify(columnOrder));
      } catch {}
    }
  }, [columnOrder, id]);

  useEffect(() => {
    if (id) {
      try {
        localStorage.setItem(`env_meta:${id}`, JSON.stringify(envMeta));
      } catch {}
    }
  }, [envMeta, id]);

  const fetchProject = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getProject(id);
      setProject(response.project);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch project');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSecrets = async () => {
    if (!id) return;
    
    try {
      setIsLoadingSecrets(true);
      const response = await apiService.getSecrets(id, true);
      setSecrets(response.secrets);
    } catch (err: any) {
      console.error('Failed to fetch secrets:', err);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as Environment);
        const newIndex = items.indexOf(over.id as Environment);

        const newOrder = [...items];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, active.id as Environment);
        return newOrder;
      });
    }
  };

  const slugify = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const handleAddEnvironmentSubmit = () => {
    const slug = newEnvSlug || slugify(newEnvName);
    if (!slug) return;
    if (columnOrder.includes(slug)) {
      setShowAddEnv(false);
      setEnvMenuOpen(false);
      setNewEnvName('');
      setNewEnvSlug('');
      return;
    }
    setColumnOrder((prev) => [...prev, slug]);
    setEnvMeta((prev) => ({ ...prev, [slug]: { label: newEnvName || slug } }));
    setShowAddEnv(false);
    setEnvMenuOpen(false);
    setNewEnvName('');
    setNewEnvSlug('');
  };

  // Delete environment confirmation state
  const [showDeleteEnv, setShowDeleteEnv] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<string | null>(null);
  const [confirmSlug, setConfirmSlug] = useState('');
  const [showRenameEnv, setShowRenameEnv] = useState(false);
  const [envToRename, setEnvToRename] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  
  // Rename project state
  const [showRenameProject, setShowRenameProject] = useState(false);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [renameProjectDesc, setRenameProjectDesc] = useState('');
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const requestDeleteEnvironment = (env: string) => {
    setEnvToDelete(env);
    setConfirmSlug('');
    setShowDeleteEnv(true);
  };
  const handleConfirmDeleteEnvironment = () => {
    if (!envToDelete) return;
    if (confirmSlug !== envToDelete) return;
    setColumnOrder((prev) => prev.filter((e) => e !== envToDelete));
    setEnvMeta((prev) => {
      const next = { ...prev } as any;
      delete next[envToDelete!];
      return next;
    });
    setShowDeleteEnv(false);
    setEnvToDelete(null);
    setConfirmSlug('');
  };

  const requestRenameEnvironment = (env: string) => {
    setEnvToRename(env);
    setRenameLabel(envMeta[env]?.label || (env.charAt(0).toUpperCase() + env.slice(1)));
    setShowRenameEnv(true);
  };
  const handleConfirmRenameEnvironment = () => {
    if (!envToRename) return;
    setEnvMeta((prev) => ({ ...prev, [envToRename]: { label: renameLabel || envToRename } }));
    setShowRenameEnv(false);
    setEnvToRename(null);
    setRenameLabel('');
  };

  const handleOpenRenameProject = () => {
    if (!project) return;
    setRenameProjectName(project.name);
    setRenameProjectDesc(project.description || '');
    setShowRenameProject(true);
    setEnvMenuOpen(false);
  };

  const handleConfirmRenameProject = async () => {
    if (!id || !renameProjectName.trim()) return;
    try {
      setIsRenamingProject(true);
      await apiService.updateProject(id, {
        name: renameProjectName.trim(),
        description: renameProjectDesc.trim() || undefined,
      });
      await fetchProject();
      toast.success('Project renamed successfully');
      setShowRenameProject(false);
    } catch (err) {
      toast.error('Failed to rename project');
      console.error('Failed to rename project:', err);
    } finally {
      setIsRenamingProject(false);
    }
  };

  const handleAddSecret = (environment: string, folder?: string) => {
    setPreselectedEnvironment(environment);
    setPreselectedFolder(folder || null);
    setShowCreateSecret(true);
  };

  const handleFolderClick = (environment: string, folder: string) => {
    const envSeg = encodeURIComponent(environment.toLowerCase());
    const folderSeg = encodeURIComponent(folder || 'default');
    navigate(`/projects/${id}/env/${envSeg}/folders/${folderSeg}`);
  };

  const handleRenameFolder = async (environment: string, oldFolder: string, newFolder: string) => {
    if (!id) return;
    // Update all secrets in this project matching env+folder
    const toUpdate = secrets.filter(
      (s) => (s.environment || '').toLowerCase() === environment && (s.folder || 'default') === oldFolder
    );
    try {
      await Promise.all(
        toUpdate.map((s) => apiService.updateSecret(s.id, { folder: newFolder } as any))
      );
      await fetchSecrets();
    } catch (err) {
      console.error('Failed to rename folder:', err);
    }
  };

  const handleCreateSecret = async (data: any) => {
    if (!id) return;
    
    try {
      setIsCreatingSecret(true);
      // If environment was preselected, ensure it's set
      if (preselectedEnvironment) {
        data.environment = preselectedEnvironment;
      }
      // If folder was preselected, ensure it's set
      if (preselectedFolder) {
        data.folder = preselectedFolder;
      } else if (!data.folder) {
        data.folder = 'default';
      }
      await apiService.createSecret(id, data);
      toast.success('Secret created successfully');
      await fetchSecrets();
      setShowCreateSecret(false);
      setPreselectedEnvironment(null);
      setPreselectedFolder(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create secret';
      toast.error(errorMsg);
    } finally {
      setIsCreatingSecret(false);
    }
  };

  const handleEditSecret = async (data: any) => {
    if (!selectedSecret) return;
    
    try {
      await apiService.updateSecret(selectedSecret.id, data);
      toast.success('Secret updated successfully');
      await fetchSecrets();
      setShowSecretModal(false);
      setSelectedSecret(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update secret';
      toast.error(errorMsg);
      console.error('Failed to update secret:', err);
    }
  };

  const handleDeleteSecret = (secret: Secret) => {
    setSecretToDelete(secret);
    setShowDeleteSecretModal(true);
  };

  const handleConfirmDeleteSecret = async () => {
    if (!secretToDelete) return;

    setIsDeletingSecret(true);
    try {
      await apiService.deleteSecret(secretToDelete.id);
      toast.success('Secret deleted successfully');
      await fetchSecrets();
      setShowDeleteSecretModal(false);
      setSecretToDelete(null);
      setShowSecretModal(false);
      setSelectedSecret(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete secret';
      toast.error(errorMsg);
      console.error('Failed to delete secret:', err);
    } finally {
      setIsDeletingSecret(false);
    }
  };

  const handleViewSecret = (secret: Secret) => {
    setSelectedSecret(secret);
    setShowSecretModal(true);
  };

  const handleEditSecretClick = (secret: Secret) => {
    setSelectedSecret(secret);
    setShowSecretModal(true);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Project not found</h2>
          <p className="text-gray-400 mb-4">{error || 'The requested project could not be found.'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{project.name}</h1>
            <p className="text-gray-400 text-sm line-clamp-1">{project.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              className="p-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setEnvMenuOpen((v) => !v)}
              title="More options"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {envMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-50">
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                  onClick={handleOpenRenameProject}
                >
                  Rename project
                </button>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                  onClick={() => { setShowAddEnv(true); setEnvMenuOpen(false); }}
                >
                  Add environment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Members Section */}
      <ProjectMembersSection
        projectId={id!}
        projectName={project.name}
        canManageMembers={(project as any).userAccess?.canManageMembers ?? false}
        currentUserId={user?.id || ''}
      />

      {/* Environment Columns with Drag and Drop */}
      <div className="w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              {columnOrder.map((env) => (
                <EnvironmentColumn
                  key={env}
                  id={env}
                  environment={env}
                  secrets={secretsByEnvironment[env] || []}
                  onAddSecret={handleAddSecret}
                  onFolderClick={handleFolderClick}
                  onRenameFolder={handleRenameFolder}
                  onRenameEnvironment={requestRenameEnvironment}
                  onDeleteEnvironment={requestDeleteEnvironment}
                  canWrite={(project as any).userAccess?.canWrite ?? true}
                  canDelete={(project as any).userAccess?.canDelete ?? true}
                  isLoading={isLoadingSecrets}
                  label={envMeta[env]?.label || (env.charAt(0).toUpperCase() + env.slice(1))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Create Secret Modal */}
      {showCreateSecret && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl animate-slide-up">
            <SecretForm
              onSubmit={handleCreateSecret}
              onCancel={() => {
                setShowCreateSecret(false);
                setPreselectedEnvironment(null);
                setPreselectedFolder(null);
              }}
              isLoading={isCreatingSecret}
              title="Create New Secret"
              initialData={{
                ...(preselectedEnvironment ? { environment: preselectedEnvironment } : {}),
                ...(preselectedFolder ? { folder: preselectedFolder } : {}),
              }}
            />
          </div>
        </div>
      )}

      {/* Secret Modal */}
      {showSecretModal && selectedSecret && (
        <SecretModal
          secret={selectedSecret}
          onClose={() => {
            setShowSecretModal(false);
            setSelectedSecret(null);
          }}
          onEdit={handleEditSecret}
          onDelete={handleDeleteSecret}
          canEdit={(project as any).userAccess?.canWrite ?? true}
          canDelete={(project as any).userAccess?.canDelete ?? true}
        />
      )}

      {/* Add Environment Modal */}
      {showAddEnv && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Add Environment</h3>
              <button className="text-gray-400 hover:text-gray-200" onClick={() => setShowAddEnv(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Environment name</label>
                <input
                  className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                  placeholder="e.g., Preview"
                  value={newEnvName}
                  onChange={(e) => {
                    setNewEnvName(e.target.value);
                    if (!newEnvSlug) {
                      const slug = e.target.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewEnvSlug(slug);
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Slug</label>
                <input
                  className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                  placeholder="e.g., preview"
                  value={newEnvSlug}
                  onChange={(e) => setNewEnvSlug(e.target.value)}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddEnv(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddEnvironmentSubmit} disabled={!newEnvName && !newEnvSlug}>Add</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Environment Modal */}
      {showRenameEnv && envToRename && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold">Rename Environment</h3>
            </div>
            <div className="p-4 space-y-3">
              <label className="block text-sm text-gray-300 mb-1">Display name</label>
              <input
                className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                value={renameLabel}
                onChange={(e) => setRenameLabel(e.target.value)}
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRenameEnv(false)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmRenameEnvironment} disabled={!renameLabel.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Environment Confirmation */}
      {showDeleteEnv && envToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="text-white font-semibold">Delete Environment</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-300">This will remove the environment column from this view. Type the slug to confirm:</p>
              <p className="text-sm text-gray-400">Slug: <span className="font-mono text-gray-200">{envToDelete}</span></p>
              <input
                className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                placeholder={envToDelete}
                value={confirmSlug}
                onChange={(e) => setConfirmSlug(e.target.value)}
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteEnv(false)}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmDeleteEnvironment} disabled={confirmSlug !== envToDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Modal */}
      {showRenameProject && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowRenameProject(false)}
        >
          <div 
            className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">Rename Project</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Project name</label>
                <input
                  className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none focus:border-gray-700 focus-visible:border-gray-700 appearance-none"
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none focus:border-gray-700 focus-visible:border-gray-700 appearance-none resize-none"
                  rows={3}
                  value={renameProjectDesc}
                  onChange={(e) => setRenameProjectDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 text-sm rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => setShowRenameProject(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                disabled={!renameProjectName.trim() || isRenamingProject}
                onClick={handleConfirmRenameProject}
              >
                {isRenamingProject ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Secret Confirmation Modal */}
      {showDeleteSecretModal && secretToDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteSecretModal}
          onClose={() => {
            setShowDeleteSecretModal(false);
            setSecretToDelete(null);
          }}
          onConfirm={handleConfirmDeleteSecret}
          title="Delete Secret"
          itemName={secretToDelete.name}
          itemType="secret"
          description="This will permanently delete the secret. This action cannot be undone."
          isLoading={isDeletingSecret}
        />
      )}
    </div>
  );
}

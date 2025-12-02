import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiService, ApiError } from '../services/api';
import { InviteOrganizationMemberModal } from '../components/InviteOrganizationMemberModal';
import { OrganizationMembersSection } from '../components/OrganizationMembersSection';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { CreateProjectModal } from '../components/modals/CreateProjectModal';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { EditOrganizationModal } from '../components/modals/EditOrganizationModal';
import type { Organization, Project } from '../types';

export function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showEditOrganizationModal, setShowEditOrganizationModal] = useState(false);
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [isDeletingOrganization, setIsDeletingOrganization] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showDeleteOrganizationModal, setShowDeleteOrganizationModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrganization();
      fetchProjects();
    }
  }, [id]);

  const fetchOrganization = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.getOrganization(id);
      setOrganization(response.organization);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch organization');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!id) return;
    
    try {
      setIsLoadingProjects(true);
      const response = await apiService.getProjects(id);
      setProjects(response.projects);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };


  const handleEdit = () => {
    if (!organization) return;
    setShowEditOrganizationModal(true);
  };

  const handleEditSubmit = async (name: string, description?: string) => {
    if (!organization) return;
    
    // Check permissions before attempting to edit
    if (organization.role !== 'OWNER' && organization.role !== 'ADMIN') {
      throw new Error('You do not have permission to edit this organization');
    }
    
    setIsEditingOrganization(true);
    setError(null);
    try {
      const response = await apiService.updateOrganization(organization.id, {
        name: name.trim(),
        description: description || undefined,
      });
      
      setOrganization(response.organization);
      setShowEditOrganizationModal(false);
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Insufficient permissions')) {
        setError('You do not have permission to edit this organization');
      } else {
        setError(err.message || 'Failed to update organization');
      }
      throw err;
    } finally {
      setIsEditingOrganization(false);
    }
  };

  const handleDelete = () => {
    if (!organization) return;
    
    // Check permissions before attempting to delete
    if (organization.role !== 'OWNER') {
      setError('Only the organization owner can delete the organization');
      return;
    }
    
    setShowDeleteOrganizationModal(true);
  };

  const handleConfirmDeleteOrganization = async () => {
    if (!organization) return;

    setIsDeletingOrganization(true);
    setError(null);
    try {
      await apiService.deleteOrganization(organization.id);
      navigate('/organizations');
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Insufficient permissions')) {
        setError('Only the organization owner can delete the organization');
      } else {
        setError(err.message || 'Failed to delete organization');
      }
    } finally {
      setIsDeletingOrganization(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditProjectModal(true);
    setShowProjectMenu(null);
  };

  const handleUpdateProject = async (name: string, description?: string) => {
    if (!editingProject) return;

    setIsUpdatingProject(true);
    try {
      await apiService.updateProject(editingProject.id, {
        name: name.trim(),
        description: description || undefined,
      });
      await fetchProjects();
      setShowEditProjectModal(false);
      setEditingProject(null);
    } catch (err: any) {
      console.error('Failed to update project:', err);
      setError(err.message || 'Failed to update project');
      throw err;
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteProjectModal(true);
    setShowProjectMenu(null);
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;

    setIsDeletingProject(true);
    try {
      await apiService.deleteProject(projectToDelete.id);
      await fetchProjects();
      setShowDeleteProjectModal(false);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      setError(err.message || 'Failed to delete project');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleCreateProject = () => {
    setShowCreateProjectModal(true);
  };

  const handleSubmitProject = async (name: string, description?: string) => {
    if (!organization?.id) return;
    
    setIsCreatingProject(true);
    try {
      await apiService.createProject(organization.id, {
        name: name.trim(),
        description: description || undefined
      });
      
      // Close modal and refresh projects list
      setShowCreateProjectModal(false);
      await fetchProjects();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403 && err.message.startsWith('Free plan limit')) {
        setError('Free plan limit reached: You can only create 1 project per workspace on the Free plan. Upgrade in Billing to create more.');
      } else {
        setError(err.message || 'Failed to create project');
      }
      throw err;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleInviteMember = async (email: string, role: string) => {
    if (!id) return;
    await apiService.sendOrganizationInvitation(id, { email, role });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-gray-400">Loading organization...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-red-400 mb-4">{error}</div>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="hover:bg-gray-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <div className="text-gray-400 mb-4">Organization not found</div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/organizations')}
            className="hover:bg-gray-800"
          >
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has edit/delete permissions (OWNER or ADMIN role)
  const canEdit = organization.role === 'OWNER' || organization.role === 'ADMIN';
  const canDelete = organization.role === 'OWNER';
  const canCreateProject = organization.role === 'OWNER' || organization.role === 'ADMIN' || organization.role === 'MEMBER';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {organization.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{organization.name}</h1>
            {organization.description ? (
              <p className="text-gray-400 text-sm line-clamp-1">{organization.description}</p>
            ) : (
              <p className="text-gray-500 text-xs">Workspace</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <Button 
              variant="gradient" 
              size="sm"
              onClick={() => setShowInviteModal(true)}
              className="shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Member
            </Button>
          )}
          {canCreateProject && (
            <Button 
              variant="gradient"
              size="sm"
              onClick={handleCreateProject}
              className="shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </Button>
          )}
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProjectMenu('org-menu')}
              className="hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>
            {showProjectMenu === 'org-menu' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(null)} />
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50">
                  {canEdit && (
                    <button
                      onClick={() => {
                        handleEdit();
                        setShowProjectMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Organization
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowProjectMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Organization
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center">
              <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-xs font-medium text-gray-400">Name</span>
                <span className="text-sm text-white font-medium">{organization.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-xs font-medium text-gray-400">Slug</span>
                <span className="text-xs text-gray-300 font-mono bg-gray-800 px-2 py-1 rounded">{organization.slug}</span>
              </div>
              {organization.description && (
                <div className="flex justify-between items-start py-2">
                  <span className="text-xs font-medium text-gray-400">Description</span>
                  <span className="text-sm text-gray-300 text-right max-w-xs line-clamp-2">{organization.description}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold flex items-center">
              <svg className="w-4 h-4 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Access & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-xs font-medium text-gray-400">Your Role</span>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-900/20 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                  {organization.role || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800/60">
                <span className="text-xs font-medium text-gray-400">Created</span>
                <span className="text-xs text-gray-300">{new Date(organization.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-medium text-gray-400">Last Updated</span>
                <span className="text-xs text-gray-300">{new Date(organization.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Members */}
      <OrganizationMembersSection 
        organizationId={organization.id} 
        userRole={organization.role}
      />

      {/* Projects Section */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm font-semibold flex items-center">
              <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              Projects
            </CardTitle>
            <div className="text-sm text-gray-400">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingProjects ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-800 rounded w-32"></div>
                      </div>
                      <div className="h-5 bg-gray-700 rounded w-14"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-800/20">
                  <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  Create your first project to start organizing your secrets and credentials
                </p>
                {canCreateProject && (
                  <Button 
                    variant="gradient"
                    onClick={handleCreateProject}
                    className="shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create your first project
                  </Button>
                )}
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const canManage = (project as any).role === 'ADMIN' || (project as any).role === 'OWNER' || organization?.role === 'OWNER' || organization?.role === 'ADMIN';
                return (
                  <div 
                    key={project.id} 
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1 text-sm">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProjectMenu(showProjectMenu === project.id ? null : project.id);
                          }}
                          className="ml-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      )}
                    </div>

                    {/* Menu */}
                    {canManage && showProjectMenu === project.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(null)} />
                        <div className="absolute right-4 mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          {((project as any).role === 'OWNER' || organization?.role === 'OWNER' || organization?.role === 'ADMIN') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(project);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
                      <div className="text-[11px] text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                      {(project as any).role && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          (project as any).role === 'OWNER' ? 'bg-red-900/20 text-red-400 border-red-800/30' :
                          (project as any).role === 'ADMIN' ? 'bg-orange-900/20 text-orange-400 border-orange-800/30' :
                          (project as any).role === 'WRITE' ? 'bg-blue-900/20 text-blue-400 border-blue-800/30' :
                          'bg-emerald-900/20 text-emerald-400 border-emerald-800/30'
                        }`}>
                          {(project as any).role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onCreate={handleSubmitProject}
        isLoading={isCreatingProject}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => {
          setShowEditProjectModal(false);
          setEditingProject(null);
        }}
        onUpdate={handleUpdateProject}
        project={editingProject}
        isLoading={isUpdatingProject}
      />

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        isOpen={showEditOrganizationModal}
        onClose={() => setShowEditOrganizationModal(false)}
        onUpdate={handleEditSubmit}
        organization={organization}
        isLoading={isEditingOrganization}
      />

      

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteOrganizationMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteProjectModal && projectToDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteProjectModal}
          onClose={() => {
            setShowDeleteProjectModal(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleConfirmDeleteProject}
          title="Delete Project"
          itemName={projectToDelete.name}
          itemType="project"
          description="This will permanently delete the project and all of its secrets. This action cannot be undone."
          isLoading={isDeletingProject}
        />
      )}

      {/* Delete Organization Confirmation Modal */}
      {showDeleteOrganizationModal && organization && (
        <ConfirmDeleteModal
          isOpen={showDeleteOrganizationModal}
          onClose={() => setShowDeleteOrganizationModal(false)}
          onConfirm={handleConfirmDeleteOrganization}
          title="Delete Organization"
          itemName={organization.name}
          itemType="organization"
          description="This will permanently delete the organization and all of its projects and secrets. This action cannot be undone."
          isLoading={isDeletingOrganization}
        />
      )}
    </div>
  );
}

export default OrganizationDetailsPage;


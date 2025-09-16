import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';
import type { Organization, Project } from '../types';

export function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showEditOrganization, setShowEditOrganization] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [isDeletingOrganization, setIsDeletingOrganization] = useState(false);

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
    setEditName(organization.name);
    setEditDescription(organization.description || '');
    setShowEditOrganization(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !editName.trim()) return;
    
    // Check permissions before attempting to edit
    if (organization.role !== 'OWNER' && organization.role !== 'ADMIN') {
      setError('You do not have permission to edit this organization');
      return;
    }
    
    setIsEditingOrganization(true);
    setError(null);
    try {
      const response = await apiService.updateOrganization(organization.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      
      setOrganization(response.organization);
      setShowEditOrganization(false);
      setEditName('');
      setEditDescription('');
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Insufficient permissions')) {
        setError('You do not have permission to edit this organization');
      } else {
        setError(err.message || 'Failed to update organization');
      }
    } finally {
      setIsEditingOrganization(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;
    
    // Check permissions before attempting to delete
    if (organization.role !== 'OWNER') {
      setError('Only the organization owner can delete the organization');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone and will delete all projects and secrets.`)) {
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
    }
  };

  const handleInviteTeam = () => {
    // TODO: Implement invite team functionality
    console.log('Invite team members for organization:', organization?.id);
  };

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !organization?.id) return;
    
    setIsCreatingProject(true);
    try {
      await apiService.createProject(organization.id, {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined
      });
      
      // Reset form and close modal
      setProjectName('');
      setProjectDescription('');
      setShowCreateProject(false);
      
      // Refresh projects list
      fetchProjects();
      
      // TODO: Show success message
      console.log('Project created successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleCancelProject = () => {
    setProjectName('');
    setProjectDescription('');
    setShowCreateProject(false);
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
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {organization.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
            <p className="text-gray-400">Organization Details</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <Button variant="outline" onClick={handleEdit} className="hover:bg-blue-600 hover:border-blue-600 hover:text-white">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button 
              variant="outline" 
              onClick={handleDelete} 
              className="text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white"
              loading={isDeletingOrganization}
              disabled={isDeletingOrganization}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeletingOrganization ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            {canEdit && (
              <Button onClick={handleInviteTeam} className="flex items-center space-x-2">
                <span>👥</span>
                <span>Invite Team Members</span>
              </Button>
            )}
            {canCreateProject && (
              <Button onClick={handleCreateProject} variant="outline" className="flex items-center space-x-2">
                <span>📁</span>
                <span>Create Project</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Name</span>
                <span className="text-sm text-white font-medium">{organization.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Slug</span>
                <span className="text-sm text-gray-300 font-mono bg-gray-800 px-2 py-1 rounded">{organization.slug}</span>
              </div>
              {organization.description && (
                <div className="flex justify-between items-start py-2">
                  <span className="text-sm font-medium text-gray-400">Description</span>
                  <span className="text-sm text-gray-300 text-right max-w-xs">{organization.description}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Access & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Your Role</span>
                <span className="text-sm font-medium text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-800">
                  {organization.role || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Created</span>
                <span className="text-sm text-gray-300">{new Date(organization.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-400">Last Updated</span>
                <span className="text-sm text-gray-300">{new Date(organization.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card className="hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <svg className="w-6 h-6 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              Projects
            </CardTitle>
            {canCreateProject && (
              <Button 
                variant="gradient"
                onClick={handleCreateProject}
                className="flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Project</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingProjects ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-800 rounded w-32"></div>
                      </div>
                      <div className="h-6 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">Create your first project to start organizing your secrets</p>
              {canCreateProject && (
                <Button 
                  variant="gradient"
                  onClick={handleCreateProject}
                  className="flex items-center space-x-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create your first project</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm group-hover:text-amber-400 transition-colors">{project.name}</h4>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-1">{project.description}</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="text-xs hover:bg-amber-600 hover:border-amber-600 hover:text-white"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
            
            <form onSubmit={handleSubmitProject} className="space-y-4">
              <Input
                label="Project Name"
                placeholder="e.g. My Web App"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
              
              <Input
                label="Description (optional)"
                placeholder="Brief description of the project"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelProject}
                  disabled={isCreatingProject}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isCreatingProject}
                  disabled={!projectName.trim() || isCreatingProject}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Organization</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <Input
                label="Organization Name"
                placeholder="e.g. My Company"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              
              <Input
                label="Description (optional)"
                placeholder="Brief description of your organization"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditOrganization(false);
                    setEditName('');
                    setEditDescription('');
                    setError(null);
                  }}
                  disabled={isEditingOrganization}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isEditingOrganization}
                  disabled={!editName.trim() || isEditingOrganization}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationDetailsPage;


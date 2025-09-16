import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';
import type { Project, Secret } from '../types';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [secretName, setSecretName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretDescription, setSecretDescription] = useState('');
  const [secretType, setSecretType] = useState('API_KEY');
  const [secretEnvironment, setSecretEnvironment] = useState('development');
  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  const [showSecretDetails, setShowSecretDetails] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  const [showEditSecret, setShowEditSecret] = useState(false);
  const [editSecretLoading, setEditSecretLoading] = useState(false);
  const [deleteSecretLoadingId, setDeleteSecretLoadingId] = useState<string | null>(null);

  // Edit modal fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('API_KEY');
  const [editEnvironment, setEditEnvironment] = useState('development');
  const [editValue, setEditValue] = useState(''); // Optional (only if user wants to rotate/update)

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuOpenId && !(event.target as Element).closest('.action-menu-container')) {
        setActionMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionMenuOpenId]);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchSecrets();
    }
  }, [id]);

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
      const response = await apiService.getSecrets(id, false);
      setSecrets(response.secrets);
    } catch (err: any) {
      console.error('Failed to fetch secrets:', err);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit project:', project?.id);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        // TODO: Implement delete functionality
        console.log('Delete project:', project.id);
        // await apiService.deleteProject(project.id);
        // navigate('/organizations');
      } catch (err: any) {
        setError(err.message || 'Failed to delete project');
      }
    }
  };

  const handleCreateSecret = () => {
    setShowCreateSecret(true);
  };

  const handleSubmitSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretName.trim() || !secretValue.trim() || !project?.id) return;
    
    // Check permissions before attempting to create
    if (!canCreateSecret) {
      setError('You do not have permission to create secrets in this project');
      return;
    }
    
    setIsCreatingSecret(true);
    setError(null);
    try {
      await apiService.createSecret(project.id, {
        name: secretName.trim(),
        value: secretValue.trim(),
        description: secretDescription.trim() || undefined,
        type: secretType as any,
        environment: secretEnvironment
      });
      
      // Reset form and close modal
      setSecretName('');
      setSecretValue('');
      setSecretDescription('');
      setSecretType('API_KEY');
      setSecretEnvironment('development');
      setShowCreateSecret(false);
      
      // Refresh secrets list
      fetchSecrets();
      
      console.log('Secret created successfully');
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Access denied')) {
        setError('You do not have permission to create secrets in this project');
      } else {
        setError(err.message || 'Failed to create secret');
      }
    } finally {
      setIsCreatingSecret(false);
    }
  };

  const handleCancelSecret = () => {
    setSecretName('');
    setSecretValue('');
    setSecretDescription('');
    setSecretType('API_KEY');
    setSecretEnvironment('development');
    setShowCreateSecret(false);
  };

  const handleViewSecret = async (secret: Secret) => {
    setSelectedSecret(secret);
    setShowSecretValue(false);
    setShowSecretDetails(true);
  };

  const handleRevealSecret = async () => {
    if (!selectedSecret) return;
    
    try {
      const response = await apiService.getSecret(selectedSecret.id, true);
      setSelectedSecret(response.secret);
      setShowSecretValue(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch secret value');
    }
  };

  const handleCloseSecretDetails = () => {
    setSelectedSecret(null);
    setShowSecretValue(false);
    setShowSecretDetails(false);
  };

  const openActionMenu = (secretId: string) => {
    setActionMenuOpenId((prev) => (prev === secretId ? null : secretId));
  };

  const handleEditSecretOpen = (secret: Secret) => {
    setSelectedSecret(secret);
    setEditName(secret.name);
    setEditDescription(secret.description || '');
    setEditType(secret.type);
    setEditEnvironment(secret.environment || 'development');
    setEditValue('');
    setShowEditSecret(true);
    setActionMenuOpenId(null);
  };

  const handleEditSecretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSecret) return;
    
    // Check permissions before attempting to edit
    if (!canEdit) {
      setError('You do not have permission to edit secrets in this project');
      return;
    }
    
    setEditSecretLoading(true);
    setError(null);
    try {
      await apiService.updateSecret(selectedSecret.id, {
        name: editName.trim() || undefined,
        description: editDescription.trim() || undefined,
        type: editType as any,
        environment: editEnvironment,
        value: editValue.trim() || undefined,
      });
      setShowEditSecret(false);
      setSelectedSecret(null);
      await fetchSecrets();
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Access denied')) {
        setError('You do not have permission to edit this secret');
      } else {
        setError(err.message || 'Failed to update secret');
      }
    } finally {
      setEditSecretLoading(false);
    }
  };

  const handleDeleteSecret = async (secret: Secret) => {
    // Check permissions before attempting to delete
    if (!canDelete) {
      setError('You do not have permission to delete secrets in this project');
      return;
    }
    
    if (!window.confirm(`Delete secret "${secret.name}" in ${secret.environment || 'development'}?`)) return;
    setDeleteSecretLoadingId(secret.id);
    setError(null);
    try {
      await apiService.deleteSecret(secret.id);
      await fetchSecrets();
    } catch (err: any) {
      if (err.status === 403 || err.message?.includes('Access denied')) {
        setError('You do not have permission to delete this secret');
      } else {
        setError(err.message || 'Failed to delete secret');
      }
    } finally {
      setDeleteSecretLoadingId(null);
      setActionMenuOpenId(null);
    }
  };

  // Get unique environments from secrets
  const availableEnvironments = Array.from(new Set(secrets.map(secret => secret.environment || 'development')));
  
  // Filter secrets based on environment and search query
  const filteredSecrets = secrets.filter(secret => {
    const matchesEnvironment = selectedEnvironment === 'all' || (secret.environment || 'development') === selectedEnvironment;
    const matchesSearch = searchQuery === '' || 
      secret.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (secret.description && secret.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesEnvironment && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-gray-400">Loading project...</div>
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

  if (!project) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <div className="text-gray-400 mb-4">Project not found</div>
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

  // Check if user has edit/delete permissions based on role
  const userRole = project?.organization?.role;
  const canEdit = userRole === 'OWNER' || userRole === 'ADMIN';
  const canDelete = userRole === 'OWNER';
  const canCreateSecret = userRole === 'OWNER' || userRole === 'ADMIN' || userRole === 'MEMBER';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <p className="text-gray-400">Project Details</p>
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
            <Button variant="outline" onClick={handleDelete} className="text-red-400 hover:bg-red-600 hover:border-red-600 hover:text-white">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Name</span>
                <span className="text-sm text-white font-medium">{project.name}</span>
              </div>
              {project.description && (
                <div className="flex justify-between items-start py-2 border-b border-gray-800">
                  <span className="text-sm font-medium text-gray-400">Description</span>
                  <span className="text-sm text-gray-300 text-right max-w-xs">{project.description}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Created</span>
                <span className="text-sm text-gray-300">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-400">Last Updated</span>
                <span className="text-sm text-gray-300">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center">
              <svg className="w-5 h-5 mr-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Total Secrets</span>
                <span className="text-lg font-bold text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-lg">
                  {secrets.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-gray-400">Organization</span>
                <span className="text-sm text-white font-medium">{project.organization?.name || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secrets Section */}
      <Card className="hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <svg className="w-6 h-6 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Secrets
            </CardTitle>
            {canCreateSecret ? (
              <Button 
                variant="gradient"
                onClick={handleCreateSecret}
                className="flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Secret</span>
              </Button>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-800 px-3 py-2 rounded-lg">
                No permission to create secrets
              </div>
            )}
          </div>
        </CardHeader>
        
        {/* Filters */}
        <div className="px-6 pb-6 border-b border-gray-800">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                placeholder="Search secrets by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Environment Filter */}
            <div className="flex items-center space-x-3 min-w-0">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Environment:</label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-0 flex-shrink-0"
              >
                <option value="all">All Environments</option>
                {availableEnvironments.map(env => (
                  <option key={env} value={env}>
                    {env.charAt(0).toUpperCase() + env.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Filter Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing <span className="text-white font-medium">{filteredSecrets.length}</span> of <span className="text-white font-medium">{secrets.length}</span> secrets
              {selectedEnvironment !== 'all' && ` in ${selectedEnvironment}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            {(selectedEnvironment !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEnvironment('all');
                  setSearchQuery('');
                }}
                className="text-xs hover:bg-gray-800"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        <CardContent className="pt-6">
          {isLoadingSecrets ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-48"></div>
                        <div className="h-3 bg-gray-800 rounded w-32"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-gray-700 rounded w-16"></div>
                        <div className="h-6 bg-gray-700 rounded w-20"></div>
                        <div className="h-6 bg-gray-700 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : secrets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No secrets yet</h3>
              <p className="text-gray-400 mb-6">Start by adding your first secret to this project</p>
              {canCreateSecret ? (
                <Button 
                  variant="gradient"
                  onClick={handleCreateSecret}
                  className="flex items-center space-x-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add your first secret</span>
                </Button>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-800 px-4 py-2 rounded-lg inline-block">
                  You don't have permission to create secrets in this project
                </div>
              )}
            </div>
          ) : filteredSecrets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No secrets match your filters</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEnvironment('all');
                  setSearchQuery('');
                }}
                className="hover:bg-gray-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSecrets.map((secret) => (
                <div key={secret.id} className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-5 hover:from-gray-800 hover:to-gray-900 hover:border-gray-600 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-lg group-hover:text-emerald-400 transition-colors truncate">{secret.name}</h4>
                          {secret.description && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{secret.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 relative">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          {secret.type}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                          {secret.environment || 'development'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSecret(secret)}
                          className="text-xs hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        {/* Actions menu - only show if user has permissions */}
                        {(canEdit || canDelete) && (
                          <div className="relative action-menu-container">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openActionMenu(secret.id)}
                              className="text-xs hover:bg-gray-700 transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </Button>
                            {actionMenuOpenId === secret.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 overflow-hidden">
                                {canEdit && (
                                  <button
                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center"
                                    onClick={() => handleEditSecretOpen(secret)}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Secret
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors flex items-center"
                                    onClick={() => handleDeleteSecret(secret)}
                                    disabled={deleteSecretLoadingId === secret.id}
                                  >
                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {deleteSecretLoadingId === secret.id ? 'Deleting…' : 'Delete Secret'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created {new Date(secret.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Updated {new Date(secret.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Secret Modal */}
      {showCreateSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Add New Secret
              </h3>
              <button
                onClick={handleCancelSecret}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isCreatingSecret}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitSecret} className="space-y-6">
              <Input
                label="Secret Name"
                placeholder="e.g. API_KEY"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secret Type</label>
                  <select
                    value={secretType}
                    onChange={(e) => setSecretType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="API_KEY">API Key</option>
                    <option value="DATABASE_URL">Database URL</option>
                    <option value="JWT_SECRET">JWT Secret</option>
                    <option value="OAUTH_CLIENT_SECRET">OAuth Client Secret</option>
                    <option value="WEBHOOK_SECRET">Webhook Secret</option>
                    <option value="SSH_KEY">SSH Key</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="PASSWORD">Password</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
                  <select
                    value={secretEnvironment}
                    onChange={(e) => setSecretEnvironment(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="testing">Testing</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secret Value</label>
                <textarea
                  placeholder="Enter the secret value"
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none"
                  rows={4}
                  required
                />
              </div>
              
              <Input
                label="Description (optional)"
                placeholder="Brief description of this secret"
                value={secretDescription}
                onChange={(e) => setSecretDescription(e.target.value)}
              />
              
              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelSecret}
                  disabled={isCreatingSecret}
                  className="hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  loading={isCreatingSecret}
                  disabled={!secretName.trim() || !secretValue.trim() || isCreatingSecret}
                  className="shadow-lg"
                >
                  Add Secret
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret Details Modal */}
      {showSecretDetails && selectedSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Secret Details
              </h3>
              <button
                onClick={handleCloseSecretDetails}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <p className="text-sm text-white font-mono bg-gray-800 border border-gray-700 p-3 rounded-lg">{selectedSecret.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                    {selectedSecret.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                    {selectedSecret.environment || 'development'}
                  </span>
                </div>
              </div>
              
              {selectedSecret.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <p className="text-sm text-gray-300 bg-gray-800 border border-gray-700 p-3 rounded-lg">{selectedSecret.description}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Secret Value</label>
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-mono text-white break-all flex-1 mr-3">
                      {showSecretValue ? selectedSecret.value : selectedSecret.maskedValue}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showSecretValue ? () => setShowSecretValue(false) : handleRevealSecret}
                        className="text-xs hover:bg-emerald-600 hover:border-emerald-600 hover:text-white"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {showSecretValue ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          )}
                        </svg>
                        {showSecretValue ? 'Hide' : 'Show'}
                      </Button>
                      {showSecretValue && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(selectedSecret.value)}
                          className="text-xs hover:bg-blue-600 hover:border-blue-600 hover:text-white"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {!showSecretValue && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Click "Show" to reveal the actual value
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 pt-4 border-t border-gray-800">
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-300">Created:</span> {new Date(selectedSecret.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium text-gray-300">Updated:</span> {new Date(selectedSecret.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={handleCloseSecretDetails}
                className="hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Secret Modal */}
      {showEditSecret && selectedSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Secret
              </h3>
              <button
                onClick={() => setShowEditSecret(false)}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={editSecretLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSecretSubmit} className="space-y-6">
              <Input
                label="Secret Name"
                placeholder="e.g. API_KEY"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Secret Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="API_KEY">API Key</option>
                    <option value="DATABASE_URL">Database URL</option>
                    <option value="JWT_SECRET">JWT Secret</option>
                    <option value="OAUTH_CLIENT_SECRET">OAuth Client Secret</option>
                    <option value="WEBHOOK_SECRET">Webhook Secret</option>
                    <option value="SSH_KEY">SSH Key</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="PASSWORD">Password</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
                  <select
                    value={editEnvironment}
                    onChange={(e) => setEditEnvironment(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="testing">Testing</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>

              <Input
                label="Description (optional)"
                placeholder="Brief description of this secret"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Secret Value (optional)</label>
                <textarea
                  placeholder="Enter new secret value to rotate (leave blank to keep current)"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current value unchanged</p>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditSecret(false)}
                  disabled={editSecretLoading}
                  className="hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  loading={editSecretLoading}
                  disabled={editSecretLoading}
                  className="shadow-lg"
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

export default ProjectDetailsPage;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretCard } from '../components/forms/SecretCard';
import { SecretFilters } from '../components/forms/SecretFilters';
import { SecretModal } from '../components/forms/SecretModal';
import { ProjectMembersSection } from '../components/ProjectMembersSection';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/auth';
import toast from 'react-hot-toast';
import type { Project, Secret } from '../types';

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
  const [filteredSecrets, setFilteredSecrets] = useState<Secret[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  
  // UI state
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [isCreatingSecret, setIsCreatingSecret] = useState(false);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchSecrets();
    }
  }, [id]);

  useEffect(() => {
    filterSecrets();
  }, [secrets, searchQuery, selectedEnvironment, selectedType, selectedFolder]);

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
      // Log API response for debugging
      console.log('API Response secrets:', response.secrets.map(s => ({ id: s.id, name: s.name, hasValue: !!s.value, valueLength: s.value?.length })));
      setSecrets(response.secrets);
    } catch (err: any) {
      console.error('Failed to fetch secrets:', err);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  const filterSecrets = () => {
    let filtered = [...secrets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(secret => 
        secret.name.toLowerCase().includes(query) ||
        secret.description?.toLowerCase().includes(query)
      );
    }

    // Environment filter
    if (selectedEnvironment !== 'all') {
      filtered = filtered.filter(secret => secret.environment === selectedEnvironment);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(secret => secret.type === selectedType);
    }

    // Folder filter
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(secret => secret.folder === selectedFolder);
    }

    setFilteredSecrets(filtered);
  };

  const handleCreateSecret = async (data: any) => {
    if (!id) return;
    
    try {
      setIsCreatingSecret(true);
      await apiService.createSecret(id, data);
      toast.success('Secret created successfully');
      await fetchSecrets();
      setShowCreateSecret(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create secret';
      toast.error(errorMsg);
      console.error('Failed to create secret:', err);
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

  const handleDeleteSecret = async (secret: Secret) => {
    if (!window.confirm(`Are you sure you want to delete "${secret.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await apiService.deleteSecret(secret.id);
      toast.success('Secret deleted successfully');
      await fetchSecrets();
      setShowSecretModal(false);
      setSelectedSecret(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete secret';
      toast.error(errorMsg);
      console.error('Failed to delete secret:', err);
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedEnvironment('all');
    setSelectedType('all');
    setSelectedFolder('all');
  };

  const getExistingFolders = () => {
    const uniqueFolders = [...new Set(secrets.map(secret => secret.folder))];
    return uniqueFolders.filter(folder => folder && folder !== 'default');
  };

  const getEnvironmentStats = () => {
    const stats = {
      development: secrets.filter(s => s.environment === 'development').length,
      staging: secrets.filter(s => s.environment === 'staging').length,
      production: secrets.filter(s => s.environment === 'production').length,
    };
    return stats;
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

  const environmentStats = getEnvironmentStats();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          <p className="text-gray-400 mt-1">{project.description || 'No description'}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
            </Button>
          {((project as any).userAccess?.canWrite ?? true) && (
            <Button
              variant="gradient"
              onClick={() => setShowCreateSecret(true)}
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              Add Secret
              </Button>
          )}
        </div>
      </div>

      {/* Environment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Development</p>
                <p className="text-2xl font-bold text-blue-400">{environmentStats.development}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              </div>
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Staging</p>
                <p className="text-2xl font-bold text-yellow-400">{environmentStats.staging}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Production</p>
                <p className="text-2xl font-bold text-red-400">{environmentStats.production}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Members Section */}
      <ProjectMembersSection
        projectId={id!}
        projectName={project.name}
        canManageMembers={(project as any).userAccess?.canManageMembers ?? false}
        currentUserId={user?.id || ''}
      />
        
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <SecretFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedEnvironment={selectedEnvironment}
            onEnvironmentChange={setSelectedEnvironment}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedFolder={selectedFolder}
            onFolderChange={setSelectedFolder}
            onClearFilters={handleClearFilters}
            existingFolders={getExistingFolders()}
          />
        </CardContent>
      </Card>

      {/* Secrets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Secrets ({filteredSecrets.length})
          </h2>
        </div>

          {isLoadingSecrets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-800 rounded"></div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
        ) : filteredSecrets.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {secrets.length === 0 ? 'No secrets yet' : 'No secrets match your filters'}
              </h3>
              <p className="text-gray-400 mb-6">
                {secrets.length === 0 
                  ? 'Create your first secret to get started' 
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {secrets.length === 0 && (
                <Button variant="gradient" onClick={() => setShowCreateSecret(true)}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Secret
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSecrets.map((secret) => (
              <SecretCard
                key={secret.id}
                secret={secret}
                onEdit={handleEditSecretClick}
                onDelete={handleDeleteSecret}
                onView={handleViewSecret}
                canEdit={(project as any).userAccess?.canWrite ?? true}
                canDelete={(project as any).userAccess?.canDelete ?? true}
              />
            ))}
                          </div>
                        )}
                      </div>

      {/* Create Secret Modal */}
      {showCreateSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <SecretForm
              onSubmit={handleCreateSecret}
              onCancel={() => setShowCreateSecret(false)}
              isLoading={isCreatingSecret}
              title="Create New Secret"
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
    </div>
  );
}

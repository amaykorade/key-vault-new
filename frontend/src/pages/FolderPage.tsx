import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { SecretRow } from '../components/SecretRow';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { EnvImportModal } from '../components/EnvImportModal';
import { apiService, ApiError } from '../services/api';
import type { Project, Secret } from '../types';

type Tab = 'secrets' | 'access' | 'logs' | 'integrations';

// Temporary feature flag: disable Render sync while integration is unstable
const RENDER_SYNC_ENABLED = false;

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getEventIcon(eventType: string, action: string) {
  // Vercel sync events
  if (eventType === 'vercel_sync') {
    if (action === 'failed') {
      return <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
    }
    return <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
  }
  if (action === 'create') {
    return <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
  }
  if (action === 'update') {
    return <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  }
  if (action === 'delete') {
    return <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
  }
  if (action === 'view') {
    return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
  }
  if (action === 'failed') {
    return <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
  }
  return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function getEventColor(action: string) {
  if (action === 'create') return { bg: 'bg-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' };
  if (action === 'update') return { bg: 'bg-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' };
  if (action === 'delete') return { bg: 'bg-red-500/20', badge: 'bg-red-500/20 text-red-400' };
  if (action === 'view') return { bg: 'bg-gray-700/30', badge: 'bg-gray-700/30 text-gray-400' };
  if (action === 'failed') return { bg: 'bg-red-500/20', badge: 'bg-red-500/20 text-red-400' };
  return { bg: 'bg-gray-700/30', badge: 'bg-gray-700/30 text-gray-400' };
}

export function FolderPage() {
  const navigate = useNavigate();
  const { id, env, folder } = useParams<{ id: string; env: string; folder: string }>();

  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('secrets');
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<Secret | null>(null);
  const [isDeletingSecret, setIsDeletingSecret] = useState(false);
  const [selectedSecretsForDelete, setSelectedSecretsForDelete] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokens, setTokens] = useState<Array<{ id: string; name: string; createdAt: string; expiresAt?: string | null; lastUsedAt?: string | null; projectId?: string | null; projectName?: string | null; scopes?: string[] }>>([]);
  const [tokenToRevoke, setTokenToRevoke] = useState<{ id: string; name: string } | null>(null);
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);
  const [isRevokingToken, setIsRevokingToken] = useState(false);

  async function fetchTokens() {
    try {
      setTokensLoading(true);
      const res = await apiService.listTokens();
      const list = Array.isArray(res.tokens) ? res.tokens : [];
      const filtered = id ? list.filter((t: any) => !t.projectId || t.projectId === id) : list;
      setTokens(filtered as any);
    } catch (e) {
      // no-op
    } finally {
      setTokensLoading(false);
    }
  }

  async function fetchLogs() {
    if (!id || !env || !folder) return;
    try {
      setIsLoadingLogs(true);
      const res = await apiService.getFolderLogs(id, env, folder || 'default');
      setLogs(res.logs || []);
      
      // Auto-expand the most recent date (today's date)
      if (res.logs && res.logs.length > 0) {
        const mostRecentDate = new Date(res.logs[0].createdAt);
        const dateKey = mostRecentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        setExpandedDates(new Set([dateKey]));
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  }

  async function handleRevealSecret(secretId: string) {
    if (revealedSecrets.has(secretId) || revealingSecrets.has(secretId)) return;
    
    try {
      setRevealingSecrets(prev => new Set(prev).add(secretId));
      
      // Fetch the secret with its value (this will log the view event on backend)
      const res = await apiService.getSecret(secretId, true);
      
      // Update the secret in the list with the revealed value
      setSecrets(prev => prev.map(s => 
        s.id === secretId ? { ...s, value: res.secret.value } : s
      ));
      
      // Mark as revealed
      setRevealedSecrets(prev => new Set(prev).add(secretId));
    } catch (e) {
      console.error('Failed to reveal secret:', e);
    } finally {
      setRevealingSecrets(prev => {
        const next = new Set(prev);
        next.delete(secretId);
        return next;
      });
    }
  }

  function handleHideSecret(secretId: string) {
    setRevealedSecrets(prev => {
      const next = new Set(prev);
      next.delete(secretId);
      return next;
    });
    
    // Reset the secret value to masked
    setSecrets(prev => prev.map(s => 
      s.id === secretId ? { ...s, value: s.maskedValue || '••••••••' } : s
    ));
  }

  function toggleDateExpansion(dateKey: string) {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  }
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [scopeRead, setScopeRead] = useState(true);
  const [scopeWrite, setScopeWrite] = useState(false);
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('');
  const [expiryMinutes, setExpiryMinutes] = useState<string>('');
  const [forceEditNameId, setForceEditNameId] = useState<string | null>(null);
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // Track which secrets have been revealed
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [revealingSecrets, setRevealingSecrets] = useState<Set<string>>(new Set());
  
  // Log filters
  const [logDateFilter, setLogDateFilter] = useState<string>('all'); // 'all', 'today', 'week', 'month'
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all'); // 'all', 'secret', 'token'
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  
  // Vercel integration state
  const [vercelConnected, setVercelConnected] = useState(false);
  const [renderConnected, setRenderConnected] = useState(false);
  const [vercelIntegrations, setVercelIntegrations] = useState<Array<{
    id: string;
    name: string;
    vercelTeamId: string | null;
    vercelTeamName: string | null;
    createdAt: string;
    updatedAt: string;
  }>>([]);
  const [selectedVercelIntegration, setSelectedVercelIntegration] = useState<string>('');
  const [vercelProjects, setVercelProjects] = useState<any[]>([]);
  const [selectedVercelProject, setSelectedVercelProject] = useState<string>('');
  const [vercelEnvTarget, setVercelEnvTarget] = useState<'production' | 'preview' | 'development'>('development');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddSyncModal, setShowAddSyncModal] = useState(false);
  const [isLoadingVercelSync, setIsLoadingVercelSync] = useState(false);
  const [isLoadingRenderSync, setIsLoadingRenderSync] = useState(false);
  const [vercelToken, setVercelToken] = useState('');
  const [vercelIntegrationName, setVercelIntegrationName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Render state
  const [renderIntegrations, setRenderIntegrations] = useState<any[]>([]);
  const [renderServices, setRenderServices] = useState<any[]>([]);
  const [selectedRenderIntegration, setSelectedRenderIntegration] = useState<string>('');
  const [selectedRenderService, setSelectedRenderService] = useState<string>('');
  const [showRenderConnectModal, setShowRenderConnectModal] = useState(false);
  const [showRenderConfigModal, setShowRenderConfigModal] = useState(false);
  const [renderApiKey, setRenderApiKey] = useState('');
  const [renderIntegrationName, setRenderIntegrationName] = useState('');
  const [isConnectingRender, setIsConnectingRender] = useState(false);
  const [isSavingRenderConfig, setIsSavingRenderConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isDeletingIntegration, setIsDeletingIntegration] = useState<string | null>(null);
  const [isDeletingSyncConfig, setIsDeletingSyncConfig] = useState(false);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; projectName: string; envTarget: string } | null>(null);
  const [isTriggeringDeploy, setIsTriggeringDeploy] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [expandedSyncId, setExpandedSyncId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    // Filter by date
    if (logDateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (logDateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.createdAt) >= filterDate);
    }
    
    // Filter by resource type
    if (logTypeFilter !== 'all') {
      if (logTypeFilter === 'vercel_sync') {
        // Show both 'integration' and 'vercel_sync' resource types
        filtered = filtered.filter(log => 
          log.resourceType === 'integration' || 
          log.resourceType === 'vercel_sync' ||
          log.eventType === 'vercel_sync'
        );
      } else {
        filtered = filtered.filter(log => log.resourceType === logTypeFilter);
      }
    }
    
    return filtered;
  }, [logs, logDateFilter, logTypeFilter]);

const environmentLabel = useMemo(() => {
  if (!env) return 'Unknown Environment';
  return env
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}, [env]);

const folderLabel = useMemo(() => {
    const folderName = folder || 'default';
  return folderName
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
}, [folder]);

const breadcrumbItems = useMemo(() => {
  const items: Array<{ label: string; onClick?: () => void }> = [
    { label: 'Projects', onClick: () => navigate('/projects') },
  ];

  if (projectDetails?.id) {
    items.push({
      label: projectDetails.name,
      onClick: () => navigate(`/projects/${projectDetails.id}`),
    });
  } else {
    items.push({
      label: 'Project',
      onClick: () => navigate('/projects'),
    });
  }

  items.push({
    label: environmentLabel,
    onClick: id ? () => navigate(`/projects/${id}`) : undefined,
  });

  items.push({
    label: folderLabel,
  });

  return items;
}, [navigate, projectDetails, environmentLabel, folderLabel, id, env]);

  useEffect(() => {
    fetchSecrets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, env, folder]);

  // Close download menu when clicking outside
  useEffect(() => {
    if (!showDownloadMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.download-menu-container')) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  useEffect(() => {
    if (activeTab === 'access') {
      fetchTokens();
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'integrations') {
      checkVercelConnection();
      if (RENDER_SYNC_ENABLED) {
        checkRenderConnection();
      }
    }
  }, [activeTab]);

  // Check Vercel connection status on mount to enable sync indicators
  useEffect(() => {
    if (id) {
      checkVercelConnection();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check sync status from backend
  async function checkSyncStatus() {
    if (!id || !env || !vercelConnected) return;
    
    try {
      const data = await apiService.checkVercelSyncStatus(id, env, folder || 'default');
      setHasUnsyncedChanges(data.hasUnsyncedChanges);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  }

  // Check sync status when folder changes or Vercel connection status changes
  useEffect(() => {
    if (vercelConnected && id && env) {
      checkSyncStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, env, folder, vercelConnected]);

  async function checkVercelConnection() {
    if (!id || !env || !folder) return;
    
    try {
      // Get project to find organizationId
      const projectRes = await apiService.getProject(id);
      setProjectDetails(projectRes.project);
      const orgId = projectRes.project?.organizationId;
      
      if (!orgId) {
        console.error('Could not determine organization ID');
        return;
      }
      
      const data = await apiService.checkVercelStatus(orgId);
      setVercelConnected(data.connected || false);
      
      // If connected, fetch integrations and load saved sync config
      if (data.connected) {
        try {
          // Fetch all integrations
          const integrationsData = await apiService.getVercelIntegrations(orgId);
          setVercelIntegrations(integrationsData.integrations || []);
          
          // Load saved sync configuration
          const configData = await apiService.getVercelSyncConfig(id, env, folder || 'default');
          if (configData.config) {
            // Load project and environment from saved config
            if (configData.config.vercelProjectId) {
              setSelectedVercelProject(configData.config.vercelProjectId);
            }
            if (configData.config.vercelEnvTarget) {
              setVercelEnvTarget(configData.config.vercelEnvTarget);
            }
            
            // If integration ID exists, use it; otherwise use first integration (backward compatibility)
            if (configData.config.vercelIntegrationId) {
              setSelectedVercelIntegration(configData.config.vercelIntegrationId);
              // Fetch projects for the selected integration
              try {
                const projectsData = await apiService.getVercelProjects(configData.config.vercelIntegrationId);
                setVercelProjects(projectsData.projects || []);
              } catch (projectsError) {
                console.error('Failed to load Vercel projects:', projectsError);
              }
            } else if (integrationsData.integrations.length > 0) {
              // Backward compatibility: use first integration if config doesn't have integration ID
              const firstIntegration = integrationsData.integrations[0];
              setSelectedVercelIntegration(firstIntegration.id);
              try {
                const projectsData = await apiService.getVercelProjects(firstIntegration.id);
                setVercelProjects(projectsData.projects || []);
              } catch (projectsError) {
                console.error('Failed to load Vercel projects:', projectsError);
              }
            }
          } else if (integrationsData.integrations.length > 0) {
            // If no config but integrations exist, use the first one
            const firstIntegration = integrationsData.integrations[0];
            setSelectedVercelIntegration(firstIntegration.id);
            try {
              const projectsData = await apiService.getVercelProjects(firstIntegration.id);
              setVercelProjects(projectsData.projects || []);
            } catch (projectsError) {
              console.error('Failed to load Vercel projects:', projectsError);
            }
          }
        } catch (configError) {
          console.error('Failed to load integrations or sync config:', configError);
          // If no config exists, that's okay - user needs to configure
        }
      }
    } catch (e) {
      console.error('Failed to check Vercel connection:', e);
    }
  }

  async function loadVercelProjects(integrationId: string) {
    try {
      const projectsData = await apiService.getVercelProjects(integrationId);
      setVercelProjects(projectsData.projects || []);
    } catch (error) {
      console.error('Failed to load Vercel projects:', error);
      setVercelProjects([]);
    }
  }

  async function checkRenderConnection() {
    if (!id || !env || !folder) return;
    
    try {
      // Get project to find organizationId
      const projectRes = await apiService.getProject(id);
      const orgId = projectRes.project?.organizationId;
      
      if (!orgId) {
        console.error('Could not determine organization ID');
        return;
      }
      
      const data = await apiService.checkRenderStatus(orgId);
      setRenderConnected(data.connected || false);
      
      // If connected, fetch integrations and load saved sync config
      if (data.connected) {
        try {
          const integrationsData = await apiService.getRenderIntegrations(orgId);
          setRenderIntegrations(integrationsData.integrations || []);
          
          const configData = await apiService.getRenderSyncConfig(id, env, folder || 'default');
          if (configData.config) {
            // Load service from saved config
            if (configData.config.renderServiceId) {
              setSelectedRenderService(configData.config.renderServiceId);
            }
            
            // If integration ID exists, use it; otherwise use first integration
            if (configData.config.renderIntegrationId) {
              setSelectedRenderIntegration(configData.config.renderIntegrationId);
              try {
                const servicesData = await apiService.getRenderServices(configData.config.renderIntegrationId);
                setRenderServices(servicesData.services || []);
              } catch (servicesError) {
                console.error('Failed to load Render services:', servicesError);
              }
            } else if (integrationsData.integrations.length > 0) {
              const firstIntegration = integrationsData.integrations[0];
              setSelectedRenderIntegration(firstIntegration.id);
              try {
                const servicesData = await apiService.getRenderServices(firstIntegration.id);
                setRenderServices(servicesData.services || []);
              } catch (servicesError) {
                console.error('Failed to load Render services:', servicesError);
              }
            }
          } else if (integrationsData.integrations.length > 0) {
            // If no config but integrations exist, use the first one
            const firstIntegration = integrationsData.integrations[0];
            setSelectedRenderIntegration(firstIntegration.id);
            try {
              const servicesData = await apiService.getRenderServices(firstIntegration.id);
              setRenderServices(servicesData.services || []);
            } catch (servicesError) {
              console.error('Failed to load Render services:', servicesError);
            }
          }
        } catch (configError) {
          console.error('Failed to load Render integrations or sync config:', configError);
        }
      }
    } catch (e) {
      console.error('Failed to check Render connection:', e);
    }
  }

  async function loadRenderServices(integrationId: string) {
    try {
      const servicesData = await apiService.getRenderServices(integrationId);
      setRenderServices(servicesData.services || []);
    } catch (error) {
      console.error('Failed to load Render services:', error);
      setRenderServices([]);
    }
  }

  const handleVercelSyncClick = async () => {
    setIsLoadingVercelSync(true);
    setShowAddSyncModal(false);
    
    try {
      // Small delay to ensure modal closes before opening next one
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // If Vercel is not connected, show connect modal, otherwise show config modal
      if (!vercelConnected) {
        setShowConnectModal(true);
      } else {
        // Load config and show config modal
        if (id && env && folder) {
          try {
            const configData = await apiService.getVercelSyncConfig(id, env, folder || 'default');
            if (configData.config) {
              setSelectedVercelIntegration(configData.config.vercelIntegrationId || '');
              setSelectedVercelProject(configData.config.vercelProjectId);
              setVercelEnvTarget(configData.config.vercelEnvTarget);
              if (configData.config.vercelIntegrationId) {
                await loadVercelProjects(configData.config.vercelIntegrationId);
              }
            }
          } catch (error) {
            console.error('Failed to load sync config:', error);
          }
          setShowConfigModal(true);
        } else {
          // Auto-select first integration if not already selected and only one exists
          if (vercelIntegrations.length === 1 && !selectedVercelIntegration) {
            setSelectedVercelIntegration(vercelIntegrations[0].id);
            loadVercelProjects(vercelIntegrations[0].id);
          }
          setShowConfigModal(true);
        }
      }
    } finally {
      setIsLoadingVercelSync(false);
    }
  };

  async function fetchSecrets() {
    if (!id) return;
    try {
      setIsLoading(true);
      // Don't include values by default for security
      const res = await apiService.getSecrets(id, false);
      const filtered = res.secrets.filter((s: Secret) => (s.environment || '').toLowerCase() === (env || '').toLowerCase() && (s.folder || 'default') === (folder || 'default'));
      setSecrets(filtered);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSecret(data: any) {
    if (!id) return;
    const payload = { ...data, environment: env, folder: folder || 'default' };
    try {
      await apiService.createSecret(id, payload);
      await fetchSecrets();
      setShowCreateSecret(false);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403 && typeof err.message === 'string' && err.message.startsWith('Free plan limit')) {
        toast.error(
          'Free plan limit reached: You can only use the development environment and up to 5 secrets per workspace. Upgrade in Billing to unlock more.',
          { duration: 10000 }
        );
      } else {
        const errorMsg = (err as any)?.response?.data?.error || err?.message || 'Failed to create secret';
        toast.error(errorMsg, { duration: 5000 });
      }
    }
  }

  async function handleQuickCreateSecret() {
    if (!id) return;
    
    // Generate a unique name to avoid conflicts
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const uniqueName = `UNTITLED_${randomSuffix}`;
    
    const payload = {
      name: uniqueName,
      description: '',
      type: 'OTHER',
      environment: env,
      folder: folder || 'default',
      value: ' ',
    };
    try {
      const res = await apiService.createSecret(id, payload as any);
      await fetchSecrets();
      setForceEditNameId(res.secret.id);
      
      // Check sync status after creating secret (small delay to ensure DB commit)
      if (vercelConnected) {
        setTimeout(() => checkSyncStatus(), 100);
      }
    } catch (err: any) {
      console.error('Failed to create secret:', err);
      if (err instanceof ApiError && err.status === 403 && typeof err.message === 'string' && err.message.startsWith('Free plan limit')) {
        toast.error(
          'Free plan limit reached: You can only use the development environment and up to 5 secrets per workspace. Upgrade in Billing to unlock more.',
          { duration: 10000 }
        );
      } else {
        const errorMsg = (err as any)?.response?.data?.error || err?.message || 'Failed to create secret';
        toast.error(errorMsg, { duration: 5000 });
      }
    }
  }

  async function handleEditSecret(data: any) {
    if (!selectedSecret) return;
    await apiService.updateSecret(selectedSecret.id, data);
    await fetchSecrets();
    setShowSecretModal(false);
    setSelectedSecret(null);
  }

  async function handleConfirmDelete() {
    if (!secretToDelete || isDeletingSecret) return;
    try {
      setIsDeletingSecret(true);
      await apiService.deleteSecret(secretToDelete.id);
      await fetchSecrets();
      setShowDeleteSecretModal(false);
      setSecretToDelete(null);
      
      // Check sync status after deleting secret (small delay to ensure DB commit)
      if (vercelConnected) {
        setTimeout(() => checkSyncStatus(), 100);
      }
    } catch (error) {
      console.error('Failed to delete secret:', error);
      toast.error('Failed to delete secret. Please try again.');
    } finally {
      setIsDeletingSecret(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedSecretsForDelete.size === 0 || isBulkDeleting) return;
    
    const count = selectedSecretsForDelete.size;
    const loadingToast = toast.loading(`Deleting ${count} secret${count !== 1 ? 's' : ''}...`);
    
    try {
      setIsBulkDeleting(true);
      
      // Delete all selected secrets in parallel
      const deletePromises = Array.from(selectedSecretsForDelete).map(secretId =>
        apiService.deleteSecret(secretId).catch((error) => {
          console.error(`Failed to delete secret ${secretId}:`, error);
          return { error, secretId };
        })
      );
      
      const results = await Promise.all(deletePromises);
      const errors = results.filter(r => r && 'error' in r);
      
      if (errors.length > 0) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to delete ${errors.length} of ${count} secret${count !== 1 ? 's' : ''}.`);
      } else {
        toast.dismiss(loadingToast);
        toast.success(`Successfully deleted ${count} secret${count !== 1 ? 's' : ''}.`);
      }
      
      // Clear selection and refresh
      setSelectedSecretsForDelete(new Set());
      await fetchSecrets();
      
      // Check sync status after deleting secrets (small delay to ensure DB commit)
      if (vercelConnected) {
        setTimeout(() => checkSyncStatus(), 100);
      }
    } catch (error) {
      console.error('Failed to bulk delete secrets:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to delete secrets. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  }

  function toggleSecretSelection(secretId: string) {
    setSelectedSecretsForDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(secretId)) {
        newSet.delete(secretId);
      } else {
        newSet.add(secretId);
      }
      return newSet;
    });
  }

  function toggleSelectAll() {
    if (selectedSecretsForDelete.size === secrets.length) {
      setSelectedSecretsForDelete(new Set());
    } else {
      setSelectedSecretsForDelete(new Set(secrets.map(s => s.id)));
    }
  }

  // Download secrets in various formats
  async function downloadSecretsWithValues(format: 'env' | 'json' | 'yaml' | 'csv') {
    if (secrets.length === 0) {
      toast.error('No secrets to download');
      return;
    }

    const loadingToast = toast.loading('Fetching secret values...');

    try {
      // Fetch all secrets with their values
      const secretsWithValues = await Promise.all(
        secrets.map(async (secret) => {
          try {
            const response = await apiService.getSecret(secret.id, true);
            return { ...secret, value: response.secret.value };
          } catch (error) {
            console.error(`Failed to fetch value for ${secret.name}:`, error);
            return { ...secret, value: '***' };
          }
        })
      );

      toast.dismiss(loadingToast);

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (format) {
        case 'env':
          content = secretsWithValues
            .map(s => `${s.name}=${s.value || ''}`)
            .join('\n');
          filename = `${projectDetails?.name || 'secrets'}-${env}-${folder || 'default'}.env`;
          mimeType = 'text/plain';
          break;

        case 'json':
          content = JSON.stringify(
            secretsWithValues.reduce((acc, s) => {
              acc[s.name] = s.value || '';
              return acc;
            }, {} as Record<string, string>),
            null,
            2
          );
          filename = `${projectDetails?.name || 'secrets'}-${env}-${folder || 'default'}.json`;
          mimeType = 'application/json';
          break;

        case 'yaml':
          content = secretsWithValues
            .map(s => `${s.name}: ${s.value || ''}`)
            .join('\n');
          filename = `${projectDetails?.name || 'secrets'}-${env}-${folder || 'default'}.yaml`;
          mimeType = 'text/yaml';
          break;

        case 'csv':
          content = 'Name,Type,Value\n' + secretsWithValues
            .map(s => `"${s.name}","${s.type}","${s.value || ''}"`)
            .join('\n');
          filename = `${projectDetails?.name || 'secrets'}-${env}-${folder || 'default'}.csv`;
          mimeType = 'text/csv';
          break;
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${secrets.length} secret${secrets.length !== 1 ? 's' : ''} as ${format.toUpperCase()}`);
      setShowDownloadMenu(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Failed to download secrets:', error);
      toast.error('Failed to download secrets. Please try again.');
      setShowDownloadMenu(false);
    }
  }


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-gray-400">
                {breadcrumbItems.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                    {index !== 0 && (
                      <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    {item.onClick ? (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="hover:text-gray-200 transition-colors"
                      >
                        {item.label}
                      </button>
                    ) : (
                      <span className="text-gray-300">{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{folderLabel}</h1>
              <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                {environmentLabel}
              </span>
              {projectDetails?.organization?.name && (
                <span className="text-xs text-gray-500">
                  {projectDetails.organization.name}
                </span>
              )}
        </div>
          </div>
        </div>
        {/* Right side intentionally left empty for future actions */}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('secrets')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'secrets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Secrets
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors relative group ${
              activeTab === 'integrations'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              Sync Configuration
              {vercelConnected && hasUnsyncedChanges && (
                <>
                  <svg 
                    className="w-4 h-4 text-orange-400 animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                  {/* Tooltip */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700 shadow-lg">
                    Out of sync - Click to sync changes
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></span>
                  </span>
                </>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'access'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Access
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'secrets' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm font-semibold">Secrets</CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center shadow transition-colors"
                  title="Import Environment Variables"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </button>
                <button
                  onClick={handleQuickCreateSecret}
                  className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow transition-colors"
                  title="Add Secret"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                  </svg>
                </button>
                <div className="relative download-menu-container">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center shadow transition-colors"
                    title="Download Options"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {showDownloadMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDownloadMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase border-b border-gray-700">
                          Download as
                        </div>
                        <button
                          onClick={() => downloadSecretsWithValues('env')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>.env File</span>
                        </button>
                        <button
                          onClick={() => downloadSecretsWithValues('json')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>JSON</span>
                        </button>
                        <button
                          onClick={() => downloadSecretsWithValues('yaml')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>YAML</span>
                        </button>
                        <button
                          onClick={() => downloadSecretsWithValues('csv')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>CSV</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-800 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : secrets.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-white mb-2">No secrets in this folder</h3>
                <p className="text-gray-400 mb-5 text-sm">Create your first secret to get started</p>
                <Button variant="gradient" size="sm" onClick={handleQuickCreateSecret}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Secret
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>Tip: Click the name or value to edit inline.</span>
                  </div>
                  {selectedSecretsForDelete.size > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-medium">
                        {selectedSecretsForDelete.size} secret{selectedSecretsForDelete.size !== 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSecretsForDelete(new Set())}
                        disabled={isBulkDeleting}
                        className="text-gray-300 border-gray-700 hover:bg-gray-800"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        loading={isBulkDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                      >
                        {isBulkDeleting ? 'Deleting...' : `Delete ${selectedSecretsForDelete.size}`}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="w-full">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]">
                        <input
                          type="checkbox"
                          checked={secrets.length > 0 && selectedSecretsForDelete.size === secrets.length}
                          onChange={toggleSelectAll}
                          disabled={isBulkDeleting || secrets.length === 0}
                          className="rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
                          title="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[20%]">Name</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[40%]">Secret</TableHead>
                      <TableHead className="w-[20%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {secrets.map((secret) => (
                  <SecretRow
                    key={secret.id}
                    secret={secret}
                    forceEditNameId={forceEditNameId}
                    isTable
                    showCheckbox
                    isSelected={selectedSecretsForDelete.has(secret.id)}
                    onToggleSelect={toggleSecretSelection}
                    isSelectionDisabled={isBulkDeleting}
                    onReveal={handleRevealSecret}
                    onHide={handleHideSecret}
                    isRevealed={revealedSecrets.has(secret.id)}
                    isRevealing={revealingSecrets.has(secret.id)}
                    onEdit={async (updatedSecret) => {
                      try {
                        const updateData: any = {};
                        if (updatedSecret.type !== secret.type) {
                          updateData.type = updatedSecret.type;
                        }
                        if (updatedSecret.name && updatedSecret.name !== secret.name) {
                          updateData.name = updatedSecret.name;
                        }
                            if (typeof updatedSecret.value === 'string' && updatedSecret.value !== secret.value) {
                              updateData.value = updatedSecret.value;
                        }
                            if (Object.keys(updateData).length > 0) {
                              await apiService.updateSecret(secret.id, updateData);
                              await fetchSecrets();
                              if (forceEditNameId === secret.id) setForceEditNameId(null);
                              
                              // Check sync status after updating secret (small delay to ensure DB commit)
                              if (vercelConnected) {
                                setTimeout(() => checkSyncStatus(), 100);
                              }
                            }
                      } catch (err: any) {
                        console.error('Failed to update secret:', err);
                      }
                    }}
                    onDelete={(s) => {
                      setSecretToDelete(s);
                      setShowDeleteSecretModal(true);
                    }}
                    canEdit={true}
                    canDelete={true}
                  />
                ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'access' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm font-semibold">Access</CardTitle>
              <button
                onClick={() => setShowTokenModal(true)}
                disabled={isGeneratingToken}
                className="px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 disabled:opacity-50"
                title="Generate service token"
              >
                Generate
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Tokens List */}
              <div className="overflow-hidden">
                {tokensLoading ? (
                  <div className="p-4 text-sm text-gray-400">Loading tokens…</div>
                ) : tokens.length === 0 ? (
                  <div className="p-4 text-sm text-gray-400">No tokens yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Token</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last used</TableHead>
                        <TableHead>Valid until</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{t.name || 'Unnamed token'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs text-gray-500 whitespace-nowrap">••••••••••••••••••••••••••••••••</div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-300 whitespace-nowrap">
                            {(t as any).scopes?.length ? (t as any).scopes.join(', ') : 'Read, Write'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                            {t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                            {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'No expiry'}
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => {
                                setTokenToRevoke({ id: t.id, name: t.name });
                                setShowRevokeConfirmation(true);
                              }}
                              className="px-2 py-1 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-colors"
                            >
                              Revoke
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Service Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Generate Service Token</h3>
              <button className="text-gray-400 hover:text-gray-200" onClick={() => setShowTokenModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                  placeholder="e.g., ci-deploy"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Access</label>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-emerald-500" checked={scopeRead} onChange={(e) => setScopeRead(e.target.checked)} />
                    Read
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="accent-emerald-500" checked={scopeWrite} onChange={(e) => setScopeWrite(e.target.checked)} />
                    Write
                  </label>
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" className="accent-emerald-500" checked={useExpiry} onChange={(e) => setUseExpiry(e.target.checked)} />
                  Set expiration
                </label>
                {useExpiry && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Days</label>
                      <input
                        className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                        inputMode="numeric"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Minutes</label>
                      <input
                        className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                        inputMode="numeric"
                        value={expiryMinutes}
                        onChange={(e) => setExpiryMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-end gap-2">
              <button className="px-3 py-2 text-sm rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800" onClick={() => setShowTokenModal(false)}>Cancel</button>
              <button
                className="px-3 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 disabled:opacity-50"
                disabled={isGeneratingToken || (!scopeRead && !scopeWrite)}
                onClick={async () => {
                  if (!id) return;
                  try {
                    setIsGeneratingToken(true);
                    const scopes: Array<'read' | 'write'> = [];
                    if (scopeRead) scopes.push('read');
                    if (scopeWrite) scopes.push('write');
                    let expiresInMinutes: number | undefined = undefined;
                    if (useExpiry) {
                      const d = parseInt(expiryDays || '0', 10) || 0;
                      const m = parseInt(expiryMinutes || '0', 10) || 0;
                      expiresInMinutes = d * 24 * 60 + m;
                    }
                    const res = await apiService.createTokenForProject(id, {
                      name: tokenName || undefined,
                      scopes,
                      expiresInMinutes,
                      environment: env,
                      folder: folder || 'default',
                    });
                    setShowTokenModal(false);
                    setGeneratedToken(res.token);
                    setTokenName('');
                    setScopeRead(true);
                    setScopeWrite(false);
                    setUseExpiry(false);
                    setExpiryDays('');
                    setExpiryMinutes('');
                    await fetchTokens();
                  } finally {
                    setIsGeneratingToken(false);
                  }
                }}
              >
                Generate service token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Token Confirmation Modal */}
      {showRevokeConfirmation && tokenToRevoke && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Revoke Token?</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  You are about to revoke the token:
                </p>
                <p className="text-sm font-mono text-emerald-400">{tokenToRevoke.name}</p>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-200">
                  <strong>Warning:</strong> Any applications or services using this token will immediately lose access.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!isRevokingToken) {
                      setShowRevokeConfirmation(false);
                      setTokenToRevoke(null);
                    }
                  }}
                  disabled={isRevokingToken}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (isRevokingToken) return;
                    try {
                      setIsRevokingToken(true);
                      await apiService.revokeToken(tokenToRevoke.id);
                      await fetchTokens();
                      setShowRevokeConfirmation(false);
                      setTokenToRevoke(null);
                      toast.success('Token revoked successfully');
                    } catch (e) {
                      console.error('Failed to revoke token:', e);
                      toast.error('Failed to revoke token. Please try again.');
                    } finally {
                      setIsRevokingToken(false);
                    }
                  }}
                  disabled={isRevokingToken}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRevokingToken ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Revoking...
                    </>
                  ) : (
                    'Revoke Token'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Display Modal */}
      {generatedToken && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Service Token Created</h3>
                  <p className="text-sm text-gray-400">Copy this token now - you won't be able to see it again</p>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-yellow-200">
                    <strong>Important:</strong> This token is scoped to <strong>{env}/{folder || 'default'}</strong> only. 
                    Store it securely - it will not be shown again.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                <code className="text-sm text-emerald-400 font-mono break-all">{generatedToken}</code>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                  }}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Copy Token
                </button>
                <button
                  onClick={() => setGeneratedToken(null)}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-white text-sm font-semibold">Activity Logs</CardTitle>
              
              {/* Date Filter Dropdown */}
              <div className="relative">
                <select
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="appearance-none bg-gray-800 text-gray-300 text-sm px-4 py-2 pr-10 rounded-lg border border-gray-700 hover:border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Resource Type Filter Tabs */}
            <Tabs value={logTypeFilter} onValueChange={setLogTypeFilter}>
              <TabsList className="w-full justify-start h-auto p-1">
                <TabsTrigger value="all">
                  All Events
                </TabsTrigger>
                <TabsTrigger value="secret">
                  <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Secrets
                </TabsTrigger>
                <TabsTrigger value="token">
                  <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Access Tokens
                </TabsTrigger>
                <TabsTrigger value="vercel_sync">
                  <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Configuration
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3 bg-gray-800/30 rounded">
                    <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
                <h3 className="text-base font-medium text-white mb-2">
                  {logDateFilter === 'all' ? 'No activity yet' : 'No activity in this period'}
                </h3>
                <p className="text-gray-400 mb-5 text-sm">
                  {logDateFilter === 'all' ? 'Activity in this folder will appear here' : 'Try selecting a different time period'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  // Group logs by date
                  const logsByDate = filteredLogs.reduce((acc, log) => {
                    const date = new Date(log.createdAt);
                    const dateKey = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                    if (!acc[dateKey]) {
                      acc[dateKey] = [];
                    }
                    acc[dateKey].push(log);
                    return acc;
                  }, {} as Record<string, any[]>);

                  return Object.entries(logsByDate).map(([dateKey, dateLogs]) => {
                    const isDateExpanded = expandedDates.has(dateKey);
                    const logsCount = (dateLogs as any[]).length;
                    
                    return (
                      <div key={dateKey}>
                        {/* Collapsible Date Header */}
                        <button
                          onClick={() => toggleDateExpansion(dateKey)}
                          className="sticky top-0 w-full bg-gray-900/95 backdrop-blur-sm py-3 px-4 border-b border-gray-700/50 z-10 hover:bg-gray-800/95 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${isDateExpanded ? 'rotate-90' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <h3 className="text-sm font-semibold text-gray-300">{dateKey}</h3>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                            {logsCount} {logsCount === 1 ? 'event' : 'events'}
                          </span>
                        </button>
                        
                        {/* Logs for this date - collapsible */}
                        {isDateExpanded && (
                          <div className="space-y-2 mt-2">
                        {(dateLogs as any[]).map((log: any) => {
                          const isExpanded = expandedLogId === log.id;
                          const timeAgo = getTimeAgo(log.createdAt);
                          const eventIcon = getEventIcon(log.eventType, log.action);
                          const eventColor = getEventColor(log.action);
                          
                          return (
                            <div key={log.id} className="bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="w-full p-3 flex items-start gap-3 hover:bg-gray-800/50 transition-colors text-left"
                              >
                                <div className={`w-8 h-8 ${eventColor.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  {eventIcon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-white">
                                      {log.user?.name || log.user?.email || 'System'}
                                    </span>
                                    <span className="text-sm text-gray-400">{log.description}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{timeAgo}</span>
                                    <span>•</span>
                                    <span className={`px-1.5 py-0.5 rounded ${eventColor.badge}`}>{log.eventType.replace(/_/g, ' ')}</span>
                                    {log.resourceName && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate">{log.resourceName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 border-t border-gray-800/70 pt-3 space-y-2 text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-gray-500">Timestamp:</span>
                                      <div className="text-gray-300">{new Date(log.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">IP Address:</span>
                                      <div className="text-gray-300">{log.ipAddress || 'N/A'}</div>
                                    </div>
                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Details:</span>
                                        <pre className="mt-1 text-gray-300 bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Configuration Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Add Sync Button */}
          <Card className="hover-lift">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
              <CardTitle className="text-white text-sm font-semibold">Sync Configuration</CardTitle>
                <p className="text-xs text-gray-400 mt-1">Connect your secrets to external platforms</p>
                </div>
              <button
                onClick={() => setShowAddSyncModal(true)}
                className="px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Sync
              </button>
            </CardHeader>
          </Card>

          {/* Connected Syncs List */}
          <div className="space-y-3">
            {/* Show connected syncs - only show if sync is actually configured */}
            {((vercelConnected && selectedVercelIntegration && selectedVercelProject) || 
              (renderConnected && selectedRenderIntegration && selectedRenderService)) ? (
              <div className="space-y-3">
                {/* Vercel Sync Card */}
                {vercelConnected && selectedVercelIntegration && selectedVercelProject && (
                <Card 
                  className={`border-gray-800 hover:border-emerald-500/40 transition-all cursor-pointer ${
                    expandedSyncId === 'vercel' ? 'border-emerald-500/50' : ''
                  }`}
                  onClick={() => {
                    setExpandedSyncId(expandedSyncId === 'vercel' ? null : 'vercel');
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 22h20L12 2z" />
                        </svg>
                      </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-white">Vercel Sync</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                        {selectedVercelIntegration && selectedVercelProject ? (
                          (() => {
                            const integration = vercelIntegrations.find(i => i.id === selectedVercelIntegration);
                            const project = vercelProjects.find(p => p.id === selectedVercelProject);
                                return integration && project 
                                  ? `${integration.name} → ${project.name} (${vercelEnvTarget})`
                                  : 'Not configured';
                          })()
                        ) : (
                              'Not configured'
                        )}
                          </p>
                      </div>
                              </div>
                      <div className="flex items-center gap-3">
                      {hasUnsyncedChanges ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Out of sync
                        </span>
                        ) : selectedVercelIntegration && selectedVercelProject ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Synced
                        </span>
                        ) : null}
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedSyncId === 'vercel' ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Expanded Content */}
                  {expandedSyncId === 'vercel' && (
                    <CardContent className="pt-0 space-y-4 border-t border-gray-800">
                      {/* Configuration Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Integration</label>
                          <p className="text-sm text-white">
                            {selectedVercelIntegration ? (
                              vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.name || 'Not configured'
                            ) : (
                              'Not configured'
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Destination</label>
                          <p className="text-sm text-white">
                            {selectedVercelIntegration && selectedVercelProject ? (
                              (() => {
                                const project = vercelProjects.find(p => p.id === selectedVercelProject);
                                return project 
                                  ? `${project.name} (${vercelEnvTarget})`
                                  : 'Not configured';
                              })()
                            ) : (
                              'Not configured'
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                        {selectedVercelIntegration && selectedVercelProject ? (
                          <>
                            <button
                              onClick={async () => {
                                if (!id || !env || !folder) {
                                  toast.error('Invalid project, environment, or folder');
                                  return;
                                }
                                
                                try {
                                  setIsDeletingSyncConfig(true);
                                  await apiService.deleteVercelSyncConfig(id, env, folder || 'default');
                                  // Clear sync configuration
                                  setSelectedVercelIntegration('');
                                  setSelectedVercelProject('');
                                  setVercelProjects([]);
                                  setVercelEnvTarget('development');
                                  // Refresh sync status and logs
                                  await checkSyncStatus();
                                  await fetchLogs();
                                  toast.success('Sync configuration deleted successfully');
                                } catch (error) {
                                  console.error('Failed to delete sync config:', error);
                                  toast.error('Failed to delete sync configuration. Please try again.');
                                } finally {
                                  setIsDeletingSyncConfig(false);
                                }
                              }}
                              disabled={isDeletingSyncConfig}
                              className="px-3 py-2 text-xs rounded-md border border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Disconnect sync"
                            >
                              {isDeletingSyncConfig ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                            <button
                              onClick={async () => {
                                // Load saved configuration before opening modal
                                if (id && env && folder) {
                                  try {
                                    const configData = await apiService.getVercelSyncConfig(id, env, folder || 'default');
                                    if (configData.config) {
                                      setSelectedVercelIntegration(configData.config.vercelIntegrationId || '');
                                      setSelectedVercelProject(configData.config.vercelProjectId);
                                      setVercelEnvTarget(configData.config.vercelEnvTarget);
                                      
                                      // Load projects for the selected integration
                                      if (configData.config.vercelIntegrationId) {
                                        await loadVercelProjects(configData.config.vercelIntegrationId);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Failed to load sync config:', error);
                                  }
                                }
                                // Open configuration modal
                                setShowConfigModal(true);
                              }}
                              className="px-3 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                              title="Configure sync"
                            >
                              Configure
                            </button>
                            <button
                              onClick={async () => {
                                if (!id || !env) {
                                  toast.error('Invalid project or environment');
                                  return;
                                }
                                
                                // Check if configuration exists
                                if (!selectedVercelIntegration) {
                                  toast.error('Please configure the sync first by clicking "Configure" to select a Vercel integration, project and environment.');
                                  setShowConfigModal(true);
                                  return;
                                }
                                
                                if (!selectedVercelProject) {
                                  toast.error('Please configure the sync first by clicking "Configure" to select a Vercel project and environment.');
                                  setShowConfigModal(true);
                                  return;
                                }
                                
                                try {
                                  setIsSyncing(true);
                                  
                                  const selectedProject = vercelProjects.find(p => p.id === selectedVercelProject);
                                  
                                  if (!selectedProject) {
                                    toast.error('Selected Vercel project not found. Please reconfigure.');
                                    setShowConfigModal(true);
                                    return;
                                  }
                                  
                                  const data = await apiService.syncToVercel({
                                    projectId: id,
                                    environment: env,
                                    folder: folder || 'default',
                                    vercelIntegrationId: selectedVercelIntegration,
                                    vercelProjectId: selectedVercelProject,
                                    vercelProjectName: selectedProject.name,
                                    vercelEnvTarget,
                                  });
                                  
                                  if (data.success) {
                                    if (data.errors && data.errors.length > 0) {
                                      toast.error(`Synced ${data.synced} secret(s) with ${data.errors.length} error(s): ${data.errors.join(', ')}`, {
                                        duration: 5000,
                                      });
                                    } else {
                                      setSyncResult({
                                        synced: data.synced,
                                        projectName: selectedProject?.name || 'Unknown Project',
                                        envTarget: vercelEnvTarget,
                                      });
                                      setShowSyncSuccessModal(true);
                                      setTimeout(() => checkSyncStatus(), 100);
                                    }
                                    await checkVercelConnection();
                                    // Refresh logs to show the sync event
                                    await fetchLogs();
                                  } else {
                                    toast.error(`Sync failed: ${data.message || 'Unknown error'}`);
                                  }
                                } catch (e) {
                                  console.error('Sync failed:', e);
                                  toast.error('Failed to sync to Vercel. Please try again.');
                                } finally {
                                  setIsSyncing(false);
                                }
                              }}
                              disabled={!selectedVercelIntegration || !selectedVercelProject || vercelProjects.length === 0 || isSyncing}
                              className="px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSyncing ? (
                                <span className="flex items-center gap-1.5">
                                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Syncing...
                                </span>
                              ) : (
                                'Trigger Sync'
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={async () => {
                              // Load saved configuration before opening modal
                              if (id && env && folder) {
                                try {
                                  const configData = await apiService.getVercelSyncConfig(id, env, folder || 'default');
                                  if (configData.config) {
                                    setSelectedVercelIntegration(configData.config.vercelIntegrationId || '');
                                    setSelectedVercelProject(configData.config.vercelProjectId);
                                    setVercelEnvTarget(configData.config.vercelEnvTarget);
                                    
                                    // Load projects for the selected integration
                                    if (configData.config.vercelIntegrationId) {
                                      await loadVercelProjects(configData.config.vercelIntegrationId);
                                    }
                                  }
                                } catch (error) {
                                  console.error('Failed to load sync config:', error);
                                }
                              }
                              // Open configuration modal
                              setShowConfigModal(true);
                            }}
                            className="px-3 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                            title="Configure sync"
                          >
                            Configure
                          </button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
                )}

                {/* Render Sync Card - temporarily disabled via RENDER_SYNC_ENABLED flag */}
                {RENDER_SYNC_ENABLED && renderConnected && selectedRenderIntegration && selectedRenderService && (
                  <Card 
                    className={`border-gray-800 hover:border-emerald-500/40 transition-all cursor-pointer ${
                      expandedSyncId === 'render' ? 'border-emerald-500/50' : ''
                    }`}
                    onClick={() => {
                      setExpandedSyncId(expandedSyncId === 'render' ? null : 'render');
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 4v8.36l-8-4V4.18z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white">Render Sync</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {selectedRenderIntegration && selectedRenderService ? (
                                (() => {
                                  const integration = renderIntegrations.find(i => i.id === selectedRenderIntegration);
                                  const service = renderServices.find((s: any) => (s.id || s.service?.id) === selectedRenderService);
                                  const serviceName = service?.name || service?.service?.name || service?.serviceDetails?.name || 'Unknown Service';
                                  return integration && service 
                                    ? `${integration.name} → ${serviceName}`
                                    : 'Not configured';
                                })()
                              ) : (
                                'Not configured'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedRenderIntegration && selectedRenderService ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Configured
                            </span>
                          ) : null}
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedSyncId === 'render' ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Expanded Content */}
                    {expandedSyncId === 'render' && (
                      <CardContent className="pt-0 space-y-4 border-t border-gray-800">
                        {/* Configuration Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Integration</label>
                            <p className="text-sm text-white">
                              {selectedRenderIntegration ? (
                                renderIntegrations.find(i => i.id === selectedRenderIntegration)?.name || 'Not configured'
                              ) : (
                                'Not configured'
                              )}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">Destination</label>
                            <p className="text-sm text-white">
                              {selectedRenderService ? (
                                (() => {
                                  const service = renderServices.find((s: any) => (s.id || s.service?.id) === selectedRenderService);
                                  return service?.name || service?.service?.name || service?.serviceDetails?.name || 'Unknown Service';
                                })()
                              ) : (
                                'Not configured'
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                          {selectedRenderIntegration && selectedRenderService ? (
                            <>
                              <button
                                onClick={async () => {
                                  if (!id || !env || !folder) {
                                    toast.error('Invalid project, environment, or folder');
                                    return;
                                  }
                                  
                                  try {
                                    setIsDeletingSyncConfig(true);
                                    await apiService.deleteRenderSyncConfig(id, env, folder || 'default');
                                    setSelectedRenderIntegration('');
                                    setSelectedRenderService('');
                                    setRenderServices([]);
                                    await checkRenderConnection();
                                    await fetchLogs();
                                    toast.success('Sync configuration deleted successfully');
                                  } catch (error) {
                                    console.error('Failed to delete sync config:', error);
                                    toast.error('Failed to delete sync configuration. Please try again.');
                                  } finally {
                                    setIsDeletingSyncConfig(false);
                                  }
                                }}
                                disabled={isDeletingSyncConfig}
                                className="px-3 py-2 text-xs rounded-md border border-gray-700 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Disconnect sync"
                              >
                                {isDeletingSyncConfig ? 'Disconnecting...' : 'Disconnect'}
                              </button>
                              <button
                                onClick={async () => {
                                  if (id && env && folder) {
                                    try {
                                      const configData = await apiService.getRenderSyncConfig(id, env, folder || 'default');
                                      if (configData.config) {
                                        setSelectedRenderIntegration(configData.config.renderIntegrationId || '');
                                        setSelectedRenderService(configData.config.renderServiceId);
                                        
                                        if (configData.config.renderIntegrationId) {
                                          await loadRenderServices(configData.config.renderIntegrationId);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Failed to load sync config:', error);
                                    }
                                  }
                                  setShowRenderConfigModal(true);
                                }}
                                className="px-3 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                title="Configure sync"
                              >
                                Configure
                              </button>
                              <button
                                onClick={async () => {
                                  if (!id || !env) {
                                    toast.error('Invalid project or environment');
                                    return;
                                  }
                                  
                                  if (!selectedRenderIntegration) {
                                    toast.error('Please configure the sync first by clicking "Configure" to select a Render integration and service.');
                                    setShowRenderConfigModal(true);
                                    return;
                                  }
                                  
                                  if (!selectedRenderService) {
                                    toast.error('Please configure the sync first by clicking "Configure" to select a Render service.');
                                    setShowRenderConfigModal(true);
                                    return;
                                  }
                                  
                                  try {
                                    setIsSyncing(true);
                                    
                                    const selectedService = renderServices.find((s: any) => (s.id || s.service?.id) === selectedRenderService);
                                    const serviceName = selectedService?.name || selectedService?.service?.name || selectedService?.serviceDetails?.name;
                                    
                                    if (!selectedService) {
                                      toast.error('Selected Render service not found. Please reconfigure.');
                                      setShowRenderConfigModal(true);
                                      return;
                                    }
                                    
                                    const data = await apiService.syncToRender({
                                      projectId: id,
                                      environment: env,
                                      folder: folder || 'default',
                                      renderIntegrationId: selectedRenderIntegration,
                                      renderServiceId: selectedRenderService,
                                      renderServiceName: serviceName,
                                    });
                                    
                                    if (data.success) {
                                      if (data.errors && data.errors.length > 0) {
                                        toast.error(`Synced ${data.synced} secret(s) with ${data.errors.length} error(s): ${data.errors.join(', ')}`, {
                                          duration: 5000,
                                        });
                                      } else {
                                        toast.success(`Successfully synced ${data.synced} secret(s) to Render`);
                                      }
                                      await checkRenderConnection();
                                      await fetchLogs();
                                    } else {
                                      toast.error(`Sync failed: ${data.message || 'Unknown error'}`);
                                    }
                                  } catch (e) {
                                    console.error('Sync failed:', e);
                                    toast.error('Failed to sync to Render. Please try again.');
                                  } finally {
                                    setIsSyncing(false);
                                  }
                                }}
                                disabled={!selectedRenderIntegration || !selectedRenderService || renderServices.length === 0 || isSyncing}
                                className="px-3 py-2 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSyncing ? (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Syncing...
                                  </span>
                                ) : (
                                  'Trigger Sync'
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={async () => {
                                if (id && env && folder) {
                                  try {
                                    const configData = await apiService.getRenderSyncConfig(id, env, folder || 'default');
                                    if (configData.config) {
                                      setSelectedRenderIntegration(configData.config.renderIntegrationId || '');
                                      setSelectedRenderService(configData.config.renderServiceId);
                                      
                                      if (configData.config.renderIntegrationId) {
                                        await loadRenderServices(configData.config.renderIntegrationId);
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Failed to load sync config:', error);
                                  }
                                }
                                setShowRenderConfigModal(true);
                              }}
                              className="px-3 py-2 text-xs rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                              title="Configure sync"
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}
              </div>
            ) : (
              /* Empty State */
              <Card className="border-dashed border-gray-700">
                <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Connected Syncs</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                    Connect your secrets to external platforms to automatically sync environment variables.
                </p>
                <button
                    onClick={() => setShowAddSyncModal(true)}
                    className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50 transition-colors"
                >
                  Add Your First Sync
                </button>
          </CardContent>
        </Card>
            )}
          </div>
        </div>
      )}

      {/* Sync Success Modal with Auto Deployment */}
      {showSyncSuccessModal && syncResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-6">
              {/* Success Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Secrets Synced!</h3>
                  <p className="text-sm text-gray-400">
                    {syncResult.synced} secret{syncResult.synced !== 1 ? 's' : ''} synced to Vercel
                  </p>
                </div>
              </div>

              {/* Sync Details */}
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Project:</span>
                  <span className="text-gray-200 font-medium">{syncResult.projectName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Environment:</span>
                  <span className="text-gray-200 font-medium capitalize">{syncResult.envTarget}</span>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400 mb-1">⚠️ Redeploy Required</h4>
                    <p className="text-xs text-gray-300 leading-relaxed mb-2">
                      Environment variables have been updated in Vercel. To apply these changes to your live site, you need to <strong className="text-white">redeploy from your Vercel dashboard</strong>.
                    </p>
                    <p className="text-xs text-gray-400">
                      Go to your Vercel project → Deployments → Click "Redeploy" on the latest deployment
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSyncSuccessModal(false);
                    setSyncResult(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors font-medium"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    window.open(`https://vercel.com/dashboard`, '_blank');
                    setShowSyncSuccessModal(false);
                    setSyncResult(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Vercel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sync Modal - Shows available sync providers */}
      {(showAddSyncModal || isLoadingVercelSync) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up relative">
            {isLoadingVercelSync && (
              <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <span className="text-sm text-gray-300 font-medium">Loading Vercel sync...</span>
                  <span className="text-xs text-gray-500">Please wait</span>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Add Sync</h3>
                  <p className="text-xs text-gray-400 mt-1">Choose a platform to sync your secrets with</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!isLoadingVercelSync) {
                      setShowAddSyncModal(false);
                    }
                  }}
                  disabled={isLoadingVercelSync}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vercel Sync Option */}
                <Card
                  className={`border-gray-800 transition-all relative overflow-hidden group ${
                    isLoadingVercelSync 
                      ? 'cursor-wait opacity-75' 
                      : 'hover:border-emerald-500/50 hover:shadow-emerald-500/10 cursor-pointer'
                  }`}
                  onClick={isLoadingVercelSync ? undefined : handleVercelSyncClick}
                >
                  {isLoadingVercelSync && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="text-sm text-gray-300 font-medium">Loading...</span>
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                          {isLoadingVercelSync ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                          ) : (
                  <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                          )}
                </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1">Vercel</CardTitle>
                          <CardDescription className="text-xs">
                            Sync secrets to Vercel environment variables
                          </CardDescription>
                </div>
                      </div>
                      {!isLoadingVercelSync && (
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {vercelConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Not connected</span>
                    )}
                  </CardContent>
                </Card>

                {/* Render Sync Option */}
                <Card
                  className={`border-gray-800 transition-all relative overflow-hidden group ${
                    isLoadingRenderSync 
                      ? 'cursor-wait opacity-75' 
                      : 'hover:border-emerald-500/50 hover:shadow-emerald-500/10 cursor-pointer'
                  }`}
                  onClick={isLoadingRenderSync ? undefined : async () => {
                    if (!id) {
                      toast.error('Invalid project');
                      return;
                    }
                    
                    try {
                      setIsLoadingRenderSync(true);
                      
                      // Get project to find organizationId
                      const projectRes = await apiService.getProject(id);
                      const orgId = projectRes.project?.organizationId;
                      
                      if (!orgId) {
                        toast.error('Could not determine workspace. Please try again.');
                        setIsLoadingRenderSync(false);
                        return;
                      }
                      
                      // Check if Render is connected
                      const statusRes = await apiService.checkRenderStatus(orgId);
                      setRenderConnected(statusRes.connected);
                      
                      if (statusRes.connected) {
                        // Load integrations and open config modal
                        const integrationsRes = await apiService.getRenderIntegrations(orgId);
                        setRenderIntegrations(integrationsRes.integrations);
                        
                        if (integrationsRes.integrations.length > 0) {
                          setSelectedRenderIntegration(integrationsRes.integrations[0].id);
                          await loadRenderServices(integrationsRes.integrations[0].id);
                        }
                        
                        setShowAddSyncModal(false);
                        setTimeout(() => {
                          setShowRenderConfigModal(true);
                        }, 300);
                      } else {
                        // Open connect modal
                        setShowAddSyncModal(false);
                        setTimeout(() => {
                          setShowRenderConnectModal(true);
                        }, 300);
                      }
                    } catch (error: any) {
                      console.error('Failed to check Render status:', error);
                      toast.error('Failed to check Render connection status');
                    } finally {
                      setIsLoadingRenderSync(false);
                    }
                  }}
                >
                  {isLoadingRenderSync && (
                    <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="text-sm text-gray-300 font-medium">Loading...</span>
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                          {isLoadingRenderSync ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                          ) : (
                            <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 4v8.36l-8-4V4.18z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1">Render</CardTitle>
                          <CardDescription className="text-xs">
                            Sync secrets to Render service environment variables
                          </CardDescription>
                        </div>
                      </div>
                      {!isLoadingRenderSync && (
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderConnected ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Connected
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Not connected</span>
                    )}
                  </CardContent>
                </Card>

                {/* AWS Secrets Manager - Coming Soon */}
                <Card className="border-gray-800 opacity-60 cursor-not-allowed">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-700/50">
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base text-gray-400">AWS Secrets Manager</CardTitle>
                            <span className="px-2 py-0.5 bg-gray-800/50 border border-gray-700/50 text-gray-500 text-xs font-medium rounded-full">Coming Soon</span>
                          </div>
                          <CardDescription className="text-xs text-gray-500">
                            Sync secrets to AWS Secrets Manager
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Google Cloud Secret Manager - Coming Soon */}
                <Card className="border-gray-800 opacity-60 cursor-not-allowed">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-700/50">
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base text-gray-400">Google Cloud</CardTitle>
                            <span className="px-2 py-0.5 bg-gray-800/50 border border-gray-700/50 text-gray-500 text-xs font-medium rounded-full">Coming Soon</span>
                          </div>
                          <CardDescription className="text-xs text-gray-500">
                            Sync secrets to Google Cloud Secret Manager
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Azure Key Vault - Coming Soon */}
                <Card className="border-gray-800 opacity-60 cursor-not-allowed">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-700/50">
                          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base text-gray-400">Azure Key Vault</CardTitle>
                            <span className="px-2 py-0.5 bg-gray-800/50 border border-gray-700/50 text-gray-500 text-xs font-medium rounded-full">Coming Soon</span>
                          </div>
                          <CardDescription className="text-xs text-gray-500">
                            Sync secrets to Azure Key Vault for Microsoft cloud services
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect to Vercel Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Connect to Vercel</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Link your Vercel account to sync secrets</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowConnectModal(false);
                    setVercelToken('');
                    setVercelIntegrationName('');
                  }}
                  disabled={isConnecting}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-semibold text-emerald-400">How to get your token:</h4>
                </div>
                <ol className="space-y-1.5 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">1.</span>
                    <span>
                      Visit{' '}
                      <a 
                        href="https://vercel.com/account/tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        vercel.com/account/tokens
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">2.</span>
                    <span>Click <strong className="text-white">"Create Token"</strong> and give it a name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">3.</span>
                    <span>Select scope: <strong className="text-white">Full Access</strong> or specific projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">4.</span>
                    <span>Copy the token and paste it below</span>
                  </li>
                </ol>
              </div>

              {/* Integration Name Input */}
              <div className="mb-4">
                <label htmlFor="vercel-integration-name" className="text-sm font-medium text-gray-300 mb-2 block">
                  Integration Name <span className="text-gray-500">(optional)</span>
                </label>
                <Input
                  id="vercel-integration-name"
                  type="text"
                  value={vercelIntegrationName}
                  onChange={(e) => setVercelIntegrationName(e.target.value)}
                  placeholder="e.g., Production Vercel, Team Account..."
                  helperText="Optional: Give this integration a name to identify it"
                  className="text-xs"
                />
              </div>

              {/* Token Input */}
              <div className="mb-4">
                <label htmlFor="vercel-token" className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Access Token <span className="text-red-400">*</span>
                </label>
                <Input
                  id="vercel-token"
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="Paste your Vercel token here..."
                  helperText="Your token will be encrypted and stored securely"
                  className="font-mono text-xs"
                  autoFocus
                />
              </div>

              {/* Deployment Note */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-yellow-400">Note:</strong> After syncing secrets, manually redeploy from your Vercel dashboard for changes to take effect.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowConnectModal(false);
                    setVercelToken('');
                    setVercelIntegrationName('');
                  }}
                  className="flex-1 text-xs"
                  disabled={isConnecting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (!vercelToken.trim()) {
                      toast.error('Please enter your Vercel token');
                      return;
                    }
                    
                    if (!id) {
                      toast.error('Invalid project');
                      return;
                    }
                    
                    try {
                      setIsConnecting(true);
                      
                      // Get project to find organizationId
                      const projectRes = await apiService.getProject(id);
                      const orgId = projectRes.project?.organizationId;
                      
                      if (!orgId) {
                        toast.error('Could not determine workspace. Please try again.');
                        setIsConnecting(false);
                        return;
                      }
                      
                      const data = await apiService.connectVercel({
                        accessToken: vercelToken,
                        organizationId: orgId,
                        name: vercelIntegrationName.trim() || undefined,
                      });
                      
                      if (data.success) {
                        setVercelConnected(true);
                        setShowConnectModal(false);
                        setVercelToken('');
                        setVercelIntegrationName('');
                        
                        // Refresh integrations list and reload connection status
                        await checkVercelConnection();
                        
                        // If a new integration was created, use it
                        if (data.integration) {
                          setSelectedVercelIntegration(data.integration.id);
                          await loadVercelProjects(data.integration.id);
                          
                          // Check if sync configuration exists, if not, open config modal
                          if (id && env && folder) {
                            try {
                              const configData = await apiService.getVercelSyncConfig(id, env, folder || 'default');
                              if (!configData.config) {
                                // No configuration exists, prompt user to configure
                                setTimeout(() => {
                                  setShowConfigModal(true);
                                }, 500);
                              }
                            } catch (configError) {
                              console.error('Failed to load sync config:', configError);
                              // Open config modal if we can't load config
                              setTimeout(() => {
                                setShowConfigModal(true);
                              }, 500);
                            }
                          }
                        }
                        
                        toast.success('Vercel connected successfully');
                      } else {
                        toast.error(`Failed to connect: ${data.message || 'Unknown error'}`);
                      }
                    } catch (e) {
                      console.error('Failed to connect Vercel:', e);
                      toast.error('Failed to connect to Vercel. Please check your token and try again.');
                    } finally {
                      setIsConnecting(false);
                    }
                  }}
                  disabled={!vercelToken.trim() || isConnecting}
                  loading={isConnecting}
                  className="flex-1 text-xs"
                >
                  Connect to Vercel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Vercel Sync Modal */}
      {showConfigModal && vercelConnected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Configure Vercel Sync</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {vercelIntegrations.length > 1 
                      ? 'Select integration, project and environment' 
                      : 'Select project and environment'}
                  </p>
                </div>
              </div>

              {/* Vercel Integration Selection - Only show dropdown if multiple integrations exist */}
              {vercelIntegrations.length > 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Vercel Integration <span className="text-red-400">*</span>
                  </label>
                  <Select
                    value={selectedVercelIntegration || vercelIntegrations[0]?.id}
                    onValueChange={async (integrationId) => {
                      setSelectedVercelIntegration(integrationId);
                      setSelectedVercelProject(''); // Reset project selection
                      if (integrationId) {
                        await loadVercelProjects(integrationId);
                      } else {
                        setVercelProjects([]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      {selectedVercelIntegration ? (
                        <div className="flex flex-col items-start text-left w-full">
                          <span className="text-gray-300 font-medium text-xs">
                            {vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.name || 'Selected'}
                          </span>
                          {vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.vercelTeamName && (
                            <span className="text-[11px] text-gray-500">
                              {vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.vercelTeamName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a Vercel integration..." />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {vercelIntegrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          <div className="flex flex-col gap-0.5 w-full">
                            <span className="font-medium truncate">{integration.name}</span>
                            {integration.vercelTeamName && (
                              <span className="text-gray-500 text-[11px] truncate">{integration.vercelTeamName}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Choose which Vercel integration to use for this sync. Each folder can sync to a different integration.
                  </p>
                </div>
              )}
              
              {/* Show current integration if only one exists */}
              {vercelIntegrations.length === 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Vercel Integration
                  </label>
                  <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-gray-300">
                        {vercelIntegrations[0].name}
                      </span>
                      {vercelIntegrations[0].vercelTeamName && (
                        <span className="text-[11px] text-gray-500">
                          {vercelIntegrations[0].vercelTeamName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
                {vercelIntegrations.length === 0 && (
                <div className="mb-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-xs text-yellow-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    No Vercel integrations found. Please connect a Vercel account first.
                  </p>
              </div>
                </div>
              )}

              {/* Vercel Project Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Project <span className="text-red-400">*</span>
                </label>
                <Select
                  value={selectedVercelProject}
                  onValueChange={(projectId) => setSelectedVercelProject(projectId)}
                  disabled={!selectedVercelIntegration}
                >
                  <SelectTrigger className="h-9">
                    {selectedVercelProject ? (
                      <span className="text-gray-300 font-medium text-xs">
                        {vercelProjects.find(p => p.id === selectedVercelProject)?.name || 'Selected'}
                      </span>
                    ) : (
                      <SelectValue 
                        placeholder={
                          selectedVercelIntegration 
                            ? 'Select a Vercel project...' 
                            : 'Select an integration first...'
                        } 
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {!selectedVercelIntegration ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        Please select an integration first
                      </div>
                    ) : vercelProjects.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No projects found
                      </div>
                    ) : (
                      vercelProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <span className="font-medium">{project.name}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedVercelIntegration && vercelProjects.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No Vercel projects found. Make sure you have projects in your Vercel account.
                  </p>
                )}
              </div>

              {/* Vercel Environment Target Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Environment <span className="text-red-400">*</span>
                </label>
                <Select
                  value={vercelEnvTarget}
                  onValueChange={(value) => setVercelEnvTarget(value as 'production' | 'preview' | 'development')}
                >
                  <SelectTrigger className="h-9">
                    {vercelEnvTarget ? (
                      <span className="text-gray-300 font-medium text-xs capitalize">
                        {vercelEnvTarget}
                      </span>
                    ) : (
                      <SelectValue placeholder="Select environment..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">
                      <span className="font-medium">Production</span>
                    </SelectItem>
                    <SelectItem value="preview">
                      <span className="font-medium">Preview</span>
                    </SelectItem>
                    <SelectItem value="development">
                      <span className="font-medium">Development</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Secrets will be synced to this environment in the selected Vercel project.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-emerald-400">Sync Mapping:</strong> {folder || 'default'} ({environmentLabel}) →{' '}
                    <strong className="text-white">
                      {selectedVercelIntegration ? vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.name || 'integration' : 'integration'}
                    </strong>
                    {' → '}
                    <strong className="text-white">{selectedVercelProject ? vercelProjects.find(p => p.id === selectedVercelProject)?.name || 'project' : 'project'}</strong>{' '}
                    (<strong className="text-white">{vercelEnvTarget}</strong>)
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowConfigModal(false);
                  }}
                  className="flex-1 text-xs"
                  disabled={isSavingConfig}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (!selectedVercelIntegration) {
                      toast.error('Please select a Vercel integration');
                      return;
                    }
                    
                    if (!selectedVercelProject) {
                      toast.error('Please select a Vercel project');
                      return;
                    }
                    
                    if (!id || !env) {
                      toast.error('Invalid project or environment');
                      return;
                    }
                    
                    try {
                      setIsSavingConfig(true);
                      
                      const selectedProject = vercelProjects.find(p => p.id === selectedVercelProject);
                      
                      const data = await apiService.saveVercelSyncConfig({
                        projectId: id,
                        environment: env,
                        folder: folder || 'default',
                        vercelIntegrationId: selectedVercelIntegration,
                        vercelProjectId: selectedVercelProject,
                        vercelProjectName: selectedProject?.name,
                        vercelEnvTarget,
                      });
                      
                      if (data.success) {
                        setShowConfigModal(false);
                        // Refresh sync status
                        await checkSyncStatus();
                        // Show success message
                        toast.success('Sync configuration saved successfully');
                      } else {
                        toast.error('Failed to save configuration');
                      }
                    } catch (e) {
                      console.error('Failed to save sync config:', e);
                      toast.error('Failed to save configuration. Please try again.');
                    } finally {
                      setIsSavingConfig(false);
                    }
                  }}
                  disabled={!selectedVercelIntegration || !selectedVercelProject || isSavingConfig}
                  loading={isSavingConfig}
                  className="flex-1 text-xs"
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && id && env && folder && (
        <EnvImportModal
          projectId={id}
          environment={env}
          folder={folder || 'default'}
          onClose={() => setShowImportModal(false)}
          onSuccess={async () => {
            await fetchSecrets();
            setShowImportModal(false);
          }}
        />
      )}

      {showCreateSecret && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl animate-slide-up">
            <SecretForm
              onSubmit={handleCreateSecret}
              onCancel={() => setShowCreateSecret(false)}
              isLoading={false}
              title="Create New Secret"
              initialData={{ environment: env, folder: folder || 'default' }}
            />
          </div>
        </div>
      )}

      {showSecretModal && selectedSecret && (
        <SecretModal
          secret={selectedSecret}
          onClose={() => { setShowSecretModal(false); setSelectedSecret(null); }}
          onEdit={handleEditSecret}
          onDelete={(s) => { setSecretToDelete(s); setShowDeleteSecretModal(true); }}
          canEdit={true}
          canDelete={true}
        />
      )}

      {showDeleteSecretModal && secretToDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteSecretModal}
          onClose={() => { if (!isDeletingSecret) { setShowDeleteSecretModal(false); setSecretToDelete(null); } }}
          onConfirm={handleConfirmDelete}
          title="Delete Secret"
          itemName={secretToDelete.name}
          itemType="secret"
          description="This will permanently delete the secret. This action cannot be undone."
          isLoading={isDeletingSecret}
        />
      )}

      {/* Connect to Render Modal */}
      {showRenderConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l8 4v8.36l-8-4V4.18z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white">Connect to Render</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Link your Render account to sync secrets</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRenderConnectModal(false);
                    setRenderApiKey('');
                    setRenderIntegrationName('');
                  }}
                  disabled={isConnectingRender}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-semibold text-emerald-400">How to get your Render API key:</h4>
                </div>
                <ol className="space-y-1.5 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">1.</span>
                    <span>
                      Go to{' '}
                      <a 
                        href="https://dashboard.render.com/account/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Render Dashboard → Account Settings → API Keys
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      {' '}(or click the button below)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">2.</span>
                    <span>Click the <strong className="text-white">"Create API Key"</strong> button on the page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">3.</span>
                    <span>Enter a descriptive name (e.g., "Key Vault Integration") and click <strong className="text-white">"Create"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">4.</span>
                    <span><strong className="text-white">⚠️ Copy the API key immediately</strong> - Render only shows it once. You won't be able to view it again.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold flex-shrink-0">5.</span>
                    <span>Paste the copied API key in the field below</span>
                  </li>
                </ol>
                <div className="mt-3 pt-3 border-t border-emerald-500/20">
                  <a 
                    href="https://dashboard.render.com/account/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors w-full justify-center py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Open Render API Keys Page
                  </a>
                </div>
              </div>

              {/* Integration Name Input */}
              <div className="mb-4">
                <label htmlFor="render-integration-name" className="text-sm font-medium text-gray-300 mb-2 block">
                  Integration Name <span className="text-gray-500">(optional)</span>
                </label>
                <Input
                  id="render-integration-name"
                  type="text"
                  value={renderIntegrationName}
                  onChange={(e) => setRenderIntegrationName(e.target.value)}
                  placeholder="e.g., Production Render, Team Account..."
                  helperText="Optional: Give this integration a name to identify it"
                  className="text-xs"
                />
              </div>

              {/* API Key Input */}
              <div className="mb-4">
                <label htmlFor="render-api-key" className="text-sm font-medium text-gray-300 mb-2 block">
                  Render API Key <span className="text-red-400">*</span>
                </label>
                <Input
                  id="render-api-key"
                  type="password"
                  value={renderApiKey}
                  onChange={(e) => setRenderApiKey(e.target.value)}
                  placeholder="Paste your Render API key here..."
                  helperText="Your API key will be encrypted and stored securely"
                  className="font-mono text-xs"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRenderConnectModal(false);
                    setRenderApiKey('');
                    setRenderIntegrationName('');
                  }}
                  className="flex-1 text-xs"
                  disabled={isConnectingRender}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (!renderApiKey.trim()) {
                      toast.error('Please enter your Render API key');
                      return;
                    }
                    
                    if (!id) {
                      toast.error('Invalid project');
                      return;
                    }
                    
                    try {
                      setIsConnectingRender(true);
                      
                      const projectRes = await apiService.getProject(id);
                      const orgId = projectRes.project?.organizationId;
                      
                      if (!orgId) {
                        toast.error('Could not determine workspace. Please try again.');
                        setIsConnectingRender(false);
                        return;
                      }
                      
                      const data = await apiService.connectRender({
                        apiKey: renderApiKey,
                        organizationId: orgId,
                        name: renderIntegrationName.trim() || undefined,
                      });
                      
                      if (data.success) {
                        setRenderConnected(true);
                        setShowRenderConnectModal(false);
                        setRenderApiKey('');
                        setRenderIntegrationName('');
                        
                        await checkRenderConnection();
                        
                        if (data.integration) {
                          setSelectedRenderIntegration(data.integration.id);
                          await loadRenderServices(data.integration.id);
                          
                          if (id && env && folder) {
                            try {
                              const configData = await apiService.getRenderSyncConfig(id, env, folder || 'default');
                              if (!configData.config) {
                                setTimeout(() => {
                                  setShowRenderConfigModal(true);
                                }, 500);
                              }
                            } catch (configError) {
                              console.error('Failed to load sync config:', configError);
                              setTimeout(() => {
                                setShowRenderConfigModal(true);
                              }, 500);
                            }
                          }
                        }
                        
                        toast.success('Render connected successfully');
                      } else {
                        toast.error(`Failed to connect: ${data.message || 'Unknown error'}`);
                      }
                    } catch (e) {
                      console.error('Failed to connect Render:', e);
                      toast.error('Failed to connect to Render. Please check your API key and try again.');
                    } finally {
                      setIsConnectingRender(false);
                    }
                  }}
                  disabled={!renderApiKey.trim() || isConnectingRender}
                  loading={isConnectingRender}
                  className="flex-1 text-xs"
                >
                  Connect to Render
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Render Sync Modal */}
      {showRenderConfigModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">Configure Render Sync</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRenderConfigModal(false)}
                  disabled={isSavingRenderConfig}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-4">
                {/* Render Integration Select */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Render Integration <span className="text-red-400">*</span>
                  </label>
                  <Select
                    value={selectedRenderIntegration}
                    onValueChange={async (value) => {
                      setSelectedRenderIntegration(value);
                      await loadRenderServices(value);
                      setSelectedRenderService('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration" />
                    </SelectTrigger>
                    <SelectContent>
                      {renderIntegrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          {integration.name || `Render ${new Date(integration.createdAt).toLocaleDateString()}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Render Service Select */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Render Service <span className="text-red-400">*</span>
                  </label>
                  <Select
                    value={selectedRenderService}
                    onValueChange={setSelectedRenderService}
                    disabled={!selectedRenderIntegration || renderServices.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedRenderIntegration ? "Select integration first" : renderServices.length === 0 ? "Loading services..." : "Select service"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isSavingRenderConfig ? (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">Loading...</div>
                      ) : (
                        renderServices.map((service: any) => (
                          <SelectItem key={service.id || service.service?.id} value={service.id || service.service?.id}>
                            <span className="font-medium">{service.name || service.service?.name || service.serviceDetails?.name || 'Unknown Service'}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Info Box */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    Secrets will be synced to this Render service as environment variables.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRenderConfigModal(false)}
                  disabled={isSavingRenderConfig}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (!selectedRenderIntegration) {
                      toast.error('Please select a Render integration');
                      return;
                    }
                    
                    if (!selectedRenderService) {
                      toast.error('Please select a Render service');
                      return;
                    }
                    
                    if (!id || !env) {
                      toast.error('Invalid project or environment');
                      return;
                    }
                    
                    try {
                      setIsSavingRenderConfig(true);
                      
                      const selectedService = renderServices.find((s: any) => (s.id || s.service?.id) === selectedRenderService);
                      const serviceName = selectedService?.name || selectedService?.service?.name || selectedService?.serviceDetails?.name;
                      
                      const data = await apiService.saveRenderSyncConfig({
                        projectId: id,
                        environment: env,
                        folder: folder || 'default',
                        renderIntegrationId: selectedRenderIntegration,
                        renderServiceId: selectedRenderService,
                        renderServiceName: serviceName,
                      });
                      
                      if (data.success) {
                        setShowRenderConfigModal(false);
                        await checkRenderConnection();
                        toast.success('Sync configuration saved successfully');
                      } else {
                        toast.error('Failed to save configuration');
                      }
                    } catch (e) {
                      console.error('Failed to save sync config:', e);
                      toast.error('Failed to save configuration. Please try again.');
                    } finally {
                      setIsSavingRenderConfig(false);
                    }
                  }}
                  disabled={!selectedRenderIntegration || !selectedRenderService || isSavingRenderConfig}
                  loading={isSavingRenderConfig}
                  className="flex-1 text-xs"
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

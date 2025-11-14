import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { SecretRow } from '../components/SecretRow';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { apiService } from '../services/api';
import type { Project, Secret } from '../types';

type Tab = 'secrets' | 'access' | 'logs' | 'integrations';

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

function getEventIcon(_eventType: string, action: string) {
  if (action === 'create') {
    return <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
  }
  if (action === 'update') {
    return <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  }
  if (action === 'delete') {
    return <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
  }
  if (action === 'view') {
    return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
  }
  return <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

function getEventColor(action: string) {
  if (action === 'create') return { bg: 'bg-emerald-500/20', badge: 'bg-emerald-500/20 text-emerald-400' };
  if (action === 'update') return { bg: 'bg-blue-500/20', badge: 'bg-blue-500/20 text-blue-400' };
  if (action === 'delete') return { bg: 'bg-red-500/20', badge: 'bg-red-500/20 text-red-400' };
  if (action === 'view') return { bg: 'bg-gray-700/30', badge: 'bg-gray-700/30 text-gray-400' };
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
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showDeleteSecretModal, setShowDeleteSecretModal] = useState(false);
  const [secretToDelete, setSecretToDelete] = useState<Secret | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokens, setTokens] = useState<Array<{ id: string; name: string; createdAt: string; expiresAt?: string | null; lastUsedAt?: string | null; projectId?: string | null; projectName?: string | null; scopes?: string[] }>>([]);
  const [tokenToRevoke, setTokenToRevoke] = useState<{ id: string; name: string } | null>(null);
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);

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
  const [vercelToken, setVercelToken] = useState('');
  const [vercelIntegrationName, setVercelIntegrationName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isDeletingIntegration, setIsDeletingIntegration] = useState<string | null>(null);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; projectName: string; envTarget: string } | null>(null);
  const [isTriggeringDeploy, setIsTriggeringDeploy] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'access') {
      fetchTokens();
    } else if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'integrations') {
      checkVercelConnection();
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
    await apiService.createSecret(id, payload);
    await fetchSecrets();
    setShowCreateSecret(false);
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
    } catch (e) {
      console.error('Failed to create secret:', e);
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
    if (!secretToDelete) return;
    await apiService.deleteSecret(secretToDelete.id);
    await fetchSecrets();
    setShowDeleteSecretModal(false);
    setSecretToDelete(null);
    
    // Check sync status after deleting secret (small delay to ensure DB commit)
    if (vercelConnected) {
      setTimeout(() => checkSyncStatus(), 100);
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
              Connected Syncs
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
              <button
                onClick={handleQuickCreateSecret}
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow transition-colors"
                title="Add Secret"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
                </svg>
              </button>
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
                <div className="px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Tip: Click the name or value to edit inline.</span>
                </div>
                <div className="w-full">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Name</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[45%]">Secret</TableHead>
                      <TableHead className="w-[15%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {secrets.map((secret) => (
                  <SecretRow
                    key={secret.id}
                    secret={secret}
                        forceEditNameId={forceEditNameId}
                        isTable
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
                    setShowRevokeConfirmation(false);
                    setTokenToRevoke(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await apiService.revokeToken(tokenToRevoke.id);
                      await fetchTokens();
                      setShowRevokeConfirmation(false);
                      setTokenToRevoke(null);
                    } catch (e) {
                      console.error('Failed to revoke token:', e);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Revoke Token
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
                  Connected Syncs
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

      {/* Connected Syncs Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Syncs Configuration Card */}
          <Card className="hover-lift">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-white text-sm font-semibold">Sync Configuration</CardTitle>
            </CardHeader>
          <CardContent className="space-y-6">
            {/* Manual Redeploy Warning (MVP Notice) */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-1">⚠️ Manual Redeployment Required (For Now)</h4>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    After syncing secrets to Vercel, you currently need to <strong className="text-white">manually redeploy from your Vercel dashboard</strong> for changes to take effect.
                  </p>
                  <p className="text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1.5 inline-block">
                    🚀 <strong className="text-emerald-400">Coming Soon:</strong> Automatic redeployment after sync - no manual work needed!
                  </p>
                </div>
              </div>
            </div>

            {/* Unsynced Changes Warning */}
            {vercelConnected && hasUnsyncedChanges && (
              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg animate-pulse">
                <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-400 mb-1">Unsynced Changes</h4>
                  <p className="text-xs text-gray-300">
                    You have made changes to your secrets. Trigger a sync below to push the latest changes.
                  </p>
                </div>
              </div>
            )}

            {/* Syncs Table */}
            {vercelConnected ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Integration</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Vercel Sync Row */}
                  <TableRow className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 22h20L12 2z" />
                        </svg>
                        <span className="text-sm font-medium text-white">Vercel</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300">
                        {selectedVercelIntegration && selectedVercelProject ? (
                          (() => {
                            const integration = vercelIntegrations.find(i => i.id === selectedVercelIntegration);
                            const project = vercelProjects.find(p => p.id === selectedVercelProject);
                            return integration && project ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-white">{integration.name}</span>
                                <span className="text-xs text-gray-400">{project.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Configuration incomplete</span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">Not configured</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {selectedVercelIntegration && selectedVercelProject ? (
                          (() => {
                            const integration = vercelIntegrations.find(i => i.id === selectedVercelIntegration);
                            const project = vercelProjects.find(p => p.id === selectedVercelProject);
                            return integration && project ? (
                              <div className="flex items-center gap-2 text-gray-300">
                                <span className="font-medium text-white">{integration.name}</span>
                                <span className="text-gray-500">→</span>
                                <span className="font-medium text-white">{project.name}</span>
                                <span className="text-gray-500">/</span>
                                <span className="capitalize text-gray-300">{vercelEnvTarget}</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-gray-400">Encrypted</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Configuration incomplete</span>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">Not configured</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasUnsyncedChanges ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Out of sync
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Synced
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
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
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Connected Syncs</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  Connect your secrets to external platforms like Vercel to automatically sync environment variables.
                </p>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Add Your First Sync
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vercel Integrations Management Card */}
        {vercelConnected && (
          <Card className="hover-lift">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-white text-sm font-semibold">Vercel Integrations</CardTitle>
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Integration
              </button>
            </CardHeader>
            <CardContent>
              {vercelIntegrations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 mb-4">No Vercel integrations found</p>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm"
                  >
                    Add Your First Integration
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {vercelIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-white">{integration.name}</h4>
                          {integration.vercelTeamName && (
                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">
                              {integration.vercelTeamName}
                            </span>
                          )}
                          {selectedVercelIntegration === integration.id && (
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          Connected {new Date(integration.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            try {
                              setIsDeletingIntegration(integration.id);
                              await apiService.deleteVercelIntegration(integration.id);
                              // Refresh integrations and connection status
                              await checkVercelConnection();
                              // If deleted integration was selected, clear selection
                              if (selectedVercelIntegration === integration.id) {
                                setSelectedVercelIntegration('');
                                setSelectedVercelProject('');
                                setVercelProjects([]);
                              }
                              toast.success('Vercel integration deleted successfully');
                            } catch (error) {
                              console.error('Failed to delete integration:', error);
                              toast.error('Failed to delete integration. Please try again.');
                            } finally {
                              setIsDeletingIntegration(null);
                            }
                          }}
                          disabled={isDeletingIntegration === integration.id}
                          className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeletingIntegration === integration.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">⚠️ Redeploy Required</h4>
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

      {/* Connect to Vercel Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Connect to Vercel</h3>
                  <p className="text-sm text-gray-400">Link your Vercel account to sync secrets</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">How to get your Vercel token:</h4>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">1.</span>
                    <span>
                      Go to{' '}
                      <a 
                        href="https://vercel.com/account/tokens" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-medium"
                      >
                        vercel.com/account/tokens
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">2.</span>
                    <span>Click <strong>"Create Token"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">3.</span>
                    <span>
                      Give it a name (e.g., "Key Vault Sync") and select scope:{' '}
                      <strong className="text-white">Full Access</strong> or specific projects
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">4.</span>
                    <span>Copy the token and paste it below</span>
                  </li>
                </ol>
              </div>

              {/* Integration Name Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Integration Name <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={vercelIntegrationName}
                  onChange={(e) => setVercelIntegrationName(e.target.value)}
                  placeholder="e.g., Production Vercel, Team Account..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Give this integration a name to identify it (useful when you have multiple Vercel accounts)
                </p>
              </div>

              {/* Token Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Access Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="Paste your Vercel token here..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  🔒 Your token will be encrypted and stored securely
                </p>
              </div>

              {/* Deployment Note */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-300">
                    <strong className="text-yellow-400">Note:</strong> After syncing secrets, you'll need to manually redeploy from your Vercel dashboard for changes to take effect.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setVercelToken('');
                    setVercelIntegrationName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
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
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect to Vercel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Vercel Sync Modal */}
      {showConfigModal && vercelConnected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl animate-slide-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Configure Vercel Sync</h3>
                  <p className="text-sm text-gray-400">Select which Vercel integration, project and environment to sync to</p>
                </div>
              </div>

              {/* Vercel Integration Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Integration <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedVercelIntegration}
                  onChange={async (e) => {
                    const integrationId = e.target.value;
                    setSelectedVercelIntegration(integrationId);
                    setSelectedVercelProject(''); // Reset project selection
                    if (integrationId) {
                      await loadVercelProjects(integrationId);
                    } else {
                      setVercelProjects([]);
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Select a Vercel integration...</option>
                  {vercelIntegrations.map((integration) => (
                    <option key={integration.id} value={integration.id}>
                      {integration.name} {integration.vercelTeamName ? `(${integration.vercelTeamName})` : ''}
                    </option>
                  ))}
                </select>
                {vercelIntegrations.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    No Vercel integrations found. Please connect a Vercel account first.
                  </p>
                )}
              </div>

              {/* Vercel Project Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedVercelProject}
                  onChange={(e) => setSelectedVercelProject(e.target.value)}
                  disabled={!selectedVercelIntegration}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedVercelIntegration ? 'Select a Vercel project...' : 'Select an integration first...'}
                  </option>
                  {vercelProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {selectedVercelIntegration && vercelProjects.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    No Vercel projects found. Make sure you have projects in your Vercel account.
                  </p>
                )}
              </div>

              {/* Vercel Environment Target Selection */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Vercel Environment <span className="text-red-400">*</span>
                </label>
                <select
                  value={vercelEnvTarget}
                  onChange={(e) => setVercelEnvTarget(e.target.value as 'production' | 'preview' | 'development')}
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="production">Production</option>
                  <option value="preview">Preview</option>
                  <option value="development">Development</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Secrets will be synced to this environment in the selected Vercel project.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-gray-300">
                    <strong className="text-blue-400">Sync Mapping:</strong> This folder ({folder || 'default'}) in {environmentLabel} environment will sync to{' '}
                    <strong className="text-white">
                      {selectedVercelIntegration ? vercelIntegrations.find(i => i.id === selectedVercelIntegration)?.name || 'selected integration' : 'selected integration'}
                    </strong>
                    {' → '}
                    <strong className="text-white">{selectedVercelProject ? vercelProjects.find(p => p.id === selectedVercelProject)?.name || 'selected project' : 'selected project'}</strong>{' '}
                    in <strong className="text-white">{vercelEnvTarget}</strong> environment.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
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
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
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
          onClose={() => { setShowDeleteSecretModal(false); setSecretToDelete(null); }}
          onConfirm={handleConfirmDelete}
          title="Delete Secret"
          itemName={secretToDelete.name}
          itemType="secret"
          description="This will permanently delete the secret. This action cannot be undone."
          isLoading={false}
        />
      )}

    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { SecretRow } from '../components/SecretRow';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { apiService } from '../services/api';
import type { Secret } from '../types';

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
  const [vercelProjects, setVercelProjects] = useState<any[]>([]);
  const [selectedVercelProject, setSelectedVercelProject] = useState<string>('');
  const [vercelEnvTarget, setVercelEnvTarget] = useState<'production' | 'preview' | 'development'>('development');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [vercelToken, setVercelToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
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
      filtered = filtered.filter(log => log.resourceType === logTypeFilter);
    }
    
    return filtered;
  }, [logs, logDateFilter, logTypeFilter]);

  const headerTitle = useMemo(() => {
    const f = (folder || 'default').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    const e = (env || '').charAt(0).toUpperCase() + (env || '').slice(1).toLowerCase();
    return `${f} • ${e}`;
  }, [env, folder]);

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
    if (!id || !env) {
      console.log('[Sync] Skipping check - missing id or env');
      return;
    }
    
    if (!vercelConnected) {
      console.log('[Sync] Skipping check - Vercel not connected');
      return;
    }
    
    console.log('[Sync] Checking sync status for:', { id, env, folder: folder || 'default' });
    
    try {
      const res = await fetch(`/api/vercel/sync-status/${id}/${env}/${folder || 'default'}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      console.log('[Sync] API response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Sync] Backend sync status:', data.hasUnsyncedChanges);
        setHasUnsyncedChanges(data.hasUnsyncedChanges);
      } else {
        const errorText = await res.text();
        console.error('[Sync] API error:', res.status, errorText);
      }
    } catch (error) {
      console.error('[Sync] Failed to check sync status:', error);
    }
  }

  // Check sync status when folder changes or Vercel connection status changes
  useEffect(() => {
    if (vercelConnected && id && env) {
      console.log('[Sync] useEffect triggered - checking sync status');
      checkSyncStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, env, folder, vercelConnected]);

  async function checkVercelConnection() {
    if (!id) return;
    
    try {
      // Get project to find organizationId
      const projectRes = await apiService.getProject(id);
      const orgId = projectRes.project?.organizationId;
      
      if (!orgId) {
        console.error('Could not determine organization ID');
        return;
      }
      
      const res = await fetch(`/api/vercel/status/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      console.log('[Sync] Vercel connection status:', data.connected);
      setVercelConnected(data.connected || false);
      
      // If connected, fetch projects
      if (data.connected) {
        const projectsRes = await fetch(`/api/vercel/projects/${orgId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const projectsData = await projectsRes.json();
        setVercelProjects(projectsData.projects || []);
      }
    } catch (e) {
      console.error('Failed to check Vercel connection:', e);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-white">{headerTitle}</h1>
        </div>
        {/* Removed top-level Add Secret button */}
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
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors relative group ${
              activeTab === 'integrations'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              Integrations
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
                <Button variant="gradient" size="sm" onClick={() => setShowCreateSecret(true)}>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Secret</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              console.log('[Sync] Secret updated. Vercel connected:', vercelConnected);
                              if (vercelConnected) {
                                console.log('[Sync] Checking sync status');
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
            <div className="flex gap-2 border-b border-gray-700/50">
              <button
                onClick={() => setLogTypeFilter('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  logTypeFilter === 'all'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setLogTypeFilter('secret')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  logTypeFilter === 'secret'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Secrets
              </button>
              <button
                onClick={() => setLogTypeFilter('token')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  logTypeFilter === 'token'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Access Tokens
              </button>
            </div>
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

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold">Vercel Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!vercelConnected ? (
              /* Not Connected State */
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Connect to Vercel</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  Sync your secrets directly to Vercel environment variables. No more manual copying!
                </p>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Connect Vercel
                </button>
              </div>
            ) : (
              /* Connected State */
              <div className="space-y-6">
                {/* Unsynced Changes Warning */}
                {hasUnsyncedChanges && (
                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg animate-pulse">
                    <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-orange-400 mb-1">Unsynced Changes</h4>
                      <p className="text-xs text-gray-300">
                        You have made changes to your secrets. Click "Sync to Vercel" below to push the latest changes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Vercel Connected</h4>
                      <p className="text-xs text-gray-400">Ready to sync secrets</p>
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Sync Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Vercel Project</label>
                    <Select value={selectedVercelProject} onValueChange={setSelectedVercelProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Vercel project..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vercelProjects.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No projects found</div>
                        ) : (
                          vercelProjects.map((proj) => (
                            <SelectItem key={proj.id} value={proj.id}>
                              {proj.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Target Environment</label>
                    <Select value={vercelEnvTarget} onValueChange={(val) => setVercelEnvTarget(val as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    onClick={async () => {
                      if (!id || !selectedVercelProject) {
                        alert('Please select a Vercel project first');
                        return;
                      }
                      
                      try {
                        setIsSyncing(true);
                        
                        // Get the selected project name for logging
                        const selectedProject = vercelProjects.find(p => p.id === selectedVercelProject);
                        
                        console.log('Starting sync to Vercel...');
                        console.log('Project:', id);
                        console.log('Vercel Project:', selectedProject?.name);
                        console.log('Environment:', env, '→ Vercel:', vercelEnvTarget);
                        console.log('Folder:', folder || 'default');
                        
                        // Call sync API
                        const res = await fetch(`/api/vercel/sync`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                          },
                          body: JSON.stringify({
                            projectId: id,
                            environment: env,
                            folder: folder || 'default',
                            vercelProjectId: selectedVercelProject,
                            vercelProjectName: selectedProject?.name,
                            vercelEnvTarget,
                          }),
                        });
                        
                        console.log('Sync response status:', res.status);
                        
                        if (!res.ok) {
                          const errorData = await res.json();
                          console.error('Sync error:', errorData);
                          alert(`Sync failed: ${errorData.error || 'Unknown error'}`);
                          return;
                        }
                        
                        const data = await res.json();
                        console.log('Sync result:', data);
                        
                        if (data.success) {
                          if (data.errors && data.errors.length > 0) {
                            alert(`Synced ${data.synced} secret(s) with ${data.errors.length} error(s):\n${data.errors.join('\n')}`);
                          } else {
                            // Show success modal with redeploy prompt
                            setSyncResult({
                              synced: data.synced,
                              projectName: selectedProject?.name || 'Unknown Project',
                              envTarget: vercelEnvTarget,
                            });
                            setShowSyncSuccessModal(true);
                            
                            // Check sync status after successful sync (small delay to ensure DB commit)
                            setTimeout(() => checkSyncStatus(), 100);
                          }
                          
                          // Refresh sync status
                          await checkVercelConnection();
                        } else {
                          alert(`Sync failed: ${data.error || 'Unknown error'}`);
                        }
                      } catch (e) {
                        console.error('Sync failed:', e);
                        alert('Failed to sync to Vercel. Please try again.');
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={!selectedVercelProject || isSyncing}
                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSyncing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Syncing to Vercel...
                      </span>
                    ) : (
                      'Sync to Vercel'
                    )}
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-blue-400 mb-1">How it works:</p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        <li>• All secrets from <strong className="text-gray-300">{env}/{folder || 'default'}</strong> will be synced</li>
                        <li>• Secrets are created as encrypted environment variables in Vercel</li>
                        <li>• Existing variables with the same name will be updated</li>
                        <li>• You can re-sync anytime to update changed secrets</li>
                      </ul>
                    </div>
                  </div>
                </div>
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Success Modal with Redeploy Prompt */}
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
                  <h3 className="text-lg font-semibold text-white">Sync Successful!</h3>
                  <p className="text-sm text-gray-400">
                    {syncResult.synced} secret{syncResult.synced !== 1 ? 's' : ''} synced to Vercel
                  </p>
                </div>
              </div>

              {/* Sync Details */}
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Vercel Project:</span>
                  <span className="text-gray-200 font-medium">{syncResult.projectName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Environment:</span>
                  <span className="text-gray-200 font-medium capitalize">{syncResult.envTarget}</span>
                </div>
              </div>

              {/* Warning about redeployment */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-400 mb-1">Redeployment Required</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      To use the updated secrets, you need to redeploy your Vercel project. 
                      Existing deployments will continue using the old values.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSyncSuccessModal(false);
                    setSyncResult(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  I'll Deploy Later
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsTriggeringDeploy(true);
                      
                      // Open Vercel project deployments page in new tab
                      const vercelProjectUrl = `https://vercel.com/dashboard/deployments`;
                      window.open(vercelProjectUrl, '_blank');
                      
                      // Close modal after opening Vercel
                      setTimeout(() => {
                        setShowSyncSuccessModal(false);
                        setSyncResult(null);
                      }, 500);
                    } catch (e) {
                      console.error('Failed to open Vercel:', e);
                    } finally {
                      setIsTriggeringDeploy(false);
                    }
                  }}
                  disabled={isTriggeringDeploy}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Go to Vercel Deployments
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-500 text-center mt-3">
                Tip: You can also trigger deployments via Git push or Vercel CLI
              </p>
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

              {/* Token Input */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Vercel Access Token</label>
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

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setVercelToken('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!vercelToken.trim()) {
                      alert('Please enter your Vercel token');
                      return;
                    }
                    
                    if (!id) {
                      alert('Invalid project');
                      return;
                    }
                    
                    try {
                      setIsConnecting(true);
                      
                      // Get project to find organizationId
                      const projectRes = await apiService.getProject(id);
                      const orgId = projectRes.project?.organizationId;
                      
                      if (!orgId) {
                        alert('Could not determine workspace. Please try again.');
                        setIsConnecting(false);
                        return;
                      }
                      
                      console.log('Connecting to Vercel with org:', orgId);
                      
                      const res = await fetch('/api/vercel/connect', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        },
                        body: JSON.stringify({
                          accessToken: vercelToken,
                          organizationId: orgId,
                        }),
                      });

                      console.log('Response status:', res.status);
                      console.log('Response ok:', res.ok);
                      
                      if (!res.ok) {
                        const text = await res.text();
                        console.error('Error response:', text);
                        try {
                          const errorData = JSON.parse(text);
                          alert(`Failed to connect: ${errorData.error || 'Unknown error'}`);
                        } catch {
                          alert(`Failed to connect: Server returned ${res.status}`);
                        }
                        return;
                      }

                      const data = await res.json();
                      console.log('Connection response:', data);
                      
                      if (data.success) {
                        setVercelConnected(true);
                        setShowConnectModal(false);
                        setVercelToken('');
                        
                        // Fetch Vercel projects using the orgId we just got
                        const projectsRes = await fetch(`/api/vercel/projects/${orgId}`, {
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                          },
                        });
                        const projectsData = await projectsRes.json();
                        console.log('Fetched Vercel projects:', projectsData);
                        setVercelProjects(projectsData.projects || []);
                      } else {
                        alert(`Failed to connect: ${data.error || 'Unknown error'}`);
                      }
                    } catch (e) {
                      console.error('Failed to connect Vercel:', e);
                      alert('Failed to connect to Vercel. Please check your token and try again.');
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

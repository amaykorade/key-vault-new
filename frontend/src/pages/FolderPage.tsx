import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { SecretRow } from '../components/SecretRow';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { apiService } from '../services/api';
import type { Secret } from '../types';

type Tab = 'secrets' | 'access' | 'logs';

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
    }
  }, [activeTab]);

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

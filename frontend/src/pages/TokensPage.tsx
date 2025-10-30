import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Combobox } from '@headlessui/react';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ConfirmRegenerateModal } from '../components/ConfirmRegenerateModal';

export const TokensPage: React.FC = () => {
  const [projectId, setProjectId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Array<{ id: string; name: string; createdAt: string; expiresAt?: string | null; lastUsedAt?: string | null; projectId?: string | null; projectName?: string | null }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [query, setQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<{ id: string; projectName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [tokenToRegenerate, setTokenToRegenerate] = useState<{ id: string; projectName: string } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratedToken, setRegeneratedToken] = useState<string | null>(null);

  const takenProjectIds = new Set((tokens.map(t => t.projectId).filter((v): v is string => !!v)));
  const isTaken = (id: string) => takenProjectIds.has(id);

  const filteredProjects = query === ''
    ? projects
    : projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const loadTokens = async () => {
    const res = await apiService.listTokens();
    setTokens(res.tokens);
  };

  useEffect(() => {
    (async () => {
      const { projects } = await apiService.getMyProjects();
      setProjects(projects);
      await loadTokens();
    })();
  }, []);

  const handleCreate = async () => {
    if (!projectId) return;
    if (isTaken(projectId)) return;
    setCreating(true);
    try {
      const res = await apiService.createTokenForProject(projectId);
      setCreatedToken(res.token);
      setCopied(false);
      setProjectId('');
      await loadTokens();
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const openDelete = (id: string, projectName?: string | null) => {
    setTokenToDelete({ id, projectName: projectName || 'project' });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tokenToDelete) return;
    setDeleting(true);
    try {
      await apiService.revokeToken(tokenToDelete.id);
      setShowDeleteModal(false);
      setTokenToDelete(null);
      await loadTokens();
    } finally {
      setDeleting(false);
    }
  };

  const openRegenerate = (id: string, projectName?: string | null) => {
    setTokenToRegenerate({ id, projectName: projectName || 'project' });
    setShowRegenerateModal(true);
    setRegeneratedToken(null);
  };

  const handleRegenerateConfirm = async () => {
    if (!tokenToRegenerate) return;
    setRegenerating(true);
    try {
      const res = await apiService.regenerateToken(tokenToRegenerate.id);
      setRegeneratedToken(res.token);
      setCopied(false);
      await loadTokens();
    } finally {
      setRegenerating(false);
    }
  };

  const selectedProject = projects.find(p => p.id === projectId) || null;
  const projectAlreadyHasToken = projectId ? isTaken(projectId) : false;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tokens</h1>
          <p className="text-gray-400 text-sm mt-1">Generate a Personal Access Token scoped to a single project to use the short API endpoint.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 hidden md:block">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''}
          </div>
          <Button onClick={() => { setShowForm(true); setCreatedToken(null); }}>Create</Button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-base">Create Token</h2>
                    <p className="text-xs text-gray-400">Generate a Personal Access Token for API access</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowForm(false); setProjectId(''); setCreatedToken(null); }}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>

            <div className="p-6 space-y-5">
              {!createdToken && (
                <>
                  <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">Project</label>
                      <Combobox value={selectedProject} onChange={(val: any) => setProjectId(val?.id || '')}>
                        <div className="relative">
                          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-900 border border-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <Combobox.Input
                              className="w-full border-none py-2 pl-3 pr-10 text-white placeholder-gray-500 bg-transparent focus:ring-0"
                              displayValue={(p: any) => p?.name || ''}
                              placeholder="Search or select project…"
                              onChange={(e) => setQuery(e.target.value)}
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Combobox.Button>
                          </div>
                          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-900 border border-gray-700 py-1 text-sm shadow-lg focus:outline-none">
                            {filteredProjects.length === 0 && query !== '' ? (
                              <div className="cursor-default select-none px-3 py-2 text-gray-500">
                                No projects found
                              </div>
                            ) : (
                              filteredProjects.map((p) => (
                                <Combobox.Option
                                  key={p.id}
                                  value={p}
                                  disabled={isTaken(p.id)}
                                  title={isTaken(p.id) ? 'Token already exists for this project' : ''}
                                  className={({ active, disabled }) => `relative cursor-pointer select-none py-2 pl-3 pr-4 flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active && !disabled ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                >
                                  {({ selected, disabled }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium text-white' : ''}`}>{p.name}</span>
                                      {disabled && (
                                        <span className="text-[10px] text-gray-500">Already has token</span>
                                      )}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                      {projectAlreadyHasToken && (
                        <p className="mt-2 text-xs text-red-400">A token already exists for this project. Delete or regenerate the existing token.</p>
                      )}
                    <p className="mt-2 text-xs text-gray-500">Token will be limited to this project and inherits your permissions.</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="outline" onClick={() => { setShowForm(false); setProjectId(''); setCreatedToken(null); }}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="gradient"
                      onClick={handleCreate}
                      disabled={creating || !projectId || projectAlreadyHasToken}
                      loading={creating}
                      className="shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {creating ? 'Creating…' : 'Generate Token'}
                    </Button>
                  </div>
                </>
              )}

              {createdToken && (
                <div className="mt-1 space-y-3">
                  <div className="text-emerald-400 font-semibold">Token created</div>
                  <div className="text-gray-300 text-xs">Copy and store this token securely. You won't be able to see it again.</div>
                  <code className="block w-full p-4 bg-gray-900 rounded border border-gray-700 text-emerald-300 break-all text-sm">{createdToken}</code>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tokens.length === 0 ? (
        <Card className="hover-lift">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No tokens yet</h3>
            <p className="text-gray-400 mb-6">Create your first token to access secrets via API</p>
            <Button variant="gradient" onClick={() => { setShowForm(true); setCreatedToken(null); }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Tokens</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="p-4 flex items-center justify-between bg-gray-900/40 border border-gray-800 rounded-lg hover:bg-gray-900/60 hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{t.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Created {new Date(t.createdAt).toLocaleDateString()}
                        {t.projectName && (
                          <span className="ml-2">• Project: {t.projectName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRegenerate(t.id, t.projectName)}
                      disabled={(regenerating && tokenToRegenerate?.id === t.id) || (deleting && tokenToDelete?.id === t.id)}
                      aria-label="Regenerate token"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/30"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openDelete(t.id, t.projectName)}
                      disabled={(deleting && tokenToDelete?.id === t.id) || (regenerating && tokenToRegenerate?.id === t.id)}
                      aria-label="Delete token"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showDeleteModal && tokenToDelete && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setTokenToDelete(null); }}
          onConfirm={handleDeleteConfirm}
          title="Delete Token"
          itemName={tokenToDelete.projectName}
          itemType="token"
          description={`This will revoke the token associated with project "${tokenToDelete.projectName}". This action cannot be undone.`}
          isLoading={deleting}
        />
      )}

      {showRegenerateModal && tokenToRegenerate && (
        <>
          <ConfirmRegenerateModal
            isOpen={showRegenerateModal && !regeneratedToken}
            onClose={() => {
              if (!regenerating) {
                setShowRegenerateModal(false);
                setTokenToRegenerate(null);
                setRegeneratedToken(null);
              }
            }}
            onConfirm={handleRegenerateConfirm}
            itemName={tokenToRegenerate.projectName}
            isLoading={regenerating}
          />
          
          {regeneratedToken && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-white font-semibold text-base">Token Regenerated</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowRegenerateModal(false);
                      setTokenToRegenerate(null);
                      setRegeneratedToken(null);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-amber-900/20 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-amber-400 font-medium mb-1">Important: Save this token now</h4>
                        <p className="text-amber-300 text-sm">
                          The old token has been revoked. This is the only time you'll be able to see the new token. Copy it immediately and update your environment variables.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-emerald-400 font-semibold mb-2">New Token</div>
                    <code className="block w-full p-4 bg-gray-900 rounded border border-gray-700 text-emerald-300 break-all text-sm">{regeneratedToken}</code>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={async () => {
                      if (regeneratedToken) {
                        try {
                          await navigator.clipboard.writeText(regeneratedToken);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (_) {}
                      }
                    }}>
                      {copied ? 'Copied!' : 'Copy Token'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};



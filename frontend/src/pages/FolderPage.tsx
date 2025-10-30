import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SecretRow } from '../components/SecretRow';
import { SecretForm } from '../components/forms/SecretForm';
import { SecretModal } from '../components/forms/SecretModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { apiService } from '../services/api';
import type { Secret } from '../types';

type Tab = 'secrets' | 'access' | 'logs';

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
  const [forceEditNameId, setForceEditNameId] = useState<string | null>(null);

  const headerTitle = useMemo(() => {
    const f = (folder || 'default').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    const e = (env || '').charAt(0).toUpperCase() + (env || '').slice(1).toLowerCase();
    return `${f} • ${e}`;
  }, [env, folder]);

  useEffect(() => {
    fetchSecrets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, env, folder]);

  async function fetchSecrets() {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await apiService.getSecrets(id, true);
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
    const payload = {
      name: 'UNTITLED',
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
      // no-op; backend may validate, but we attempt best-effort
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
              <div className="space-y-4">
                {secrets.map((secret) => (
                  <SecretRow
                    key={secret.id}
                    secret={secret}
                    forceEditNameId={forceEditNameId}
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'access' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold">Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Access Control</h3>
              <p className="text-gray-400 mb-5 text-sm">Manage who can access secrets in this folder</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-semibold">Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-10 text-center">
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-white mb-2">Activity Logs</h3>
              <p className="text-gray-400 mb-5 text-sm">View access logs and activity for this folder</p>
            </div>
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

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface CliToken {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export function CliTokenManager() {
  const [tokens, setTokens] = useState<CliToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const { tokens: tokensList } = await apiService.listCliTokens();
      setTokens(tokensList);
    } catch (error) {
      console.error('Failed to load CLI tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      setCreating(true);
      const { token } = await apiService.createCliToken(tokenName || undefined);
      setNewToken(token);
      setShowTokenModal(true);
      setTokenName('');
      await loadTokens();
    } catch (error) {
      console.error('Failed to create CLI token:', error);
      alert('Failed to create CLI token');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this CLI token? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(tokenId);
      await apiService.deleteCliToken(tokenId);
      await loadTokens();
    } catch (error) {
      console.error('Failed to delete CLI token:', error);
      alert('Failed to delete CLI token');
    } finally {
      setDeleting(null);
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('Token copied to clipboard!');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Create Token Section */}
      <Card className="hover-lift border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-white">Create CLI Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Token Name (Optional)
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g., MacBook Pro, CI/CD Pipeline"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Give your token a descriptive name to identify it later
            </p>
          </div>
          <button
            onClick={handleCreateToken}
            disabled={creating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Generate CLI Token'}
          </button>
        </CardContent>
      </Card>

      {/* Token Display Modal */}
      {showTokenModal && newToken && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 border-emerald-500/50">
            <CardHeader>
              <CardTitle className="text-white">CLI Token Created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-300">
                  ⚠️ <strong>Important:</strong> Copy this token now. You won't be able to see it again!
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Your CLI Token
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-emerald-400 font-mono text-sm break-all">
                    {newToken}
                  </code>
                  <button
                    onClick={() => copyToken(newToken)}
                    className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-2">
                  <strong>Next Steps:</strong>
                </p>
                <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Install the CLI: <code className="bg-gray-900 px-1 rounded">npm install -g @keyvault/cli</code></li>
                  <li>Login: <code className="bg-gray-900 px-1 rounded">keyvault login</code> (paste the token above)</li>
                  <li>Setup: <code className="bg-gray-900 px-1 rounded">keyvault setup</code> (select org/project/env/folder)</li>
                  <li>Run: <code className="bg-gray-900 px-1 rounded">keyvault run -- npm start</code></li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setNewToken(null);
                }}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Existing Tokens */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">Your CLI Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No CLI tokens created yet. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">
                        {token.name || 'Unnamed Token'}
                      </h3>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {token.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>Created: {formatDate(token.createdAt)}</div>
                      <div>Last used: {formatDate(token.lastUsedAt)}</div>
                      {token.expiresAt && (
                        <div>Expires: {formatDate(token.expiresAt)}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    disabled={deleting === token.id}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === token.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


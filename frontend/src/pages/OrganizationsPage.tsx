import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizationsStore } from '../stores/organizations';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export function OrganizationsPage() {
  const navigate = useNavigate();
  const {
    organizations,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization,
    clearError,
  } = useOrganizationsStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const slugPreview = name.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    clearError();
    try {
      const slug = slugPreview;
      await createOrganization({
        name: name.trim(),
        slug: slug,
        description: description.trim() || undefined
      });
      setName('');
      setDescription('');
      setShowCreate(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage your workspaces</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400 hidden md:block">
            {organizations.length} workspace{organizations.length !== 1 ? 's' : ''}
          </div>
          <Button onClick={() => { setShowCreate(true); clearError(); }}>Create</Button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-xl shadow-2xl border border-gray-700 w-full max-w-xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base">Create Workspace</h2>
                  <p className="text-xs text-gray-400">Set up a space to organize projects and members</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreate(false); setName(''); setDescription(''); }}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Workspace Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <input
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. My Company"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Slug will be <span className="text-gray-300">{slugPreview || 'my-workspace'}</span></div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Description (optional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Brief description of your organization"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400">{error}</span>
                  </div>
                </div>
              )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setName(''); setDescription(''); }}>Cancel</Button>
                <Button type="submit" variant="gradient" loading={submitting} disabled={!name.trim() || submitting} className="shadow-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organizations List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-700 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <Card className="hover-lift">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No workspaces yet</h3>
            <p className="text-gray-400 mb-6">Create your first workspace to get started</p>
            <Button variant="gradient" onClick={() => { setShowCreate(true); clearError(); }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="group cursor-pointer transition-colors duration-200 border border-gray-800 bg-gray-900/50 hover:bg-gray-800/30"
              onClick={() => navigate(`/organizations/${org.id}`)}
            >
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {org.name}
                      </h3>
                      <div className="text-[11px] text-gray-500">Created {new Date(org.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-md bg-gray-800/60 text-gray-300 border border-gray-700">
                    {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Description */}
                <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
                  {org.description || 'No description'}
                </p>
                {/* Footer */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/60 border border-gray-700">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      Workspace
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganizationsPage;
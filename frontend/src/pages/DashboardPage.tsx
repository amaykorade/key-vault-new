import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { apiService } from '../services/api';
import type { Project, Organization } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tokens, setTokens] = useState<Array<{ id: string; lastUsedAt?: string | null; expiresAt?: string | null }>>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ organizations }, { projects }, tokenRes, recent] = await Promise.all([
          apiService.getOrganizations(),
          apiService.getProjects(),
          apiService.listTokens(),
          apiService.getRecentActivity(undefined, 10),
        ]);
        setOrgs(organizations || []);
        setProjects(projects || []);
        setTokens(tokenRes.tokens || []);
        setActivity(recent.logs || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => ({
    organizations: orgs.length,
    projects: projects.length,
    tokens: tokens.length,
  }), [orgs.length, projects.length, tokens.length]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your workspaces, projects, and recent activity</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={ROUTES.API_TOKENS}>
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm-7 8l4-4m0 0l-4-4m4 4H3" />
              </svg>
              Create Token
            </Button>
          </Link>
          <Link to={ROUTES.ORGANIZATIONS}>
            <Button variant="gradient" className="shadow-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Organization
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Workspaces</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <CardDescription>
              Manage your workspaces and team access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-emerald-400">{loading ? '—' : counts.organizations}</span>
                <span className="text-sm text-gray-400">Total workspaces</span>
              </div>
              <Link to={ROUTES.ORGANIZATIONS}>
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                   Create Workspace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Projects</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
              </div>
            </div>
            <CardDescription>
              Organize your secrets by project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-teal-400">{loading ? '—' : counts.projects}</span>
                <span className="text-sm text-gray-400">Total projects</span>
              </div>
              <div className="text-sm text-gray-500">Your active projects</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Tokens</CardTitle>
              <div className="w-12 h-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3zm-7 8l4-4m0 0l-4-4m4 4H3" />
                </svg>
              </div>
            </div>
            <CardDescription>
              Personal access tokens for API access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-amber-400">{loading ? '—' : counts.tokens}</span>
                <span className="text-sm text-gray-400">Your tokens</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.API_TOKENS)}>
                Manage Tokens
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest actions across your organizations and projects</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {activity.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No recent activity.</div>
          ) : (
            <div className="divide-y divide-gray-800 border border-gray-800 rounded-lg">
              {activity.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between bg-gray-900/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10M5 6h14v12H5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-white">
                        {log.action}
                        {log.secretName ? ` • ${log.secretName}` : ''}
                        {log.projectName ? ` • ${log.projectName}` : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt as any).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {log.projectId && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${log.projectId}`)}>
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Projects */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Projects</CardTitle>
          <CardDescription>Quick access to projects you’re part of</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {projects.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No projects yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((p) => (
                <div key={p.id} className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg hover:bg-gray-900/60 transition cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-white font-medium line-clamp-1">{p.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
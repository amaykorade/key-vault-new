import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useOrganizationsStore } from '../stores/organizations';
import { apiService, ApiError } from '../services/api';
import toast from 'react-hot-toast';
import type { Project } from '../types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationsStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchProjects();
    }
  }, [currentOrganization]);

  const fetchProjects = async () => {
    if (!currentOrganization?.id) return;
    try {
      setIsLoading(true);
      const res = await apiService.getProjects(currentOrganization.id);
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!currentOrganization?.id || !projectName.trim()) return;
    try {
      setIsCreating(true);
      await apiService.createProject(currentOrganization.id, {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });
      await fetchProjects();
      setShowCreate(false);
      setProjectName('');
      setProjectDescription('');
    } catch (err) {
      console.error('Failed to create project:', err);
      if (err instanceof ApiError && err.status === 403 && err.message.startsWith('Free plan limit')) {
        toast.error(
          'Free plan limit reached: You can only create 1 project per workspace on the Free plan. Upgrade in Billing to create more.',
          { duration: 10000 }
        );
      } else if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to create project', { duration: 5000 });
      } else {
        toast.error('Failed to create project', { duration: 5000 });
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">Please select a workspace from the sidebar</p>
          </div>
        </div>
        <Card className="hover-lift">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No workspace selected</h3>
            <p className="text-gray-400 mb-6">Select a workspace from the sidebar to view projects</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-xs text-gray-400 mt-1">
            {currentOrganization.name} • {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow transition-colors"
          title="Create Project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
          </svg>
        </button>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg shadow-xl animate-slide-up">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Create Project</h3>
              <button className="text-gray-400 hover:text-gray-200" onClick={() => setShowCreate(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Project name</label>
                <input
                  className="w-full h-10 rounded-md bg-gray-800 border border-gray-700 px-3 text-sm text-white focus:outline-none"
                  placeholder="e.g., My App"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  className="w-full rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none resize-none"
                  rows={3}
                  placeholder="Brief description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateProject} disabled={!projectName.trim() || isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-700 rounded w-48"></div>
                    <div className="h-3 bg-gray-800 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-700 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="hover-lift">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Create your first project to get started</p>
            <Button variant="gradient" onClick={() => setShowCreate(true)}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-colors duration-200 border border-gray-800 bg-gray-900/50 hover:bg-gray-800/30"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-800/60 text-gray-400 border border-gray-700">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;


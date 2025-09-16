import { create } from 'zustand';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types';
import { apiService } from '../services/api';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectsActions {
  fetchProjects: (organizationId?: string) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (organizationId: string, data: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type ProjectsStore = ProjectsState & ProjectsActions;

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Actions
  fetchProjects: async (organizationId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getProjects(organizationId);
      set({
        projects: response.projects,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        projects: [],
        isLoading: false,
        error: error.message || 'Failed to fetch projects',
      });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getProject(id);
      set({
        currentProject: response.project,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        currentProject: null,
        isLoading: false,
        error: error.message || 'Failed to fetch project',
      });
    }
  },

  createProject: async (organizationId: string, data: CreateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createProject(organizationId, data);
      const newProject = response.project;
      
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false,
        error: null,
      }));
      
      return newProject;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create project',
      });
      throw error;
    }
  },

  updateProject: async (id: string, data: UpdateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateProject(id, data);
      const updatedProject = response.project;
      
      set((state) => ({
        projects: state.projects.map(project =>
          project.id === id ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === id 
          ? updatedProject 
          : state.currentProject,
        isLoading: false,
        error: null,
      }));
      
      return updatedProject;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update project',
      });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteProject(id);
      
      set((state) => ({
        projects: state.projects.filter(project => project.id !== id),
        currentProject: state.currentProject?.id === id 
          ? null 
          : state.currentProject,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to delete project',
      });
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

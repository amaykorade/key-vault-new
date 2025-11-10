import { create } from 'zustand';
import type { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '../types';
import { apiService } from '../services/api';

interface OrganizationsState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
}

interface OrganizationsActions {
  fetchOrganizations: () => Promise<void>;
  fetchOrganization: (id: string) => Promise<void>;
  createOrganization: (data: CreateOrganizationRequest) => Promise<Organization>;
  updateOrganization: (id: string, data: UpdateOrganizationRequest) => Promise<Organization>;
  setCurrentOrganization: (organization: Organization | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type OrganizationsStore = OrganizationsState & OrganizationsActions;

export const useOrganizationsStore = create<OrganizationsStore>((set, get) => ({
  // State
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,

  // Actions
  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getOrganizations();
      if (import.meta.env.DEV) {
        console.debug('[organizations] fetched', response.organizations);
      }
      set({
        organizations: response.organizations,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        organizations: [],
        isLoading: false,
        error: error.message || 'Failed to fetch organizations',
      });
    }
  },

  fetchOrganization: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getOrganization(id);
      set({
        currentOrganization: response.organization,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        currentOrganization: null,
        isLoading: false,
        error: error.message || 'Failed to fetch organization',
      });
    }
  },

  createOrganization: async (data: CreateOrganizationRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createOrganization(data);
      const newOrganization = response.organization;
      
      set((state) => ({
        organizations: [...state.organizations, newOrganization],
        isLoading: false,
        error: null,
      }));
      
      return newOrganization;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create organization',
      });
      throw error;
    }
  },

  updateOrganization: async (id: string, data: UpdateOrganizationRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateOrganization(id, data);
      const updatedOrganization = response.organization;
      
      set((state) => ({
        organizations: state.organizations.map(org =>
          org.id === id ? updatedOrganization : org
        ),
        currentOrganization: state.currentOrganization?.id === id 
          ? updatedOrganization 
          : state.currentOrganization,
        isLoading: false,
        error: null,
      }));
      
      return updatedOrganization;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update organization',
      });
      throw error;
    }
  },

  setCurrentOrganization: (organization: Organization | null) => {
    set({ currentOrganization: organization });
  },

  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

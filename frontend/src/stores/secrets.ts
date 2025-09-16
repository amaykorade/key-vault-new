import { create } from 'zustand';
import type { Secret, CreateSecretRequest, UpdateSecretRequest, SecretSearchParams, SecretType } from '../types';
import { apiService } from '../services/api';

interface SecretsState {
  secrets: Secret[];
  currentSecret: Secret | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedType: SecretType | 'ALL';
  showValues: boolean;
}

interface SecretsActions {
  fetchSecrets: (projectId: string, includeValues?: boolean) => Promise<void>;
  fetchSecret: (id: string, includeValue?: boolean) => Promise<void>;
  createSecret: (projectId: string, data: CreateSecretRequest) => Promise<Secret>;
  updateSecret: (id: string, data: UpdateSecretRequest) => Promise<Secret>;
  deleteSecret: (id: string) => Promise<void>;
  searchSecrets: (params: SecretSearchParams) => Promise<void>;
  getSecretsByType: (projectId: string, type: string) => Promise<void>;
  setCurrentSecret: (secret: Secret | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: SecretType | 'ALL') => void;
  setShowValues: (show: boolean) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type SecretsStore = SecretsState & SecretsActions;

export const useSecretsStore = create<SecretsStore>((set, get) => ({
  // State
  secrets: [],
  currentSecret: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedType: 'ALL',
  showValues: false,

  // Actions
  fetchSecrets: async (projectId: string, includeValues = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getSecrets(projectId, includeValues);
      set({
        secrets: response.secrets,
        isLoading: false,
        error: null,
        showValues: includeValues,
      });
    } catch (error: any) {
      set({
        secrets: [],
        isLoading: false,
        error: error.message || 'Failed to fetch secrets',
      });
    }
  },

  fetchSecret: async (id: string, includeValue = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getSecret(id, includeValue);
      set({
        currentSecret: response.secret,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        currentSecret: null,
        isLoading: false,
        error: error.message || 'Failed to fetch secret',
      });
    }
  },

  createSecret: async (projectId: string, data: CreateSecretRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.createSecret(projectId, data);
      const newSecret = response.secret;
      
      set((state) => ({
        secrets: [newSecret, ...state.secrets],
        isLoading: false,
        error: null,
      }));
      
      return newSecret;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to create secret',
      });
      throw error;
    }
  },

  updateSecret: async (id: string, data: UpdateSecretRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.updateSecret(id, data);
      const updatedSecret = response.secret;
      
      set((state) => ({
        secrets: state.secrets.map(secret =>
          secret.id === id ? updatedSecret : secret
        ),
        currentSecret: state.currentSecret?.id === id 
          ? updatedSecret 
          : state.currentSecret,
        isLoading: false,
        error: null,
      }));
      
      return updatedSecret;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update secret',
      });
      throw error;
    }
  },

  deleteSecret: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteSecret(id);
      
      set((state) => ({
        secrets: state.secrets.filter(secret => secret.id !== id),
        currentSecret: state.currentSecret?.id === id 
          ? null 
          : state.currentSecret,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to delete secret',
      });
      throw error;
    }
  },

  searchSecrets: async (params: SecretSearchParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.searchSecrets(params);
      set({
        secrets: response.secrets,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        secrets: [],
        isLoading: false,
        error: error.message || 'Failed to search secrets',
      });
    }
  },

  getSecretsByType: async (projectId: string, type: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getSecretsByType(projectId, type);
      set({
        secrets: response.secrets,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        secrets: [],
        isLoading: false,
        error: error.message || 'Failed to fetch secrets by type',
      });
    }
  },

  setCurrentSecret: (secret: Secret | null) => {
    set({ currentSecret: secret });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedType: (type: SecretType | 'ALL') => {
    set({ selectedType: type });
  },

  setShowValues: (show: boolean) => {
    set({ showValues: show });
  },

  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  reset: () => set({
    secrets: [],
    currentSecret: null,
    error: null,
    searchQuery: '',
    selectedType: 'ALL',
    showValues: false,
  }),
}));

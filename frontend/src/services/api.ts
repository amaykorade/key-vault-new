import type { 
  AuthResponse, 
  LoginRequest, 
  SignupRequest, 
  User, 
  Organization, 
  CreateOrganizationRequest, 
  UpdateOrganizationRequest,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Secret,
  CreateSecretRequest,
  UpdateSecretRequest,
  SecretSearchParams
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    this.accessToken = localStorage.getItem('accessToken');
  }

  private setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  private clearToken() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.details
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0);
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  }

  // Allow applying tokens from OAuth callback
  applyTokens(accessToken: string, refreshToken?: string) {
    this.setToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  async logout() {
    this.clearToken();
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/me');
  }

  // Organization endpoints
  async getOrganizations(): Promise<{ organizations: Organization[] }> {
    return this.request<{ organizations: Organization[] }>('/organizations');
  }

  async getOrganization(id: string): Promise<{ organization: Organization }> {
    return this.request<{ organization: Organization }>(`/organizations/${id}`);
  }

  async createOrganization(data: CreateOrganizationRequest): Promise<{ organization: Organization }> {
    return this.request<{ organization: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<{ organization: Organization }> {
    return this.request<{ organization: Organization }>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.request<void>(`/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async getProjects(organizationId?: string): Promise<{ projects: Project[] }> {
    const endpoint = organizationId 
      ? `/projects/organizations/${organizationId}/projects`
      : '/projects';
    return this.request<{ projects: Project[] }>(endpoint);
  }

  async getProject(id: string): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/projects/${id}`);
  }

  async createProject(organizationId: string, data: CreateProjectRequest): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/projects/organizations/${organizationId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<{ project: Project }> {
    return this.request<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Secret endpoints
  async getSecrets(projectId: string, includeValues = false): Promise<{ secrets: Secret[] }> {
    const params = new URLSearchParams();
    if (includeValues) params.append('includeValues', 'true');
    
    return this.request<{ secrets: Secret[] }>(
      `/secrets/projects/${projectId}/secrets?${params.toString()}`
    );
  }

  async getSecret(id: string, includeValue = false): Promise<{ secret: Secret }> {
    const params = new URLSearchParams();
    if (includeValue) params.append('includeValue', 'true');
    
    return this.request<{ secret: Secret }>(`/secrets/${id}?${params.toString()}`);
  }

  async createSecret(projectId: string, data: CreateSecretRequest): Promise<{ secret: Secret }> {
    return this.request<{ secret: Secret }>(`/secrets/projects/${projectId}/secrets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSecret(id: string, data: UpdateSecretRequest): Promise<{ secret: Secret }> {
    return this.request<{ secret: Secret }>(`/secrets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSecret(id: string): Promise<void> {
    return this.request<void>(`/secrets/${id}`, {
      method: 'DELETE',
    });
  }

  async searchSecrets(params: SecretSearchParams): Promise<{ secrets: Secret[] }> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.projectId) searchParams.append('projectId', params.projectId);
    
    return this.request<{ secrets: Secret[] }>(`/secrets/search?${searchParams.toString()}`);
  }

  async getSecretsByType(projectId: string, type: string): Promise<{ secrets: Secret[] }> {
    return this.request<{ secrets: Secret[] }>(`/secrets/projects/${projectId}/secrets/type/${type}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getToken(): string | null {
    return this.accessToken;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export { ApiError };

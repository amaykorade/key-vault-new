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
  SecretSearchParams,
  AuditLog,
  AuditFilters,
  Folder
} from '../types';

const resolveDefaultApiBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
};

export const API_BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
  ? import.meta.env.VITE_API_URL.trim()
  : resolveDefaultApiBase();

class ApiError extends Error {
  status: number;
  details?: Array<{ field: string; message: string }>;
  
  constructor(
    message: string,
    status: number,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
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

  // Public method to reload token (useful after OAuth callback)
  reloadToken() {
    this.accessToken = localStorage.getItem('accessToken');
  }

  private setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }

  applyTokens(accessToken: string, refreshToken?: string) {
    this.setToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
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

  // Folder endpoints
  async getProjectFolders(projectId: string): Promise<{ folders: Folder[] }> {
    return this.request<{ folders: Folder[] }>(`/projects/${projectId}/folders`);
  }

  async createFolder(
    projectId: string,
    data: { name: string; environment: string; description?: string }
  ): Promise<{ folder: Folder }> {
    return this.request<{ folder: Folder }>(`/projects/${projectId}/folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(
    projectId: string,
    folderId: string,
    data: { name?: string; description?: string }
  ): Promise<{ folder: Folder }> {
    return this.request<{ folder: Folder }>(`/projects/${projectId}/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(projectId: string, folderId: string): Promise<void> {
    return this.request<void>(`/projects/${projectId}/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  // Project Member endpoints
  async getProjectMembers(projectId: string): Promise<{ members: any[] }> {
    return this.request<{ members: any[] }>(`/projects/${projectId}/members`);
  }

  async getAvailableProjectMembers(projectId: string): Promise<{ members: any[] }> {
    return this.request<{ members: any[] }>(`/projects/${projectId}/available-members`);
  }

  async addProjectMember(projectId: string, data: any): Promise<{ member: any }> {
    return this.request<{ member: any }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProjectMemberRole(projectId: string, userId: string, data: any): Promise<{ member: any }> {
    return this.request<{ member: any }>(`/projects/${projectId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    return this.request<void>(`/projects/${projectId}/members/${userId}`, {
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

  // Tokens (PAT)
  async createTokenForProject(
    projectId: string,
    options?: { 
      name?: string; 
      scopes?: Array<'read' | 'write'>; 
      expiresInMinutes?: number;
      environment?: string;
      folder?: string;
    }
  ): Promise<{ token: string; tokenMeta: any }> {
    const body: any = { name: options?.name || `token-${Date.now()}`, projects: [projectId] };
    if (options?.scopes) body.scopes = options.scopes;
    if (typeof options?.expiresInMinutes === 'number') body.expiresInMinutes = options.expiresInMinutes;
    if (options?.environment) body.environments = [options.environment];
    if (options?.folder) body.folders = [options.folder];
    return this.request<{ token: string; tokenMeta: any }>(`/tokens`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async listTokens(): Promise<{ tokens: Array<{ id: string; name: string; createdAt: string; expiresAt?: string | null; lastUsedAt?: string | null; projectId?: string | null; projectName?: string | null }> }> {
    return this.request(`/tokens`);
  }

  async revokeToken(id: string): Promise<void> {
    return this.request<void>(`/tokens/${id}`, { method: 'DELETE' });
  }

  async regenerateToken(id: string): Promise<{ token: string }> {
    return this.request<{ token: string }>(`/tokens/${id}/regenerate`, { method: 'POST' });
  }

  // User projects for dropdown
  async getMyProjects(): Promise<{ projects: Array<{ id: string; name: string }> }> {
    const res = await this.request<{ projects: Array<{ id: string; name: string }> }>(`/projects`);
    return { projects: res.projects.map((p: any) => ({ id: p.id, name: p.name })) };
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

  // Team methods
  async getOrganizationTeams(organizationId: string): Promise<{ teams: any[] }> {
    return this.request<{ teams: any[] }>(`/organizations/${organizationId}/teams`);
  }

  async getTeam(teamId: string): Promise<{ team: any }> {
    return this.request<{ team: any }>(`/teams/${teamId}`);
  }

  async getUserTeams(): Promise<{ teams: any[] }> {
    return this.request<{ teams: any[] }>('/users/me/teams');
  }

  async createTeam(organizationId: string, data: any): Promise<{ team: any }> {
    return this.request<{ team: any }>(`/organizations/${organizationId}/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeam(teamId: string, data: any): Promise<{ team: any }> {
    return this.request<{ team: any }>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(teamId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  async addTeamMember(teamId: string, data: any): Promise<{ membership: any }> {
    return this.request<{ membership: any }>(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateTeamMemberRole(teamId: string, userId: string, data: any): Promise<{ membership: any }> {
    return this.request<{ membership: any }>(`/teams/${teamId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getOrganizationMembers(organizationId: string): Promise<{ members: any[] }> {
    return this.request<{ members: any[] }>(`/organizations/${organizationId}/members`);
  }

  // Project assignment methods
  async assignProjectToTeam(teamId: string, data: any): Promise<{ assignment: any }> {
    return this.request<{ assignment: any }>(`/teams/${teamId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeProjectFromTeam(teamId: string, projectId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  async updateTeamProjectPermissions(teamId: string, projectId: string, data: any): Promise<{ assignment: any }> {
    return this.request<{ assignment: any }>(`/teams/${teamId}/projects/${projectId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getTeamProjects(teamId: string): Promise<{ projects: any[] }> {
    return this.request<{ projects: any[] }>(`/teams/${teamId}/projects`);
  }

  async getProjectTeams(projectId: string): Promise<{ teams: any[] }> {
    return this.request<{ teams: any[] }>(`/projects/${projectId}/teams`);
  }

  // Invitation methods
  async sendOrganizationInvitation(organizationId: string, data: any): Promise<any> {
    return this.request<any>(`/organizations/${organizationId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendTeamInvitation(teamId: string, data: any): Promise<any> {
    return this.request<any>(`/teams/${teamId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvitationByToken(token: string): Promise<{ invitation: any }> {
    return this.request<{ invitation: any }>(`/invitations/${token}`);
  }

  async acceptInvitation(token: string, data: any): Promise<any> {
    return this.request<any>(`/invitations/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrganizationInvitations(organizationId: string): Promise<{ invitations: any[] }> {
    return this.request<{ invitations: any[] }>(`/organizations/${organizationId}/invitations`);
  }

  async getTeamInvitations(teamId: string): Promise<{ invitations: any[] }> {
    return this.request<{ invitations: any[] }>(`/teams/${teamId}/invitations`);
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    return this.request<void>(`/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  async resendInvitation(invitationId: string): Promise<{ invitation: any }> {
    return this.request<{ invitation: any }>(`/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  // Audit methods
  async getAuditLogs(filters: AuditFilters = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.organizationId) params.append('organizationId', filters.organizationId);
    if (filters.projectId) params.append('projectId', filters.projectId);
    if (filters.eventType) params.append('eventType', filters.eventType);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    return this.request<{ logs: AuditLog[]; total: number }>(`/audit/logs?${params.toString()}`);
  }

  async getRecentActivity(organizationId?: string, limit: number = 20): Promise<{ logs: AuditLog[] }> {
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    params.append('limit', limit.toString());

    return this.request<{ logs: AuditLog[] }>(`/audit/recent?${params.toString()}`);
  }

  async getSecurityEvents(organizationId?: string, limit: number = 20): Promise<{ logs: AuditLog[] }> {
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    params.append('limit', limit.toString());

    return this.request<{ logs: AuditLog[] }>(`/audit/security?${params.toString()}`);
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>(`/audit/user/${userId}?limit=${limit}`);
  }

  async getOrganizationActivity(organizationId: string, limit: number = 50, offset: number = 0): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>(`/audit/organization/${organizationId}?limit=${limit}&offset=${offset}`);
  }

  async getProjectActivity(projectId: string, limit: number = 50, offset: number = 0): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>(`/audit/project/${projectId}?limit=${limit}&offset=${offset}`);
  }

  async getSecretAccessHistory(secretId: string, limit: number = 50, offset: number = 0): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>(`/audit/secret/${secretId}?limit=${limit}&offset=${offset}`);
  }

  async getFolderLogs(projectId: string, environment: string, folder: string, limit: number = 50, offset: number = 0): Promise<{ logs: AuditLog[] }> {
    return this.request<{ logs: AuditLog[] }>(`/audit/folder/${projectId}/${encodeURIComponent(environment)}/${encodeURIComponent(folder)}?limit=${limit}&offset=${offset}`);
  }

  // CLI token methods
  async createCliToken(name?: string): Promise<{ token: string; tokenMeta: any }> {
    return this.request<{ token: string; tokenMeta: any }>('/cli/token', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async listCliTokens(): Promise<{ tokens: any[] }> {
    return this.request<{ tokens: any[] }>('/cli/tokens');
  }

  async deleteCliToken(tokenId: string): Promise<void> {
    return this.request<void>(`/cli/token/${tokenId}`, {
      method: 'DELETE',
    });
  }

  async authorizeCliDeviceCode(userCode: string, name?: string): Promise<{ success: boolean; message: string; token?: string }> {
    return this.request<{ success: boolean; message: string; token?: string }>(`/cli/device-code/${userCode}/authorize`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async submitEarlyAccess(data: { email: string; name?: string; developerType: string }): Promise<{ success: boolean }> {
    let base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    if (!base.endsWith('/api')) {
      base = base.endsWith('/') ? `${base}api` : `${base}/api`;
    }
    const url = `${base}/public/early-access`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      console.log('[API] Submitting early access:', { url, data: { email: data.email, developerType: data.developerType } });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('[API] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('[API] Early access error response:', errorData);
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.details
        );
      }

      const result = await response.json();
      console.log('[API] Early access success:', result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[API] Early access fetch error:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout. Please try again.', 0);
      }
      // Re-throw network errors as ApiError with status 0
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // Vercel Integration
  async checkVercelStatus(organizationId: string): Promise<{ connected: boolean }> {
    return this.request<{ connected: boolean }>(`/vercel/status/${organizationId}`);
  }

  async getVercelProjects(organizationId: string): Promise<{ projects: any[] }> {
    return this.request<{ projects: any[] }>(`/vercel/projects/${organizationId}`);
  }

  async connectVercel(data: { accessToken: string; organizationId: string; teamId?: string; teamName?: string }): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>('/vercel/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncToVercel(data: {
    projectId: string;
    environment: string;
    folder: string;
    vercelProjectId: string;
    vercelProjectName?: string;
    vercelEnvTarget: 'production' | 'preview' | 'development';
  }): Promise<{ success: boolean; synced: number; errors: string[]; message?: string }> {
    return this.request<{ success: boolean; synced: number; errors: string[]; message?: string }>('/vercel/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkVercelSyncStatus(projectId: string, environment: string, folder: string): Promise<{ hasUnsyncedChanges: boolean }> {
    return this.request<{ hasUnsyncedChanges: boolean }>(`/vercel/sync-status/${projectId}/${environment}/${folder}`);
  }

  async getVercelAuthUrl(organizationId: string, returnTo?: string): Promise<{ authUrl: string }> {
    const params = new URLSearchParams();
    if (organizationId) params.append('organizationId', organizationId);
    if (returnTo) params.append('returnTo', returnTo);
    return this.request<{ authUrl: string }>(`/vercel/auth/redirect?${params.toString()}`);
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

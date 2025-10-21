// Role types
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role?: Role;
  memberCount?: number;
  projectCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

// Secret types
export type SecretType = 
  | 'API_KEY'
  | 'DATABASE_URL'
  | 'JWT_SECRET'
  | 'OAUTH_CLIENT_SECRET'
  | 'WEBHOOK_SECRET'
  | 'SSH_KEY'
  | 'CERTIFICATE'
  | 'PASSWORD'
  | 'OTHER';

export interface Secret {
  id: string;
  name: string;
  description?: string;
  type: SecretType;
  environment: string;
  folder: string;
  value: string; // This will be masked unless includeValues is true
  maskedValue: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecretRequest {
  name: string;
  description?: string;
  type: SecretType;
  environment: string;
  folder: string;
  value: string;
}

export interface UpdateSecretRequest {
  name?: string;
  description?: string;
  type?: SecretType;
  environment?: string;
  folder?: string;
  value?: string;
}

// Membership types
export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface ApiErrorResponse {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Search and filter types
export interface SecretSearchParams {
  q?: string;
  projectId?: string;
  type?: SecretType;
  includeValues?: boolean;
}

export interface ProjectSearchParams {
  organizationId?: string;
  search?: string;
}

export interface OrganizationSearchParams {
  search?: string;
}
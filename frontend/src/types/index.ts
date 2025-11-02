// Role types
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TeamRole = 'LEAD' | 'MEMBER';

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
export type ProjectRole = 'OWNER' | 'ADMIN' | 'WRITE' | 'READ';

export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  userRole?: ProjectRole | null;
  userAccess?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    canManageProject: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  user: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  role: ProjectRole;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface AddProjectMemberRequest {
  userId: string;
  role: ProjectRole;
}

export interface UpdateProjectMemberRoleRequest {
  role: ProjectRole;
}

// Audit types
export interface AuditLog {
  id: string;
  userId?: string;
  organizationId?: string;
  projectId?: string;
  secretId?: string;
  tokenId?: string;
  eventType: string;
  action: string;
  resourceName?: string;
  resourceType?: string;
  environment?: string;
  folder?: string;
  metadata?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  secret?: {
    id: string;
    name: string;
  };
}

export interface AuditFilters {
  organizationId?: string;
  projectId?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
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
  value: string; // This will be masked unless includeValues is true
  maskedValue: string;
  projectId: string;
  environment: string;
  folder: string;
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

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  members?: TeamMember[];
  memberCount: number;
  userRole?: TeamRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  user: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  role: TeamRole;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface AddTeamMemberRequest {
  userId: string;
  role: TeamRole;
}

export interface UpdateTeamMemberRoleRequest {
  role: TeamRole;
}

export interface UserTeam {
  id: string;
  role: TeamRole;
  joinedAt: string;
  team: {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    memberCount: number;
    createdAt: string;
  };
}

// Team search and filter types
export interface TeamSearchParams {
  organizationId?: string;
  search?: string;
}

// Project permission types
export type ProjectPermission = 
  | 'READ_SECRETS'
  | 'WRITE_SECRETS' 
  | 'DELETE_SECRETS'
  | 'MANAGE_ENVIRONMENTS'
  | 'MANAGE_FOLDERS';

// Team project assignment types
export interface TeamProject {
  id: string;
  project: {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
  };
  permissions: ProjectPermission[];
  assignedAt: string;
}

export interface ProjectTeam {
  id: string;
  team: {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    memberCount: number;
    createdAt: string;
  };
  permissions: ProjectPermission[];
  assignedAt: string;
}

export interface AssignProjectToTeamRequest {
  projectId: string;
  permissions: ProjectPermission[];
}

export interface UpdateTeamProjectPermissionsRequest {
  permissions: ProjectPermission[];
}

// Invitation types
export interface Invitation {
  id: string;
  email: string;
  role: Role;
  teamRole?: TeamRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  team?: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    name?: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: Role;
  teamRole?: TeamRole;
}

export interface AcceptInvitationRequest {
  name?: string;
  password?: string;
}

export interface InvitationInfo {
  email: string;
  role: Role;
  teamRole?: TeamRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  team?: {
    id: string;
    name: string;
  };
  invitedBy: {
    id: string;
    name?: string;
    email: string;
  };
  expiresAt: string;
}

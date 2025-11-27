import type { SecretType } from '../types';

// Secret types with labels and icons
export const SECRET_TYPES: Array<{
  value: SecretType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'API_KEY',
    label: 'API Key',
    description: 'API keys for external services',
    icon: '🔑',
  },
  {
    value: 'DATABASE_URL',
    label: 'Database URL',
    description: 'Database connection strings',
    icon: '🗄️',
  },
  {
    value: 'JWT_SECRET',
    label: 'JWT Secret',
    description: 'JSON Web Token secrets',
    icon: '🎫',
  },
  {
    value: 'OAUTH_CLIENT_SECRET',
    label: 'OAuth Client Secret',
    description: 'OAuth 2.0 client secrets',
    icon: '🔐',
  },
  {
    value: 'WEBHOOK_SECRET',
    label: 'Webhook Secret',
    description: 'Webhook verification secrets',
    icon: '🔗',
  },
  {
    value: 'SSH_KEY',
    label: 'SSH Key',
    description: 'SSH private keys',
    icon: '🔧',
  },
  {
    value: 'CERTIFICATE',
    label: 'Certificate',
    description: 'SSL/TLS certificates',
    icon: '📜',
  },
  {
    value: 'PASSWORD',
    label: 'Password',
    description: 'General passwords',
    icon: '🔒',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other types of secrets',
    icon: '📝',
  },
];

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ME: '/me',
  },
  ORGANIZATIONS: '/organizations',
  PROJECTS: '/projects',
  SECRETS: '/secrets',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  CURRENT_ORGANIZATION: 'currentOrganization',
  CURRENT_PROJECT: 'currentProject',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  ORGANIZATIONS: '/organizations',
  PROJECTS: '/projects',
  TEAMS: '/teams',
  SECRETS: '/secrets',
  API: '/api',
  API_TOKENS: '/api/tokens',
  AUDIT: '/audit',
  SETTINGS: '/settings',
  CLI_AUTH: '/cli/auth',
  CLI_GUIDE: '/docs/cli',
  DOCS: '/docs',
  FAQ: '/faq',
  BILLING: '/billing',
  LANDING: '/',
} as const;

// UI constants
export const UI = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  PAGINATION_SIZE: 20,
  DEBOUNCE_DELAY: 300,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  ORGANIZATION_CREATED: 'Organization created successfully!',
  ORGANIZATION_UPDATED: 'Organization updated successfully!',
  PROJECT_CREATED: 'Project created successfully!',
  PROJECT_UPDATED: 'Project updated successfully!',
  PROJECT_DELETED: 'Project deleted successfully!',
  SECRET_CREATED: 'Secret created successfully!',
  SECRET_UPDATED: 'Secret updated successfully!',
  SECRET_DELETED: 'Secret deleted successfully!',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
} as const;

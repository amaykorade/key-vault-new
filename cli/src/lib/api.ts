import chalk from 'chalk';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function apiBaseUrl() {
  const base = process.env.KEYVAULT_API_URL || 'https://key-vault-new.onrender.com';
  return base.replace(/\/$/, '');
}

function apiUrl(path: string) {
  return `${apiBaseUrl()}/api${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiGet(path: string, token?: string) {
  const headers: Record<string, string> = {
    'User-Agent': `keyvault-cli/0.1.0 (+https://key-vault-new.vercel.app)`,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = apiUrl(path);
  
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Unauthorized. Run `keyvault login` again.', 401);
      }
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        if (body?.error) {
          message = body.error;
        }
      } catch {
        // ignore
      }
      throw new ApiError(message, response.status);
    }

    try {
      return await response.json();
    } catch (error) {
      console.error(chalk.red('Failed to parse response JSON'));
      throw error;
    }
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const baseUrl = apiBaseUrl();
      throw new Error(
        `Cannot connect to backend at ${baseUrl}\n` +
        `Please make sure:\n` +
        `  1. The backend is running (check: curl ${baseUrl}/health)\n` +
        `  2. KEYVAULT_API_URL is set correctly (current: ${baseUrl})\n` +
        `  3. There are no firewall issues blocking the connection`
      );
    }
    throw error;
  }
}

export async function apiPost(path: string, body?: any, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': `keyvault-cli/0.1.0 (+https://key-vault-new.vercel.app)`,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = apiUrl(path);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch {
        // ignore
      }
      throw new ApiError(message, response.status);
    }

    try {
      return await response.json();
    } catch (error) {
      return {};
    }
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const baseUrl = apiBaseUrl();
      throw new Error(
        `Cannot connect to backend at ${baseUrl}\n` +
        `Please make sure:\n` +
        `  1. The backend is running (check: curl ${baseUrl}/health)\n` +
        `  2. KEYVAULT_API_URL is set correctly (current: ${baseUrl})\n` +
        `  3. There are no firewall issues blocking the connection`
      );
    }
    throw error;
  }
}


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

export async function apiGet(path: string, token: string) {
  const response = await fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': `keyvault-cli/0.1.0 (+https://key-vault-new.vercel.app)`,
    },
  });

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
}


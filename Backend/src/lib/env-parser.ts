/**
 * .env file parser utility
 * Parses standard .env file format and extracts key-value pairs
 */

export interface ParsedSecret {
  name: string;
  value: string;
  lineNumber: number;
  rawLine: string;
}

export interface ParseResult {
  secrets: ParsedSecret[];
  errors: Array<{ line: number; error: string; rawLine: string }>;
}

/**
 * Parse .env file content and extract key-value pairs
 * Supports:
 * - KEY=value
 * - KEY="value"
 * - KEY='value'
 * - Comments (# comment)
 * - Empty lines
 * - Multi-line values (basic support)
 */
export function parseEnvFile(content: string): ParseResult {
  const secrets: ParsedSecret[] = [];
  const errors: Array<{ line: number; error: string; rawLine: string }> = [];
  
  const lines = content.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      continue;
    }
    
    // Skip comments
    if (trimmed.startsWith('#')) {
      continue;
    }
    
    // Parse KEY=value format
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      errors.push({
        line: lineNumber,
        error: 'Missing equals sign (=)',
        rawLine: line,
      });
      continue;
    }
    
    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();
    
    // Validate key name
    if (!key) {
      errors.push({
        line: lineNumber,
        error: 'Empty key name',
        rawLine: line,
      });
      continue;
    }
    
    // Key validation: alphanumeric, underscore, and hyphen (max 100 chars)
    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      errors.push({
        line: lineNumber,
        error: 'Invalid key name (only alphanumeric, underscore, and hyphen allowed)',
        rawLine: line,
      });
      continue;
    }
    
    if (key.length > 100) {
      errors.push({
        line: lineNumber,
        error: 'Key name too long (max 100 characters)',
        rawLine: line,
      });
      continue;
    }
    
    // Validate value is not empty
    if (!value) {
      errors.push({
        line: lineNumber,
        error: 'Empty value',
        rawLine: line,
      });
      continue;
    }
    
    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      // Remove quotes
      value = value.slice(1, -1);
      
      // Handle escaped characters
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
    }
    
    // Validate value length (reasonable limit: 10KB per secret)
    if (value.length > 10 * 1024) {
      errors.push({
        line: lineNumber,
        error: 'Value too long (max 10KB)',
        rawLine: line,
      });
      continue;
    }
    
    secrets.push({
      name: key,
      value,
      lineNumber,
      rawLine: line,
    });
  }
  
  return { secrets, errors };
}

/**
 * Auto-detect secret type based on key name patterns
 */
export function detectSecretType(keyName: string, value: string): string {
  const lowerKey = keyName.toLowerCase();
  
  // Database URLs
  if (lowerKey.includes('database') || lowerKey.includes('db_url') || lowerKey.includes('db_uri') || lowerKey.startsWith('db_')) {
    return 'DATABASE_URL';
  }
  
  // JWT/Token secrets
  if (lowerKey.includes('jwt') || lowerKey.includes('token') && !lowerKey.includes('api')) {
    return 'JWT_SECRET';
  }
  
  // OAuth secrets
  if (lowerKey.includes('oauth') || lowerKey.includes('client_secret')) {
    return 'OAUTH_CLIENT_SECRET';
  }
  
  // Webhook secrets
  if (lowerKey.includes('webhook')) {
    return 'WEBHOOK_SECRET';
  }
  
  // SSH keys
  if (lowerKey.includes('ssh') || lowerKey.includes('private_key') || lowerKey.includes('rsa_key')) {
    return 'SSH_KEY';
  }
  
  // Certificates
  if (lowerKey.includes('cert') || lowerKey.includes('ssl') || lowerKey.includes('tls') || value.includes('-----BEGIN')) {
    return 'CERTIFICATE';
  }
  
  // Passwords
  if (lowerKey.includes('password') || lowerKey.includes('pass') || lowerKey.includes('pwd')) {
    return 'PASSWORD';
  }
  
  // API keys
  if (lowerKey.includes('api_key') || lowerKey.includes('apikey') || lowerKey.includes('api_token')) {
    return 'API_KEY';
  }
  
  // Default to API_KEY
  return 'API_KEY';
}


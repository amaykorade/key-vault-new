/**
 * Secret detection patterns for common API keys and credentials
 * Based on known patterns from various services
 */

export interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'high' | 'medium' | 'low';
  description: string;
  examples: string[];
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // AWS
  {
    name: 'AWS Access Key ID',
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: 'high',
    description: 'AWS Access Key ID - grants access to AWS services',
    examples: ['AKIAIOSFODNN7EXAMPLE'],
  },
  {
    name: 'AWS Secret Access Key',
    pattern: /aws_secret_access_key\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/i,
    severity: 'high',
    description: 'AWS Secret Access Key - used with Access Key ID',
    examples: ['aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'],
  },
  
  // Stripe
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/,
    severity: 'high',
    description: 'Stripe Live Secret Key - full access to Stripe account',
    examples: ['sk_live_51Habc123xyz...'],
  },
  {
    name: 'Stripe Publishable Key',
    pattern: /pk_live_[0-9a-zA-Z]{24,}/,
    severity: 'medium',
    description: 'Stripe Live Publishable Key - less sensitive but still important',
    examples: ['pk_live_51Habc123xyz...'],
  },
  
  // Database URLs
  {
    name: 'PostgreSQL Connection String',
    pattern: /postgres:\/\/[^:]+:[^@]+@[^\s'"]+/i,
    severity: 'high',
    description: 'PostgreSQL database connection string with credentials',
    examples: ['postgres://user:password@host:5432/dbname'],
  },
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\s'"]+/i,
    severity: 'high',
    description: 'MongoDB connection string with credentials',
    examples: ['mongodb://user:password@host:27017/dbname'],
  },
  {
    name: 'MySQL Connection String',
    pattern: /mysql:\/\/[^:]+:[^@]+@[^\s'"]+/i,
    severity: 'high',
    description: 'MySQL database connection string with credentials',
    examples: ['mysql://user:password@host:3306/dbname'],
  },
  
  // OAuth & API Keys
  {
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/,
    severity: 'high',
    description: 'Google API Key - grants access to Google services',
    examples: ['AIzaSyDaGmWKa7JsR8H5fFTB2jX6w5K3vZ4xYzAb'],
  },
  {
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[0-9a-zA-Z]{36}/,
    severity: 'high',
    description: 'GitHub Personal Access Token - grants repository access',
    examples: ['ghp_1234567890abcdefghijklmnopqrstuvwxyz'],
  },
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[0-9a-zA-Z]{36}/,
    severity: 'high',
    description: 'GitHub OAuth Token',
    examples: ['gho_1234567890abcdefghijklmnopqrstuvwxyz'],
  },
  
  // JWT
  {
    name: 'JWT Secret',
    pattern: /jwt[_-]?secret\s*[=:]\s*['"]?([A-Za-z0-9+/=]{32,})['"]?/i,
    severity: 'high',
    description: 'JWT signing secret - used to sign/verify tokens',
    examples: ['JWT_SECRET=your-secret-key-here'],
  },
  
  // SSH Keys
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH)\s+PRIVATE KEY-----/,
    severity: 'high',
    description: 'SSH private key - grants server access',
    examples: ['-----BEGIN RSA PRIVATE KEY-----'],
  },
  
  // Generic patterns (more strict to reduce false positives)
  // Generic patterns (more strict to reduce false positives)
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key\s*[=:]\s*['"]?([A-Za-z0-9+/=_-]{32,})['"]?/i,
    severity: 'medium',
    description: 'Generic API key pattern (32+ characters to reduce false positives)',
    examples: ['API_KEY=abc123xyz...'],
  },
  {
    name: 'Generic Secret',
    pattern: /secret\s*[=:]\s*['"]?([A-Za-z0-9+/=_-]{32,})['"]?/i,
    severity: 'medium',
    description: 'Generic secret pattern (32+ characters to reduce false positives)',
    examples: ['SECRET=your-secret-value'],
  },
  {
    name: 'Password in Code',
    pattern: /password\s*[=:]\s*['"]?([A-Za-z0-9!@#$%^&*()_+-=]{16,})['"]?/i,
    severity: 'low',
    description: 'Potential password in code (16+ characters, may be false positive)',
    examples: ['password = "mypassword123"'],
  },
  
  // Slack
  {
    name: 'Slack Webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/i,
    severity: 'high',
    description: 'Slack webhook URL - can be used to send messages to Slack channels',
    examples: ['https://hooks.slack.com/services/EXAMPLE/EXAMPLE/EXAMPLE'], // Example placeholder only
  },
  {
    name: 'Slack Bot Token',
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,48}/,
    severity: 'high',
    description: 'Slack bot token - grants access to Slack API',
    examples: ['xoxb-EXAMPLE-EXAMPLE-EXAMPLE'], // Example placeholder only - not a real token
  },
  
  // Twilio
  {
    name: 'Twilio API Key',
    pattern: /SK[0-9a-fA-F]{32}/,
    severity: 'high',
    description: 'Twilio API Key - grants access to Twilio services',
    examples: ['SK00000000000000000000000000000000'], // Example placeholder
  },
  {
    name: 'Twilio Auth Token',
    pattern: /twilio[_-]?auth[_-]?token\s*[=:]\s*['"]?([0-9a-fA-F]{32})['"]?/i,
    severity: 'high',
    description: 'Twilio Auth Token',
    examples: ['TWILIO_AUTH_TOKEN=00000000000000000000000000000000'], // Example placeholder
  },
  
  // SendGrid
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[0-9A-Za-z_-]{22}\.[0-9A-Za-z_-]{43}/,
    severity: 'high',
    description: 'SendGrid API Key - grants access to SendGrid email service',
    examples: ['SG.1234567890abcdefghijklmnopqrstuvwxyz.1234567890abcdefghijklmnopqrstuvwxyz1234567890'],
  },
  
  // Firebase
  {
    name: 'Firebase API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/,
    severity: 'high',
    description: 'Firebase API Key (also matches Google API Key)',
    examples: ['AIzaSyDaGmWKa7JsR8H5fFTB2jX6w5K3vZ4xYzAb'],
  },
  {
    name: 'Firebase Service Account',
    pattern: /"type":\s*"service_account"[\s\S]*"private_key"/,
    severity: 'high',
    description: 'Firebase service account JSON with private key',
    examples: ['{"type": "service_account", "private_key": "-----BEGIN PRIVATE KEY-----"}'],
  },
  
  // Heroku
  {
    name: 'Heroku API Key',
    pattern: /[hH]eroku[_-]?[aA][pP][iI][_-]?[kK]ey\s*[=:]\s*['"]?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]?/i,
    severity: 'high',
    description: 'Heroku API Key',
    examples: ['HEROKU_API_KEY=12345678-1234-1234-1234-123456789012'],
  },
  
  // Mailgun
  {
    name: 'Mailgun API Key',
    pattern: /key-[0-9a-f]{32}/i,
    severity: 'high',
    description: 'Mailgun API Key',
    examples: ['key-1234567890abcdef1234567890abcdef'],
  },
  
  // Square
  {
    name: 'Square Access Token',
    pattern: /sq0atp-[0-9A-Za-z_-]{22}/,
    severity: 'high',
    description: 'Square Access Token',
    examples: ['sq0atp-1234567890abcdefghij'],
  },
  {
    name: 'Square OAuth Secret',
    pattern: /sq0csp-[0-9A-Za-z_-]{43}/,
    severity: 'high',
    description: 'Square OAuth Secret',
    examples: ['sq0csp-1234567890abcdefghijklmnopqrstuvwxyz1234567890'],
  },
  
  // PayPal
  {
    name: 'PayPal Client ID',
    pattern: /[Aa][Tt][Tt][-]?[Pp][Aa][Yy][Pp][Aa][Ll][-]?[Cc][Ll][Ii][Ee][Nn][Tt][-]?[Ii][Dd]\s*[=:]\s*['"]?([A-Za-z0-9_-]{80,})['"]?/i,
    severity: 'high',
    description: 'PayPal Client ID',
    examples: ['ATT-PAYPAL-CLIENT-ID=1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz'],
  },
  
  // Generic tokens
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[A-Za-z0-9\-._~+/]+=*/i,
    severity: 'medium',
    description: 'Bearer token (OAuth, JWT, etc.)',
    examples: ['Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
  },
  {
    name: 'Authorization Header',
    pattern: /authorization\s*[=:]\s*['"]?(bearer|basic|token)\s+[A-Za-z0-9\-._~+/=]+['"]?/i,
    severity: 'medium',
    description: 'Authorization header with token',
    examples: ['Authorization: Bearer token123...'],
  },
];

/**
 * Check if a line is likely a false positive (comment, example, placeholder, etc.)
 */
function isLikelyFalsePositive(line: string, match: string): boolean {
  const trimmedLine = line.trim().toLowerCase();
  const trimmedMatch = match.toLowerCase();
  
  // Skip comments
  if (trimmedLine.startsWith('//') || trimmedLine.startsWith('#') || trimmedLine.startsWith('*')) {
    return true;
  }
  
  // Skip example/placeholder patterns
  const falsePositivePatterns = [
    'example',
    'placeholder',
    'your-',
    'your_',
    'change-me',
    'change_me',
    'replace-me',
    'replace_me',
    'todo',
    'xxx',
    'test',
    'dummy',
    'sample',
    'demo',
    'example.com',
    'localhost',
    '127.0.0.1',
    'example_key',
    'example_secret',
    'example_password',
    'your_key_here',
    'your_secret_here',
    'your_password_here',
    'api_key_example',
    'secret_example',
  ];
  
  // Check if line contains false positive indicators
  if (falsePositivePatterns.some(pattern => trimmedLine.includes(pattern) || trimmedMatch.includes(pattern))) {
    return true;
  }
  
  // Skip if match is too generic/common (likely placeholder)
  const commonPlaceholders = [
    'changeme',
    'yourkey',
    'yoursecret',
    'yourpassword',
    'apikey',
    'secretkey',
    'password123',
    'test123',
    'demo123',
  ];
  
  if (commonPlaceholders.some(placeholder => trimmedMatch.includes(placeholder))) {
    return true;
  }
  
  // Skip if it's clearly a variable name pattern (not a value)
  // e.g., "const apiKey = ..." vs "api_key = 'actual_secret'"
  if (trimmedLine.match(/^(const|let|var|function|class|interface|type)\s+/)) {
    // Only skip if it's a generic pattern (not specific like AWS keys)
    if (match.length < 20) {
      return true;
    }
  }
  
  return false;
}

/**
 * Scan a file content for secrets
 */
export function scanFileContent(content: string, filePath: string): Array<{
  pattern: SecretPattern;
  match: string;
  line: number;
  context: string;
}> {
  const results: Array<{
    pattern: SecretPattern;
    match: string;
    line: number;
    context: string;
  }> = [];

  const lines = content.split('\n');

  lines.forEach((line, index) => {
    SECRET_PATTERNS.forEach((pattern) => {
      const matches = line.matchAll(new RegExp(pattern.pattern, 'g'));
      
      for (const match of matches) {
        const matchText = match[0];
        
        // Skip if likely a false positive
        if (isLikelyFalsePositive(line, matchText)) {
          continue;
        }
        
        // For generic patterns, apply stricter validation
        if (pattern.name === 'Generic API Key' || pattern.name === 'Generic Secret' || pattern.name === 'Password in Code') {
          // Skip if it looks like a variable name or example
          if (pattern.name === 'Generic API Key' || pattern.name === 'Generic Secret') {
            // Require at least 32 characters for API keys and secrets
            if (matchText.length < 32) {
              continue;
            }
          }
          
          if (pattern.name === 'Password in Code') {
            // Require at least 16 characters for passwords
            if (matchText.length < 16) {
              continue;
            }
          }
          
          // Skip common placeholder patterns
          if (matchText.match(/(example|placeholder|changeme|your|test|demo|dummy|sample|localhost|127\.0\.0\.1)/i)) {
            continue;
          }
          
          // Skip if it's clearly a hash/checksum (not a secret)
          // Most secrets don't look like MD5/SHA hashes
          if (matchText.match(/^[a-f0-9]{32}$/i) || matchText.match(/^[a-f0-9]{40}$/i) || matchText.match(/^[a-f0-9]{64}$/i)) {
            // Only skip if it's in a context that suggests it's a hash
            if (line.match(/(hash|checksum|md5|sha|digest)/i)) {
              continue;
            }
          }
        }
        
        // Get context (3 lines before and after)
        const start = Math.max(0, index - 3);
        const end = Math.min(lines.length, index + 4);
        const context = lines.slice(start, end).join('\n');

        results.push({
          pattern,
          match: matchText,
          line: index + 1,
          context,
        });
      }
    });
  });

  return results;
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CliTokenManager } from '../components/CliTokenManager';
import { ROUTES } from '../constants';

export function ApiPage() {
  const navigate = useNavigate();
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'curl' | 'node' | 'python' | 'go'>('curl');

  const copyToClipboard = (text: string, example: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(example);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/v1`;

  const codeExamples = {
    curl: `# Get a secret (returns plain text value)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "${apiUrl}/DATABASE_URL"

# Get with metadata (JSON format)
curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "${apiUrl}/DATABASE_URL?format=json"`,

    node: `const axios = require('axios');

const token = 'YOUR_TOKEN';
const apiUrl = '${apiUrl}';

// Simple function to get any secret
async function getSecret(name) {
  const response = await axios.get(
    \`\${apiUrl}/\${name}\`,
    { headers: { 'Authorization': \`Bearer \${token}\` } }
  );
  return response.data;
}

// Usage - load secrets at startup
async function loadSecrets() {
  const dbUrl = await getSecret('DATABASE_URL');
  const apiKey = await getSecret('API_KEY');
  const jwtSecret = await getSecret('JWT_SECRET');
  
  return { dbUrl, apiKey, jwtSecret };
}

// Use in your app
loadSecrets().then(secrets => {
  console.log('Database URL:', secrets.dbUrl);
  // Configure your app with the secrets
});`,

    python: `import requests
import os

TOKEN = os.getenv('VAULT_TOKEN')  # Store token in env var
API_URL = '${apiUrl}'

def get_secret(name: str) -> str:
    """
    Fetch a secret from the vault.
    Token scope determines project/environment/folder automatically.
    """
    response = requests.get(
        f"{API_URL}/{name}",
        headers={"Authorization": f"Bearer {TOKEN}"}
    )
    response.raise_for_status()
    return response.text

# Usage - load secrets at app startup
def load_config():
    return {
        'database_url': get_secret('DATABASE_URL'),
        'api_key': get_secret('API_KEY'),
        'jwt_secret': get_secret('JWT_SECRET'),
    }

# Use in your app
config = load_config()
print(f"Database URL: {config['database_url']}")`,

    go: `package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
    "os"
)

var (
    token  = os.Getenv("VAULT_TOKEN")
    apiURL = "${apiUrl}"
)

// GetSecret fetches a secret from the vault
// Token scope determines project/environment/folder automatically
func GetSecret(name string) (string, error) {
    url := fmt.Sprintf("%s/%s", apiURL, name)
    
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        return "", err
    }
    req.Header.Set("Authorization", "Bearer "+token)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return "", fmt.Errorf("API returned status %d", resp.StatusCode)
    }
    
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return "", err
    }
    
    return string(body), nil
}

// Usage - load secrets at app startup
type Config struct {
    DatabaseURL string
    APIKey      string
    JWTSecret   string
}

func LoadConfig() (*Config, error) {
    dbURL, err := GetSecret("DATABASE_URL")
    if err != nil {
        return nil, err
    }
    
    apiKey, err := GetSecret("API_KEY")
    if err != nil {
        return nil, err
    }
    
    jwtSecret, err := GetSecret("JWT_SECRET")
    if err != nil {
        return nil, err
    }
    
    return &Config{
        DatabaseURL: dbURL,
        APIKey:      apiKey,
        JWTSecret:   jwtSecret,
    }, nil
}

func main() {
    config, err := LoadConfig()
    if err != nil {
        panic(err)
    }
    fmt.Println("Database URL:", config.DatabaseURL)
}`
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Documentation</h1>
          <p className="text-gray-400">Access your secrets programmatically using our REST API</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span>API Online</span>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="hover-lift border-emerald-500/30">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <CardTitle className="text-white">Quick Start - 3 Simple Steps</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-white text-sm">Create Token</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Navigate to any folder (e.g., <strong className="text-gray-300">Development → default</strong>), 
                go to the <strong className="text-gray-300">Access</strong> tab, and click <strong className="text-gray-300">Generate</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-white text-sm">Copy Token</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Copy the token from the modal. Store it securely as an environment variable - you won't see it again!
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-white text-sm">Make API Calls</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Use the code examples below. Just provide the <strong className="text-gray-300">token</strong> and <strong className="text-gray-300">secret name</strong> - that's it!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoint Reference */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">API Endpoint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">Base URL</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-900 rounded-lg border border-gray-700">
                <code className="text-emerald-400 font-mono text-sm">{apiUrl}</code>
              </div>
              <button
                onClick={() => copyToClipboard(apiUrl, 'baseUrl')}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
              >
                {copiedExample === 'baseUrl' ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Simple Endpoint - Recommended */}
          <div className="bg-emerald-500/5 border-2 border-emerald-500/30 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-sm font-semibold text-emerald-400">Recommended Endpoint</h3>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">GET</span>
                <code className="text-emerald-300 text-base font-mono font-semibold">
                  /{'{secretName}'}
                </code>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Header:</span>
                  <code className="text-gray-300 font-mono">Authorization: Bearer YOUR_TOKEN</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Returns:</span>
                  <span className="text-gray-300">Plain text secret value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-20">Optional:</span>
                  <code className="text-gray-300 font-mono">?format=json</code>
                  <span className="text-gray-400">for metadata</span>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-xs text-emerald-300 leading-relaxed">
                ✨ <strong>Smart Endpoint:</strong> The token automatically determines the project, environment, and folder. 
                You only need to provide the secret name!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Personal Access Tokens
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Created per folder (scoped to specific environment/folder)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Supports read/write permissions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Optional expiration dates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>IP allowlisting supported</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Code Examples</CardTitle>
            <div className="flex gap-2">
              {(['curl', 'node', 'python', 'go'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeLanguage === lang
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'node' ? 'Node.js' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <button
              onClick={() => copyToClipboard(codeExamples[activeLanguage], activeLanguage)}
              className="absolute top-3 right-3 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 flex items-center gap-2"
            >
              {copiedExample === activeLanguage ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <pre className="bg-gray-900 p-5 rounded-lg border border-gray-700 overflow-x-auto">
              <code className="text-sm text-gray-300 font-mono leading-relaxed">{codeExamples[activeLanguage]}</code>
            </pre>
          </div>
          
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Tip:</strong> Replace <code className="bg-gray-900 px-1 py-0.5 rounded">YOUR_TOKEN</code> with your actual token. 
              The token determines which project/environment/folder to fetch from automatically.</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Request & Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Request Format */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-white text-base">Request Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Endpoint</h4>
              <code className="block px-3 py-2 bg-gray-900 text-emerald-400 rounded-lg border border-gray-700 font-mono text-sm">
                GET /{'{secretName}'}
              </code>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Headers</h4>
              <code className="block px-3 py-2 bg-gray-900 text-gray-300 rounded-lg border border-gray-700 font-mono text-xs">
                Authorization: Bearer YOUR_TOKEN
              </code>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Query Params (Optional)</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2 px-3 py-2 bg-gray-900 rounded border border-gray-700">
                  <code className="text-emerald-400 font-mono">format</code>
                  <span className="text-gray-500">-</span>
                  <span className="text-gray-400">Set to <code className="text-gray-300 bg-gray-800 px-1 rounded">json</code> to get metadata</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-white text-base">Response Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Default (Plain Text)</h4>
              <pre className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-700">
                <code className="text-emerald-400 font-mono text-sm">agadg</code>
              </pre>
              <p className="text-xs text-gray-500 mt-2">Returns just the secret value - perfect for direct use</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">JSON Format</h4>
              <pre className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-700 overflow-x-auto text-xs">
                <code className="text-gray-300 font-mono leading-relaxed">{`{
  "name": "DATABASE_URL",
  "value": "agadg",
  "environment": "development",
  "folder": "default",
  "type": "API_KEY",
  "updatedAt": "2025-11-02T..."
}`}</code>
              </pre>
              <p className="text-xs text-gray-500 mt-2">Add <code className="text-emerald-400 bg-gray-900 px-1 rounded">?format=json</code> to get metadata</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Scoping */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">How Token Scoping Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Tokens created in different folders are automatically scoped to their respective environments. 
              This provides <strong>automatic security isolation</strong> without any manual configuration.
            </p>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-3">Example Scenario:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded">Dev Token</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 mb-1">Created in: <code className="text-emerald-400 bg-gray-900 px-1.5 py-0.5 rounded text-xs">Development → default</code></p>
                    <p className="text-gray-500 text-xs">✓ Can access development secrets only</p>
                    <p className="text-gray-500 text-xs">✗ Cannot access staging or production secrets</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-mono rounded">Staging Token</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 mb-1">Created in: <code className="text-emerald-400 bg-gray-900 px-1.5 py-0.5 rounded text-xs">Staging → default</code></p>
                    <p className="text-gray-500 text-xs">✓ Can access staging secrets only</p>
                    <p className="text-gray-500 text-xs">✗ Cannot access development or production secrets</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-mono rounded">Prod Token</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 mb-1">Created in: <code className="text-emerald-400 bg-gray-900 px-1.5 py-0.5 rounded text-xs">Production → default</code></p>
                    <p className="text-gray-500 text-xs">✓ Can access production secrets only</p>
                    <p className="text-gray-500 text-xs">✗ Cannot access development or staging secrets</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Security Best Practices</h4>
                  <ul className="space-y-1 text-xs text-gray-300">
                    <li>• Store tokens in environment variables, never in code</li>
                    <li>• Use separate tokens for dev, staging, and production</li>
                    <li>• Set expiration dates on tokens (recommended: 90 days)</li>
                    <li>• Rotate tokens regularly</li>
                    <li>• Revoke unused tokens immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">Error Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Meaning</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Solution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                <tr className="bg-gray-900/30">
                  <td className="px-4 py-3">
                    <code className="text-red-400 font-mono font-semibold">401</code>
                  </td>
                  <td className="px-4 py-3 text-gray-300">Unauthorized</td>
                  <td className="px-4 py-3 text-xs text-gray-400">Check your token is correct and included in the Authorization header</td>
                </tr>
                <tr className="bg-gray-900/30">
                  <td className="px-4 py-3">
                    <code className="text-orange-400 font-mono font-semibold">403</code>
                  </td>
                  <td className="px-4 py-3 text-gray-300">Forbidden</td>
                  <td className="px-4 py-3 text-xs text-gray-400">Token doesn't have permission or is scoped to different env/folder</td>
                </tr>
                <tr className="bg-gray-900/30">
                  <td className="px-4 py-3">
                    <code className="text-yellow-400 font-mono font-semibold">404</code>
                  </td>
                  <td className="px-4 py-3 text-gray-300">Not Found</td>
                  <td className="px-4 py-3 text-xs text-gray-400">Secret name doesn't exist in the token's scoped folder</td>
                </tr>
                <tr className="bg-gray-900/30">
                  <td className="px-4 py-3">
                    <code className="text-emerald-400 font-mono font-semibold">200</code>
                  </td>
                  <td className="px-4 py-3 text-gray-300">Success</td>
                  <td className="px-4 py-3 text-xs text-gray-400">Secret value returned successfully</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white">Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CI/CD */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h4 className="text-sm font-semibold text-white">CI/CD Pipelines</h4>
              </div>
              <pre className="text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-x-auto">
                <code className="text-gray-300 font-mono">{`# GitHub Actions
env:
  DB_URL: \${{ secrets.VAULT_TOKEN }}
  
run: |
  curl -H "Authorization: Bearer $DB_URL" \\
    "$API_URL/DATABASE_URL"`}</code>
              </pre>
            </div>

            {/* Docker */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h4 className="text-sm font-semibold text-white">Docker Containers</h4>
              </div>
              <pre className="text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-x-auto">
                <code className="text-gray-300 font-mono">{`# Dockerfile entrypoint
#!/bin/sh
export DB_URL=$(curl -H \\
  "Authorization: Bearer $VAULT_TOKEN" \\
  "$API_URL/simple/DATABASE_URL")
  
exec "$@"`}</code>
              </pre>
            </div>

            {/* Kubernetes */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <h4 className="text-sm font-semibold text-white">Kubernetes Init Containers</h4>
              </div>
              <pre className="text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-x-auto">
                <code className="text-gray-300 font-mono">{`initContainers:
- name: fetch-secrets
  image: curlimages/curl
  command: [sh, -c]
  args:
  - curl -H "Authorization: Bearer..."
    "$API_URL/API_KEY" 
    > /secrets/api_key`}</code>
              </pre>
            </div>

            {/* Application Startup */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h4 className="text-sm font-semibold text-white">Application Startup</h4>
              </div>
              <pre className="text-xs bg-gray-900 p-3 rounded border border-gray-700 overflow-x-auto">
                <code className="text-gray-300 font-mono">{`// Load all secrets on startup
const config = {
  db: await getSecret('DATABASE_URL'),
  redis: await getSecret('REDIS_URL'),
  apiKey: await getSecret('API_KEY'),
  jwt: await getSecret('JWT_SECRET')
};`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Section */}
      <Card className="hover-lift border-emerald-500/30">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <CardTitle className="text-white">Test Your API</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-3">Try it now with cURL:</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">1. Get your token from any folder's Access tab</label>
                <div className="px-3 py-2 bg-gray-800 rounded text-xs text-gray-500 font-mono">
                  Example: pat_abc123xyz...
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-400 mb-1 block">2. Run this command in your terminal:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-800 text-emerald-400 rounded text-xs font-mono overflow-x-auto">
                    curl -H "Authorization: Bearer YOUR_TOKEN" "{apiUrl}/DATABASE_URL"
                  </code>
                  <button
                    onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_TOKEN" "${apiUrl}/DATABASE_URL"`, 'test')}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors text-xs"
                  >
                    {copiedExample === 'test' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">3. You should get back:</label>
                <div className="px-3 py-2 bg-gray-800 rounded text-xs text-emerald-400 font-mono">
                  agadg
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CLI Access Section */}
      <Card className="hover-lift border-purple-500/30">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <CardTitle className="text-white">CLI Access (Doppler-style)</CardTitle>
            </div>
            <button
              onClick={() => navigate(ROUTES.CLI_GUIDE)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-500/40 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              View Full CLI Guide
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-sm text-purple-300 leading-relaxed">
              Use our command-line interface to inject secrets as environment variables into your applications. 
              Similar to Doppler, our CLI securely fetches secrets and injects them into your process without storing them on disk.
            </p>
          </div>

          {/* Installation */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Installation</h3>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <pre className="text-sm text-gray-300 font-mono">
                <code>{`# Install via npm (recommended)
npm install -g @keyvault/cli

# Or via Homebrew (macOS)
brew install keyvault/cli/keyvault

# Or download binary from GitHub releases
# https://github.com/your-org/keyvault-cli/releases`}</code>
              </pre>
              <button
                onClick={() => copyToClipboard('npm install -g @keyvault/cli', 'install')}
                className="mt-3 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
              >
                {copiedExample === 'install' ? '✓ Copied' : 'Copy Install Command'}
              </button>
            </div>
          </div>

          {/* Quick Start */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Start</h3>
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-semibold text-white">Install the CLI</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-300 font-mono">
                    <code>npm install -g @keyvault/cli</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard('npm install -g @keyvault/cli', 'cli-install')}
                    className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
                  >
                    {copiedExample === 'cli-install' ? '✓ Copied' : 'Copy command'}
                  </button>
                  <p className="text-sm text-gray-400">
                    Prefer Homebrew, tarballs, or Docker? See the full guide for upcoming alternative installers.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">
                    2
                  </div>
                  <h4 className="font-semibold text-white">Authenticate via Browser</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-300 font-mono">
                    <code>keyvault login</code>
                  </pre>
                  <p className="text-sm text-gray-400">
                    A browser window opens to <code className="bg-gray-900 px-1 rounded text-xs">/cli/auth</code>. Sign in, click <strong>Give Access</strong>, and the CLI stores your token securely on this device.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">
                    3
                  </div>
                  <h4 className="font-semibold text-white">Choose Defaults</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-300 font-mono">
                    <code>keyvault setup</code>
                  </pre>
                  <p className="text-sm text-gray-400">
                    Select your organization, project, environment, and folder once per repo. We save them to <code className="bg-gray-900 px-1 rounded text-xs">.keyvault.yaml</code> (never commit this file).
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">
                    4
                  </div>
                  <h4 className="font-semibold text-white">Run Your Application</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-300 font-mono">
                    <code>keyvault run -- npm start</code>
                  </pre>
                  <p className="text-sm text-gray-400">
                    Secrets are injected as environment variables at runtime (e.g., <code className="bg-gray-900 px-1 rounded text-xs">process.env.SECRET_NAME</code>, <code className="bg-gray-900 px-1 rounded text-xs">os.environ['SECRET_NAME']</code>).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CLI Token Management */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Manage CLI Tokens</h3>
            <p className="text-sm text-gray-400 mb-3">
              Every browser authorization creates a scoped CLI token. Use the manager below to revoke old devices, rename tokens, or generate manual tokens for automation.
            </p>
            <CliTokenManager />
          </div>

          {/* CLI Examples */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Usage Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-2 text-sm">Node.js Application</h4>
                <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto">
                  <code>{`keyvault run -- npm start

# Your app can access:
process.env.DATABASE_URL
process.env.API_KEY`}</code>
                </pre>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-2 text-sm">Python Application</h4>
                <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto">
                  <code>{`keyvault run -- python app.py

# Your app can access:
import os
os.environ['DATABASE_URL']
os.environ['API_KEY']`}</code>
                </pre>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-2 text-sm">Docker Container</h4>
                <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto">
                  <code>{`keyvault run -- docker run \\
  -e DATABASE_URL \\
  -e API_KEY \\
  my-app:latest`}</code>
                </pre>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-2 text-sm">CI/CD Pipeline</h4>
                <pre className="bg-gray-900 p-3 rounded border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto">
                  <code>{`# .github/workflows/deploy.yml
- name: Run tests
  run: keyvault run -- npm test`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Security Notes */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Security Best Practices</h4>
                <ul className="space-y-1 text-xs text-yellow-200">
                  <li>• Secrets are injected in memory only - never written to disk</li>
                  <li>• CLI tokens are user-scoped and inherit your RBAC permissions</li>
                  <li>• Use separate tokens for different machines/environments</li>
                  <li>• Rotate CLI tokens regularly (recommended: every 90 days)</li>
                  <li>• Never commit <code className="bg-gray-900 px-1 rounded">.keyvault.yaml</code> or tokens to version control</li>
                  <li>• Revoke unused tokens immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const ApiPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Reference</h1>
          <p className="text-gray-400 text-sm mt-1">Programmatic access to project secrets using Project Tokens. Tokens inherit your RBAC permissions for the selected workspace and project.</p>
        </div>
      </div>

      {/* Authentication */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-300 text-sm mb-4">Send your Project Token in the Authorization header.</p>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>Authorization: Bearer &lt;PROJECT_TOKEN&gt;</code></pre>
          <p className="text-gray-400 text-sm mt-3">Create tokens in <span className="text-white font-medium">API → Tokens</span>. Each token is scoped to a single project.</p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="text-sm text-gray-300 space-y-2">
            <div>
              <div className="font-mono text-emerald-300">GET /api/v1/secrets/:name</div>
              <div className="text-gray-400">Resolves project from token. Returns <span className="font-mono">text/plain</span> secret value by default. Add <span className="font-mono">?format=json</span> for JSON. Supports <span className="font-mono">env</span> and <span className="font-mono">folder</span> query params.</div>
            </div>
            <div>
              <div className="font-mono text-emerald-300">GET /api/v1/o/:orgSlug/p/:projectSlug/secrets/:name</div>
              <div className="text-gray-400">Explicit org/project via slugs. Default <span className="font-mono">text/plain</span>. Add <span className="font-mono">?format=json</span> for JSON.</div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-white text-sm font-semibold mb-2">Query Parameters</h3>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
              <li><span className="font-mono">env</span> (optional): environment filter (e.g., <span className="font-mono">production</span>, <span className="font-mono">staging</span>, <span className="font-mono">development</span>)</li>
              <li><span className="font-mono">folder</span> (optional): folder filter (e.g., <span className="font-mono">backend</span>, <span className="font-mono">billing</span>)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Responses */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Responses</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <h3 className="text-white text-sm font-semibold mb-1">Success 200 (default)</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>text/plain
postgresql://...</code></pre>
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-1">Success 200 (JSON)</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`{
  "name": "DATABASE_URL",
  "value": "postgresql://...",
  "environment": "production",
  "folder": "backend",
  "type": "DATABASE_URL"
}`}</code></pre>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-white text-sm font-semibold mb-1">401 Unauthorized</h3>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`{
  "error": "Invalid or missing token"
}`}</code></pre>
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-1">403 Forbidden</h3>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`{
  "error": "Insufficient permissions"
}`}</code></pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Helper Functions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-gray-300 text-sm mb-4">Copy these functions into your project. Set <span className="font-mono text-gray-200">PROJECT_TOKEN</span> in your environment variables.</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-white text-sm font-semibold mb-2">JavaScript / Node.js</h3>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`// kv.js
const BASE = process.env.KV_BASE_URL || 'http://localhost:4000';
const TOKEN = process.env.PROJECT_TOKEN;

async function getSecret(name, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = BASE + '/api/v1/secrets/' + name + (query ? ('?' + query) : '');
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.text();
}

// Usage:
// const dbUrl = await getSecret('DATABASE_URL', { env: 'production' });
// console.log(dbUrl);`}</code></pre>
            </div>
            <div>
              <h3 className="text-white text-sm font-semibold mb-2">Python</h3>
              <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`# kv.py
import os
import requests

BASE = os.getenv("KV_BASE_URL", "http://localhost:4000")
TOKEN = os.environ["PROJECT_TOKEN"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def get_secret(name: str, **params) -> str:
    r = requests.get(f"{BASE}/api/v1/secrets/{name}", params=params, headers=HEADERS)
    r.raise_for_status()
    return r.text

# Usage:
# db_url = get_secret("DATABASE_URL", env="production")
# print(db_url)`}</code></pre>
            </div>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-2">Next.js</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`// lib/kv.ts or utils/kv.ts
const BASE = process.env.KV_BASE_URL || 'http://localhost:4000';
const TOKEN = process.env.PROJECT_TOKEN;

export async function getSecret(name: string, params: Record<string, string> = {}): Promise<string> {
  const query = new URLSearchParams(params).toString();
  const url = BASE + '/api/v1/secrets/' + name + (query ? ('?' + query) : '');
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + TOKEN },
    cache: 'no-store', // or 'force-cache' for static secrets
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.text();
}

// Usage in Server Components:
// const dbUrl = await getSecret('DATABASE_URL', { env: 'production' });

// Usage in API Routes:
// export async function GET() {
//   const apiKey = await getSecret('API_KEY', { env: 'production' });
//   return Response.json({ apiKey });
// }`}</code></pre>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-2">curl (Direct API)</h3>
            <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-200 border border-gray-700"><code>{`# Default: returns plain secret value
curl -s \
  -H "Authorization: Bearer $PROJECT_TOKEN" \
  "http://localhost:4000/api/v1/secrets/DATABASE_URL?env=production"

# JSON format
curl -s \
  -H "Authorization: Bearer $PROJECT_TOKEN" \
  "http://localhost:4000/api/v1/secrets/DATABASE_URL?env=production&format=json"

# With folder filter (plain value)
curl -s \
  -H "Authorization: Bearer $PROJECT_TOKEN" \
  "http://localhost:4000/api/v1/secrets/STRIPE_KEY?env=staging&folder=billing"`}</code></pre>
          </div>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Behavior & Security</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>Tokens are project-scoped and inherit your project role (OWNER/ADMIN/WRITE/READ).</li>
            <li>Optional allowlists on token can restrict environments and folders.</li>
            <li>All access is logged (time, token, user, secret name, env/folder, IP).</li>
            <li>Rotate tokens by deleting and creating a new one.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card className="hover-lift">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-400">
            Base URL (local): <span className="font-mono text-gray-300">http://localhost:4000</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



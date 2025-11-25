import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="space-y-1">
    <h2 className="text-2xl font-semibold text-white">{title}</h2>
    {subtitle ? <p className="text-gray-400 text-sm">{subtitle}</p> : null}
  </div>
);

const CodeBlock = ({ children }: { children: string }) => (
  <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const ListItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-2 text-sm text-gray-300">
    <span className="text-emerald-400 mt-1">•</span>
    <span>{text}</span>
  </li>
);

export function CliGuidePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fade-in">
      <SectionTitle
        title="APIVault CLI Guide"
        subtitle="Authenticate via browser, configure your workspace, and inject secrets into any command in seconds."
      />

      <Card className="hover-lift border-emerald-500/30">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
          <CardTitle className="text-white text-lg">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            The APIVault CLI delivers a secure, Doppler-style workflow. Authenticate through a device-code browser flow,
            choose your project/environment/folder, and run any command with secrets injected as environment variables.
            Secrets never touch disk—they live in memory for the lifetime of the process you launch.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm text-white font-semibold mb-2">Prerequisites</h3>
            <ul className="space-y-1.5">
              <ListItem text="Node.js 18 or newer (for npm installations)" />
              <ListItem text="Access to an APIVault workspace" />
              <ListItem text="Outbound HTTPS access to https://key-vault-new.onrender.com" />
              <ListItem text="For air-gapped setups: download the binary release or use the Docker image (coming soon)" />
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Install the CLI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock>{`# Recommended global install
npm install -g @keyvault/cli

# Pin a specific version
npm install -g @keyvault/cli@0.1.0`}</CodeBlock>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
            <p className="font-semibold mb-1">Alternative installation paths (coming soon)</p>
            <ul className="space-y-1">
              <ListItem text="Homebrew: brew install keyvault/cli/keyvault" />
              <ListItem text="Tarball / binary download from GitHub Releases" />
              <ListItem text="Docker image: docker run keyvault/cli" />
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Authenticate (Device Code Flow)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock>{`keyvault login`}</CodeBlock>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>The CLI opens <code className="bg-gray-900 px-1 py-0.5 rounded">/cli/auth</code> in your browser.</li>
            <li>Sign in (email/password or Google) and click <strong>Give Access</strong>.</li>
            <li>The CLI stores an encrypted token in <code className="bg-gray-900 px-1 py-0.5 rounded">~/.config/keyvault/config.yaml</code> (macOS/Linux) or <code className="bg-gray-900 px-1 py-0.5 rounded">%APPDATA%\keyvault\config.yaml</code> (Windows).</li>
          </ol>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-sm text-purple-200">
            <p className="font-semibold mb-1">Custom environments</p>
            <p className="mb-2 text-purple-100">Point the CLI at another backend (staging, self-hosted, etc.):</p>
            <CodeBlock>{`export KEYVAULT_API_URL=https://your-api.example.com
keyvault login`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Configure Project Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock>{`keyvault setup`}</CodeBlock>
          <p className="text-sm text-gray-300 leading-relaxed">
            Choose your organization, project, environment, and folder once per repository. The selection is saved to
            <code className="bg-gray-900 px-1 py-0.5 rounded text-xs ml-1">.keyvault.yaml</code> (do not commit this file).
            Run the command again whenever you need different defaults.
          </p>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Inject Secrets into Any Command</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-300 leading-relaxed">
            Use <code className="bg-gray-900 px-1 py-0.5 rounded text-xs">keyvault run -- &lt;command&gt;</code> to hydrate environment variables
            before launching your process. Secrets are available via the standard environment lookup for every language.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CodeBlock>{`# Node.js
keyvault run -- npm start

// Inside your app
process.env.DATABASE_URL`}</CodeBlock>
            <CodeBlock>{`# Python
keyvault run -- python app.py

# Inside your app
import os
os.environ['API_KEY']`}</CodeBlock>
            <CodeBlock>{`# Docker
keyvault run -- docker compose up`}</CodeBlock>
            <CodeBlock>{`# GitHub Actions
- name: Run tests
  run: keyvault run -- npm test`}</CodeBlock>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-white mb-2">Key files</h3>
            <table className="w-full text-sm text-gray-300">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left pb-2">File</th>
                  <th className="text-left pb-2">Purpose</th>
                  <th className="text-left pb-2">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                <tr>
                  <td className="py-2 font-mono text-xs">~/.config/keyvault/config.yaml</td>
                  <td className="py-2">Encrypted CLI tokens per device</td>
                  <td className="py-2">User home directory</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">.keyvault.yaml</td>
                  <td className="py-2">Project defaults (project/env/folder)</td>
                  <td className="py-2">Current project root</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">Security best practices</h3>
            <ul className="space-y-1 text-xs text-yellow-100">
              <li>• Log in separately on every machine; revoke old tokens from the UI under <strong>Access → CLI Tokens</strong>.</li>
              <li>• Rotate CLI tokens roughly every 90 days (UI today, automated command coming soon).</li>
              <li>• Never commit `.keyvault.yaml` or token values to version control.</li>
              <li>• Prefer ephemeral tokens for CI jobs; revoke after use.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-white text-lg">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div className="bg-gray-900/60 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Symptom</th>
                  <th className="text-left px-4 py-3">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="px-4 py-3">`fetch failed`</td>
                  <td className="px-4 py-3">Verify the backend is reachable (`curl $KEYVAULT_API_URL/health`) and the URL is correct.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">`Authorization expired`</td>
                  <td className="px-4 py-3">Complete the browser authorization within 10 minutes; rerun `keyvault login` if needed.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">`Device code not found`</td>
                  <td className="px-4 py-3">The code was already used or expired. Start a new session with `keyvault login`.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">`Invalid token` after approval</td>
                  <td className="px-4 py-3">Ensure you are signed into the web app before clicking “Give Access”.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">`keyvault: command not found`</td>
                  <td className="px-4 py-3">Install globally via npm or download the standalone binary/Docker image.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            Still stuck? Collect the output of <code className="bg-gray-900 px-1 py-0.5 rounded text-xs">keyvault --version</code> and the timestamp of your run,
            then contact support. Backend auth logs contain detailed diagnostics for each request.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

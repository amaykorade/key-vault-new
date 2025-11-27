import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { SEO, getOrganizationSchema, getSoftwareApplicationSchema, getFAQSchema } from '../components/SEO';
import { trackPageView } from '../components/GoogleAnalytics';
import { useEffect } from 'react';
import { Button } from '../components/ui/Button';

const sectionSpacing = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

const CHECK_ICON = (
  <svg className="h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export function LandingPage() {
  useEffect(() => {
    trackPageView('/');
  }, []);

  const faqs = [
    { 
      question: 'How does APIVault encrypt my secrets?', 
      answer: 'We use AES-256 encryption, the same military-grade standard used by banks and government agencies. Your secrets are encrypted on your device before being sent to our servers using zero-knowledge architecture. This means APIVault staff cannot access your keys even if we wanted to. Only you hold the decryption keys. All data is encrypted at rest and in transit using TLS 1.3.' 
    },
    { 
      question: 'Can I use APIVault with Vercel?', 
      answer: 'Yes! APIVault has native Vercel integration. Connect your Vercel account with one click, select which projects to sync, and your environment variables will automatically stay up-to-date. When you add, update, or delete a secret in APIVault, it syncs to Vercel within seconds. No more manual copying between dashboards.' 
    },
    { 
      question: 'What\'s the difference between Free and Pro plans?', 
      answer: 'The Free plan is perfect for solo developers with up to 50 API keys across 3 projects. It includes CLI/API access and 30 days of audit logs. The Pro plan ($9/month) gives you unlimited keys and projects, Vercel integration, 1-year audit log retention, priority support, and higher API rate limits. See our full pricing comparison at /pricing.' 
    },
    { 
      question: 'Is my data secure?', 
      answer: 'Absolutely. We implement multiple layers of security: AES-256 encryption at rest, TLS 1.3 encryption in transit, zero-knowledge architecture (we can\'t access your keys), regular security audits, automatic encrypted backups, and SOC 2 Type II compliance (in progress). Your secrets are protected by the same standards used by Fortune 500 companies.' 
    },
    { 
      question: 'Can I export my secrets if I leave APIVault?', 
      answer: 'Yes, always. You can export all your secrets at any time in JSON or .env format with one click. There\'s no vendor lock-in. We believe you should own your data. If you cancel your subscription, you\'ll have 30 days to export everything before permanent deletion.' 
    },
    { 
      question: 'Do you support team access and permissions?', 
      answer: 'Team features including role-based access control (RBAC), team member management, and granular permissions are coming in our Team plan (launching Q1 2026). Join our early access waitlist to be notified when it launches. Free and Pro plans are currently single-user focused.' 
    },
    { 
      question: 'What if I accidentally commit a secret to GitHub?', 
      answer: 'APIVault helps prevent this by centralizing secret storage so you never need .env files in your repos. If you do leak a key, use our instant key rotation feature to update it across all environments in seconds. No redeploying required. We also recommend using our GitHub integration (coming soon) to scan for leaked secrets automatically.' 
    },
    { 
      question: 'How long does setup take?', 
      answer: 'Most developers are up and running in under 5 minutes. Sign up, add your first secret, install our CLI (optional), and you\'re done. If you want Vercel integration, add another 2 minutes for one-click OAuth connection. No complex configuration, no DevOps knowledge required.' 
    },
    { 
      question: 'Can I use APIVault in CI/CD pipelines?', 
      answer: 'Yes! Use our REST API to fetch secrets in GitHub Actions, GitLab CI, CircleCI, Jenkins, or any CI/CD tool. We provide secure token-based authentication with scoped permissions. Check our API documentation for code examples in Node.js, Python, Go, Ruby, and curl. Rate limits: 10,000 requests/day (Pro), 100,000/day (Team).' 
    },
    { 
      question: 'What happens if APIVault goes down?', 
      answer: 'Your secrets are always yours. You can export them anytime for local backups. We maintain 99.9% uptime with redundant infrastructure, automatic failover, and real-time monitoring. In the unlikely event of extended downtime, you still have access to previously cached secrets locally and can switch to exported .env files as a backup.' 
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationSchema(),
      getSoftwareApplicationSchema(),
      getFAQSchema(faqs),
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <SEO
        title="Never Lose an API Key Again: Secure API Key Management for Developers"
        description="Stop juggling scattered secrets across Slack, notes, and .env files. Store, rotate, and share API keys securely all from one encrypted dashboard."
        url="/"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className={`pt-20 pb-16 ${sectionSpacing}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Never Lose an API Key Again
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl">
              Stop juggling scattered secrets across Slack, notes, and .env files. Store, rotate, and share API keys securely all from one encrypted dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={ROUTES.SIGNUP}>
                <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                  Get Started Free →
                </Button>
              </Link>
              <Link to={ROUTES.DOCS}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {CHECK_ICON}
                <span>AES-256 Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {CHECK_ICON}
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {CHECK_ICON}
                <span>2-Minute Setup</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {CHECK_ICON}
                <span>No Credit Card Required</span>
              </div>
            </div>
          </div>

          {/* Visual Placeholder - Dashboard Screenshot */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gray-900/60 p-6 shadow-2xl">
            <div className="absolute -top-12 right-6 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
            <div className="relative space-y-4 text-sm text-gray-300">
                <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
                  <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Project</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Active</span>
                </div>
                  <p className="text-base font-semibold text-white mb-4">Stripe Production</p>
                  <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                      <span className="text-gray-400">API Key</span>
                      <span className="text-gray-200 font-mono">sk_live_93f3...</span>
                  </div>
                  <div className="flex items-center justify-between">
                      <span className="text-gray-400">Last accessed</span>
                      <span className="text-gray-200">2 hours ago</span>
                  </div>
                </div>
              </div>

                <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>aws_access_key_id</span>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 font-mono">
                    AKIAIOSFODNN7EXAMPLE
                </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

      {/* Social Proof Bar */}
      <section className={`py-12 border-y border-gray-800 ${sectionSpacing}`}>
        <div className="text-center space-y-6">
          <p className="text-lg font-semibold text-gray-300">
            Trusted by indie developers and small teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <span className="text-sm text-gray-400 font-medium">GitHub Repositories</span>
            <span className="text-sm text-gray-400 font-medium">Vercel Projects</span>
            <span className="text-sm text-gray-400 font-medium">Indie Startups</span>
            <span className="text-sm text-gray-400 font-medium">SaaS Builders</span>
          </div>
          </div>
        </section>

      {/* Problem Statement Section */}
      <section className={`py-20 ${sectionSpacing}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            The API Key Management Problem Every Developer Faces
          </h2>
                </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Problem 1: Scattered Everywhere */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <h3 className="text-xl font-semibold text-white mb-4">Scattered Everywhere</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>API keys buried in .env files, notes apps, Slack messages, and email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Hard to find credentials when you urgently need them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Risk of losing access to critical services permanently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>No single source of truth for your secrets</span>
              </li>
            </ul>
              </div>

          {/* Problem 2: Security Nightmares */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <h3 className="text-xl font-semibold text-white mb-4">Security Nightmares</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Accidentally commit secrets to public GitHub repositories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Share API keys via insecure channels like Slack or email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>No audit trail of who accessed which secrets and when</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Keys exposed in commit history even after deletion</span>
              </li>
            </ul>
            </div>

          {/* Problem 3: Team Chaos */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <h3 className="text-xl font-semibold text-white mb-4">Team Chaos</h3>
              <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Teammates locked out when they need access to keys</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Manual key rotation across 10+ different services</span>
                </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>No centralized way to control permissions</span>
                </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>Onboarding nightmare: "Where are all the API keys?"</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

      {/* Use Cases Section */}
      <section className={`py-20 ${sectionSpacing}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Built for Indie Developers and Small Teams
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Use Case 1: Solo Developers */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <blockquote className="text-gray-300 italic mb-6 text-sm">
              "I'm tired of .env files scattered across 10 different projects"
            </blockquote>
            <h3 className="text-xl font-semibold text-white mb-4">Solo Developers</h3>
            <ul className="space-y-3 text-sm text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Centralize all your API keys in one secure dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Access secrets from CLI, API, or Vercel integration</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Stop accidentally committing credentials to GitHub</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Find any key in seconds with powerful search</span>
              </li>
            </ul>
            <p className="text-xs text-gray-400">
              Perfect for: Freelancers, indie hackers, side project builders, solo founders
            </p>
          </div>

          {/* Use Case 2: Small Teams */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <blockquote className="text-gray-300 italic mb-6 text-sm">
              "We need a simple way to share keys securely without Slack"
            </blockquote>
            <h3 className="text-xl font-semibold text-white mb-4">Small Teams</h3>
            <ul className="space-y-3 text-sm text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Centralized secret storage accessible to the whole team</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>No more Slack screenshots, email attachments, or shared password managers</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Audit logs show exactly who accessed what and when</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Onboard new developers in minutes, not hours</span>
              </li>
            </ul>
            <p className="text-xs text-gray-400">
              Perfect for: Startups, agencies, small dev teams (2-10 people), remote teams
            </p>
          </div>

          {/* Use Case 3: Project Founders */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 hover:border-emerald-500/40 transition-all">
            <blockquote className="text-gray-300 italic mb-6 text-sm">
              "I deploy to Vercel and Railway. Manual secret management is killing me"
            </blockquote>
            <h3 className="text-xl font-semibold text-white mb-4">Project Founders</h3>
            <ul className="space-y-3 text-sm text-gray-300 mb-6">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Auto-sync secrets with Vercel projects (one-click setup)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Use REST API for Railway, Docker, Render, and CI/CD</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Multi-environment support for dev, staging, and production</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Rotate keys instantly when switching services</span>
              </li>
            </ul>
            <p className="text-xs text-gray-400">
              Perfect for: SaaS founders, bootstrapped startups, MVP builders, multi-cloud deployers
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to={ROUTES.SIGNUP}>
            <Button variant="outline" size="lg">
              See How APIVault Fits Your Workflow →
            </Button>
          </Link>
        </div>
      </section>

      {/* Integrations Section */}
      <section className={`py-20 ${sectionSpacing} bg-gray-900/30`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Integrates with Your Favorite Tools
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Vercel Integration */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 22.525H0l12-21.05 12 21.05z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Vercel</h3>
                <span className="text-xs text-emerald-400">✅ Available</span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Auto-sync environment variables to Vercel projects with one-click integration. Deploy with confidence knowing your secrets are always up-to-date. No manual copying, no configuration drift.
            </p>
          </div>

          {/* CLI Integration */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">💻</div>
              <div>
                <h3 className="font-semibold text-white">CLI</h3>
                <span className="text-xs text-emerald-400">✅ Available</span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Inject secrets into your local development environment via command line. Works with any language or framework—Node.js, Python, Go, Ruby, PHP. Run <code className="text-emerald-400">apivault run -- [your command]</code> and go.
            </p>
          </div>

          {/* REST API Integration */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🔌</div>
              <div>
                <h3 className="font-semibold text-white">REST API</h3>
                <span className="text-xs text-emerald-400">✅ Available</span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Programmatic access for CI/CD pipelines, Docker, Railway, Render, and custom workflows. Token-based authentication with full rate limiting and security. Comprehensive API documentation with code examples.
            </p>
          </div>

          {/* GitHub Integration (Coming Soon) */}
          <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">GitHub</h3>
                <span className="text-xs text-gray-400">🔜 Coming Soon</span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Automatically sync secrets to GitHub Actions for seamless CI/CD deployments. Rotate keys without updating workflow files. Launching Q1 2026.
            </p>
          </div>

          {/* AWS/GCP/Azure Integration (Coming Soon) */}
          <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">☁️</div>
              <div>
                <h3 className="font-semibold text-white">AWS/GCP/Azure</h3>
                <span className="text-xs text-gray-400">🔜 Coming Soon</span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Export secrets to AWS Secrets Manager, Google Secret Manager, or Azure Key Vault for production infrastructure. One-way sync keeps cloud secrets up-to-date. Launching Q2 2026.
            </p>
          </div>
          </div>
        </section>

      {/* Pricing Section */}
      <section className={`py-20 ${sectionSpacing}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-lg">
            No hidden fees. Cancel anytime. All plans include core security features.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 relative">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-2">$0<span className="text-lg text-gray-400">/month</span></div>
              <h3 className="text-xl font-semibold text-white mb-2">Perfect for solo developers</h3>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Up to 50 API keys</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>3 projects</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Multi-environment support (dev, staging, prod)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>CLI and REST API access</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Basic audit logs (30 days)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>AES-256 encryption</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Email support</span>
              </li>
            </ul>
            <Link to={ROUTES.BILLING} className="block">
              <Button variant="gradient" size="lg" className="w-full mb-2">
                Get Started Free →
              </Button>
            </Link>
            <p className="text-xs text-gray-400 text-center">No credit card required</p>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-8 relative">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                Recommended
              </span>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-2">$9<span className="text-lg text-gray-400">/month</span></div>
              <h3 className="text-xl font-semibold text-white mb-2">For growing projects and serious builders</h3>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Unlimited API keys</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Everything in Free, plus:</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Vercel integration (auto-sync)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Advanced audit logging (1 year retention)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Instant key rotation</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Priority email support</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>API rate limits: 10,000 requests/day</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>30-day money-back guarantee</span>
              </li>
            </ul>
            <Link to={ROUTES.BILLING} className="block">
              <Button variant="gradient" size="lg" className="w-full mb-2">
                Start Free Trial →
              </Button>
            </Link>
            <p className="text-xs text-gray-400 text-center">7-day free trial • No credit card required</p>
          </div>

          {/* Team Plan */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 relative opacity-75">
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                Coming Soon
              </span>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white mb-2">$29<span className="text-lg text-gray-400">/month</span></div>
              <h3 className="text-xl font-semibold text-white mb-2">For small teams and startups</h3>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Unlimited everything</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Everything in Pro, plus:</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Team member access (up to 10 members)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Role-based permissions (RBAC)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Slack/webhook notifications</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>SSO (Single Sign-On)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Custom retention policies</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>Dedicated support (24hr response)</span>
              </li>
              <li className="flex items-start gap-2">
                {CHECK_ICON}
                <span>API rate limits: 100,000 requests/day</span>
              </li>
            </ul>
            <Link to="/waitlist?plan=team" className="block">
              <Button variant="outline" size="lg" className="w-full mb-2" disabled>
                Notify Me
              </Button>
            </Link>
            <p className="text-xs text-gray-400 text-center">Available Q1 2026</p>
          </div>
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-gray-400">
            Need enterprise features? <Link to="/contact" className="text-emerald-400 hover:text-emerald-300">Contact us</Link> for custom pricing with SLA, dedicated infrastructure, and compliance support.
          </p>
          <Link to="/pricing" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            See Full Pricing Details →
          </Link>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-20 ${sectionSpacing} bg-gray-900/30`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            What Developers Are Saying
          </h2>
          <p className="text-gray-400 text-lg">
            Join hundreds of developers who've simplified their secret management
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Testimonial 1 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-semibold">
                AT
              </div>
              <div>
                <div className="font-semibold text-white">Alex Thompson</div>
                <div className="text-sm text-gray-400">Indie Hacker</div>
              </div>
            </div>
            <blockquote className="text-gray-300 italic mb-4 text-sm">
              "Finally, a simple secret manager that doesn't require a PhD to set up"
            </blockquote>
            <p className="text-sm text-gray-400">
              I was juggling .env files across 5 different projects. APIVault made it dead simple to centralize everything in one place. The CLI integration is a game-changer—I just run my commands and secrets are injected automatically.
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-semibold">
                SK
              </div>
              <div>
                <div className="font-semibold text-white">Sarah Kim</div>
                <div className="text-sm text-gray-400">SaaS Founder</div>
              </div>
            </div>
            <blockquote className="text-gray-300 italic mb-4 text-sm">
              "The Vercel integration alone is worth the $9/month"
            </blockquote>
            <p className="text-sm text-gray-400">
              Auto-syncing secrets to Vercel means I never have to manually copy environment variables again. I used to waste 10 minutes every deployment checking if all keys were up-to-date. Now it just works.
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-semibold">
                MR
              </div>
              <div>
                <div className="font-semibold text-white">Mike Rodriguez</div>
                <div className="text-sm text-gray-400">Startup CTO</div>
              </div>
            </div>
            <blockquote className="text-gray-300 italic mb-4 text-sm">
              "No more sharing API keys via Slack DMs"
            </blockquote>
            <p className="text-sm text-gray-400">
              Our team was sharing API keys through Slack messages and shared notes docs. APIVault gave us a secure, centralized place to manage everything with proper audit logs. Onboarding new developers went from 2 hours to 10 minutes.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`py-20 ${sectionSpacing}`}>
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Secure Your API Keys?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
            Join developers who've stopped worrying about lost, leaked, or scattered secrets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to={ROUTES.SIGNUP}>
              <Button variant="gradient" size="lg">
                Get Started Free →
              </Button>
            </Link>
            <Link to={ROUTES.DOCS}>
              <Button variant="outline" size="lg">
                See Documentation
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              {CHECK_ICON}
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              {CHECK_ICON}
              <span>Free forever plan available</span>
            </div>
            <div className="flex items-center gap-2">
              {CHECK_ICON}
              <span>Cancel anytime, keep your data</span>
            </div>
            <div className="flex items-center gap-2">
              {CHECK_ICON}
              <span>2-minute setup • AES-256 encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-20 ${sectionSpacing} bg-gray-900/30`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to={ROUTES.FAQ} className="text-emerald-400 hover:text-emerald-300 font-medium">
            See All FAQs →
          </Link>
          </div>
        </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950/50 mt-20">
        <div className={`${sectionSpacing} py-12`}>
          <div className="grid gap-8 md:grid-cols-4">
            {/* Column 1: Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/#features" className="text-gray-400 hover:text-emerald-400 transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-400 hover:text-emerald-400 transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/#integrations" className="text-gray-400 hover:text-emerald-400 transition">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.DOCS} className="text-gray-400 hover:text-emerald-400 transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/changelog" className="text-gray-400 hover:text-emerald-400 transition">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link to="/roadmap" className="text-gray-400 hover:text-emerald-400 transition">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.API} className="text-gray-400 hover:text-emerald-400 transition">
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/blog" className="text-gray-400 hover:text-emerald-400 transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/guides" className="text-gray-400 hover:text-emerald-400 transition">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link to="/tutorials" className="text-gray-400 hover:text-emerald-400 transition">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-gray-400 hover:text-emerald-400 transition">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="text-gray-400 hover:text-emerald-400 transition">
                    Support
                  </Link>
                </li>
                <li>
                  <Link to="/status" className="text-gray-400 hover:text-emerald-400 transition">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-emerald-400 transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-emerald-400 transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="text-gray-400 hover:text-emerald-400 transition opacity-60">
                    Careers <span className="text-xs">(Coming Soon)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-emerald-400 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-emerald-400 transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/refund" className="text-gray-400 hover:text-emerald-400 transition">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="text-gray-400 hover:text-emerald-400 transition">
                    Security
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Connect */}
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="https://twitter.com/apivault" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    Twitter/X
                  </a>
                </li>
                <li>
                  <a href="https://github.com/amaykorade/key-vault-new" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com/company/apivault" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <Link to="/discord" className="text-gray-400 hover:text-emerald-400 transition opacity-60">
                    Discord <span className="text-xs">(Coming Soon)</span>
                  </Link>
                </li>
                <li className="pt-2">
                  <a href="mailto:support@apivault.com" className="text-gray-400 hover:text-emerald-400 transition">
                    support@apivault.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} APIVault. All rights reserved.</p>
            <p className="mt-2 text-emerald-400">Built for developers, by developers 🚀</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

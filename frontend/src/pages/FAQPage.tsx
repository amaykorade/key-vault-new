import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';

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

export function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to know about APIVault and how it can help secure your secrets.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-6 mb-12">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:border-emerald-500/40 transition-all">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@apivault.com"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all"
            >
              Contact Support →
            </a>
            <Link
              to={ROUTES.SIGNUP}
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold border-2 border-gray-700 bg-gray-900 text-gray-200 hover:border-emerald-500/40 hover:text-white hover:bg-gray-800 transition-all"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQPage;


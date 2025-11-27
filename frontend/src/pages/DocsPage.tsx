import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export function DocsPage() {
  const { isAuthenticated } = useAuth();

  const docsSections = [
    {
      title: 'API Reference',
      description: 'Complete REST API documentation with code examples in multiple languages. Learn how to integrate APIVault into your applications, CI/CD pipelines, and infrastructure.',
      href: isAuthenticated ? ROUTES.API : ROUTES.LOGIN,
      icon: '🔌',
      features: [
        'REST API endpoints',
        'Authentication & tokens',
        'Code examples (Node.js, Python, Go, cURL)',
        'Error handling',
        'Rate limits & best practices',
      ],
      comingSoon: false,
    },
    {
      title: 'CLI Guide',
      description: 'Learn how to use the APIVault CLI to inject secrets into your local development environment and CI/CD pipelines.',
      href: isAuthenticated ? ROUTES.CLI_GUIDE : ROUTES.LOGIN,
      icon: '💻',
      features: [
        'Installation & setup',
        'Authentication flow',
        'Workspace configuration',
        'Injecting secrets into commands',
        'CI/CD integration examples',
      ],
      comingSoon: false,
    },
    {
      title: 'Quick Start',
      description: 'Get up and running with APIVault in minutes. Learn the basics of creating projects, managing secrets, and using integrations.',
      href: isAuthenticated ? ROUTES.PROJECTS : ROUTES.SIGNUP,
      icon: '🚀',
      features: [
        'Account setup',
        'Creating your first project',
        'Adding secrets',
        'Managing environments',
        'Basic workflows',
      ],
      comingSoon: false,
    },
    {
      title: 'Integrations',
      description: 'Connect APIVault with your favorite tools and platforms. Vercel, GitHub Actions, and more.',
      href: '#',
      icon: '🔗',
      features: [
        'Vercel integration',
        'CI/CD platforms',
        'Docker & Kubernetes',
        'Webhook configurations',
        'API integrations',
      ],
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">
            Documentation
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to know about using APIVault to manage your secrets securely.
          </p>
        </div>

        {/* Documentation Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-12">
          {docsSections.map((section) => (
            <Card
              key={section.title}
              className={`border-gray-800 bg-gray-900/50 hover:border-emerald-500/40 transition-all ${
                section.comingSoon ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{section.icon}</span>
                  <CardTitle className="text-xl text-white">{section.title}</CardTitle>
                </div>
                {section.comingSoon && (
                  <span className="inline-block rounded-full bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                    Coming Soon
                  </span>
                )}
                <CardDescription className="text-gray-400 mt-3">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {section.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {section.comingSoon ? (
                  <button
                    disabled
                    className="w-full rounded-lg px-4 py-2 text-sm font-semibold bg-gray-700/50 text-gray-400 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    to={section.href}
                    className="block w-full rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 text-center transition-all"
                  >
                    View Documentation →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-800 pt-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Popular Resources</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to={isAuthenticated ? ROUTES.BILLING : ROUTES.SIGNUP}
              className="block p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-emerald-500/40 transition-all"
            >
              <h3 className="font-semibold text-white mb-2">Pricing & Plans</h3>
              <p className="text-sm text-gray-400">Compare plans and choose what works for you</p>
            </Link>
            <Link
              to={ROUTES.LANDING}
              className="block p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-emerald-500/40 transition-all"
            >
              <h3 className="font-semibold text-white mb-2">Product Overview</h3>
              <p className="text-sm text-gray-400">Learn about APIVault features and capabilities</p>
            </Link>
            {!isAuthenticated && (
              <Link
                to={ROUTES.SIGNUP}
                className="block p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:border-emerald-500/40 transition-all"
              >
                <h3 className="font-semibold text-white mb-2">Get Started</h3>
                <p className="text-sm text-gray-400">Create your free account and start managing secrets</p>
              </Link>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-12 p-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <h2 className="text-xl font-semibold text-white mb-2">Need Help?</h2>
          <p className="text-gray-300 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@apivault.com"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              support@apivault.com →
            </a>
            <Link
              to="/contact"
              className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
            >
              Contact Us →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;


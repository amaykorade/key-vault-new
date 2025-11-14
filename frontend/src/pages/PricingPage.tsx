import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { ROUTES } from '../constants';
import { Link, useNavigate } from 'react-router-dom';

const FeatureItem = ({ children }: { children: string }) => (
  <li className="flex items-start gap-3 text-sm text-gray-300">
    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
    <span>{children}</span>
  </li>
);

export function PricingPage() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      cadence: 'per month',
      description: 'Ideal for individual developers validating ideas.',
      ctaLabel: 'Get Started Free',
      ctaAction: () => navigate(ROUTES.SIGNUP),
      popular: false,
      items: [
        'Perfect for solo developers',
        '1 organization',
        '3 projects',
        '50 secrets',
        'Development environment',
        'CLI access included',
        'API access (1,000 requests/month)',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: '$9',
      cadence: 'per month',
      secondaryPrice: '$79/year',
      description: 'Everything growing teams need to run a serious workflow.',
      ctaLabel: 'Start 14-Day Free Trial',
      ctaAction: () => navigate(ROUTES.SIGNUP),
      popular: true,
      items: [
        'Perfect for indie hackers & freelancers',
        'Unlimited organizations, projects, and secrets',
        'All environments (dev, staging, prod)',
        'Unlimited CLI access',
        'API access (100K requests/month)',
        'Vercel integration',
        'Basic audit logs',
      ],
    },
  ];

  const upcoming = [
    {
      name: 'Professional',
      launch: 'January 2026',
      price: '$19/month',
      bullets: ['Team invitations', 'Team RBAC', 'Advanced features'],
    },
    {
      name: 'Business',
      launch: 'February 2026',
      price: '$79/month',
      bullets: ['Advanced RBAC', 'Integrations', 'Compliance tooling'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
        </div>

        <div className="space-y-12 pb-20">
          <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-gray-900/60 to-gray-900/80 p-10 shadow-2xl">
            <div className="max-w-3xl space-y-5">
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
                Pricing
              </span>
              <h1 className="text-4xl font-semibold text-white md:text-5xl">
                Predictable pricing designed for every stage of your secret lifecycle.
              </h1>
              <p className="text-base text-gray-300 md:text-lg">
                Start free, scale when you are ready. Every plan includes secure secret storage, encrypted delivery, CLI access, and detailed audit trails.
              </p>
              <div className="flex flex-col gap-3 text-sm text-gray-400 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                  Cancel or upgrade anytime directly inside Key Vault.
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                  Annual billing saves 25% on the Starter plan.
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex h-full flex-col overflow-hidden border-gray-800/80 bg-gray-900/70 transition-transform hover:scale-[1.01] hover:border-emerald-500/30 ${
                  plan.popular ? 'ring-1 ring-emerald-500/40 shadow-emerald-500/20 shadow-2xl' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                    Most popular
                  </div>
                )}
                <CardHeader className="space-y-4 border-b border-gray-800/80 bg-gray-900/60">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-semibold text-white">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline gap-2 text-white">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-gray-400">{plan.cadence}</span>
                  </div>
                  {plan.secondaryPrice && (
                    <p className="text-sm text-emerald-300">{plan.secondaryPrice} when billed annually</p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-6 pt-6">
                  <ul className="space-y-3">
                    {plan.items.map((item) => (
                      <FeatureItem key={item}>{item}</FeatureItem>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto border-t border-gray-800/80 bg-gray-900/50">
                  <button
                    onClick={plan.ctaAction}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-semibold tracking-wide transition ${
                      plan.popular
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'border border-gray-700 bg-gray-900 text-gray-200 hover:border-emerald-500/40 hover:text-white'
                    }`}
                  >
                    {plan.ctaLabel}
                  </button>
                </CardFooter>
              </Card>
            ))}
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Coming Soon</h2>
              <p className="text-sm text-gray-400">We are rolling out deeper collaboration and compliance tooling early next year.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {upcoming.map((plan) => (
                <Card key={plan.name} className="border-dashed">
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center justify-between text-white">
                      {plan.name}
                      <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
                        {plan.launch}
                      </span>
                    </CardTitle>
                    <CardDescription>{plan.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.bullets.map((item) => (
                        <FeatureItem key={`${plan.name}-${item}`}>{item}</FeatureItem>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-white">Plan Comparison</h2>
              <p className="text-sm text-gray-400">Compare the core capabilities as you scale.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70">
              <div className="grid grid-cols-3 bg-gray-800/50 text-sm font-medium text-gray-200">
                <div className="px-6 py-4 text-left">Capability</div>
                <div className="px-6 py-4 text-center">Free</div>
                <div className="px-6 py-4 text-center">Starter</div>
              </div>
              <div className="divide-y divide-gray-800 text-sm text-gray-300">
                {[
                  ['Organizations', '1', 'Unlimited'],
                  ['Projects', '3', 'Unlimited'],
                  ['Secrets', '50', 'Unlimited'],
                  ['Environments', 'Development', 'Dev, Staging, Production'],
                  ['CLI access', 'Included', 'Unlimited'],
                  ['API requests', '1,000 / month', '100,000 / month'],
                  ['Integrations', '—', 'Vercel'],
                  ['Audit logs', '—', 'Basic insights'],
                ].map(([capability, free, starter]) => (
                  <div key={capability} className="grid grid-cols-3">
                    <div className="px-6 py-3 text-left text-gray-400">{capability}</div>
                    <div className="px-6 py-3 text-center">{free}</div>
                    <div className="px-6 py-3 text-center text-white">{starter}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;


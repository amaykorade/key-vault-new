import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { ROUTES } from '../constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentModal } from '../components/PaymentModal';
import { BillingToggle } from '../components/BillingToggle';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const FeatureItem = ({ children }: { children: string }) => (
  <li className="flex items-start gap-3 text-sm text-gray-300 group">
    <svg 
      className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400 group-hover:text-emerald-300 transition-colors" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    <span className="flex-1">{children}</span>
  </li>
);

export function BillingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  // Handle plan query parameter after component mounts
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && !isLoadingSubscription) {
      // Auto-select plan if specified in URL
      const planMap: Record<string, 'STARTER' | 'PROFESSIONAL' | 'BUSINESS'> = {
        starter: 'STARTER',
        professional: 'PROFESSIONAL',
        business: 'BUSINESS',
      };
      
      const plan = planMap[planParam.toLowerCase()];
      if (plan) {
        setSelectedPlan(plan);
        setSelectedBillingCycle(selectedBillingCycle);
        setShowPaymentModal(true);
      }
      
      // Clean up URL params after processing
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('plan');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [isLoadingSubscription, searchParams, setSearchParams, selectedBillingCycle]);

  async function loadSubscription() {
    try {
      const response = await apiService.getSubscription();
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  }

  function handlePlanSelect(planId: string, billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY') {
    if (planId === 'free') {
      navigate(ROUTES.PROJECTS);
      return;
    }

    const planMap: Record<string, 'STARTER' | 'PROFESSIONAL' | 'BUSINESS'> = {
      starter: 'STARTER',
      professional: 'PROFESSIONAL',
      business: 'BUSINESS',
    };

    const plan = planMap[planId];
    if (plan) {
      setSelectedPlan(plan);
      setSelectedBillingCycle(billingCycle);
      setShowPaymentModal(true);
    }
  }

  const plans = useMemo(
    () => [
      {
        id: 'free',
        name: 'Free',
        monthlyPrice: '$0',
        yearlyPrice: '$0',
        description: 'Ideal for individual developers validating ideas.',
        ctaLabel: 'Get Started',
        ctaAction: () => navigate(ROUTES.PROJECTS),
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
        monthlyPrice: '$9',
        yearlyPrice: '$79',
        description: 'Everything growing teams need to run a serious workflow.',
        ctaLabel: 'Subscribe Now',
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
    ],
    [navigate]
  );

  // Calculate displayed price based on billing cycle
  const getDisplayPrice = (plan: (typeof plans)[0]) => {
    if (plan.id === 'free') return '$0';
    return selectedBillingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPricePerMonth = (plan: (typeof plans)[0]) => {
    if (plan.id === 'free') return '$0';
    if (selectedBillingCycle === 'MONTHLY') return plan.monthlyPrice;
    // Calculate monthly equivalent for yearly
    const yearlyNum = parseInt(plan.yearlyPrice.replace('$', ''));
    return `$${(yearlyNum / 12).toFixed(2)}`;
  };

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
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-gray-900/60 to-gray-900/80 p-10 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
            Pricing
          </span>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            Predictable pricing designed for every stage of your secret lifecycle.
          </h1>
          <p className="text-base text-gray-300 md:text-lg max-w-2xl mx-auto">
            Start free, scale when you are ready. Every plan includes secure secret storage, encrypted delivery, CLI access, and detailed audit trails.
          </p>
          <div className="flex flex-col gap-3 text-sm text-gray-400 md:flex-row md:items-center md:justify-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              Cancel or upgrade anytime directly inside APIVault.
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              Annual billing saves 25% on the Starter plan.
            </div>
          </div>
        </div>
      </section>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <BillingToggle value={selectedBillingCycle} onChange={setSelectedBillingCycle} />
      </div>

      {/* Pricing Cards */}
      <section className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
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
              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold text-white">{plan.name}</CardTitle>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight text-white">{getDisplayPrice(plan)}</span>
                  {plan.id !== 'free' && (
                    <span className="text-lg text-gray-400">
                      /{selectedBillingCycle === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
                {plan.id !== 'free' && selectedBillingCycle === 'YEARLY' && (
                  <p className="text-sm text-emerald-400 font-medium">
                    ${getPricePerMonth(plan).replace('$', '')}/month billed annually
                  </p>
                )}
                {plan.id !== 'free' && selectedBillingCycle === 'MONTHLY' && (
                  <p className="text-sm text-gray-500">Billed monthly</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-6 pt-8">
              <ul className="space-y-4">
                {plan.items.map((item) => (
                  <FeatureItem key={item}>{item}</FeatureItem>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto border-t border-gray-800/80 bg-gray-900/50 pt-6">
              <button
                onClick={() => {
                  if (plan.id === 'starter') {
                    handlePlanSelect(plan.id, selectedBillingCycle);
                  } else if (plan.ctaAction) {
                    plan.ctaAction();
                  }
                }}
                disabled={plan.id === 'starter'}
                className={`w-full rounded-lg px-6 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 ${
                  plan.id === 'starter'
                    ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed opacity-60'
                    : plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                    : 'border-2 border-gray-700 bg-gray-900 text-gray-200 hover:border-emerald-500/40 hover:text-white hover:bg-gray-800'
                }`}
              >
                {plan.id === 'starter' ? 'Coming Soon' : plan.ctaLabel}
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

      {/* Comparison Table */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-semibold text-white">Plan Comparison</h2>
          <p className="text-gray-400">Compare the core capabilities as you scale.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border-2 border-gray-800 bg-gray-900/70 shadow-xl">
          <div className="grid grid-cols-3 bg-gradient-to-r from-gray-800/80 to-gray-800/60 text-sm font-semibold text-gray-200 border-b border-gray-700">
            <div className="px-6 py-4 text-left">Capability</div>
            <div className="px-6 py-4 text-center">Free</div>
            <div className="px-6 py-4 text-center text-emerald-400">Starter</div>
          </div>
          <div className="divide-y divide-gray-800/80">
            {[
              ['Organizations', '1', 'Unlimited'],
              ['Projects', '3', 'Unlimited'],
              ['Secrets', '50', 'Unlimited'],
              ['Environments', 'Development', 'Dev, Staging, Production'],
              ['CLI access', 'Included', 'Unlimited'],
              ['API requests', '1,000 / month', '100,000 / month'],
              ['Integrations', '—', 'Vercel'],
              ['Audit logs', '—', 'Basic insights'],
            ].map(([capability, free, starter], index) => (
              <div 
                key={capability} 
                className={`grid grid-cols-3 text-sm transition-colors hover:bg-gray-800/30 ${
                  index % 2 === 0 ? 'bg-gray-900/40' : 'bg-gray-900/20'
                }`}
              >
                <div className="px-6 py-4 text-left text-gray-300 font-medium">{capability}</div>
                <div className="px-6 py-4 text-center text-gray-400">{free}</div>
                <div className="px-6 py-4 text-center text-white font-medium">{starter}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          billingCycle={selectedBillingCycle}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={() => {
            loadSubscription();
            toast.success('Subscription activated successfully!');
          }}
        />
      )}
    </div>
  );
}

export default BillingPage;

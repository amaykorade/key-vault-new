import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Logo } from '../Logo';
import { apiService, ApiError } from '../../services/api';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export function Header() {
  const { user, logout } = useAuth();
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [planBadgeColor, setPlanBadgeColor] = useState<'free' | 'paid'>('free');

  useEffect(() => {
    let isMounted = true;

    async function loadSubscription() {
      try {
        const res = await apiService.getSubscription();
        const plan = res.subscription?.plan as string | undefined;

        if (!isMounted) return;

        if (!plan || plan === 'FREE') {
          setPlanLabel('Free plan · 1 org · 1 project · 5 dev secrets');
          setPlanBadgeColor('free');
        } else {
          const pretty = plan.charAt(0) + plan.slice(1).toLowerCase();
          setPlanLabel(`${pretty} plan · higher limits unlocked`);
          setPlanBadgeColor('paid');
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return;
        }
      }
    }

    loadSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center space-x-4">
            {planLabel && (
              <Link
                to={ROUTES.BILLING}
                className="hidden md:inline-flex items-center rounded-full border border-emerald-500/30 bg-gray-900/60 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10 transition-colors"
              >
                <span
                  className={`mr-2 inline-flex h-2 w-2 rounded-full ${
                    planBadgeColor === 'free' ? 'bg-emerald-400' : 'bg-sky-400'
                  }`}
                  aria-hidden
                />
                <span className="truncate max-w-xs">
                  {planLabel}{' '}
                  <span className="underline decoration-dashed decoration-emerald-400/70 ml-1">
                    Upgrade →
                  </span>
                </span>
              </Link>
            )}
            <div className="hidden sm:block text-sm text-gray-300">
              Welcome, <span className="font-medium text-white">{user?.name || user?.email}</span>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-200"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
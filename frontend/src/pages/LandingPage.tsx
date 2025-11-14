import { FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService, ApiError } from '../services/api';
import { ROUTES } from '../constants';

const sectionSpacing = 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8';

const CHECK_ICON = (
  <svg className="h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const DASH_ICON = (
  <svg className="h-5 w-5 flex-shrink-0 text-pink-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

const SectionBadge = ({ children }: { children: string }) => (
  <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
    {children}
  </span>
);

const Bullet = ({ text }: { text: string }) => (
  <li className="flex items-start gap-3">
    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
    <span className="text-sm text-gray-300">{text}</span>
  </li>
);

const ProblemItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-3 rounded-xl border border-pink-500/10 bg-pink-500/5 p-4 text-left">
    {DASH_ICON}
    <p className="text-sm text-pink-100/90">{text}</p>
  </div>
);

const SolutionItem = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
    {CHECK_ICON}
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-300">{description}</p>
    </div>
  </div>
);

const StepCard = ({ step, title, description }: { step: string; title: string; description: string }) => (
  <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300">
        {step}
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <p className="mt-4 text-sm text-gray-300">{description}</p>
  </div>
);

const perks = [
  'Lifetime free tier (first 100 users)',
  'Private Slack group with founders',
  'Early features & roadmap influence',
  'API credits for testing',
  'Priority support',
];

export function LandingPage() {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formState === 'submitting') return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get('email') as string)?.trim();
    const name = (formData.get('name') as string)?.trim();
    const developerType = (formData.get('devType') as string)?.trim() || 'solo';

    if (!email) {
      setFormMessage('Please enter your email.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFormMessage("That doesn't look like a valid email address.");
      return;
    }

    setFormMessage(null);
    setFormState('submitting');

    try {
      const result = await apiService.submitEarlyAccess({
        email,
        name: name || undefined,
        developerType,
      });
      
      if (result.success) {
        setFormState('success');
        setFormMessage(null);
        form.reset();
      } else {
        setFormState('idle');
        setFormMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('[LandingPage] Early access submission error:', error);
      setFormState('idle');
      if (error instanceof ApiError) {
        if (error.status === 400) {
          setFormMessage('Please check your details and try again.');
        } else if (error.status === 0) {
          setFormMessage('Network error. Please check your connection and try again.');
        } else {
          setFormMessage('Something went wrong. Please try again in a moment.');
        }
      } else {
        setFormMessage('Network error. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className={`pt-16 pb-20 ${sectionSpacing}`}>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <SectionBadge>Private Beta</SectionBadge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Never Commit an API Key Again
            </h1>
            <p className="max-w-xl text-base text-gray-300 md:text-lg">
              Store, rotate, and share API keys securely—without leaving your dev workflow. APIVault keeps every credential encrypted, accessible, and audit logged in one beautiful dashboard.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                onClick={scrollToForm}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-emerald-400"
              >
                Join Early Access
              </button>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-200">
                First 100 signups get lifetime perks
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gray-900/60 p-6 shadow-xl">
            <div className="absolute -top-12 right-6 h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden />
            <div className="relative space-y-4 text-sm text-gray-300">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-gray-400">Project</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Healthy</span>
                </div>
                <p className="mt-3 text-base font-semibold text-white">Stripe Production</p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last rotation</span>
                    <span className="text-gray-200">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Accessed by</span>
                    <span className="text-gray-200">4 teammates</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>api_key_live_93f3...</span>
                </div>
                <div className=" rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                  curl -H "Authorization: Bearer $APIVAULT_TOKEN" \
                  <br />
                  &nbsp;&nbsp;https://api.apivault.dev/secrets/stripe
                </div>
                <div className="text-xs text-gray-400">Rotate or revoke with one click. Zero redeploys.</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-20 pb-24">
        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>Why API Key Management Sucks</SectionBadge>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Secrets scattered in env files and Notion docs',
              'Accidentally committing keys to GitHub (instant panic)',
              'Sharing with teammates over Slack or email',
              'Rotating keys and updating everything—ugh',
            ].map((item) => (
              <ProblemItem key={item} text={item} />
            ))}
          </div>
        </section>

        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>How APIVault Makes It Simple</SectionBadge>
          <div className="grid gap-4 md:grid-cols-2">
            <SolutionItem
              title="Encrypted Storage"
              description="Only you can decrypt your keys—never stored in code or plain text."
            />
            <SolutionItem
              title="All-in-One Dashboard"
              description="Every key, every project, managed in one place with crystal clarity."
            />
            <SolutionItem
              title="Key Rotation in One Click"
              description="Rotate keys across services instantly without redeploying."
            />
            <SolutionItem
              title="Team-Safe Sharing"
              description="Grant or revoke access anytime—no screenshots or email chains."
            />
            <SolutionItem
              title="CLI + API Access"
              description="Use it from your terminal or integrate with any workflow."
            />
            <SolutionItem
              title="Audit Logging"
              description="See who accessed what, when, and from where."
            />
          </div>
        </section>

        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>Get Set Up in 3 Minutes</SectionBadge>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step="1"
              title="Add Your Keys"
              description="Paste them manually or import from your existing .env and config stores."
            />
            <StepCard
              step="2"
              title="We Encrypt Everything"
              description="Each secret is encrypted client-side before we store it."
            />
            <StepCard
              step="3"
              title="Use Instantly"
              description="Access secrets via CLI, dashboard, or API without ever exposing values."
            />
          </div>
        </section>

        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>Built for Indie Devs</SectionBadge>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8 shadow-xl">
              <h3 className="text-xl font-semibold text-white">Built for Indie Devs, Not Big Enterprise</h3>
              <ul className="mt-6 space-y-3">
                <Bullet text="Simple pricing, forever-free for solo devs" />
                <Bullet text="CLI-first UX—work how you want" />
                <Bullet text="No lock-in: export anytime, use any API" />
                <Bullet text="Instant integrations with Vercel, AWS, and more" />
              </ul>
              <button
                onClick={scrollToForm}
                className="mt-8 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Join Early Access
              </button>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 shadow-xl">
              <h3 className="text-xl font-semibold text-white">Early Access Gets You:</h3>
              <ul className="mt-6 space-y-3">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-emerald-50">
                    {CHECK_ICON}
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-200">
                Only 100 slots—don’t miss out!
              </p>
            </div>
          </div>
        </section>

        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>Built by Indie Hackers</SectionBadge>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-8">
              <p className="text-sm text-gray-300">
                “APIVault is what I always wanted but never found.”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-white">An upcoming beta tester</p>
                  <p className="text-xs text-gray-400">Indie app developer</p>
                </div>
              </div>
              <Link
                to="https://github.com/amaykorade/key-vault-new"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-emerald-300 hover:text-emerald-200"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path fillRule="evenodd" d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.39 7.87 10.915.575.11.786-.25.786-.556 0-.273-.01-1.183-.015-2.144-3.2.696-3.877-1.383-3.877-1.383-.523-1.328-1.28-1.683-1.28-1.683-1.046-.715.08-.701.08-.701 1.156.081 1.765 1.188 1.765 1.188 1.03 1.764 2.705 1.255 3.363.96.105-.748.403-1.255.732-1.544-2.554-.291-5.238-1.278-5.238-5.686 0-1.255.45-2.283 1.188-3.088-.12-.292-.516-1.467.112-3.058 0 0 .967-.31 3.17 1.18a11.04 11.04 0 012.888-.388c.98.004 1.967.132 2.888.388 2.202-1.49 3.166-1.18 3.166-1.18.632 1.591.236 2.766.116 3.058.742.805 1.188 1.833 1.188 3.088 0 4.42-2.689 5.39-5.256 5.676.413.355.78 1.055.78 2.132 0 1.54-.014 2.781-.014 3.162 0 .31.206.672.793.556C20.21 21.386 23.5 17.084 23.5 12c0-6.352-5.148-11.5-11.5-11.5z" clipRule="evenodd" />
                </svg>
                GitHub repo →
              </Link>
            </div>
            <div className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900/70 p-8">
              <h3 className="text-xl font-semibold text-white">You Own Your Keys</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  {CHECK_ICON}
                  <span>End-to-end encrypted—zero knowledge even to us.</span>
                </li>
                <li className="flex items-start gap-3">
                  {CHECK_ICON}
                  <span>Regular security audits, open roadmap, and transparent updates.</span>
                </li>
                <li className="flex items-start gap-3">
                  {CHECK_ICON}
                  <span>Compliant with best practices. No data sharing, ever.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={`${sectionSpacing} space-y-8`}>
          <SectionBadge>FAQs</SectionBadge>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Are my keys secure?', 'Yes, only you can decrypt them (AES-256).'],
              ['What if APIVault goes offline?', 'You always have local export. No lock-in.'],
              ['Does it work with my APIs?', 'It works with any API—Stripe, AWS, anything.'],
              ['Is it free?', 'Solo devs get our free tier for life.'],
              ['What’s the catch?', 'Early feedback helps build the tool you need.'],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
                <h4 className="text-sm font-semibold text-white">{question}</h4>
                <p className="mt-2 text-sm text-gray-300">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section ref={formRef} className={`${sectionSpacing} space-y-6`}> 
          <SectionBadge>Join Early Access</SectionBadge>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-white">Join Early Access</h2>
              <p className="text-sm text-gray-300">
                Be among the first 100 builders to secure lifetime perks, private community access, and direct influence over the roadmap. We’ll reach out as soon as new capabilities ship.
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-200">No spam. We respect your inbox.</p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-emerald-500/20 bg-gray-900/70 p-8 shadow-xl"
            >
              <div className="grid gap-5">
                <label className="space-y-2 text-sm text-gray-200">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-0"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-200">
                  Name <span className="text-gray-500">(optional)</span>
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-0"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-200">
                  What type of developer are you?
                  <select
                    name="devType"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 focus:ring-0"
                    defaultValue="solo"
                  >
                    <option value="solo">Solo</option>
                    <option value="freelance">Freelance</option>
                    <option value="team">Team</option>
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="inline-flex h-[46px] w-full items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                >
                  {formState === 'submitting' ? 'Reserving...' : 'Reserve My Spot'}
                </button>

                {formMessage && formState !== 'success' && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {formMessage}
                  </p>
                )}

                {formState === 'success' && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                    You&apos;re on the list! Check your email for next steps.
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 bg-gray-950/50 mt-20">
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12`}>
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-white font-semibold mb-4">APIVault</h3>
              <p className="text-sm text-gray-400">
                Never commit an API key again. Secure secrets management for developers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/pricing" className="text-gray-400 hover:text-emerald-400 transition">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
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
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="mailto:contact@apivault.it.com" className="hover:text-emerald-400 transition">
                    contact@apivault.it.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} APIVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

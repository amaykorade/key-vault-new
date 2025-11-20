'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { parseGitHubUrl } from '@/lib/github';
import { isPrivateRepo, getGitHubAuthUrl } from '@/lib/github-auth';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingRepo, setIsCheckingRepo] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<string | null>(null);

  // Handle GitHub OAuth callback
  useEffect(() => {
    const token = searchParams.get('github_token');
    const user = searchParams.get('github_user');
    const error = searchParams.get('error');

    if (error) {
      const errorMsg = decodeURIComponent(error);
      toast.error(`GitHub authentication failed: ${errorMsg}`, { duration: 8000 });
      console.error('GitHub OAuth error:', errorMsg);
      // Clean URL
      router.replace('/');
    } else if (token && user) {
      // Store token in sessionStorage
      sessionStorage.setItem('github_token', token);
      sessionStorage.setItem('github_user', user);
      setGithubToken(token);
      setGithubUser(user);
      toast.success(`Connected to GitHub as ${user}`);
      // Clean URL
      router.replace('/');
    } else {
      // Load token from sessionStorage
      const storedToken = sessionStorage.getItem('github_token');
      const storedUser = sessionStorage.getItem('github_user');
      if (storedToken && storedUser) {
        setGithubToken(storedToken);
        setGithubUser(storedUser);
      }
    }
  }, [searchParams, router]);

  // Check if repository is private when URL changes
  useEffect(() => {
    const checkRepo = async () => {
      if (!repoUrl.trim()) {
        setIsPrivate(false);
        return;
      }

      const parsed = parseGitHubUrl(repoUrl.trim());
      if (!parsed) {
        setIsPrivate(false);
        return;
      }

      setIsCheckingRepo(true);
      try {
        const privateStatus = await isPrivateRepo(parsed.owner, parsed.repo, githubToken || undefined);
        setIsPrivate(privateStatus);
      } catch (error) {
        // If error checking, assume public (will fail gracefully if private)
        setIsPrivate(false);
      } finally {
        setIsCheckingRepo(false);
      }
    };

    // Debounce check
    const timeoutId = setTimeout(checkRepo, 500);
    return () => clearTimeout(timeoutId);
  }, [repoUrl, githubToken]);

  const handleGitHubAuth = async () => {
    try {
      const redirectUrl = window.location.pathname + window.location.search;
      const apiUrl = `/api/auth/github?redirect=${encodeURIComponent(redirectUrl)}`;
      
      console.log('Initiating GitHub OAuth:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub auth API error:', response.status, errorText);
        throw new Error(`Failed to initiate GitHub OAuth: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.authUrl) {
        console.log('Redirecting to GitHub:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned from server');
      }
    } catch (error) {
      console.error('GitHub auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to initiate GitHub authentication');
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    // Check if private repo needs authentication
    if (isPrivate && !githubToken) {
      toast.error('This repository is private. Please connect your GitHub account first.');
      return;
    }

    setIsScanning(true);
    
    // Show initial loading message
    let loadingToast: string | undefined;
    try {
      loadingToast = toast.loading('Starting scan... This may take up to 2 minutes for large repositories.');

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: repoUrl.trim(),
          branch: branch.trim() || undefined,
          accessToken: githubToken || undefined,
        }),
      });
      
      // Dismiss loading toast
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error types
        if (response.status === 429) {
          if (data.type === 'github_rate_limit') {
            // GitHub API rate limit - show helpful message
            const message = data.message || 'GitHub API rate limit exceeded. Connect your GitHub account for 5,000 requests/hour!';
            toast.error(
              message,
              { 
                duration: 8000,
                icon: '⚠️',
              }
            );
            
            // If not connected, show additional prompt after a delay
            if (!githubToken) {
              setTimeout(() => {
                toast(
                  (t) => (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Need more scans?</div>
                        <div className="text-xs text-gray-300">Connect GitHub for 5,000 requests/hour</div>
                      </div>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          handleGitHubAuth();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  ),
                  { 
                    duration: 10000,
                    icon: '💡',
                  }
                );
              }, 2000);
            }
          } else {
            // Our own rate limit
            const resetAt = data.resetAt ? new Date(data.resetAt).toLocaleString() : 'later';
            toast.error(`Rate limit exceeded. Please try again after ${resetAt}`);
          }
        } else if (response.status === 404) {
          toast.error('Repository not found. Make sure it exists and is accessible.');
        } else if (response.status === 408) {
          const suggestion = data.suggestion || '';
          toast.error(
            data.message || 'Scan timeout. The repository is too large. Try a smaller repository.',
            { duration: 8000 }
          );
          if (suggestion) {
            setTimeout(() => {
              toast(suggestion, { duration: 10000, icon: '💡' });
            }, 2000);
          }
        } else {
          toast.error(data.message || data.error || 'Failed to scan repository');
        }
        return;
      }

      // Show success message
      toast.success(`Scan complete! Found ${data.summary.totalFindings} potential secrets.`);
      
      // Navigate to results page with scan data
      router.push(`/results?data=${encodeURIComponent(JSON.stringify(data))}`);
    } catch (error) {
      console.error('Scan error:', error);
      
      // Dismiss loading toast if still showing
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to scan repository');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Find Leaked Secrets in Your
            <span className="text-emerald-400"> GitHub Repos</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Free tool to scan your repositories for exposed API keys, credentials, and secrets.
            Secure your codebase before it's too late.
          </p>
          
          {/* Rate Limit Info Banner */}
          {!githubToken && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-xl">💡</div>
                <div className="flex-1">
                  <div className="text-yellow-400 font-semibold mb-1">Tip: Connect GitHub for Higher Limits</div>
                  <div className="text-gray-300 text-sm">
                    Without authentication: <span className="text-yellow-400">60 requests/hour</span> • 
                    With GitHub account: <span className="text-emerald-400">5,000 requests/hour</span>
                  </div>
                  <button
                    onClick={handleGitHubAuth}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Connect GitHub Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label htmlFor="repo-url" className="block text-sm font-medium text-gray-300 mb-2">
                GitHub Repository URL
              </label>
              <input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="github.com/username/repo or username/repo"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isScanning}
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter a public GitHub repository URL or owner/repo format
              </p>
            </div>

            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-300 mb-2">
                Branch (optional)
              </label>
              <input
                id="branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main, master, develop, etc."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isScanning}
              />
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Scanning Repository...' : 'Scan Repository'}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <div className="text-emerald-400 text-2xl mb-3">🔍</div>
            <h3 className="text-white font-semibold mb-2">Comprehensive Scanning</h3>
            <p className="text-gray-400 text-sm">
              Detects 15+ types of secrets including AWS keys, Stripe tokens, database URLs, and more.
            </p>
          </div>

          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <div className="text-emerald-400 text-2xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-2">Fast & Free</h3>
            <p className="text-gray-400 text-sm">
              Scan your repositories instantly. No signup required. Completely free.
            </p>
          </div>

          <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <div className="text-emerald-400 text-2xl mb-3">🔒</div>
            <h3 className="text-white font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-400 text-sm">
              We never store your actual secrets. Only scan results are saved temporarily.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Found secrets? Secure them with{' '}
            <a
              href="https://www.apivault.it.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              APIVault
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

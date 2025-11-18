import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { ROUTES } from './constants';
import { AppLayout } from './components/layout/AppLayout';
import { GoogleAnalytics } from './components/GoogleAnalytics';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const PricingPage = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage').then(m => ({ default: m.OrganizationsPage })));
const OrganizationDetailsPage = lazy(() => import('./pages/OrganizationDetailsPage').then(m => ({ default: m.OrganizationDetailsPage })));
const ProjectDetailsPage = lazy(() => import('./pages/ProjectDetailsPage').then(m => ({ default: m.ProjectDetailsPage })));
const FolderPage = lazy(() => import('./pages/FolderPage').then(m => ({ default: m.FolderPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TeamDetailsPage = lazy(() => import('./pages/TeamDetailsPage').then(m => ({ default: m.TeamDetailsPage })));
const InvitationAcceptPage = lazy(() => import('./pages/InvitationAcceptPage').then(m => ({ default: m.InvitationAcceptPage })));
const AuditPage = lazy(() => import('./pages/AuditPage').then(m => ({ default: m.AuditPage })));
const ApiPage = lazy(() => import('./pages/ApiPage').then(m => ({ default: m.ApiPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const CliAuthPage = lazy(() => import('./pages/CliAuthPage').then(m => ({ default: m.CliAuthPage })));
const CliGuidePage = lazy(() => import('./pages/CliGuidePage').then(m => ({ default: m.CliGuidePage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
      <p className="mt-4 text-gray-400">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <GoogleAnalytics />
      <div className="App">
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.SIGNUP}
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/refund" element={<RefundPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* Protected routes */}
          <Route
            path={ROUTES.ORGANIZATIONS}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <OrganizationsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizations/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <OrganizationDetailsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.PROJECTS}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TEAMS}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TeamsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.AUDIT}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AuditPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.API}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ApiPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.BILLING}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BillingPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.CLI_GUIDE}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CliGuidePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectDetailsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id/env/:env/folders/:folder"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FolderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TeamDetailsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Invitation acceptance (public route) */}
          <Route path="/invitations/:token" element={<InvitationAcceptPage />} />

          {/* OAuth callback */}
          <Route path={"/auth/callback"} element={<AuthCallbackPage />} />

          {/* CLI authorization */}
          <Route path="/cli/auth" element={<CliAuthPage />} />

          {/* Default redirect */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
        </Suspense>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;

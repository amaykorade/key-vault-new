import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationDetailsPage } from './pages/OrganizationDetailsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TeamDetailsPage } from './pages/TeamDetailsPage';
import { TeamsPage } from './pages/TeamsPage';
import { InvitationAcceptPage } from './pages/InvitationAcceptPage';
import { AuditPage } from './pages/AuditPage';
import { ApiPage } from './pages/ApiPage';
import { TokensPage } from './pages/TokensPage';
import { ROUTES } from './constants';
import { FolderPage } from './pages/FolderPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <Router>
      <div className="App">
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

          {/* Protected routes */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

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
            path={ROUTES.API_TOKENS}
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TokensPage />
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

          {/* Default redirect */}
          <Route path="/" element={<LoginPage />} />
        </Routes>

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
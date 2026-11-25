import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { AiPage } from './admin/AiPage';
import { AvatarsPage } from './admin/AvatarsPage';
import { ContentPage } from './admin/ContentPage';
import { DashboardPage } from './admin/DashboardPage';
import { EmployeesPage } from './admin/EmployeesPage';
import { FeedbackPage } from './admin/InsightsPages';
import { ReviewPage, UsersPage } from './admin/SetupPages';
import { CandidatesPage } from './hr/CandidatesPage';
import './index.css';
import { HomeRedirect, RequireRole } from './lib/auth';
import { ChangePasswordPage, InvitePage } from './pages/AccessPages';
import { CompletePage } from './pages/CompletePage';
import { LoginPage } from './pages/LoginPage';
import { PlayerPage } from './pages/PlayerPage';
import { WelcomePage } from './pages/WelcomePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const admin = (page: React.ReactElement) => <RequireRole roles={['ADMIN']}>{page}</RequireRole>;
const learner = (page: React.ReactElement) => <RequireRole roles={['LEARNER']}>{page}</RequireRole>;

/** The reporting screens, shared by the admin panel and the HR panel. */
const reportRoutes = (
  <>
    <Route index element={<DashboardPage />} />
    <Route path="candidates" element={<CandidatesPage />} />
    <Route path="employees" element={<EmployeesPage />} />
    <Route path="feedback" element={<FeedbackPage />} />
  </>
);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/welcome" element={learner(<WelcomePage />)} />
          <Route path="/induction" element={learner(<PlayerPage />)} />
          <Route path="/complete" element={learner(<CompletePage />)} />

          {/* HR panel */}
          <Route
            path="/hr"
            element={
              <RequireRole roles={['HR_ADMIN']}>
                <AdminLayout />
              </RequireRole>
            }
          >
            {reportRoutes}
          </Route>

          {/* Admin panel (Legal reviewers see only the review screens) */}
          <Route
            path="/admin"
            element={
              <RequireRole roles={['ADMIN', 'LEGAL_REVIEWER']}>
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route element={<RequireRole roles={['ADMIN']} outlet />}>{reportRoutes}</Route>
            <Route path="content" element={<ContentPage />} />
            <Route path="review" element={<ReviewPage />} />
            <Route path="avatars" element={admin(<AvatarsPage />)} />
            <Route path="ai" element={admin(<AiPage />)} />
            <Route path="users" element={admin(<UsersPage />)} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, StrictMode, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin/AdminLayout';
import { Loading } from './components/ui';
import './index.css';
import { HomeRedirect, RequireRole } from './lib/auth';
import { GoToApp, IS_CANDIDATE_APP } from './lib/portal';
import { ChangePasswordPage } from './pages/AccessPages';
import { CandidateLoginPage, InvitePage } from './pages/CandidatePage';
import { LoginPage } from './pages/LoginPage';

/**
 * Pages other than sign-in load on demand, so each app downloads only the screens
 * a person actually opens (the presenter engine, the admin editors and the charts
 * stay out of the first download).
 */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m): { default: ComponentType } => ({ default: m[name] })));
}
const AuditPage = page(() => import('./admin/AuditPage'), 'AuditPage');
const AiPage = page(() => import('./admin/AiPage'), 'AiPage');
const AvatarsPage = page(() => import('./admin/AvatarsPage'), 'AvatarsPage');
const ContentPage = page(() => import('./admin/ContentPage'), 'ContentPage');
const DashboardPage = page(() => import('./admin/DashboardPage'), 'DashboardPage');
const EmployeesPage = page(() => import('./admin/EmployeesPage'), 'EmployeesPage');
const FeedbackPage = page(() => import('./admin/InsightsPages'), 'FeedbackPage');
const ReviewPage = page(() => import('./admin/SetupPages'), 'ReviewPage');
const UsersPage = page(() => import('./admin/SetupPages'), 'UsersPage');
const CandidatesPage = page(() => import('./hr/CandidatesPage'), 'CandidatesPage');
const CompletePage = page(() => import('./pages/CompletePage'), 'CompletePage');
const PlayerPage = page(() => import('./pages/PlayerPage'), 'PlayerPage');
const WelcomePage = page(() => import('./pages/WelcomePage'), 'WelcomePage');

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
    <Route path="audit" element={<AuditPage />} />
  </>
);

/** Candidate app (its own port): sign-in, invitation links and the induction itself. */
const candidateRoutes = (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/candidate" element={<CandidateLoginPage />} />
    <Route path="/invite/:token" element={<InvitePage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route path="/welcome" element={learner(<WelcomePage />)} />
    <Route path="/induction" element={learner(<PlayerPage />)} />
    <Route path="/complete" element={learner(<CompletePage />)} />
    {/* Staff pages live in the staff app. */}
    <Route path="/login" element={<GoToApp app="staff" />} />
    <Route path="/admin/*" element={<GoToApp app="staff" />} />
    <Route path="/hr/*" element={<GoToApp app="staff" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

/** Staff app: Admin, HR and Legal. */
const staffRoutes = (
  <Routes>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />

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

    {/* Candidate pages and invitation links open in the candidate app. */}
    <Route path="/candidate" element={<GoToApp app="candidate" />} />
    <Route path="/invite/:token" element={<GoToApp app="candidate" />} />
    <Route path="/welcome" element={<GoToApp app="candidate" />} />
    <Route path="/induction" element={<GoToApp app="candidate" />} />
    <Route path="/complete" element={<GoToApp app="candidate" />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          {IS_CANDIDATE_APP ? candidateRoutes : staffRoutes}
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

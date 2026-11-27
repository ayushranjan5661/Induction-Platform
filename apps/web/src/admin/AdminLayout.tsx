import type { Role } from '@induction/shared';
import { Suspense, type ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Loading, ROLE_LABEL } from '../components/ui';
import { useLogout, useMe } from '../lib/auth';

interface NavItem {
  to: string;
  label: string;
}
interface NavGroup {
  heading: string;
  items: NavItem[];
}

const reports = (base: string): NavItem[] => [
  { to: base, label: 'Dashboard' },
  { to: `${base}/candidates`, label: 'Candidates' },
  { to: `${base}/employees`, label: 'Performance' },
  { to: `${base}/feedback`, label: 'Feedback' },
];

const NAV: Record<Exclude<Role, 'LEARNER'>, { title: string; groups: NavGroup[] }> = {
  ADMIN: {
    title: 'Admin panel',
    groups: [
      { heading: 'HR dashboard', items: reports('/admin') },
      {
        heading: 'Induction design',
        items: [
          { to: '/admin/avatars', label: 'Presenters' },
          { to: '/admin/content', label: 'Content and questions' },
          { to: '/admin/ai', label: 'AI assistant' },
        ],
      },
      {
        heading: 'Access',
        items: [
          { to: '/admin/users', label: 'Employee Accounts' },
          { to: '/admin/audit', label: 'Audit log' },
        ],
      },
    ],
  },
  HR_ADMIN: {
    title: 'HR panel',
    groups: [
      { heading: 'Candidates', items: reports('/hr') },
      { heading: 'Access', items: [{ to: '/hr/audit', label: 'Audit log' }] },
    ],
  },
  LEGAL_REVIEWER: {
    title: 'Legal review',
    groups: [
      {
        heading: 'Review',
        items: [
          { to: '/admin/review', label: 'Review queue' },
          { to: '/admin/content', label: 'Content' },
        ],
      },
    ],
  },
};

export function AdminLayout(): ReactElement {
  const me = useMe();
  const logout = useLogout();
  const role = me.data?.role;
  const nav = role && role !== 'LEARNER' ? NAV[role] : NAV.HR_ADMIN;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="flex flex-col bg-brand-900 p-4 text-white print:hidden lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <p className="px-2 text-sm font-semibold uppercase tracking-widest text-blue-200">
          LevelShift
        </p>
        <p className="px-2 text-lg font-semibold">{nav.title}</p>
        <nav className="mt-3">
          {nav.groups.map((group) => (
            <div key={group.heading} className="mt-3">
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-blue-300">
                {group.heading}
              </p>
              <div className="mt-1 flex flex-wrap gap-1 lg:flex-col">
                {group.items.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/admin' || link.to === '/hr'}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-white/15 font-medium text-white' : 'text-blue-100 hover:bg-white/10'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/15 pt-4 text-sm lg:mt-auto">
          {me.data && (
            <div className="flex items-center gap-3 px-1">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white"
              >
                {`${me.data.firstName.charAt(0)}${me.data.lastName.charAt(0)}`.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {me.data.firstName} {me.data.lastName}
                </p>
                <p className="truncate text-xs text-blue-300">{ROLE_LABEL[me.data.role]}</p>
              </div>
            </div>
          )}
          <div className="mt-3 space-y-2">
            <Link
              to="/change-password"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-900 shadow-sm transition-colors hover:bg-blue-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Change password
            </Link>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              onClick={() => void logout()}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">
        {/* Pages load on demand (see main.tsx); keep the sidebar while one loads. */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

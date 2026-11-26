import type { MeDto, Role } from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { api, ApiError } from './api';
import { LOGIN_PATH } from './portal';

/** The signed-in user, or null when there is no session. */
export function useMe() {
  return useQuery<MeDto | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.get<MeDto>('/auth/me');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export const homeFor = (role: Role): string =>
  role === 'LEARNER'
    ? '/welcome'
    : role === 'ADMIN'
      ? '/admin'
      : role === 'HR_ADMIN'
        ? '/hr'
        : '/admin/review';

export function useLogout(): () => Promise<void> {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    // Each app has its own sign-in page: candidates in the candidate app, staff in the staff app.
    await api.post('/auth/logout').catch(() => undefined);
    queryClient.clear();
    navigate(LOGIN_PATH, { replace: true });
  };
}

export function FullPageNote({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-slate-500">
      {children}
    </div>
  );
}

/** Shows its children only to the listed roles; everyone else is sent where they belong. */
/** Pass `outlet` to guard a group of nested routes instead of a single page. */
export function RequireRole({
  roles,
  children,
  outlet,
}: {
  roles: Role[];
  children?: ReactNode;
  outlet?: boolean;
}): ReactElement {
  const me = useMe();
  if (me.isLoading) return <FullPageNote>Loading…</FullPageNote>;
  if (me.isError)
    return (
      <FullPageNote>Cannot reach the server. Check that it is running, then reload.</FullPageNote>
    );
  if (!me.data) return <Navigate to={LOGIN_PATH} replace />;
  // A default password has to be replaced before anything else opens.
  if (me.data.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!roles.includes(me.data.role)) return <Navigate to={homeFor(me.data.role)} replace />;
  return outlet ? <Outlet /> : <>{children}</>;
}

/** `/` sends each user to their own start page. */
export function HomeRedirect(): ReactElement {
  const me = useMe();
  if (me.isLoading) return <FullPageNote>Loading…</FullPageNote>;
  if (me.isError)
    return (
      <FullPageNote>Cannot reach the server. Check that it is running, then reload.</FullPageNote>
    );
  if (me.data?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Navigate to={me.data ? homeFor(me.data.role) : LOGIN_PATH} replace />;
}

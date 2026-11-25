/** Arriving by invitation link, and replacing a default password. */
import type { LoginResultDto } from '@induction/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorNote, Field, Input } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { FullPageNote, homeFor, useLogout, useMe } from '../lib/auth';

function Frame({ title, children }: { title: string; children: React.ReactNode }): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-blue-900 to-brand-600 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          LevelShift Induction
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** `/invite/:token`: signs the candidate in and takes them to their induction. */
export function InvitePage(): ReactElement {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    api
      .post<LoginResultDto>('/auth/invite', { token })
      .then(async () => {
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        navigate('/welcome', { replace: true });
      })
      .catch((err: unknown) => setError(errorMessage(err)));
  }, [token, navigate, queryClient]);

  return (
    <Frame title={error ? 'This link cannot be used' : 'Opening your induction…'}>
      {error ? (
        <div className="space-y-4">
          <ErrorNote>{error}</ErrorNote>
          <Link to="/login" className="inline-block text-sm text-brand-600 underline">
            Sign in with your email and password instead
          </Link>
        </div>
      ) : (
        <p className="text-sm text-slate-600">One moment while we check your invitation.</p>
      )}
    </Frame>
  );
}

/** `/change-password`: required after signing in with a default password, optional otherwise. */
export function ChangePasswordPage(): ReactElement {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (me.isLoading) return <FullPageNote>Loading…</FullPageNote>;
  if (!me.data) return <Navigate to="/login" replace />;
  const user = me.data;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== repeat) return setError('The two new passwords do not match');
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Frame title={user.mustChangePassword ? 'Choose your own password' : 'Change password'}>
      <p className="mb-4 text-sm text-slate-600">
        {user.mustChangePassword
          ? `Hello ${user.firstName}. You signed in with the default password you were given. Please replace it before you continue.`
          : 'Leave the current password empty if you have only ever used an invitation link.'}
      </p>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field
          label={user.mustChangePassword ? 'Default password you were given' : 'Current password'}
        >
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
            required={user.mustChangePassword}
          />
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
            required
            minLength={8}
          />
        </Field>
        <Field label="New password again">
          <Input
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
          />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (user.mustChangePassword ? void logout() : navigate(-1))}
          >
            {user.mustChangePassword ? 'Sign out' : 'Cancel'}
          </Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </Button>
        </div>
      </form>
    </Frame>
  );
}

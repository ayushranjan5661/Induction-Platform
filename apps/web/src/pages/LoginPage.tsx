/** `/login`: the staff sign-in page for Admin, HR and Legal. Candidates have `/candidate`. */
import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { homeFor, useMe } from '../lib/auth';
import { otherSignInUrl } from '../lib/portal';
import { CardTitle, PasswordForm, SignInShell, switchLinkClass } from './SignInShell';

export function LoginPage(): ReactElement {
  const me = useMe();
  if (me.data) return <Navigate to={homeFor(me.data.role)} replace />;

  return (
    <SignInShell
      badge="Admin & HR workspace"
      headline="Great first days,"
      accent="built here."
      intro="Shape the induction journey, welcome every new joiner and see exactly where each one stands."
      footer="Trouble signing in? Contact your administrator."
    >
      <CardTitle title="Staff sign in" text="Sign in with the email and password you were given." />
      <div className="mt-8">
        <PasswordForm portal="staff" emailPlaceholder="you@levelshift.com" />
      </div>
      <p className="mt-6 border-t border-white/[0.06] pt-5 text-center text-xs text-slate-500">
        For Admin, HR and Legal staff.{' '}
        <a href={otherSignInUrl()} className={switchLinkClass}>
          Candidate? Sign in here
        </a>
      </p>
    </SignInShell>
  );
}

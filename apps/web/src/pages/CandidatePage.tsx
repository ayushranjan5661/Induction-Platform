/**
 * The candidate landing page. `/candidate` signs in with email and password;
 * `/invite/:token` is where HR's invitation link lands: it greets the candidate
 * and one click starts their induction.
 */
import type { InvitePreviewDto, LoginResultDto } from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../lib/api';
import { homeFor, useMe } from '../lib/auth';
import { otherSignInUrl } from '../lib/portal';
import { withFreshTabSession } from '../lib/tabSession';
import {
  AlertNote,
  Arrow,
  CardTitle,
  PasswordForm,
  primaryButtonClass,
  SignInShell,
  Spinner,
  switchLinkClass,
} from './SignInShell';

function CandidateShell({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <SignInShell
      badge="Candidate induction"
      headline="Welcome to LevelShift,"
      accent="let's get you started."
      intro="Meet your presenter, learn how we work and finish your induction at your own pace."
      footer="Trouble signing in? Contact the HR person who invited you."
    >
      {children}
      <p className="mt-6 border-t border-white/[0.06] pt-5 text-center text-xs text-slate-500">
        For candidates joining LevelShift.{' '}
        <a href={otherSignInUrl()} className={switchLinkClass}>
          Staff sign in
        </a>
      </p>
    </SignInShell>
  );
}

/** `/candidate`: email and password sign-in for candidates. */
export function CandidateLoginPage(): ReactElement {
  const me = useMe();
  if (me.data) return <Navigate to={homeFor(me.data.role)} replace />;
  return (
    <CandidateShell>
      <CardTitle
        title="Candidate sign in"
        text="Use the email and password HR sent you, or simply open the invitation link from your email."
      />
      <div className="mt-8">
        <PasswordForm portal="candidate" emailPlaceholder="you@example.com" />
      </div>
    </CandidateShell>
  );
}

/** `/invite/:token`: HR's link lands here; the candidate clicks to begin. */
export function InvitePage(): ReactElement {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [usePassword, setUsePassword] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const preview = useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => api.post<InvitePreviewDto>('/auth/invite/check', { token }),
    retry: false,
    staleTime: Infinity,
  });

  const start = async () => {
    setStarting(true);
    setStartError('');
    try {
      await withFreshTabSession(() => api.post<LoginResultDto>('/auth/invite', { token }));
      queryClient.clear();
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/welcome', { replace: true });
    } catch (err) {
      setStartError(errorMessage(err));
      setStarting(false);
    }
  };

  const linkError = preview.isError ? errorMessage(preview.error) : '';

  if (usePassword || linkError) {
    return (
      <CandidateShell>
        <CardTitle
          title="Candidate sign in"
          text={
            linkError
              ? 'Your invitation link cannot be used. You can still sign in with the email and password HR sent you.'
              : 'Use the email and password HR sent you.'
          }
        />
        {linkError && (
          <div className="mt-6">
            <AlertNote>{linkError}</AlertNote>
          </div>
        )}
        <div className="mt-8">
          <PasswordForm portal="candidate" emailPlaceholder="you@example.com" />
        </div>
        {!linkError && (
          <button
            type="button"
            onClick={() => setUsePassword(false)}
            className={`mt-5 block w-full text-center text-sm ${switchLinkClass}`}
          >
            Back to my invitation
          </button>
        )}
      </CandidateShell>
    );
  }

  return (
    <CandidateShell>
      {preview.isLoading ? (
        <CardTitle title="Checking your invitation…" text="One moment, please." />
      ) : (
        <>
          <CardTitle
            title={`Hi ${preview.data?.firstName ?? 'there'}, you're invited!`}
            text="Your LevelShift induction is ready. It takes you through who we are, how we work and the policies you need to know, with a short quiz along the way."
          />
          <ul className="mt-6 space-y-2 text-sm text-slate-300">
            {[
              'Watch short presenter-led lessons',
              'Answer a few quick questions',
              'Acknowledge the key policies',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan-light" />
                {item}
              </li>
            ))}
          </ul>
          {startError && (
            <div className="mt-6">
              <AlertNote>{startError}</AlertNote>
            </div>
          )}
          <button
            type="button"
            onClick={() => void start()}
            disabled={starting}
            className={`mt-8 ${primaryButtonClass}`}
          >
            {starting ? (
              <>
                <Spinner />
                Opening your induction…
              </>
            ) : (
              <>
                Start my induction
                <Arrow />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setUsePassword(true)}
            className={`mt-5 block w-full text-center text-sm ${switchLinkClass}`}
          >
            Sign in with email and password instead
          </button>
        </>
      )}
    </CandidateShell>
  );
}

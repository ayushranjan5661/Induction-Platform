import type { CredentialsDto } from '@induction/shared';
import { useState, type ReactElement } from 'react';
import { Button, Modal, formatDate } from './ui';

function CopyRow({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  /** Keeps line breaks (for the email body). */
  multiline?: boolean;
}): ReactElement {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this value', value);
    }
  };
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p
          className={`text-sm text-slate-900 ${mono ? 'font-mono' : ''} ${
            multiline ? 'max-h-64 overflow-y-auto whitespace-pre-wrap break-words' : 'break-all'
          }`}
        >
          {value}
        </p>
      </div>
      <Button small onClick={() => void copy()}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

interface Email {
  subject: string;
  body: string;
}

/** A ready-to-send email with whichever details are available: link, password or both. */
function emailFor(c: CredentialsDto, staff: boolean): Email {
  const hello = `Hi ${(c.firstName || '').trim() || 'there'},`;
  const signIn = (heading: string) => [
    heading,
    `Sign-in page: ${c.signInUrl}`,
    `Email: ${c.email}`,
    `Temporary password: ${c.password ?? ''}`,
    '',
    'For your security, you will be asked to choose your own password the first time you sign in.',
  ];

  if (staff) {
    return {
      subject: 'Your LevelShift Induction Platform account',
      body: [
        hello,
        '',
        'An account has been created for you on the LevelShift Induction Platform.',
        '',
        ...signIn('Your sign-in details:'),
        '',
        'If you have any trouble signing in, just reply to this email.',
        '',
        'Kind regards,',
        'LevelShift Induction Platform team',
      ].join('\n'),
    };
  }

  const lines = [
    hello,
    '',
    'Welcome to LevelShift! We are delighted to have you joining us.',
    '',
    'Your online induction is ready. Our presenters will walk you through who we are, how we work and the policies you need to know, with a few short questions along the way. You can stop at any time and pick up where you left off.',
  ];
  if (c.inviteUrl) {
    lines.push(
      '',
      'Start your induction (no password needed):',
      c.inviteUrl,
      ...(c.inviteExpiresAt
        ? [`This personal link works until ${formatDate(c.inviteExpiresAt)}.`]
        : []),
    );
  }
  if (c.password) {
    lines.push(
      '',
      ...signIn(
        c.inviteUrl
          ? 'Or sign in with your email and temporary password:'
          : 'Sign in with your email and temporary password:',
      ),
    );
  }
  lines.push(
    '',
    'Please keep these details private. If you have any questions, just reply to this email.',
    '',
    'Kind regards,',
    'HR Team',
    'LevelShift',
  );
  return { subject: 'Welcome to LevelShift: your induction is ready', body: lines.join('\n') };
}

/** Opens a new draft in the default mail app (Outlook on most work PCs). */
const mailtoUrl = (to: string, e: Email): string =>
  `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`;

const mailIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3.5 7.5l8.5 6 8.5-6" />
  </svg>
);

function MissingRow({ label, text }: { label: string; text: string }): ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

/**
 * Shows sign-in details: freshly issued ones, or (`stored`) the ones kept for this person,
 * opened from the eye button. `onResetPassword` adds a Reset password button.
 */
export function CredentialsModal({
  credentials,
  onClose,
  stored = false,
  onResetPassword,
  resetting = false,
  error = '',
  staff = false,
}: {
  credentials: CredentialsDto;
  onClose: () => void;
  stored?: boolean;
  onResetPassword?: () => void;
  resetting?: boolean;
  error?: string;
  /** Staff accounts have no invitation link. */
  staff?: boolean;
}): ReactElement {
  const who = staff ? 'the user' : 'the candidate';
  const blocked = !credentials.isActive;
  // Nothing to send to someone who cannot sign in.
  const email =
    !blocked && (credentials.password || credentials.inviteUrl)
      ? emailFor(credentials, staff)
      : null;
  return (
    <Modal title="Sign-in details" onClose={onClose}>
      <div className="space-y-3">
        {blocked ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {staff
              ? 'This account is deactivated, so these details cannot be used to sign in. Activate it first.'
              : 'This candidate is blocked, so these details cannot be used to sign in. Unblock them first, then issue a new link.'}
          </p>
        ) : stored ? (
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            {staff
              ? 'The default password shows until the user sets their own.'
              : 'The default password shows until the candidate sets their own; the link shows while it is valid.'}
          </p>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Copy these now. You can view them again later while they are still valid.
          </p>
        )}
        {credentials.employeeId && <CopyRow label="Employee id" value={credentials.employeeId} />}
        <CopyRow label="Sign-in page" value={credentials.signInUrl} mono />
        <CopyRow label="Email" value={credentials.email} />
        {credentials.password ? (
          <CopyRow
            label="Default password (must be changed at first sign-in)"
            value={credentials.password}
            mono
          />
        ) : (
          stored && (
            <MissingRow
              label="Default password"
              text={`Not available: ${who} has set their own password, or none was issued. Use Reset password to issue a new one.`}
            />
          )
        )}
        {credentials.inviteUrl ? (
          <CopyRow
            label={`Invitation link${credentials.inviteExpiresAt ? ` (works until ${formatDate(credentials.inviteExpiresAt)})` : ''}`}
            value={credentials.inviteUrl}
            mono
          />
        ) : (
          stored &&
          !staff && (
            <MissingRow
              label="Invitation link"
              text={
                credentials.inviteHidden
                  ? 'A link is active, but it was issued before links were kept, so it cannot be shown. Use New link on the candidate’s row to get one you can see.'
                  : 'No valid link. Use New link on the candidate’s row to issue one.'
              }
            />
          )
        )}
        {email && (
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-800">Email to {credentials.email}</p>
            <CopyRow label="Subject" value={email.subject} />
            <CopyRow label="Message" value={email.body} multiline />
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={mailtoUrl(credentials.email, email)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F6CBD] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#115EA3]"
                title="Opens a new draft in Outlook with the subject and message filled in"
              >
                {mailIcon}
                Open in Outlook
              </a>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          {onResetPassword && !blocked && (
            <Button disabled={resetting} onClick={onResetPassword}>
              {resetting ? 'Resetting…' : 'Reset password'}
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

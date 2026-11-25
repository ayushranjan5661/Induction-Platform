import type { CredentialsDto } from '@induction/shared';
import { useState, type ReactElement } from 'react';
import { Button, Modal, formatDate } from './ui';

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
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
        <p className={`break-all text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <Button small onClick={() => void copy()}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

/** Builds a ready-to-send message with whichever details were issued. */
function messageFor(c: CredentialsDto): string {
  const lines = ['Welcome to LevelShift! Your induction is ready.', ''];
  if (c.inviteUrl) lines.push(`Open this link to begin: ${c.inviteUrl}`, '');
  if (c.password) {
    lines.push(
      c.inviteUrl ? 'Or sign in with:' : 'Sign in with:',
      `Email: ${c.email}`,
      `Password: ${c.password}`,
      'You will be asked to choose your own password the first time you sign in.',
    );
  }
  return lines.join('\n').trim();
}

/** Shows freshly issued sign-in details. They cannot be shown again once this is closed. */
export function CredentialsModal({
  credentials,
  onClose,
}: {
  credentials: CredentialsDto;
  onClose: () => void;
}): ReactElement {
  return (
    <Modal title="Sign-in details" onClose={onClose}>
      <div className="space-y-3">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Copy these now. For security they are shown only once; you can always issue new ones.
        </p>
        {credentials.employeeId && <CopyRow label="Employee id" value={credentials.employeeId} />}
        <CopyRow label="Email" value={credentials.email} />
        {credentials.password && (
          <CopyRow
            label="Default password (must be changed at first sign-in)"
            value={credentials.password}
            mono
          />
        )}
        {credentials.inviteUrl && (
          <CopyRow
            label={`Invitation link${credentials.inviteExpiresAt ? ` (works until ${formatDate(credentials.inviteExpiresAt)})` : ''}`}
            value={credentials.inviteUrl}
            mono
          />
        )}
        <CopyRow label="Message to send" value={messageFor(credentials)} />
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

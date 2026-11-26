import type {
  AuditActorFilter,
  AuditCategory,
  AuditLogDto,
  AuditQuery,
  Role,
} from '@induction/shared';
import type { Prisma } from '@prisma/client';

/**
 * The audit log follows the chain of command: Super Admin > Admin > HR (Legal sits beside HR).
 * Everyone sees their own actions and the actions of people below them, never those of peers
 * or of people above them. Entries with no actor (system work, or a deleted actor before
 * snapshots existed) are for the top only. With no Super Admin configured, Admins are the top.
 */
export type AuditScope = AuditLogDto['scope'];

export function scopeOf(
  role: Role,
  isSuperAdmin: boolean,
  superAdminConfigured: boolean,
): AuditScope | null {
  if (role === 'ADMIN') return isSuperAdmin || !superAdminConfigured ? 'ALL' : 'ADMIN';
  if (role === 'HR_ADMIN') return 'HR';
  return null;
}

/** Roles whose actions a scope sees besides the viewer's own. */
const BELOW: Record<Exclude<AuditScope, 'ALL'>, Role[]> = {
  ADMIN: ['HR_ADMIN', 'LEGAL_REVIEWER', 'LEARNER'],
  HR: ['LEARNER'],
};

export function actorFiltersFor(scope: AuditScope): AuditActorFilter[] {
  if (scope === 'ALL') return ['ME', 'ADMIN', 'HR_ADMIN', 'LEGAL_REVIEWER', 'LEARNER'];
  return ['ME', ...BELOW[scope]];
}

export function visibleWhere(scope: AuditScope, viewerId: string): Prisma.AuditLogWhereInput {
  if (scope === 'ALL') return {};
  return { OR: [{ actorId: viewerId }, { actorRole: { in: BELOW[scope] } }] };
}

const REVIEW_SUFFIXES = ['.submit', '.approve', '.reject', '.publish'];
const CONTENT_PREFIXES = ['module.', 'step.', 'question.', 'avatar.', 'businessUnit.', 'content.'];
const AI_ACTIONS = ['question.ai-draft'];
const SIGN_IN_ACTIONS = ['user.change-password'];

export function categoryOf(action: string): AuditCategory {
  if (action.startsWith('auth.') || SIGN_IN_ACTIONS.includes(action)) return 'SIGN_IN';
  if (AI_ACTIONS.includes(action)) return 'AI';
  if (REVIEW_SUFFIXES.some((s) => action.endsWith(s))) return 'REVIEW';
  if (action.startsWith('candidate.')) return 'CANDIDATES';
  if (action.startsWith('user.')) return 'ACCOUNTS';
  return 'CONTENT';
}

/** The same grouping as `categoryOf`, as a database filter. */
export function categoryWhere(category: AuditCategory): Prisma.AuditLogWhereInput {
  const review: Prisma.AuditLogWhereInput[] = REVIEW_SUFFIXES.map((s) => ({
    action: { endsWith: s },
  }));
  switch (category) {
    case 'SIGN_IN':
      return {
        OR: [{ action: { startsWith: 'auth.' } }, { action: { in: SIGN_IN_ACTIONS } }],
      };
    case 'AI':
      return { action: { in: AI_ACTIONS } };
    case 'REVIEW':
      return { OR: review };
    case 'CANDIDATES':
      return { action: { startsWith: 'candidate.' } };
    case 'ACCOUNTS':
      return { action: { startsWith: 'user.', notIn: SIGN_IN_ACTIONS } };
    case 'CONTENT':
      return {
        OR: CONTENT_PREFIXES.map((p) => ({ action: { startsWith: p } })),
        NOT: [{ action: { in: AI_ACTIONS } }, ...review],
      };
  }
}

export function actorWhere(filter: AuditActorFilter, viewerId: string): Prisma.AuditLogWhereInput {
  return filter === 'ME' ? { actorId: viewerId } : { actorRole: filter };
}

/** Date filters are whole days in UTC, both ends included. */
export function dateWhere(query: Pick<AuditQuery, 'from' | 'to'>): Prisma.AuditLogWhereInput {
  if (!query.from && !query.to) return {};
  const createdAt: Prisma.DateTimeFilter = {};
  if (query.from) createdAt.gte = new Date(`${query.from}T00:00:00Z`);
  if (query.to) createdAt.lt = new Date(new Date(`${query.to}T00:00:00Z`).getTime() + 86_400_000);
  return { createdAt };
}

const quote = (label: string | null, fallback: string): string => (label ? `“${label}”` : fallback);

/** A plain-English line for one entry. `target` is the name of what was acted on, if known. */
export function summarize(
  action: string,
  target: string | null,
  details: Record<string, unknown>,
): string {
  const who = target ?? 'a deleted account';
  const active = details.isActive === true;
  const via =
    details.method === 'invite'
      ? ' with their invitation link'
      : details.method === 'demo'
        ? ' with a demo button'
        : '';
  const [kind, verb] = action.split('.', 2) as [string, string | undefined];
  const thing: Record<string, string> = {
    module: 'module',
    step: 'step',
    question: 'question',
    avatar: 'presenter',
    businessUnit: 'business unit',
  };

  switch (action) {
    case 'auth.sign-in':
      return `Signed in${via}`;
    case 'auth.sign-in-failed':
      return 'Sign-in failed: wrong password';
    case 'auth.sign-out':
      return 'Signed out';
    case 'user.change-password':
      return 'Changed their own password';
    case 'user.create':
      return `Created the account of ${who}`;
    case 'user.update':
      return `Updated the account of ${who}`;
    case 'user.delete':
      return `Deleted an account${details.role ? ` (${String(details.role)})` : ''}`;
    case 'user.set-active':
      return `${active ? 'Activated' : 'Deactivated'} the account of ${who}`;
    case 'user.issue-credentials':
      return `Issued sign-in details for ${who}`;
    case 'user.view-credentials':
      return `Viewed the sign-in details of ${who}`;
    case 'user.reset-password':
      return `Reset the password of ${who}`;
    case 'user.import':
      return `Imported accounts from a CSV file (${Number(details.created ?? 0)} created, ${Number(details.skipped ?? 0)} skipped)`;
    case 'candidate.create':
      return `Invited candidate ${who}`;
    case 'candidate.delete':
      return 'Deleted a candidate';
    case 'candidate.invite':
      return `Issued a new invitation link for ${who}`;
    case 'candidate.view-credentials':
      return `Viewed the sign-in details of ${who}`;
    case 'candidate.reset-password':
      return `Reset the password and invitation link of ${who}`;
    case 'candidate.set-active':
      return `${active ? 'Unblocked' : 'Blocked'} ${who}`;
    case 'content.resetToDefault':
      return 'Reset all induction content to the default';
    case 'question.ai-draft':
      return `Drafted a question with AI in ${quote(target, 'a module')}`;
  }

  const noun = thing[kind] ?? kind;
  if (kind === 'step' || kind === 'question') {
    // Steps and questions are named by their module.
    const where = ` in ${quote(target, 'a module')}`;
    if (verb === 'create') return `Added a ${noun}${where}`;
    if (verb === 'update') return `Edited a ${noun}${where}`;
    if (verb === 'delete') return `Deleted a ${noun}${where}`;
    if (verb === 'move') return `Moved a ${noun} ${String(details.direction ?? '')}${where}`.trim();
  }
  const named = quote(target, `a ${noun}`);
  switch (verb) {
    case 'create':
      return `Created the ${noun} ${named}`;
    case 'update':
      return `Edited the ${noun} ${named}`;
    case 'delete':
      return `Deleted the ${noun} ${named}`;
    case 'submit':
      return `Sent the ${noun} ${named} for review`;
    case 'approve':
      return `Approved the ${noun} ${named}`;
    case 'reject':
      return `Sent the ${noun} ${named} back to draft`;
    case 'publish':
      return `Published the ${noun} ${named}`;
    default:
      return action;
  }
}

/** Details safe and useful to show. Secrets are never stored; this also drops ids already shown. */
export function publicDetails(details: unknown): Record<string, unknown> {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (/password|token|secret|hash/i.test(key) && typeof value !== 'boolean') continue;
    out[key] = value;
  }
  return out;
}

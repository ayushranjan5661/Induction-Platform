import {
  type AuditActorFilter,
  type AuditCategory,
  type AuditEntryDto,
  type AuditLogDto,
  type Role,
} from '@induction/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  Button,
  ErrorNote,
  Input,
  Loading,
  Notice,
  PageHeader,
  ROLE_LABEL,
  Select,
  Table,
} from '../components/ui';
import { api, errorMessage, toQuery } from '../lib/api';
import { exportToExcel } from '../lib/export';

const PAGE_SIZE = 25;
const EMPTY = { search: '', category: '', actor: '', from: '', to: '' };

const CATEGORY: Record<AuditCategory, { label: string; style: string }> = {
  SIGN_IN: { label: 'Sign-in', style: 'bg-slate-100 text-slate-700' },
  ACCOUNTS: { label: 'Accounts', style: 'bg-violet-100 text-violet-800' },
  CANDIDATES: { label: 'Candidates', style: 'bg-sky-100 text-sky-800' },
  CONTENT: { label: 'Content', style: 'bg-amber-100 text-amber-800' },
  REVIEW: { label: 'Review', style: 'bg-emerald-100 text-emerald-800' },
  AI: { label: 'AI', style: 'bg-pink-100 text-pink-800' },
};

const ACTOR_LABEL: Record<AuditActorFilter, string> = {
  ME: 'My actions',
  ADMIN: 'Admins',
  HR_ADMIN: 'HR',
  LEGAL_REVIEWER: 'Legal reviewers',
  LEARNER: 'Candidates',
};

const SCOPE_TEXT: Record<AuditLogDto['scope'], string> = {
  ALL: 'You are at the top of the hierarchy, so you see every action by every account.',
  ADMIN:
    'You see your own actions and those of HR, Legal reviewers and candidates. Actions by other admins and the Super Admin are not shown.',
  HR: 'You see your own actions and those of candidates. Actions by other HR users and admins are not shown.',
};

const DETAIL_LABEL: Record<string, string> = {
  method: 'How',
  isActive: 'Active',
  role: 'Role',
  employeeId: 'Employee id',
  password: 'Password',
  invite: 'Invitation link',
  from: 'From',
  to: 'To',
  direction: 'Direction',
  type: 'Type',
  topic: 'Topic',
  created: 'Created',
  skipped: 'Skipped',
};
/** Ids the row already names, or that mean nothing to a reader. */
const HIDDEN_DETAILS = new Set(['moduleId', 'title', 'name', 'method']);

const detailText = (details: Record<string, unknown>): string =>
  Object.entries(details)
    .filter(([key, value]) => !HIDDEN_DETAILS.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => {
      const shown =
        key === 'role' && typeof value === 'string' && value in ROLE_LABEL
          ? ROLE_LABEL[value as Role]
          : typeof value === 'boolean'
            ? value
              ? 'yes'
              : 'no'
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value);
      return `${DETAIL_LABEL[key] ?? key}: ${shown}`;
    })
    .join(' · ');

const roleText = (actor: AuditEntryDto['actor']): string =>
  actor.isSuperAdmin ? 'Super Admin' : actor.role ? ROLE_LABEL[actor.role] : '';

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const toSheetRow = (row: AuditEntryDto) => ({
  When: formatTime(row.createdAt),
  Who: row.actor.name,
  Email: row.actor.email ?? '',
  Role: roleText(row.actor),
  Category: CATEGORY[row.category].label,
  Action: row.summary,
  Details: detailText(row.details),
  'Action code': row.action,
});

/** Who did what and when, limited to the viewer's place in Super Admin > Admin > HR. */
export function AuditPage(): ReactElement {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [exportError, setExportError] = useState('');
  const set = (patch: Partial<typeof EMPTY>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const log = useQuery({
    queryKey: ['audit', filters, page],
    queryFn: () =>
      api.get<AuditLogDto>(`/audit${toQuery({ ...filters, page, pageSize: PAGE_SIZE })}`),
    placeholderData: keepPreviousData,
  });

  const exportAll = async () => {
    setExportError('');
    try {
      const all = await api.get<AuditLogDto>(
        `/audit${toQuery({ ...filters, page: 1, pageSize: 1000 })}`,
      );
      if (all.rows.length === 0)
        return setExportError('There is nothing to export for these filters.');
      await exportToExcel('induction-audit-log', 'Audit log', all.rows.map(toSheetRow));
    } catch (err) {
      setExportError(errorMessage(err));
    }
  };

  const data = log.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle={data ? `${data.total} entr${data.total === 1 ? 'y' : 'ies'} match` : undefined}
        actions={
          <>
            <Button onClick={() => void exportAll()}>Export to Excel</Button>
            <Button onClick={() => window.print()}>Print / save as PDF</Button>
          </>
        }
      />
      {data && (
        <div className="mb-4 print:hidden">
          <Notice>{SCOPE_TEXT[data.scope]}</Notice>
        </div>
      )}
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 print:hidden md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          placeholder="Search person, email, module or action"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          aria-label="Search"
        />
        <Select
          aria-label="Category"
          value={filters.category}
          onChange={(e) => set({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY).map(([value, c]) => (
            <option key={value} value={value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Who"
          value={filters.actor}
          onChange={(e) => set({ actor: e.target.value })}
        >
          <option value="">Everyone I can see</option>
          {(data?.actorFilters ?? []).map((a) => (
            <option key={a} value={a}>
              {ACTOR_LABEL[a]}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <Input
            type="date"
            aria-label="From"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
          />
          <span>to</span>
          <Input
            type="date"
            aria-label="To"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <ErrorNote>{exportError || (log.isError ? errorMessage(log.error) : '')}</ErrorNote>
        {!data ? (
          !log.isError && <Loading />
        ) : (
          <>
            <Table head={['When', 'Who', 'What', 'Details']}>
              {data.rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-slate-600">{formatTime(row.createdAt)}</td>
                  <td>
                    <span className="font-medium text-slate-900">{row.actor.name}</span>
                    {roleText(row.actor) && (
                      <span
                        className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.actor.isSuperAdmin
                            ? 'bg-brand-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {roleText(row.actor)}
                      </span>
                    )}
                    {row.actor.email && (
                      <span className="block text-xs text-slate-500">{row.actor.email}</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`mr-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY[row.category].style}`}
                    >
                      {CATEGORY[row.category].label}
                    </span>
                    <span className="text-slate-900">{row.summary}</span>
                  </td>
                  <td className="text-xs text-slate-500">{detailText(row.details) || '–'}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No entries match these filters.
                  </td>
                </tr>
              )}
            </Table>
            <div className="flex items-center justify-end gap-3 text-sm text-slate-600 print:hidden">
              <Button small disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              Page {page} of {pages}
              <Button small disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** Business units, users (with CSV import) and the review queue. */
import {
  ROLES,
  type AdminUserDto,
  type CredentialsDto,
  type BusinessUnitDto,
  type CsvImportResultDto,
  type ReviewItemDto,
  type UserUpsertInput,
} from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Loading,
  Modal,
  Notice,
  PageHeader,
  Select,
  StatusBadge,
  ROLE_LABEL,
  Table,
  Textarea,
  pretty,
} from '../components/ui';
import { CredentialsModal } from '../components/Credentials';
import { api, errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import { WorkflowButtons, useBusinessUnits, useRefreshContent } from './shared';

/* ------------------------------------------------------------------ */
/* Business units                                                      */
/* ------------------------------------------------------------------ */

export function BusinessUnitsPage(): ReactElement {
  const units = useBusinessUnits();
  const refresh = useRefreshContent();
  const [editing, setEditing] = useState<BusinessUnitDto | 'new' | null>(null);
  const [error, setError] = useState('');

  if (units.isLoading) return <Loading />;
  if (units.isError || !units.data) return <ErrorNote>{errorMessage(units.error)}</ErrorNote>;

  const remove = async (unit: BusinessUnitDto) => {
    if (!window.confirm(`Delete the business unit "${unit.name}"?`)) return;
    setError('');
    try {
      await api.del(`/admin/business-units/${unit.id}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Business units"
        subtitle="A learner's own business unit is presented first in the Business Units module."
        actions={
          <Button variant="primary" onClick={() => setEditing('new')}>
            + New business unit
          </Button>
        }
      />
      <div className="mb-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <Table head={['Name', 'Description', '']}>
        {units.data.map((unit) => (
          <tr key={unit.id}>
            <td className="font-medium text-slate-900">{unit.name}</td>
            <td className="max-w-xl text-slate-600">{unit.description}</td>
            <td className="whitespace-nowrap text-right">
              <Button small onClick={() => setEditing(unit)}>
                Edit
              </Button>{' '}
              <Button small variant="danger" onClick={() => void remove(unit)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </Table>
      {editing && (
        <UnitForm
          unit={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function UnitForm({
  unit,
  onClose,
  onSaved,
}: {
  unit?: BusinessUnitDto;
  onClose: () => void;
  onSaved: () => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState({
    name: unit?.name ?? '',
    description: unit?.description ?? '',
  });
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    try {
      if (unit) await api.put(`/admin/business-units/${unit.id}`, form);
      else await api.post('/admin/business-units', form);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Modal title={unit ? 'Edit business unit' : 'New business unit'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Name">
          <Input
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            maxLength={500}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!form.name.trim()} onClick={() => void save()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

const PILL_TONE = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-800',
  indigo: 'bg-indigo-100 text-indigo-800',
} as const;

function Pill({
  tone,
  title,
  children,
}: {
  tone: keyof typeof PILL_TONE;
  title?: string;
  children: string;
}): ReactElement {
  return (
    <span
      title={title}
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/** A staff member's default password, shown until they set their own. */
function DefaultPassword({ value }: { value: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the value is still on screen */
    }
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 py-0.5 pl-2 pr-1 text-xs text-amber-900"
      title="Default password. It disappears once the user sets their own."
    >
      <code className="font-mono font-semibold">{value}</code>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-full px-1.5 py-0.5 font-medium text-amber-800 hover:bg-amber-200"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}

const CSV_HEADER = 'email,firstName,lastName,department,location,businessUnit,joiningDate';

export function UsersPage(): ReactElement {
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUserDto[]>('/admin/users'),
  });
  const [editing, setEditing] = useState<AdminUserDto | 'new' | null>(null);
  const [importing, setImporting] = useState(false);
  const [issued, setIssued] = useState<CredentialsDto | null>(null);
  const [error, setError] = useState('');

  const resetPassword = async (user: AdminUserDto) => {
    if (
      !window.confirm(
        `Set a new default password for ${user.firstName} ${user.lastName}? Their current password will stop working.`,
      )
    )
      return;
    setError('');
    try {
      setIssued(await api.post<CredentialsDto>(`/admin/users/${user.id}/reset-password`));
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const me = useMe();

  const remove = async (user: AdminUserDto) => {
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (
      !window.confirm(
        `Permanently delete ${name}'s account? They lose access straight away. Their past actions stay in the audit history. This cannot be undone.`,
      )
    )
      return;
    setError('');
    setToggling(user.id);
    try {
      await api.del(`/admin/users/${user.id}`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const setActive = async (user: AdminUserDto) => {
    const name = `${user.firstName} ${user.lastName}`.trim();
    if (
      user.isActive &&
      !window.confirm(
        `Deactivate ${name}? They are signed out straight away and cannot use their password or invite link until you activate them again.`,
      )
    )
      return;
    setError('');
    setToggling(user.id);
    try {
      await api.put(`/admin/users/${user.id}/active`, { isActive: !user.isActive });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['candidates'] });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  if (users.isLoading) return <Loading />;
  if (users.isError || !users.data) return <ErrorNote>{errorMessage(users.error)}</ErrorNote>;
  const needle = search.trim().toLowerCase();
  // Staff first, then candidates.
  const rows = users.data
    .filter(
      (u) =>
        !needle ||
        `${u.firstName} ${u.lastName} ${u.email} ${u.department} ${u.employeeId ?? ''}`
          .toLowerCase()
          .includes(needle),
    )
    .sort((a, b) => Number(a.role === 'LEARNER') - Number(b.role === 'LEARNER'));
  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    await queryClient.invalidateQueries({ queryKey: ['employees'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return (
    <>
      <PageHeader
        title="Employee Accounts"
        subtitle="Create sign-in details for HR and other staff. The system sets a default password, which you pass on; it must be changed at first sign-in."
        actions={
          <>
            <Button onClick={() => setImporting(true)}>Import CSV</Button>
            <Button variant="primary" onClick={() => setEditing('new')}>
              + New employee account
            </Button>
          </>
        }
      />
      <Input
        className="mb-3 max-w-sm"
        placeholder="Search name, email or employee id"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search"
      />
      <div className="mb-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <Table head={['Name', 'Employee id', 'Role', 'Password', 'Status', '']}>
        {rows.map((user) => {
          const self = user.id === me.data?.id;
          // Only the super admin can change the super admin account.
          const locked = user.isSuperAdmin && !self;
          const lockedTitle = locked ? 'Only the super admin can change this account' : undefined;
          return (
            <tr key={user.id} className={user.isActive ? '' : 'bg-slate-50 text-slate-400'}>
              <td>
                <span
                  className={`font-medium ${user.isActive ? 'text-slate-900' : 'text-slate-500'}`}
                >
                  {user.firstName} {user.lastName}
                </span>
                <span className="block text-xs text-slate-500">{user.email}</span>
              </td>
              <td>{user.employeeId ?? '–'}</td>
              <td>
                {user.isSuperAdmin ? (
                  <Pill
                    tone="indigo"
                    title="Set in the server settings; only this account can change it"
                  >
                    Super admin
                  </Pill>
                ) : (
                  ROLE_LABEL[user.role]
                )}
              </td>
              <td>
                {!user.hasPassword ? (
                  <Pill tone="slate">Not set</Pill>
                ) : user.defaultPassword ? (
                  <DefaultPassword value={user.defaultPassword} />
                ) : user.mustChangePassword ? (
                  <Pill
                    tone="amber"
                    title="Issued before default passwords were kept. Click New password to issue one you can see here."
                  >
                    Default password
                  </Pill>
                ) : (
                  <Pill tone="emerald" title="The user has set their own password">
                    Set by user
                  </Pill>
                )}
              </td>
              <td>
                {user.isActive ? (
                  <Pill tone="emerald">Active</Pill>
                ) : (
                  <Pill tone="red">Deactivated</Pill>
                )}
              </td>
              <td className="whitespace-nowrap text-right">
                <Button
                  small
                  disabled={locked}
                  title={lockedTitle}
                  onClick={() => setEditing(user)}
                >
                  Edit
                </Button>{' '}
                <Button
                  small
                  disabled={locked}
                  title={lockedTitle}
                  onClick={() => void resetPassword(user)}
                >
                  New password
                </Button>{' '}
                <button
                  type="button"
                  disabled={self || locked || toggling === user.id}
                  title={self ? 'You cannot deactivate your own account' : lockedTitle}
                  onClick={() => void setActive(user)}
                  className={`w-24 rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    user.isActive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {toggling === user.id ? '…' : user.isActive ? 'Deactivate' : 'Activate'}
                </button>{' '}
                <Button
                  small
                  variant="danger"
                  disabled={self || locked || toggling === user.id}
                  title={
                    self
                      ? 'You cannot delete your own account'
                      : locked
                        ? 'The super admin account cannot be deleted'
                        : undefined
                  }
                  onClick={() => void remove(user)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          );
        })}
      </Table>
      {editing && (
        <UserForm
          user={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={async (credentials) => {
            await reload();
            setEditing(null);
            if (credentials) setIssued(credentials);
          }}
        />
      )}
      {issued && <CredentialsModal credentials={issued} onClose={() => setIssued(null)} />}
      {importing && <ImportForm onClose={() => setImporting(false)} onImported={reload} />}
    </>
  );
}

function UserForm({
  user,
  onClose,
  onSaved,
}: {
  user?: AdminUserDto;
  onClose: () => void;
  onSaved: (credentials?: CredentialsDto) => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState<UserUpsertInput>({
    email: user?.email ?? '',
    employeeId: user?.employeeId ?? null,
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    department: user?.department ?? 'Human Resources',
    location: user?.location ?? '',
    businessUnitId: user?.businessUnitId ?? null,
    role: user?.role ?? 'HR_ADMIN',
    joiningDate: user?.joiningDate ?? new Date().toISOString().slice(0, 10),
    isActive: user?.isActive ?? true,
  });
  const [name, setName] = useState(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    // One name box: the first word is stored as the first name, the rest as the last name.
    const [firstName = '', ...rest] = name.trim().split(/\s+/);
    if (!firstName) return setError('Enter a name.');
    const body = { ...form, firstName, lastName: rest.join(' ') };
    try {
      if (user) {
        await api.put(`/admin/users/${user.id}`, body);
        await onSaved();
      } else {
        await onSaved(await api.post<CredentialsDto>('/admin/users', body));
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Modal title={user ? 'Edit account' : 'New account'} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Name">
            <Input maxLength={160} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Employee id">
          <Input
            maxLength={40}
            value={form.employeeId ?? ''}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value.trim() || null })}
          />
        </Field>
        <Field label="Role">
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserUpsertInput['role'] })}
          >
            {/* Only Admin and HR are offered. Candidate and Legal reviewer show only when editing
                an account that already has that role, so its current role displays correctly. */}
            {ROLES.filter(
              (role) => role === 'ADMIN' || role === 'HR_ADMIN' || user?.role === role,
            ).map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-4 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => void save()}>
            {user ? 'Save' : 'Create and show sign-in details'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ImportForm({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => Promise<void>;
}): ReactElement {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<CsvImportResultDto | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const outcome = await api.post<CsvImportResultDto>('/admin/users/import', { csv });
      setResult(outcome);
      await onImported();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Import learners from CSV" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          The first row must be the header below. <code className="text-xs">businessUnit</code> is
          the unit's name or slug and may be empty. Dates use YYYY-MM-DD.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-100 p-2 text-xs text-slate-700">
          {CSV_HEADER}
        </pre>
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void file.text().then(setCsv);
          }}
        />
        <Textarea
          className="min-h-36 font-mono text-xs"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`${CSV_HEADER}\nnew.joiner@example.com,New,Joiner,Engineering,Chennai,cloud-practice,2026-12-01`}
          aria-label="CSV text"
        />
        <ErrorNote>{error}</ErrorNote>
        {result && (
          <Notice>
            {result.created} user{result.created === 1 ? '' : 's'} created
            {result.skipped.length > 0 &&
              `, ${result.skipped.length} row${result.skipped.length === 1 ? '' : 's'} skipped:`}
            {result.skipped.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {result.skipped.map((s) => (
                  <li key={`${s.line}-${s.reason}`}>
                    Line {s.line}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </Notice>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={busy || !csv.trim()} onClick={() => void run()}>
            {busy ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Review queue                                                        */
/* ------------------------------------------------------------------ */

export function ReviewPage(): ReactElement {
  const me = useMe();
  const queue = useQuery({
    queryKey: ['admin', 'review-queue'],
    queryFn: () => api.get<ReviewItemDto[]>('/admin/review-queue'),
  });
  if (queue.isLoading) return <Loading />;
  if (queue.isError || !queue.data || !me.data)
    return <ErrorNote>{errorMessage(queue.error)}</ErrorNote>;
  const role = me.data.role;

  return (
    <>
      <PageHeader
        title="Review queue"
        subtitle="Content waiting for review or ready to publish. Policy and compliance content needs a Legal reviewer's approval."
      />
      {queue.data.length === 0 ? (
        <Card>Nothing is waiting for review.</Card>
      ) : (
        <Table head={['Content', 'Type', 'Module', 'Version', 'Status', 'Reviewer', 'Action']}>
          {queue.data.map((item) => (
            <tr key={`${item.type}-${item.id}`}>
              <td className="max-w-md font-medium text-slate-900">{item.title}</td>
              <td>{pretty(item.type.toUpperCase())}</td>
              <td>{item.moduleTitle}</td>
              <td>v{item.version}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>{item.needsLegal ? 'Legal' : 'Admin'}</td>
              <td>
                <WorkflowButtons
                  type={item.type}
                  id={item.id}
                  status={item.status}
                  needsLegal={item.needsLegal}
                  role={role}
                />
              </td>
            </tr>
          ))}
        </Table>
      )}
      <p className="mt-3 text-sm text-slate-500">
        Open Content to read a module's steps and questions before deciding.
      </p>
    </>
  );
}

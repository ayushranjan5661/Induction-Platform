/** HR: invite a candidate with an employee id and email, then share the link or the login. */
import type { CandidateDto, CredentialsDto } from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent, type ReactElement } from 'react';
import { EmployeeDetail } from '../admin/EmployeesPage';
import { CredentialsModal } from '../components/Credentials';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Loading,
  PageHeader,
  StatusBadge,
  Table,
  formatDate,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';

const BLANK = { employeeId: '', name: '', email: '' };

export function CandidatesPage(): ReactElement {
  const queryClient = useQueryClient();
  const candidates = useQuery({
    queryKey: ['candidates'],
    queryFn: () => api.get<CandidateDto[]>('/hr/candidates'),
  });
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState<CredentialsDto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: ['candidates'] });
    await queryClient.invalidateQueries({ queryKey: ['employees'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  /** Runs an action that returns new sign-in details and shows them. */
  const issue = async (work: () => Promise<CredentialsDto>) => {
    setBusy(true);
    setError('');
    try {
      setIssued(await work());
      await reload();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    // One name box: the first word is stored as the first name, the rest as the last name.
    const [firstName = '', ...rest] = form.name.trim().split(/\s+/);
    const body = {
      employeeId: form.employeeId,
      email: form.email,
      firstName,
      lastName: rest.join(' '),
    };
    if (await issue(() => api.post<CredentialsDto>('/hr/candidates', body))) setForm(BLANK);
  };

  const [toggling, setToggling] = useState<string | null>(null);
  const setActive = async (candidate: CandidateDto) => {
    if (toggling) return;
    if (
      candidate.isActive &&
      !window.confirm(`Block ${candidate.name}? Their link and password will stop working.`)
    )
      return;
    setError('');
    setToggling(candidate.id);
    try {
      await api.put(`/hr/candidates/${candidate.id}/active`, { isActive: !candidate.isActive });
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const remove = async (candidate: CandidateDto) => {
    if (
      !window.confirm(
        `Permanently delete ${candidate.name}? Their account, induction progress, quiz answers and feedback are removed. This cannot be undone.`,
      )
    )
      return;
    setError('');
    try {
      await api.del(`/hr/candidates/${candidate.id}`);
      if (detailId === candidate.id) setDetailId(null);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  /** Eye button: the candidate's current sign-in details, with Reset password. */
  const [viewing, setViewing] = useState<{ id: string; creds: CredentialsDto } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [viewError, setViewError] = useState('');

  // Only the latest eye-button click may open the panel, so a slow earlier reply cannot show
  // another candidate's details.
  const wantedView = useRef<string | null>(null);
  const view = async (candidate: CandidateDto) => {
    setError('');
    setViewError('');
    wantedView.current = candidate.id;
    try {
      const creds = await api.get<CredentialsDto>(`/hr/candidates/${candidate.id}/credentials`);
      if (wantedView.current !== candidate.id) return;
      setViewing({ id: candidate.id, creds });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const resetFromView = async () => {
    if (!viewing) return;
    if (
      !window.confirm(
        'Issue a new default password and a new invitation link? The current password and link stop working.',
      )
    )
      return;
    setResetting(true);
    setViewError('');
    try {
      await api.post<CredentialsDto>(`/hr/candidates/${viewing.id}/reset-password`);
      // Show the new password together with the current link.
      const creds = await api.get<CredentialsDto>(`/hr/candidates/${viewing.id}/credentials`);
      setViewing({ id: viewing.id, creds });
      await reload();
    } catch (err) {
      setViewError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const needle = search.trim().toLowerCase();
  const rows = (candidates.data ?? []).filter(
    (c) => !needle || `${c.name} ${c.email} ${c.employeeId ?? ''}`.toLowerCase().includes(needle),
  );

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Invite a new joiner, then share the invitation link or the sign-in details with them."
      />

      <Card className="mb-5">
        <h2 className="font-semibold text-slate-900">Invite a candidate</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the employee id, name and email. The system sets a default password and creates an
          invitation link.
        </p>
        <form
          onSubmit={(e) => void invite(e)}
          className="mt-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1.4fr_auto]"
        >
          <Field label="Employee id">
            <Input
              required
              maxLength={40}
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              placeholder="EMP2041"
            />
          </Field>
          <Field label="Name">
            <Input
              required
              maxLength={160}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Asha Rao"
            />
          </Field>
          <Field label="Email">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="new.joiner@example.com"
            />
          </Field>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? 'Working…' : 'Create invitation'}
          </Button>
        </form>
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      </Card>

      <Input
        className="mb-3 max-w-sm"
        placeholder="Search name, email or employee id"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search"
      />
      {candidates.isLoading ? (
        <Loading />
      ) : candidates.isError ? (
        <ErrorNote>{errorMessage(candidates.error)}</ErrorNote>
      ) : (
        <Table
          head={[
            'Candidate',
            'Employee id',
            'Status',
            'Sessions attended',
            'Right',
            'Wrong',
            'Invitation',
            'Actions',
          ]}
        >
          {rows.map((c) => (
            <tr key={c.id} className={c.isActive ? '' : 'opacity-60'}>
              <td>
                <button
                  type="button"
                  className="text-left font-medium text-brand-600 hover:underline"
                  onClick={() => setDetailId(c.id)}
                >
                  {c.name}
                </button>
                <span className="block text-xs text-slate-500">{c.email}</span>
              </td>
              <td>{c.employeeId ?? '–'}</td>
              <td>
                {c.isActive ? (
                  <StatusBadge status={c.status} />
                ) : (
                  <span className="text-xs text-red-700">Blocked</span>
                )}
              </td>
              <td className="whitespace-nowrap">
                {c.modulesCompleted} of {c.totalModules}
              </td>
              <td className="text-emerald-700">{c.correctAnswers}</td>
              <td className="text-red-700">{c.wrongAnswers}</td>
              <td className="whitespace-nowrap text-xs text-slate-600">
                {c.inviteActive
                  ? `Link active until ${formatDate(c.inviteExpiresAt)}`
                  : c.inviteExpiresAt
                    ? 'Link expired'
                    : 'No link yet'}
              </td>
              <td>
                <span className="flex flex-wrap gap-1.5">
                  <Button
                    small
                    disabled={busy}
                    onClick={() => void view(c)}
                    aria-label={`Show sign-in details for ${c.name}`}
                    title="Show sign-in details"
                  >
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
                      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                      <circle cx="12" cy="12" r="2.8" />
                    </svg>
                  </Button>
                  <Button
                    small
                    disabled={busy || !c.isActive}
                    onClick={() =>
                      void issue(() => api.post<CredentialsDto>(`/hr/candidates/${c.id}/invite`))
                    }
                  >
                    New link
                  </Button>
                  <Button
                    small
                    variant={c.isActive ? 'danger' : 'secondary'}
                    disabled={busy || toggling !== null}
                    onClick={() => void setActive(c)}
                  >
                    {c.isActive ? 'Block' : 'Unblock'}
                  </Button>
                  <Button small variant="danger" disabled={busy} onClick={() => void remove(c)}>
                    Delete
                  </Button>
                </span>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-slate-500">
                No candidates found.
              </td>
            </tr>
          )}
        </Table>
      )}

      {issued && <CredentialsModal credentials={issued} onClose={() => setIssued(null)} />}
      {viewing && (
        <CredentialsModal
          stored
          credentials={viewing.creds}
          onClose={() => setViewing(null)}
          onResetPassword={() => void resetFromView()}
          resetting={resetting}
          error={viewError}
        />
      )}
      {detailId && <EmployeeDetail id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

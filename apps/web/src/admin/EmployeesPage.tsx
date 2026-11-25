import { type EmployeeDetailDto, type EmployeeRowDto, type EmployeesDto } from '@induction/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Modal } from '../components/ui';
import { useState, type ReactElement } from 'react';
import {
  Button,
  ErrorNote,
  Input,
  Loading,
  PageHeader,
  STATUS_LABEL,
  StatusBadge,
  Table,
  formatDate,
  formatPercent,
} from '../components/ui';
import { api, errorMessage, toQuery } from '../lib/api';
import { exportToExcel } from '../lib/export';

const PAGE_SIZE = 15;
const EMPTY = {
  search: '',
  joinedFrom: '',
  joinedTo: '',
};

const toSheetRow = (row: EmployeeRowDto) => ({
  'Employee id': row.employeeId ?? '',
  Name: row.name,
  Email: row.email,
  Department: row.department,
  Location: row.location,
  'Business unit': row.businessUnit ?? '',
  'Joining date': row.joiningDate.slice(0, 10),
  Status: STATUS_LABEL[row.status],
  'Modules completed': `${row.modulesCompleted} of ${row.totalModules}`,
  'Questions answered': row.questionsAnswered,
  'Right answers': row.correctAnswers,
  'Wrong answers': row.wrongAnswers,
  'Right first time':
    row.firstAttemptAccuracy === null ? '' : `${Math.round(row.firstAttemptAccuracy * 100)}%`,
  Started: row.startedAt?.slice(0, 10) ?? '',
  Completed: row.completedAt?.slice(0, 10) ?? '',
});

export function EmployeesPage(): ReactElement {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [exportError, setExportError] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const set = (patch: Partial<typeof EMPTY>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const employees = useQuery({
    queryKey: ['employees', filters, page],
    queryFn: () =>
      api.get<EmployeesDto>(
        `/dashboard/employees${toQuery({ ...filters, page, pageSize: PAGE_SIZE })}`,
      ),
    placeholderData: keepPreviousData,
  });

  const exportAll = async () => {
    setExportError('');
    try {
      const all = await api.get<EmployeesDto>(
        `/dashboard/employees${toQuery({ ...filters, page: 1, pageSize: 1000 })}`,
      );
      if (all.rows.length === 0)
        return setExportError('There is nothing to export for these filters.');
      await exportToExcel('induction-employees', 'Employees', all.rows.map(toSheetRow));
    } catch (err) {
      setExportError(errorMessage(err));
    }
  };

  const data = employees.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Candidate performance"
        subtitle={data ? `${data.total} learner${data.total === 1 ? '' : 's'} match` : undefined}
        actions={
          <>
            <Button onClick={() => void exportAll()}>Export to Excel</Button>
            <Button onClick={() => window.print()}>Print / save as PDF</Button>
          </>
        }
      />
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 print:hidden sm:grid-cols-2">
        <Input
          placeholder="Search name, email or employee id"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          aria-label="Search"
        />
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <span>Joined from</span>
          <Input
            type="date"
            aria-label="Joined from"
            value={filters.joinedFrom}
            max={filters.joinedTo || undefined}
            onChange={(e) => set({ joinedFrom: e.target.value })}
          />
          <span>to</span>
          <Input
            type="date"
            aria-label="Joined to"
            value={filters.joinedTo}
            min={filters.joinedFrom || undefined}
            onChange={(e) => set({ joinedTo: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <ErrorNote>
          {exportError || (employees.isError ? errorMessage(employees.error) : '')}
        </ErrorNote>
        {!data ? (
          <Loading />
        ) : (
          <>
            <Table
              head={[
                'Candidate',
                'Employee id',
                'Department',
                'Joined',
                'Status',
                'Sessions attended',
                'Right',
                'Wrong',
                'Score',
                'Completed',
              ]}
            >
              {data.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      type="button"
                      className="text-left font-medium text-brand-600 hover:underline print:text-slate-900"
                      onClick={() => setDetailId(row.id)}
                    >
                      {row.name}
                    </button>
                    <span className="block text-xs text-slate-500">{row.email}</span>
                  </td>
                  <td>{row.employeeId ?? '–'}</td>
                  <td>{row.department}</td>
                  <td className="whitespace-nowrap">{formatDate(row.joiningDate)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap">
                    {row.modulesCompleted} / {row.totalModules}
                  </td>
                  <td className="text-emerald-700">{row.correctAnswers}</td>
                  <td className="text-red-700">{row.wrongAnswers}</td>
                  <td>{formatPercent(row.firstAttemptAccuracy)}</td>
                  <td className="whitespace-nowrap">{formatDate(row.completedAt)}</td>
                </tr>
              ))}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No learners match these filters.
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
      {detailId && <EmployeeDetail id={detailId} onClose={() => setDetailId(null)} />}
    </>
  );
}

const OUTCOME: Record<
  EmployeeDetailDto['answers'][number]['outcome'],
  { label: string; style: string }
> = {
  RIGHT: { label: 'Right first time', style: 'bg-emerald-100 text-emerald-800' },
  SECOND_TRY: { label: 'Right on second try', style: 'bg-amber-100 text-amber-800' },
  WRONG: { label: 'Wrong (answer shown)', style: 'bg-red-100 text-red-800' },
  OPEN: { label: 'Not finished', style: 'bg-slate-100 text-slate-700' },
};

/** One candidate: sessions attended, and how each question went. */
export function EmployeeDetail({ id, onClose }: { id: string; onClose: () => void }): ReactElement {
  const detail = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get<EmployeeDetailDto>(`/dashboard/employees/${id}`),
  });
  const data = detail.data;
  const attended = data?.modules.filter((m) => m.status === 'COMPLETED').length ?? 0;
  const right = data?.answers.filter((a) => a.outcome === 'RIGHT').length ?? 0;
  const wrong = data
    ? data.answers.filter((a) => a.outcome !== 'RIGHT' && a.outcome !== 'OPEN').length
    : 0;

  return (
    <Modal title={data ? data.name : 'Candidate'} onClose={onClose} wide>
      {detail.isLoading && <Loading />}
      {detail.isError && <ErrorNote>{errorMessage(detail.error)}</ErrorNote>}
      {data && (
        <div className="space-y-5">
          <p className="text-sm text-slate-600">
            {data.email}
            {data.employeeId && ` · Employee id ${data.employeeId}`} ·{' '}
            <StatusBadge status={data.status} />
            {data.startedAt && ` · Started ${formatDate(data.startedAt)}`}
            {data.completedAt && ` · Completed ${formatDate(data.completedAt)}`}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-2xl font-semibold text-slate-900">
                {attended} / {data.modules.length}
              </p>
              <p className="text-xs text-slate-500">Sessions attended</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-2xl font-semibold text-emerald-800">{right}</p>
              <p className="text-xs text-emerald-800">Right first time</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-2xl font-semibold text-red-800">{wrong}</p>
              <p className="text-xs text-red-800">Wrong first time</p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-900">Sessions</h3>
            <Table head={['Session', 'Status', 'Questions', 'Right', 'Wrong', 'Completed']}>
              {data.modules.map((m) => (
                <tr key={m.moduleId}>
                  <td className="font-medium text-slate-900">
                    {m.order}. {m.title}
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>{m.questionsAnswered}</td>
                  <td className="text-emerald-700">{m.correctAnswers}</td>
                  <td className="text-red-700">{m.wrongAnswers}</td>
                  <td className="whitespace-nowrap">{formatDate(m.completedAt)}</td>
                </tr>
              ))}
            </Table>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-slate-900">Answers</h3>
            {data.answers.length === 0 ? (
              <p className="text-sm text-slate-500">No questions answered yet.</p>
            ) : (
              <Table head={['Question', 'Session', 'Result', 'Tries']}>
                {data.answers.map((a) => (
                  <tr key={a.questionId}>
                    <td className="max-w-md text-slate-900">{a.question}</td>
                    <td>{a.moduleTitle}</td>
                    <td>
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME[a.outcome].style}`}
                      >
                        {OUTCOME[a.outcome].label}
                      </span>
                    </td>
                    <td>{a.attempts}</td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          {data.acknowledgments.length > 0 && (
            <p className="text-sm text-slate-600">
              Acknowledged:{' '}
              {data.acknowledgments
                .map((a) => `${a.topic} (${formatDate(a.acknowledgedAt)})`)
                .join(', ')}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

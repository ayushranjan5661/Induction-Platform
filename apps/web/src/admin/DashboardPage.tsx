import type { DashboardSummaryDto, EnrollmentStatus } from '@induction/shared';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
  Card,
  ErrorNote,
  Loading,
  PageHeader,
  STATUS_LABEL,
  formatPercent,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';

/** Chart colours: one series hue, plus reserved status colours used with labels. */
export const SERIES = '#2a78d6';
const STATUS_COLOUR: Record<EnrollmentStatus, string> = {
  COMPLETED: '#059669',
  IN_PROGRESS: '#d97706',
  NOT_STARTED: '#94a3b8',
};
const STATUS_ORDER: EnrollmentStatus[] = ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'];

export const axisTick = { fontSize: 12, fill: '#64748b' };
export const shorten = (label: string, max = 16): string =>
  label.length > max ? `${label.slice(0, max - 1)}…` : label;

export function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}): ReactElement {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </Card>
  );
}

export function DashboardPage(): ReactElement {
  const summary = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardSummaryDto>('/dashboard/summary'),
  });
  if (summary.isLoading) return <Loading />;
  if (summary.isError || !summary.data) return <ErrorNote>{errorMessage(summary.error)}</ErrorNote>;
  const data = summary.data;
  const total = Math.max(1, data.learners);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Induction progress across all learners"
        actions={<Button onClick={() => window.print()}>Print / save as PDF</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="Learners" value={String(data.learners)} />
        <Tile
          label="Completion rate"
          value={formatPercent(data.completionRate)}
          note={`${data.byStatus.COMPLETED} completed`}
        />
        <Tile
          label="Right first time"
          value={formatPercent(data.firstAttemptAccuracy)}
          note="Quiz answers correct on the first try"
        />
        <Tile
          label="Average rating"
          value={data.averageRating === null ? '–' : `${data.averageRating.toFixed(1)} / 5`}
          note={`${data.feedbackCount} responses`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-slate-900">Where learners are</h2>
          <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATUS_ORDER.filter((s) => data.byStatus[s] > 0).map((status) => ({
                      status,
                      name: STATUS_LABEL[status],
                      value: data.byStatus[status],
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="#ffffff"
                    strokeWidth={2}
                    isAnimationActive={false}
                  >
                    {STATUS_ORDER.filter((s) => data.byStatus[s] > 0).map((status) => (
                      <Cell key={status} fill={STATUS_COLOUR[status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${String(value)} (${formatPercent(Number(value) / total)})`,
                      'Learners',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-slate-900">{data.learners}</span>
                <span className="text-xs text-slate-500">learners</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-2 text-sm">
              {STATUS_ORDER.map((status) => (
                <li key={status} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: STATUS_COLOUR[status] }}
                  />
                  <span className="flex-1 text-slate-700">{STATUS_LABEL[status]}</span>
                  <span className="font-medium text-slate-900">{data.byStatus[status]}</span>
                  <span className="w-12 text-right text-slate-500">
                    {formatPercent(data.byStatus[status] / total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Learners who completed each module</h2>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.completionsByModule}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="title"
                  tick={axisTick}
                  tickFormatter={(v: string) => shorten(v, 20)}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={64}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, data.learners]}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value) => [`${String(value)} learners`, 'Completed']}
                />
                <Bar
                  dataKey="completed"
                  fill={SERIES}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}

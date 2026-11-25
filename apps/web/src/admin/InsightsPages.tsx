/** Quiz analytics, acknowledgment records and learner feedback. */
import type { AcknowledgmentRowDto, FeedbackDto, QuizAnalyticsDto } from '@induction/shared';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Button,
  Card,
  ErrorNote,
  Input,
  Loading,
  PageHeader,
  Table,
  formatDate,
  formatPercent,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { exportToExcel } from '../lib/export';
import { SERIES, Tile, axisTick, shorten } from './DashboardPage';

export function QuizAnalyticsPage(): ReactElement {
  const quiz = useQuery({
    queryKey: ['quiz-analytics'],
    queryFn: () => api.get<QuizAnalyticsDto>('/dashboard/quiz-analytics'),
  });
  if (quiz.isLoading) return <Loading />;
  if (quiz.isError || !quiz.data) return <ErrorNote>{errorMessage(quiz.error)}</ErrorNote>;
  const chart = quiz.data.modules.map((m) => ({
    ...m,
    percent: m.accuracy === null ? 0 : Math.round(m.accuracy * 100),
  }));

  return (
    <>
      <PageHeader
        title="Quiz analytics"
        subtitle="How often learners answer correctly on their first try"
        actions={<Button onClick={() => window.print()}>Print / save as PDF</Button>}
      />
      <Card>
        <h2 className="font-semibold text-slate-900">Right first time, by module (%)</h2>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
              <YAxis domain={[0, 100]} tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(value) => [`${String(value)}%`, 'Right first time']}
              />
              <Bar
                dataKey="percent"
                fill={SERIES}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">By module</h2>
      <Table head={['Module', 'Questions answered', 'Right first time', 'Accuracy']}>
        {quiz.data.modules.map((m) => (
          <tr key={m.moduleId}>
            <td className="font-medium text-slate-900">{m.title}</td>
            <td>{m.answered}</td>
            <td>{m.firstAttemptCorrect}</td>
            <td>{formatPercent(m.accuracy)}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">Most missed questions</h2>
      <Table head={['Question', 'Module', 'Answered', 'Missed first time', 'Miss rate']}>
        {quiz.data.mostMissed.map((q) => (
          <tr key={q.questionId}>
            <td className="max-w-md text-slate-900">{q.text}</td>
            <td>{q.moduleTitle}</td>
            <td>{q.answered}</td>
            <td>{q.missed}</td>
            <td>{formatPercent(q.missRate)}</td>
          </tr>
        ))}
        {quiz.data.mostMissed.length === 0 && (
          <tr>
            <td colSpan={5} className="py-6 text-center text-slate-500">
              No missed questions yet.
            </td>
          </tr>
        )}
      </Table>
    </>
  );
}

export function AcknowledgmentsPage(): ReactElement {
  const acks = useQuery({
    queryKey: ['acknowledgments'],
    queryFn: () => api.get<AcknowledgmentRowDto[]>('/dashboard/acknowledgments'),
  });
  const [search, setSearch] = useState('');
  if (acks.isLoading) return <Loading />;
  if (acks.isError || !acks.data) return <ErrorNote>{errorMessage(acks.error)}</ErrorNote>;
  const needle = search.trim().toLowerCase();
  const rows = acks.data.filter(
    (r) =>
      !needle || `${r.name} ${r.email} ${r.moduleTitle} ${r.topic}`.toLowerCase().includes(needle),
  );

  return (
    <>
      <PageHeader
        title="Acknowledgments"
        subtitle="Policy and compliance confirmations, with the content version each learner agreed to"
        actions={
          <>
            <Button
              disabled={rows.length === 0}
              onClick={() =>
                void exportToExcel(
                  'induction-acknowledgments',
                  'Acknowledgments',
                  rows.map((r) => ({
                    Name: r.name,
                    Email: r.email,
                    Module: r.moduleTitle,
                    Topic: r.topic,
                    'Content version': r.contentVersion,
                    'Acknowledged at': new Date(r.acknowledgedAt)
                      .toISOString()
                      .replace('T', ' ')
                      .slice(0, 16),
                  })),
                )
              }
            >
              Export to Excel
            </Button>
            <Button onClick={() => window.print()}>Print / save as PDF</Button>
          </>
        }
      />
      <Input
        className="mb-3 max-w-sm print:hidden"
        placeholder="Search name, module or topic"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search"
      />
      <Table head={['Name', 'Module', 'Topic', 'Version', 'Acknowledged']}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <span className="font-medium text-slate-900">{r.name}</span>
              <span className="block text-xs text-slate-500">{r.email}</span>
            </td>
            <td>{r.moduleTitle}</td>
            <td>{r.topic}</td>
            <td>v{r.contentVersion}</td>
            <td className="whitespace-nowrap">{new Date(r.acknowledgedAt).toLocaleString()}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="py-6 text-center text-slate-500">
              No acknowledgments found.
            </td>
          </tr>
        )}
      </Table>
    </>
  );
}

export function FeedbackPage(): ReactElement {
  const feedback = useQuery({
    queryKey: ['feedback'],
    queryFn: () => api.get<FeedbackDto>('/dashboard/feedback'),
  });
  if (feedback.isLoading) return <Loading />;
  if (feedback.isError || !feedback.data)
    return <ErrorNote>{errorMessage(feedback.error)}</ErrorNote>;
  const data = feedback.data;
  const chart = [1, 2, 3, 4, 5].map((rating) => ({
    label: `${rating}★`,
    count: data.distribution.find((d) => d.rating === rating)?.count ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle="What learners said after finishing"
        actions={<Button onClick={() => window.print()}>Print / save as PDF</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Tile
          label="Average rating"
          value={data.average === null ? '–' : `${data.average.toFixed(1)} / 5`}
          note={`${data.items.length} responses`}
        />
        <Card>
          <h2 className="font-semibold text-slate-900">Responses by rating</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value) => [String(value), 'Responses']}
                />
                <Bar
                  dataKey="count"
                  fill={SERIES}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="mt-5">
        <Table head={['Learner', 'Rating', 'Comment', 'Date']}>
          {data.items.map((item) => (
            <tr key={item.id}>
              <td className="font-medium text-slate-900">{item.name}</td>
              <td className="whitespace-nowrap">{item.rating} / 5</td>
              <td className="max-w-lg">
                {item.comment || <span className="text-slate-400">No comment</span>}
              </td>
              <td className="whitespace-nowrap">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}

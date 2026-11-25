import type { SummaryDto } from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Avatar } from '../avatar/Avatar';
import { Button, ErrorNote, Loading, Textarea, formatDate } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { useLogout } from '../lib/auth';

const HOST = {
  name: 'Maya',
  energy: 1.1,
  themeColor: '#2563EB',
  appearance: {
    skin: '#C68B5E',
    hair: '#2B1B12',
    hairStyle: 'long' as const,
    outfit: '#2563EB',
    shirt: '#FFFFFF',
    glasses: false,
    beard: false,
    earrings: true,
  },
};

export function CompletePage(): ReactElement {
  const queryClient = useQueryClient();
  const logout = useLogout();
  const summary = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.get<SummaryDto>('/summary'),
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clap, setClap] = useState(1);

  if (summary.isLoading) return <Loading what="Loading your summary" />;
  if (summary.isError || !summary.data) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorNote>{errorMessage(summary.error)}</ErrorNote>
      </div>
    );
  }
  const data = summary.data;
  if (data.status !== 'COMPLETED') return <Navigate to="/welcome" replace />;

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/feedback', { rating, comment });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
      setClap((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-900 via-blue-900 to-slate-900 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-sm font-semibold uppercase tracking-widest text-blue-200">
          LevelShift Induction
        </span>
        <Button
          variant="ghost"
          small
          className="!text-blue-100 hover:!bg-white/10"
          onClick={() => void logout()}
        >
          Sign out
        </Button>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 px-6 pb-16 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <h1 className="mt-4 text-4xl font-semibold">Congratulations, {data.firstName}!</h1>
          <p className="mt-3 text-blue-100">
            You completed your induction
            {data.completedAt ? ` on ${formatDate(data.completedAt)}` : ''}. Welcome to the team.
          </p>
          <div className="mt-4 h-80">
            <Avatar
              avatar={HOST}
              emotion="EXCITED"
              gesture={{ name: 'APPLAUD', nonce: clap }}
              className="h-full w-full"
            />
          </div>
        </section>

        <section className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Modules completed"
              value={`${data.modulesCompleted} / ${data.totalModules}`}
            />
            <Stat
              label="Right first time"
              value={`${data.firstAttemptCorrect} / ${data.questionsAnswered}`}
            />
            <Stat label="Quiz score" value={`${data.scorePercent}%`} />
          </div>

          <div className="rounded-2xl bg-white p-5 text-slate-900">
            <h2 className="text-lg font-semibold">How was your induction?</h2>
            {data.feedback ? (
              <div className="mt-2 text-sm text-slate-700">
                <p
                  className="text-2xl text-amber-500"
                  aria-label={`${data.feedback.rating} out of 5`}
                >
                  {'★'.repeat(data.feedback.rating)}
                  <span className="text-slate-300">{'★'.repeat(5 - data.feedback.rating)}</span>
                </p>
                {data.feedback.comment && <p className="mt-2">“{data.feedback.comment}”</p>}
                <p className="mt-2 text-emerald-700">Thank you, your feedback has been recorded.</p>
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onClick={() => setRating(n)}
                      className={`text-4xl leading-none transition-transform hover:scale-110 ${n <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Textarea
                  className="mt-3"
                  value={comment}
                  maxLength={1000}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything we could do better? (optional)"
                />
                <div className="mt-3 space-y-3">
                  <ErrorNote>{error}</ErrorNote>
                  <Button
                    variant="primary"
                    disabled={rating === 0 || busy}
                    onClick={() => void send()}
                  >
                    {busy ? 'Sending…' : 'Send feedback'}
                  </Button>
                </div>
              </>
            )}
          </div>

          <Link
            to="/welcome"
            className="inline-block text-sm text-blue-100 underline hover:text-white"
          >
            Back to your modules (you can replay any of them)
          </Link>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-blue-100">{label}</p>
    </div>
  );
}

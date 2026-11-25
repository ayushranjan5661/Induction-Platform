import type { InductionDto } from '@induction/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../avatar/Avatar';
import { Button, ErrorNote, Loading } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { useLogout } from '../lib/auth';
import { sfx } from '../speech/sfx';

export function WelcomePage(): ReactElement {
  const navigate = useNavigate();
  const logout = useLogout();
  const induction = useQuery({
    queryKey: ['induction'],
    queryFn: () => api.get<InductionDto>('/induction'),
  });
  const [wave, setWave] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => setWave((n) => n + 1), 9000);
    return () => window.clearInterval(timer);
  }, []);

  if (induction.isLoading) return <Loading what="Loading your induction" />;
  if (induction.isError || !induction.data) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorNote>{errorMessage(induction.error)}</ErrorNote>
      </div>
    );
  }

  const { firstName, modules, position } = induction.data;
  const done = modules.filter((m) => m.progress === 'COMPLETED').length;
  const host = modules[0]?.avatar;
  const finished = position.status === 'COMPLETED';
  const start = () => {
    sfx.click();
    navigate(finished ? '/complete' : '/induction');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-900 via-blue-900 to-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="text-sm font-semibold uppercase tracking-widest text-blue-200">
          LevelShift Induction
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Sign out
        </button>
      </header>

      <main className="grid flex-1 items-center gap-8 px-6 pb-10 lg:grid-cols-2 lg:px-12">
        <section className="mx-auto w-full max-w-xl">
          <h1 className="text-4xl font-semibold leading-tight lg:text-6xl">
            {finished
              ? `Well done, ${firstName}!`
              : position.status === 'IN_PROGRESS'
                ? `Welcome back, ${firstName}!`
                : `Welcome, ${firstName}!`}
          </h1>
          <p className="mt-5 text-lg text-blue-100 lg:text-xl">
            {finished
              ? 'You have completed your induction. Open your summary to see how you did.'
              : 'Our presenters will walk you through the company, one short module at a time. Your place is saved, so you can stop and pick up later.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              className="!bg-white !px-8 !py-4 !text-lg !text-brand-900 hover:!bg-blue-50"
              onClick={start}
            >
              {finished
                ? 'View your summary'
                : position.status === 'IN_PROGRESS'
                  ? 'Resume induction'
                  : 'Start induction'}
            </Button>
            <span className="text-blue-200">
              {done} of {modules.length} modules completed
            </span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${(done / Math.max(1, modules.length)) * 100}%` }}
            />
          </div>
        </section>

        {host && (
          <section className="h-[45vh] lg:h-[78vh]">
            <Avatar
              avatar={host}
              emotion="CHEERFUL"
              gesture={{ name: 'WAVE', nonce: wave }}
              className="h-full w-full"
            />
          </section>
        )}
      </main>
    </div>
  );
}

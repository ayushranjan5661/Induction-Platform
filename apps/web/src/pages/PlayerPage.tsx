/**
 * The induction player. One presenter on a themed stage walks the learner
 * through the steps of a module; questions and acknowledgments pause the
 * flow until they are dealt with. Progress is saved on the server after
 * every step, so closing the tab and coming back resumes in the same place.
 */
import type {
  AttemptResponseDto,
  AvatarDto,
  InductionDto,
  PositionDto,
  QuestionDto,
  StepDto,
} from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../avatar/Avatar';
import { api, errorMessage } from '../lib/api';
import { narrator } from '../speech/narrator';
import { useSound } from '../speech/settings';
import { setMusic, sfx } from '../speech/sfx';
import { usePresenter, type Caption } from '../speech/usePresenter';

interface Cursor {
  modId: string;
  stepId: string | null;
}

interface TitleCard {
  kicker: string;
  title: string;
  sub: string;
}

const needsFirstClick = (): boolean =>
  typeof navigator !== 'undefined' &&
  'userActivation' in navigator &&
  !navigator.userActivation.hasBeenActive;

export function PlayerPage(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const replayModuleId = params.get('module');

  const induction = useQuery({
    queryKey: ['induction'],
    queryFn: () => api.get<InductionDto>('/induction'),
    refetchOnWindowFocus: false,
  });

  const [cursor, setCursor] = useState<Cursor | null>(null);
  const [replay, setReplay] = useState(false);
  const [started, setStarted] = useState(() => !needsFirstClick());
  const [nonce, setNonce] = useState(0);
  const [paused, setPaused] = useState(false);
  const [card, setCard] = useState<TitleCard | null>(null);
  const [question, setQuestion] = useState<QuestionDto | null>(null);
  const [feedback, setFeedback] = useState<AttemptResponseDto | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);
  const [error, setError] = useState('');
  const presenter = usePresenter();
  const { present, gesture, stop } = presenter;
  const sound = useSound();

  /* Where to begin: the saved position, or a finished module being replayed. */
  const initialised = useRef(false);
  useEffect(() => {
    if (!induction.data || initialised.current) return;
    initialised.current = true;
    const { modules, position } = induction.data;
    const wanted = replayModuleId ? modules.find((m) => m.id === replayModuleId) : undefined;
    if (wanted?.progress === 'COMPLETED') {
      setReplay(true);
      setCursor({ modId: wanted.id, stepId: null });
    } else if (position.currentModuleId) {
      setCursor({ modId: position.currentModuleId, stepId: position.currentStepId });
    } else {
      navigate(position.status === 'COMPLETED' ? '/complete' : '/welcome', { replace: true });
    }
  }, [induction.data, replayModuleId, navigate]);

  const stepsQuery = useQuery({
    queryKey: ['steps', cursor?.modId],
    queryFn: () => api.get<StepDto[]>(`/modules/${cursor?.modId}/steps`),
    enabled: cursor !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const steps = stepsQuery.data;
  const found = steps && cursor?.stepId ? steps.findIndex((s) => s.id === cursor.stepId) : 0;
  const idx = Math.max(0, found ?? 0);
  const step = steps?.[idx];
  const mod = induction.data?.modules.find((m) => m.id === cursor?.modId);
  const avatar: AvatarDto | undefined = step
    ? (induction.data?.avatars[step.avatarId] ?? mod?.avatar)
    : mod?.avatar;

  // Latest values for callbacks that outlive a render.
  const latest = useRef({ steps, idx, step, cursor, replay, avatar, mod });
  latest.current = { steps, idx, step, cursor, replay, avatar, mod };

  /** Marks the current step done and moves to wherever the server says is next. */
  const completing = useRef<string | null>(null);
  /** The step the open question belongs to, so a click on a closing panel cannot advance the next step. */
  const questionStep = useRef('');
  const complete = useCallback(
    async (forStepId?: string) => {
      const now = latest.current;
      if (!now.step || !now.steps || !now.cursor) return;
      // A click on a panel that is already closing belongs to the previous step.
      if (forStepId && forStepId !== now.step.id) return;
      // A second click while the first is still saving must not skip a step.
      if (completing.current === now.step.id) return;
      completing.current = now.step.id;
      if (now.replay) {
        const next = now.steps[now.idx + 1];
        if (next) setCursor({ modId: now.cursor.modId, stepId: next.id });
        else navigate('/welcome');
        return;
      }
      try {
        const position = await api.post<PositionDto>('/progress', { stepId: now.step.id });
        if (position.status === 'COMPLETED' || !position.currentModuleId) {
          sfx.fanfare();
          await queryClient.invalidateQueries({ queryKey: ['induction'] });
          navigate('/complete');
          return;
        }
        if (position.currentModuleId !== now.cursor.modId)
          void queryClient.invalidateQueries({ queryKey: ['induction'] });
        setCursor({ modId: position.currentModuleId, stepId: position.currentStepId });
      } catch (err) {
        completing.current = null;
        setError(errorMessage(err));
      }
    },
    [navigate, queryClient],
  );

  /** After an error: ask the server where this learner really is and carry on from there. */
  const recover = async () => {
    setError('');
    try {
      const fresh = await api.get<InductionDto>('/induction');
      queryClient.setQueryData(['induction'], fresh);
      if (!latest.current.replay && fresh.position.currentModuleId) {
        setCursor({ modId: fresh.position.currentModuleId, stepId: fresh.position.currentStepId });
      }
      setNonce((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  /* Play the current step. */
  const stepId = step?.id;
  useEffect(() => {
    if (!stepId || !started) return;
    const now = latest.current;
    const current = now.step;
    const who = now.avatar;
    if (!current || !who || !now.steps) return;
    let alive = true;
    completing.current = null;
    setPaused(false);
    setQuestion(null);
    setFeedback(null);
    setPicked(null);
    setAckOpen(false);
    setError('');

    void (async () => {
      const first = now.idx === 0;
      const last = now.idx === (now.steps?.length ?? 0) - 1;

      if (now.replay && (current.type === 'QUESTION' || current.type === 'ACKNOWLEDGMENT')) {
        await complete();
        return;
      }

      if (first && now.mod) {
        setCard({
          kicker: `Module ${now.mod.order}`,
          title: now.mod.title,
          sub: `With ${who.name}, ${who.title}`,
        });
        sfx.whoosh();
        const ok = await narrator.wait(2300);
        if (alive) setCard(null);
        if (!ok || !alive) return;
        gesture(who.entryGesture);
        if (!(await narrator.wait(700)) || !alive) return;
      } else if (current.type === 'TRANSITION') {
        sfx.whoosh();
      }

      if (current.type === 'QUESTION') {
        const { question: q } = await api.get<{ question: QuestionDto | null }>(
          `/steps/${current.id}/question`,
        );
        if (!alive) return;
        if (!q) {
          await complete();
          return;
        }
        questionStep.current = current.id;
        setQuestion(q);
        if (!q.resolved)
          await present([{ text: q.text, emotion: 'FRIENDLY', gesture: 'THINK' }], who);
        return; // Waits for the learner.
      }

      if (current.segments.length > 0) {
        const finished = await present(current.segments, who);
        if (!finished || !alive) return;
      }

      if (current.type === 'ACKNOWLEDGMENT' && !current.acknowledged) {
        setAckOpen(true);
        return; // Waits for the learner.
      }

      if (last && who.exitGesture !== 'NONE') {
        gesture(who.exitGesture);
        if (!(await narrator.wait(1300)) || !alive) return;
      }
      await complete();
    })().catch((err: unknown) => {
      if (alive) setError(errorMessage(err));
    });

    return () => {
      alive = false;
      stop();
    };
  }, [stepId, nonce, started, complete, present, gesture, stop]);

  /* Background music follows the sound settings. */
  useEffect(() => {
    setMusic(started && sound.music && !sound.muted && sound.volume > 0);
  }, [started, sound.music, sound.muted, sound.volume]);
  useEffect(() => () => setMusic(false), []);

  const togglePause = useCallback(() => {
    setPaused((was) => {
      if (was) narrator.resume();
      else narrator.pause();
      return !was;
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (event.code === 'Space' && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        event.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause]);

  const answer = async (optionId: string) => {
    if (!question || !avatar || answering || question.resolved) return;
    setAnswering(true);
    setError('');
    stop();
    try {
      const res = await api.post<AttemptResponseDto>(`/questions/${question.id}/attempts`, {
        optionId,
      });
      const correct = res.result === 'CORRECT';
      if (correct) sfx.correct();
      else sfx.wrong();
      setPicked(optionId);
      setFeedback(res);
      setQuestion({
        ...question,
        attemptsUsed: question.attemptsUsed + 1,
        disabledOptionIds: correct
          ? question.disabledOptionIds
          : [...question.disabledOptionIds, optionId],
        resolved: res.result !== 'HINT',
        hintText: res.hintText,
        correctOptionId: res.correctOptionId ?? (correct ? optionId : null),
      });
      setAnswering(false);
      await present([res.clip], avatar);
    } catch (err) {
      setAnswering(false);
      setError(errorMessage(err));
    }
  };

  const acknowledge = async () => {
    if (!cursor || !step) return;
    try {
      await api.post('/acknowledgments', { moduleId: cursor.modId, topic: step.topic });
      sfx.correct();
      setAckOpen(false);
      await complete();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (induction.isError || stepsQuery.isError) {
    return (
      <Shell theme="#1E3A8A">
        <div className="m-auto max-w-md rounded-2xl bg-white/10 p-6 text-center">
          <p>{errorMessage(induction.error ?? stepsQuery.error)}</p>
          <Link to="/welcome" className="mt-4 inline-block underline">
            Back to the overview
          </Link>
        </div>
      </Shell>
    );
  }
  if (!steps || !step || !avatar || !mod || !induction.data) {
    return (
      <Shell theme="#1E3A8A">
        <p className="m-auto text-blue-100">Setting the stage…</p>
      </Shell>
    );
  }

  const theme = avatar.themeColor;
  const view = presenter.view;
  const questionOpen = question !== null;
  const modules = induction.data.modules;

  return (
    <Shell theme={theme}>
      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            Module {mod.order} of {modules.length}
            {replay && ' · Replay'}
          </p>
          <p className="truncate text-lg font-semibold">{mod.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <ol className="hidden items-center gap-1.5 md:flex" aria-label="Modules">
            {modules.map((m) => (
              <li
                key={m.id}
                title={m.title}
                className={`h-2 rounded-full transition-all ${
                  m.id === mod.id
                    ? 'w-8 bg-white'
                    : m.progress === 'COMPLETED'
                      ? 'w-2 bg-emerald-400'
                      : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </ol>
          <Link
            to="/welcome"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Save and exit
          </Link>
        </div>
      </header>
      <div
        className="relative z-20 mx-5 h-1.5 overflow-hidden rounded-full bg-white/15"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Stage */}
      <div className="relative z-10 min-h-0 flex-1">
        <p className="pointer-events-none absolute inset-x-0 top-4 px-6 text-center text-xl font-semibold text-white/85 sm:text-2xl">
          {step.title}
        </p>

        <motion.div
          className="absolute inset-x-0 bottom-0 top-10 flex justify-center"
          animate={{ x: questionOpen || ackOpen ? '-24%' : '0%' }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={avatar.id}
              className="relative h-full w-full max-w-3xl"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.45 }}
            >
              <Avatar
                avatar={avatar}
                emotion={view.emotion}
                gesture={view.gesture}
                speaking={view.speaking && !paused}
                mouthCue={view.mouthCue}
                className="h-full w-full drop-shadow-2xl"
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-1 text-sm backdrop-blur">
                <span className="font-semibold">{avatar.name}</span>
                <span className="text-white/70"> · {avatar.title}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {question && (
            <QuestionPanel
              key={question.id}
              question={question}
              feedback={feedback}
              picked={picked}
              busy={answering}
              onAnswer={(id) => void answer(id)}
              onContinue={() => void complete(questionStep.current)}
            />
          )}
          {ackOpen && step.ackText && (
            <AckPanel key="ack" text={step.ackText} onConfirm={() => void acknowledge()} />
          )}
        </AnimatePresence>
      </div>

      {/* Captions */}
      <div className="relative z-20 flex min-h-16 items-end justify-center px-5 pb-2">
        {sound.captions && view.caption && !card && <Captions caption={view.caption} />}
      </div>

      {error && (
        <div
          role="alert"
          className="relative z-30 mx-auto mb-2 flex max-w-xl items-center gap-3 rounded-lg bg-red-600 px-4 py-2 text-sm"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            className="rounded bg-white/20 px-2 py-1 hover:bg-white/30"
            onClick={() => void recover()}
          >
            Try again
          </button>
        </div>
      )}

      {/* Controls */}
      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-black/35 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <ControlButton onClick={togglePause} label={paused ? 'Play' : 'Pause'}>
            {paused ? '▶' : '❚❚'}
          </ControlButton>
          <ControlButton onClick={() => setNonce((n) => n + 1)} label="Replay this step">
            ↺
          </ControlButton>
          {replay && (
            <>
              <ControlButton
                label="Previous step"
                onClick={() =>
                  idx > 0 && setCursor({ modId: mod.id, stepId: steps[idx - 1]?.id ?? null })
                }
              >
                ⏮
              </ControlButton>
              <ControlButton label="Next step" onClick={() => void complete()}>
                ⏭
              </ControlButton>
            </>
          )}
          <span className="ml-2 text-sm text-white/75">
            Step {idx + 1} of {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ControlButton
            onClick={() => sound.set({ muted: !sound.muted })}
            label={sound.muted ? 'Unmute' : 'Mute'}
          >
            {sound.muted || sound.volume === 0 ? '🔇' : '🔊'}
          </ControlButton>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sound.muted ? 0 : sound.volume}
            onChange={(e) => sound.set({ volume: Number(e.target.value), muted: false })}
            aria-label="Volume"
            className="w-24 accent-white"
          />
          <ToggleChip on={sound.captions} onClick={() => sound.set({ captions: !sound.captions })}>
            CC
          </ToggleChip>
          <ToggleChip on={sound.music} onClick={() => sound.set({ music: !sound.music })}>
            ♪ Music
          </ToggleChip>
        </div>
      </footer>

      {/* Module title card */}
      <AnimatePresence>
        {card && (
          <motion.div
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/70 text-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="h-1 rounded-full"
              style={{ backgroundColor: theme }}
              initial={{ width: 0 }}
              animate={{ width: 220 }}
              transition={{ duration: 0.8 }}
            />
            <motion.p
              className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/70"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {card.kicker}
            </motion.p>
            <motion.h2
              className="mt-2 px-6 text-4xl font-semibold sm:text-5xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {card.title}
            </motion.h2>
            <motion.p
              className="mt-3 text-white/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {card.sub}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browsers only allow sound after a click, so a fresh page load starts here. */}
      {!started && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setStarted(true);
            }}
            className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-xl hover:bg-blue-50"
          >
            ▶ {replay ? 'Play module' : 'Continue your induction'}
          </button>
          <p className="mt-3 text-sm text-white/70">Turn your sound on. Captions are available.</p>
        </div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ */

function Shell({ theme, children }: { theme: string; children: React.ReactNode }): ReactElement {
  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden text-white transition-[background] duration-700"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 105%, ${theme}dd 0%, ${theme}55 45%, transparent 75%), linear-gradient(165deg, #0b1228 0%, #131c3d 55%, #0b1228 100%)`,
      }}
    >
      <div
        className="stage-blob left-[8%] top-[18%] h-56 w-56"
        style={{ backgroundColor: theme }}
      />
      <div
        className="stage-blob right-[10%] top-[30%] h-72 w-72 [animation-delay:-6s]"
        style={{ backgroundColor: theme }}
      />
      <div
        className="stage-blob left-[45%] top-[8%] h-40 w-40 [animation-delay:-11s]"
        style={{ backgroundColor: '#ffffff' }}
      />
      {children}
    </div>
  );
}

function Captions({ caption }: { caption: Caption }): ReactElement {
  const { text, from, to, wordFrom, wordTo } = caption;
  const hasWord = wordTo > wordFrom && wordFrom >= from && wordTo <= to;
  return (
    <p
      aria-live="off"
      className="max-w-3xl rounded-xl bg-black/55 px-4 py-2 text-center text-lg leading-snug backdrop-blur"
    >
      {hasWord ? (
        <>
          <span className="text-white">{text.slice(from, wordFrom)}</span>
          <span className="rounded bg-amber-300 px-0.5 text-slate-900">
            {text.slice(wordFrom, wordTo)}
          </span>
          <span className="text-white/60">{text.slice(wordTo, to)}</span>
        </>
      ) : (
        text.slice(from, to)
      )}
    </p>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-white/10 px-2 text-sm hover:bg-white/25"
    >
      {children}
    </button>
  );
}

function ToggleChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): ReactElement {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`h-9 rounded-lg px-2.5 text-sm font-medium ${on ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/25'}`}
    >
      {children}
    </button>
  );
}

const sidePanel =
  'absolute right-4 top-14 z-20 max-h-[calc(100%-4rem)] w-[min(30rem,calc(100%-2rem))] overflow-y-auto rounded-2xl bg-white p-5 text-slate-900 shadow-2xl lg:right-[6%]';

function QuestionPanel({
  question,
  feedback,
  picked,
  busy,
  onAnswer,
  onContinue,
}: {
  question: QuestionDto;
  feedback: AttemptResponseDto | null;
  picked: string | null;
  busy: boolean;
  onAnswer: (optionId: string) => void;
  onContinue: () => void;
}): ReactElement {
  const attemptsLeft = Math.max(0, 2 - question.attemptsUsed);
  return (
    <motion.section
      className={sidePanel}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      aria-label="Quick check"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Quick check</p>
      <h3 className="mt-1 text-lg font-semibold leading-snug">{question.text}</h3>
      <ul className="mt-4 space-y-2">
        {question.options.map((option, i) => {
          const isCorrect = question.correctOptionId === option.id;
          const isWrong = question.disabledOptionIds.includes(option.id);
          const state = isCorrect
            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
            : isWrong
              ? 'border-red-200 bg-red-50 text-red-400 line-through'
              : question.resolved
                ? 'border-slate-200 text-slate-400'
                : 'border-slate-300 hover:border-brand-600 hover:bg-brand-100/50';
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={busy || question.resolved || isWrong}
                onClick={() => onAnswer(option.id)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${state}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 no-underline">
                  {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + i)}
                </span>
                <span>{option.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {!question.resolved && question.hintText && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Hint:</strong> {question.hintText} You have one more try.
        </p>
      )}
      {!question.resolved && !question.hintText && (
        <p className="mt-3 text-xs text-slate-500">
          {attemptsLeft} {attemptsLeft === 1 ? 'try' : 'tries'} left
        </p>
      )}
      {question.resolved && (
        <div className="mt-4">
          {feedback?.result === 'CORRECT' ||
          (!feedback &&
            picked === null &&
            question.attemptsUsed > 0 &&
            question.disabledOptionIds.length < question.attemptsUsed) ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              Correct, well done!
            </p>
          ) : (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
              The correct answer is highlighted above.
            </p>
          )}
          {feedback?.explanation && (
            <p className="mt-2 text-sm text-slate-700">{feedback.explanation}</p>
          )}
          <button
            type="button"
            onClick={onContinue}
            className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      )}
    </motion.section>
  );
}

function AckPanel({ text, onConfirm }: { text: string; onConfirm: () => void }): ReactElement {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <motion.section
      className={sidePanel}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      aria-label="Acknowledgment"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Acknowledgment</p>
      <h3 className="mt-1 text-lg font-semibold">Please confirm</h3>
      <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
        {text}
      </p>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>I have read and understood this, and I agree to follow it.</span>
      </label>
      <button
        type="button"
        disabled={!checked || busy}
        onClick={() => {
          setBusy(true);
          onConfirm();
          window.setTimeout(() => setBusy(false), 1500);
        }}
        className="mt-4 w-full rounded-xl bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
      >
        I acknowledge
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Your confirmation is recorded with today's date.
      </p>
    </motion.section>
  );
}

/** Content editor: modules, their steps (scripts with emotion and gesture) and their questions. */
import {
  EMOTIONS,
  STEP_TYPES,
  type AdminModuleDto,
  type AdminQuestionDto,
  type AdminStepDto,
  type AvatarDto,
  type QuestionUpsertInput,
  type Role,
  type ScriptSegment,
  type StepType,
} from '@induction/shared';
import { useEffect, useState, type ReactElement } from 'react';
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
  Textarea,
  pretty,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { useMe } from '../lib/auth';
import {
  PresenterPreview,
  SegmentsEditor,
  WorkflowButtons,
  useAdminModules,
  useAvatars,
  useRefreshContent,
} from './shared';

const STEP_LABEL: Record<StepType, string> = {
  VIDEO: 'Presentation',
  QUESTION: 'Question',
  TRANSITION: 'Transition',
  ACKNOWLEDGMENT: 'Acknowledgment',
};

export function ContentPage(): ReactElement {
  const me = useMe();
  const modules = useAdminModules();
  const avatars = useAvatars();
  const refresh = useRefreshContent();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const resetToDefault = async () => {
    const ok = window.confirm(
      'Reset all induction content to the default?\n\n' +
        'Every module, step and question goes back to the original version and is published. ' +
        'Modules you added are deleted, along with candidates’ progress in them. ' +
        'Candidates’ progress and results in the default modules are kept.',
    );
    if (!ok) return;
    setResetting(true);
    setResetError('');
    try {
      await api.post('/admin/modules/reset-to-default');
      setSelectedId(null);
      await refresh();
    } catch (err) {
      setResetError(errorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  if (modules.isLoading || avatars.isLoading) return <Loading />;
  if (modules.isError || avatars.isError || !modules.data || !avatars.data || !me.data) {
    return <ErrorNote>{errorMessage(modules.error ?? avatars.error)}</ErrorNote>;
  }
  const canEdit = me.data.role === 'ADMIN';
  const selected = modules.data.find((m) => m.id === selectedId) ?? modules.data[0];

  return (
    <>
      <PageHeader
        title="Content"
        subtitle="Learners only see published modules. Editing a module returns it to draft until it is reviewed again."
        actions={
          canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void resetToDefault()} disabled={resetting}>
                {resetting ? 'Resetting…' : 'Reset to default'}
              </Button>
              <Button variant="primary" onClick={() => setCreating(true)}>
                + New module
              </Button>
            </div>
          ) : undefined
        }
      />
      {resetError && <ErrorNote>{resetError}</ErrorNote>}
      <div className="grid gap-5 xl:grid-cols-[18rem_1fr]">
        <ul className="space-y-2">
          {modules.data.map((mod) => (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => setSelectedId(mod.id)}
                className={`w-full rounded-xl border p-3 text-left ${mod.id === selected?.id ? 'border-brand-600 bg-brand-100/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium text-slate-900">
                    {mod.order}. {mod.title}
                  </span>
                  <StatusBadge status={mod.status} />
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {mod.steps.length} steps · {mod.questions.length} questions · v{mod.version}
                  {mod.requiresAcknowledgment && ' · Legal review'}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <ModuleEditor
            key={selected.id}
            mod={selected}
            avatars={avatars.data}
            canEdit={canEdit}
            role={me.data.role}
          />
        ) : (
          <Card>No modules yet.</Card>
        )}
      </div>
      {creating && (
        <ModuleForm
          avatars={avatars.data}
          onClose={() => setCreating(false)}
          onSaved={async (id) => {
            await refresh();
            setSelectedId(id);
            setCreating(false);
          }}
        />
      )}
    </>
  );
}

function ModuleForm({
  mod,
  avatars,
  onClose,
  onSaved,
}: {
  mod?: AdminModuleDto;
  avatars: AvatarDto[];
  onClose: () => void;
  onSaved: (id: string) => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState({
    title: mod?.title ?? '',
    description: mod?.description ?? '',
    avatarId: mod?.avatarId ?? avatars[0]?.id ?? '',
    requiresAcknowledgment: mod?.requiresAcknowledgment ?? false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (mod) {
        await api.put(`/admin/modules/${mod.id}`, form);
        await onSaved(mod.id);
      } else {
        const { id } = await api.post<{ id: string }>('/admin/modules', form);
        await onSaved(id);
      }
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={mod ? 'Edit module details' : 'New module'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <Input
            value={form.title}
            maxLength={160}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            maxLength={500}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Presenter">
          <Select
            value={form.avatarId}
            onChange={(e) => setForm({ ...form, avatarId: e.target.value })}
          >
            {avatars.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.title})
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.requiresAcknowledgment}
            onChange={(e) => setForm({ ...form, requiresAcknowledgment: e.target.checked })}
          />
          Policy or compliance content: a Legal reviewer must approve it before it can be published.
        </label>
        {mod && mod.status !== 'DRAFT' && (
          <Notice>Saving returns this module to draft and it must be reviewed again.</Notice>
        )}
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !form.title.trim() || !form.avatarId}
            onClick={() => void save()}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ModuleEditor({
  mod,
  avatars,
  canEdit,
  role,
}: {
  mod: AdminModuleDto;
  avatars: AvatarDto[];
  canEdit: boolean;
  role: Role;
}): ReactElement {
  const refresh = useRefreshContent();
  const [editingDetails, setEditingDetails] = useState(false);
  const [step, setStep] = useState<AdminStepDto | 'new' | null>(null);
  const [question, setQuestion] = useState<AdminQuestionDto | 'new' | null>(null);
  const [error, setError] = useState('');
  const presenter = avatars.find((a) => a.id === mod.avatarId);

  const act = async (work: () => Promise<unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError('');
    try {
      await work();
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="min-w-0 space-y-5">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900">{mod.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{mod.description || 'No description'}</p>
            <p className="mt-2 text-xs text-slate-500">
              Presenter: {presenter ? `${presenter.name}, ${presenter.title}` : 'Unknown'} · Version{' '}
              {mod.version}
              {mod.requiresAcknowledgment && ' · Needs Legal approval'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={mod.status} />
            <WorkflowButtons
              type="module"
              id={mod.id}
              status={mod.status}
              needsLegal={mod.requiresAcknowledgment}
              role={role}
            />
            {canEdit && (
              <>
                <Button small onClick={() => setEditingDetails(true)}>
                  Edit details
                </Button>
                <Button
                  small
                  variant="danger"
                  onClick={() =>
                    void act(
                      () => api.del(`/admin/modules/${mod.id}`),
                      `Delete the module "${mod.title}" and everything in it?`,
                    )
                  }
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Steps</h3>
          {canEdit && (
            <Button small variant="primary" onClick={() => setStep('new')}>
              + Add step or question point
            </Button>
          )}
        </div>
        <ol className="divide-y divide-slate-100">
          {mod.steps.map((s, index) => (
            <li key={s.id} className="flex items-start gap-3 py-2.5">
              <span className="mt-0.5 w-6 shrink-0 text-right text-sm text-slate-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {s.title || STEP_LABEL[s.type]}
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                    {STEP_LABEL[s.type]}
                  </span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  {s.type === 'QUESTION'
                    ? `Draws one question from topic "${s.questionPoolTopic ?? s.topic}"`
                    : s.type === 'ACKNOWLEDGMENT'
                      ? s.ackText
                      : `${s.segments.length} segment${s.segments.length === 1 ? '' : 's'}: ${s.segments[0]?.text ?? ''}`}
                </p>
              </div>
              {canEdit && (
                <span className="flex shrink-0 gap-1">
                  <Button
                    small
                    variant="ghost"
                    disabled={index === 0}
                    aria-label="Move up"
                    onClick={() =>
                      void act(() => api.post(`/admin/steps/${s.id}/move`, { direction: 'up' }))
                    }
                  >
                    ↑
                  </Button>
                  <Button
                    small
                    variant="ghost"
                    disabled={index === mod.steps.length - 1}
                    aria-label="Move down"
                    onClick={() =>
                      void act(() => api.post(`/admin/steps/${s.id}/move`, { direction: 'down' }))
                    }
                  >
                    ↓
                  </Button>
                  <Button small onClick={() => setStep(s)}>
                    Edit
                  </Button>
                  <Button
                    small
                    variant="danger"
                    onClick={() =>
                      void act(() => api.del(`/admin/steps/${s.id}`), 'Delete this step?')
                    }
                  >
                    Delete
                  </Button>
                </span>
              )}
              {!canEdit && (
                <Button small onClick={() => setStep(s)}>
                  View
                </Button>
              )}
            </li>
          ))}
          {mod.steps.length === 0 && <li className="py-4 text-sm text-slate-500">No steps yet.</li>}
        </ol>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Follow-up questions</h3>
            <p className="text-xs text-slate-500">
              Asked after a presentation. A question step picks one published question with the same
              topic.
            </p>
          </div>
          {canEdit && (
            <Button small variant="primary" onClick={() => setQuestion('new')}>
              + Add follow-up question
            </Button>
          )}
        </div>
        <ul className="divide-y divide-slate-100">
          {mod.questions.map((q) => (
            <li key={q.id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">{q.text}</p>
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={q.status} />
                  <WorkflowButtons
                    type="question"
                    id={q.id}
                    status={q.status}
                    needsLegal={mod.requiresAcknowledgment}
                    role={role}
                  />
                  {canEdit && (
                    <>
                      <Button small onClick={() => setQuestion(q)}>
                        Edit
                      </Button>
                      <Button
                        small
                        variant="danger"
                        onClick={() =>
                          void act(
                            () => api.del(`/admin/questions/${q.id}`),
                            'Delete this question?',
                          )
                        }
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Topic: {q.topic}</p>
              <ul className="mt-1.5 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
                {q.options.map((o) => (
                  <li
                    key={o.id}
                    className={o.isCorrect ? 'font-medium text-emerald-700' : 'text-slate-600'}
                  >
                    {o.isCorrect ? '✓ ' : '• '}
                    {o.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {mod.questions.length === 0 && (
            <li className="py-4 text-sm text-slate-500">No questions yet.</li>
          )}
        </ul>
      </Card>

      {editingDetails && (
        <ModuleForm
          mod={mod}
          avatars={avatars}
          onClose={() => setEditingDetails(false)}
          onSaved={async () => {
            await refresh();
            setEditingDetails(false);
          }}
        />
      )}
      {step && (
        <StepForm
          mod={mod}
          step={step === 'new' ? undefined : step}
          avatars={avatars}
          readOnly={!canEdit}
          onClose={() => setStep(null)}
          onSaved={async () => {
            await refresh();
            setStep(null);
          }}
        />
      )}
      {question && (
        <QuestionForm
          mod={mod}
          question={question === 'new' ? undefined : question}
          onClose={() => setQuestion(null)}
          onSaved={async () => {
            await refresh();
            setQuestion(null);
          }}
        />
      )}
    </div>
  );
}

export function StepForm({
  mod,
  step,
  avatars,
  readOnly,
  initialSegments,
  initialTitle,
  initialTopic,
  onClose,
  onSaved,
}: {
  mod: AdminModuleDto;
  step?: AdminStepDto;
  avatars: AvatarDto[];
  readOnly?: boolean;
  initialSegments?: ScriptSegment[];
  initialTitle?: string;
  initialTopic?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState({
    type: step?.type ?? ('VIDEO' as StepType),
    title: step?.title ?? initialTitle ?? '',
    topic: step?.topic ?? initialTopic ?? '',
    avatarId: step?.avatarId ?? '',
    emotion: step?.emotion ?? 'FRIENDLY',
    ackText: step?.ackText ?? '',
  });
  const [segments, setSegments] = useState<ScriptSegment[]>(
    step?.segments ?? initialSegments ?? [{ text: '', emotion: 'FRIENDLY', gesture: 'NONE' }],
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const presenter = avatars.find((a) => a.id === (form.avatarId || mod.avatarId));
  const speaks = form.type !== 'QUESTION';

  const save = async () => {
    setBusy(true);
    setError('');
    const body = {
      type: form.type,
      title: form.title,
      topic: form.topic,
      avatarId: form.avatarId || null,
      emotion: form.emotion,
      segments: speaks ? segments.filter((s) => s.text.trim()) : [],
      ackText: form.type === 'ACKNOWLEDGMENT' ? form.ackText : null,
    };
    try {
      if (step) await api.put(`/admin/steps/${step.id}`, body);
      else await api.post(`/admin/modules/${mod.id}/steps`, body);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={readOnly ? 'Step' : step ? 'Edit step' : 'New step'} onClose={onClose} wide>
      <fieldset disabled={readOnly} className="grid gap-5 lg:grid-cols-[1fr_17rem]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as StepType })}
              >
                {STEP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {STEP_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input
                value={form.title}
                maxLength={160}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field
              label="Topic"
              hint="Lower-case words with hyphens. A question step draws from questions with the same topic."
            >
              <Input
                value={form.topic}
                maxLength={80}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="our-values"
              />
            </Field>
            <Field label="Presenter">
              <Select
                value={form.avatarId}
                onChange={(e) => setForm({ ...form, avatarId: e.target.value })}
              >
                <option value="">Module presenter</option>
                {avatars.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Overall mood">
              <Select
                value={form.emotion}
                onChange={(e) =>
                  setForm({ ...form, emotion: e.target.value as typeof form.emotion })
                }
              >
                {EMOTIONS.map((emotion) => (
                  <option key={emotion} value={emotion}>
                    {pretty(emotion)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {form.type === 'ACKNOWLEDGMENT' && (
            <Field label="Statement the learner must acknowledge">
              <Textarea
                value={form.ackText}
                maxLength={2000}
                onChange={(e) => setForm({ ...form, ackText: e.target.value })}
              />
            </Field>
          )}
          {speaks ? (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Script</p>
              <SegmentsEditor
                segments={segments}
                onChange={setSegments}
                manner={presenter?.personalityNotes}
              />
            </div>
          ) : (
            <Notice>
              The presenter reads out a question picked from this module's published questions with
              the same topic.
            </Notice>
          )}
        </div>
        <div>
          {presenter && speaks && <PresenterPreview avatar={presenter} segments={segments} />}
        </div>
      </fieldset>
      <div className="mt-4 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {!readOnly && (
            <Button variant="primary" disabled={busy} onClick={() => void save()}>
              Save step
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function QuestionForm({
  mod,
  question,
  onClose,
  onSaved,
}: {
  mod: AdminModuleDto;
  question?: AdminQuestionDto;
  onClose: () => void;
  onSaved: () => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState<QuestionUpsertInput>({
    topic: question?.topic ?? mod.steps.find((s) => s.type === 'QUESTION')?.topic ?? '',
    text: question?.text ?? '',
    hint: question?.hint ?? '',
    explanation: question?.explanation ?? '',
    options: question
      ? [...question.options]
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      : [0, 1, 2, 3].map((i) => ({ text: '', isCorrect: i === 0 })),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const topics = [...new Set(mod.steps.filter((s) => s.type === 'QUESTION').map((s) => s.topic))];

  useEffect(() => setError(''), [form]);

  const save = async () => {
    setBusy(true);
    try {
      if (question) await api.put(`/admin/questions/${question.id}`, form);
      else await api.post(`/admin/modules/${mod.id}/questions`, form);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={question ? 'Edit question' : 'New question'} onClose={onClose}>
      <div className="space-y-4">
        <Field
          label="Topic"
          hint={
            topics.length ? `Question steps in this module use: ${topics.join(', ')}` : undefined
          }
        >
          <Input
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            list="question-topics"
          />
          <datalist id="question-topics">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <Field label="Question">
          <Textarea
            value={form.text}
            maxLength={400}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
          />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">
            Options (select the correct one)
          </p>
          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  aria-label={`Option ${index + 1} is correct`}
                  checked={option.isCorrect}
                  onChange={() =>
                    setForm({
                      ...form,
                      options: form.options.map((o, i) => ({ ...o, isCorrect: i === index })),
                    })
                  }
                />
                <Input
                  value={option.text}
                  maxLength={200}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      options: form.options.map((o, i) =>
                        i === index ? { ...o, text: e.target.value } : o,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <Field
          label="Hint"
          hint="Shown after a first wrong answer. It must not give the answer away."
        >
          <Textarea
            value={form.hint}
            maxLength={400}
            onChange={(e) => setForm({ ...form, hint: e.target.value })}
          />
        </Field>
        <Field label="Explanation" hint="Shown when the answer is revealed.">
          <Textarea
            value={form.explanation}
            maxLength={800}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          />
        </Field>
        {question && question.status !== 'DRAFT' && (
          <Notice>Saving returns this question to draft until it is reviewed again.</Notice>
        )}
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={() => void save()}>
            Save question
          </Button>
        </div>
      </div>
    </Modal>
  );
}

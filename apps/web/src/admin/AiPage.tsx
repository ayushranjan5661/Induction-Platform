/** AI authoring assistant: drafts scripts and questions from pasted source text. Nothing is published without review. */
import type {
  AiDraftDto,
  AiDraftResponseDto,
  AiDraftSave,
  AiStatusDto,
  ScriptSegment,
} from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Loading,
  Notice,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { StepForm } from './ContentPage';
import {
  PresenterPreview,
  SegmentsEditor,
  useAdminModules,
  useAvatars,
  useRefreshContent,
} from './shared';

const DRAFT_QUERY = ['admin', 'ai-draft'];

/** Older builds kept the draft in localStorage; it is offered once, then saved to the server. */
const LEGACY_DRAFT_KEY = 'induction.aiAssistantDraft.v1';

function readLegacyDraft(): AiDraftSave | null {
  try {
    const raw = window.localStorage.getItem(LEGACY_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as AiDraftSave) : null;
  } catch {
    return null;
  }
}

function clearLegacyDraft(): void {
  try {
    window.localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    /* storage blocked: nothing to clear */
  }
}

const savedAtLabel = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function AiPage(): ReactElement {
  const draft = useQuery({
    queryKey: DRAFT_QUERY,
    queryFn: () => api.get<AiDraftResponseDto>('/admin/ai/draft'),
    staleTime: Infinity,
  });
  if (draft.isLoading) return <Loading />;
  if (!draft.data) return <ErrorNote>{errorMessage(draft.error)}</ErrorNote>;
  return <AiEditor saved={draft.data.draft} />;
}

function AiEditor({ saved }: { saved: AiDraftDto | null }): ReactElement {
  const status = useQuery({
    queryKey: ['admin', 'ai-status'],
    queryFn: () => api.get<AiStatusDto>('/admin/ai/status'),
  });
  const modules = useAdminModules();
  const avatars = useAvatars();
  const refresh = useRefreshContent();
  const queryClient = useQueryClient();
  const [legacy] = useState(() => (saved ? null : readLegacyDraft()));
  const initial: AiDraftSave | null = saved ?? legacy;
  const [savedAt, setSavedAt] = useState<string | null>(saved?.savedAt ?? null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [moduleId, setModuleId] = useState(initial?.moduleId ?? '');
  const [topic, setTopic] = useState(initial?.topic ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [sourceText, setSourceText] = useState(initial?.sourceText ?? '');
  const [count, setCount] = useState(initial?.count ?? 3);
  const [segments, setSegments] = useState<ScriptSegment[] | null>(initial?.segments ?? null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<'script' | 'questions' | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState(
    legacy ? 'Unsaved work from this browser was restored. Click "Save as draft" to keep it.' : '',
  );

  if (status.isLoading || modules.isLoading || avatars.isLoading) return <Loading />;
  if (!status.data || !modules.data || !avatars.data)
    return <ErrorNote>{errorMessage(status.error ?? modules.error ?? avatars.error)}</ErrorNote>;

  const mod = modules.data.find((m) => m.id === moduleId) ?? modules.data[0];
  const presenter = avatars.data.find((a) => a.id === mod?.avatarId);
  const ready =
    Boolean(mod) && sourceText.trim().length >= 40 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(topic);

  const hasWork = Boolean(topic.trim() || title.trim() || sourceText.trim() || segments);

  const saveDraft = async () => {
    setDraftBusy(true);
    setError('');
    try {
      const out = await api.put<AiDraftResponseDto>('/admin/ai/draft', {
        moduleId: mod?.id ?? '',
        topic,
        title,
        sourceText,
        count,
        segments,
      } satisfies AiDraftSave);
      queryClient.setQueryData(DRAFT_QUERY, out);
      clearLegacyDraft();
      setSavedAt(out.draft?.savedAt ?? null);
      setNote('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDraftBusy(false);
    }
  };

  const discardDraft = async () => {
    if (!window.confirm('Discard the saved draft and clear this page?')) return;
    setDraftBusy(true);
    setError('');
    try {
      await api.del('/admin/ai/draft');
      queryClient.setQueryData<AiDraftResponseDto>(DRAFT_QUERY, { draft: null });
      clearLegacyDraft();
      setSavedAt(null);
      setModuleId('');
      setTopic('');
      setTitle('');
      setSourceText('');
      setCount(3);
      setSegments(null);
      setNote('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDraftBusy(false);
    }
  };

  const run = async (kind: 'script' | 'questions') => {
    if (!mod) return;
    setBusy(kind);
    setError('');
    setNote('');
    try {
      if (kind === 'script') {
        const out = await api.post<{ segments: ScriptSegment[] }>('/admin/ai/generate-script', {
          sourceText,
          moduleId: mod.id,
          topic,
          title: title || topic,
        });
        setSegments(out.segments);
      } else {
        const out = await api.post<{ created: number }>('/admin/ai/generate-questions', {
          sourceText,
          moduleId: mod.id,
          topic,
          count,
        });
        await refresh();
        setNote(
          `${out.created} draft question${out.created === 1 ? '' : 's'} added to "${mod.title}". Review them under Content before sending for review.`,
        );
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="AI assistant"
        subtitle="Turns your source notes into a presenter script or quiz questions. Everything it writes is a draft for you to check."
      />
      {!status.data.configured && (
        <div className="mb-4">
          <Notice>
            The AI service is not configured on the server (Azure OpenAI settings in .env), so
            generation is unavailable. You can still write content by hand.
          </Notice>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Module">
              <Select value={mod?.id ?? ''} onChange={(e) => setModuleId(e.target.value)}>
                {modules.data.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Topic" hint="Lower-case words with hyphens">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="leave-policy"
              />
            </Field>
          </div>
          <Field label="Step title (for scripts)">
            <Input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field
            label="Source text"
            hint="Paste the approved notes. Do not paste personal or confidential data. At least a few sentences."
          >
            <Textarea
              className="min-h-52"
              value={sourceText}
              maxLength={12000}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          {note && (
            <Notice>
              {note}{' '}
              <Link to="/admin/content" className="underline">
                Open Content
              </Link>
            </Notice>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              disabled={!ready || busy !== null || !status.data.configured}
              onClick={() => void run('script')}
            >
              {busy === 'script' ? 'Writing…' : 'Draft a script'}
            </Button>
            <Button
              disabled={!ready || busy !== null || !status.data.configured}
              onClick={() => void run('questions')}
            >
              {busy === 'questions' ? 'Writing…' : 'Draft questions'}
            </Button>
            <Select
              className="!w-20"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              aria-label="Number of questions"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Select>
            <span className="flex-1" />
            {savedAt && (
              <Button
                variant="ghost"
                disabled={draftBusy || busy !== null}
                onClick={() => void discardDraft()}
              >
                Discard draft
              </Button>
            )}
            <Button
              disabled={!hasWork || draftBusy || busy !== null}
              onClick={() => void saveDraft()}
            >
              {draftBusy ? 'Saving…' : 'Save as draft'}
            </Button>
          </div>
          {savedAt && (
            <p className="text-xs text-slate-500">
              Draft saved {savedAtLabel(savedAt)}. It is kept on the server for your account, so you
              can pick it up from any browser until you discard it.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-slate-900">Draft script</h2>
          {!segments ? (
            <p className="mt-2 text-sm text-slate-500">
              A drafted script appears here. You can edit each segment's wording, emotion and
              gesture, preview it, then add it to the module as a new step.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {presenter && (
                <PresenterPreview avatar={presenter} segments={segments} className="h-56" />
              )}
              <SegmentsEditor segments={segments} onChange={setSegments} />
              <Button variant="primary" onClick={() => setSaving(true)}>
                Add to module as a step…
              </Button>
            </div>
          )}
        </Card>
      </div>
      {saving && mod && segments && (
        <StepForm
          mod={mod}
          avatars={avatars.data}
          initialSegments={segments}
          initialTitle={title}
          initialTopic={topic}
          onClose={() => setSaving(false)}
          onSaved={async () => {
            await refresh();
            setSaving(false);
            setSegments(null);
            setNote(
              `Step added to "${mod.title}". The module is now a draft and needs review before learners see the change.`,
            );
          }}
        />
      )}
    </>
  );
}

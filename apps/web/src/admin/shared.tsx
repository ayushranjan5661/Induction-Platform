/** Pieces shared by the content screens: data hooks, review buttons, script editor, presenter preview. */
import {
  EMOTIONS,
  GESTURES,
  type AdminModuleDto,
  type AvatarDto,
  type BusinessUnitDto,
  type ContentStatus,
  type ContentType,
  type ReviewAction,
  type Role,
  type ScriptSegment,
} from '@induction/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactElement } from 'react';
import { Avatar } from '../avatar/Avatar';
import { Button, ErrorNote, Select, Textarea, pretty } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { usePresenter } from '../speech/usePresenter';

export const useAdminModules = () =>
  useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => api.get<AdminModuleDto[]>('/admin/modules'),
  });
export const useAvatars = () =>
  useQuery({
    queryKey: ['admin', 'avatars'],
    queryFn: () => api.get<AvatarDto[]>('/admin/avatars'),
  });
export const useBusinessUnits = () =>
  useQuery({
    queryKey: ['admin', 'business-units'],
    queryFn: () => api.get<BusinessUnitDto[]>('/admin/business-units'),
  });

/** Refreshes everything the content screens show. */
export function useRefreshContent(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] });
}

/** The review actions this role may take on content in this status. */
export function allowedActions(
  role: Role,
  status: ContentStatus,
  needsLegal: boolean,
): ReviewAction[] {
  if (status === 'DRAFT') return role === 'ADMIN' ? ['submit'] : [];
  if (status === 'IN_REVIEW')
    return role === (needsLegal ? 'LEGAL_REVIEWER' : 'ADMIN') ? ['approve', 'reject'] : [];
  if (status === 'APPROVED') return role === 'ADMIN' ? ['publish'] : [];
  return [];
}

const ACTION_LABEL: Record<ReviewAction, string> = {
  submit: 'Send for review',
  approve: 'Approve',
  reject: 'Send back',
  publish: 'Publish',
};

export function WorkflowButtons({
  type,
  id,
  status,
  needsLegal,
  role,
}: {
  type: ContentType;
  id: string;
  status: ContentStatus;
  needsLegal: boolean;
  role: Role;
}): ReactElement | null {
  const refresh = useRefreshContent();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const actions = allowedActions(role, status, needsLegal);

  const run = async (action: ReviewAction) => {
    let comment = '';
    if (action === 'reject') {
      const typed = window.prompt('What needs to change? (optional)');
      if (typed === null) return;
      comment = typed;
    }
    setBusy(true);
    setError('');
    try {
      await api.post(`/admin/content/${type}/${id}/${action}`, { comment });
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (actions.length === 0) {
    if (status === 'IN_REVIEW') {
      return (
        <span className="text-xs text-slate-500">
          Waiting for {needsLegal ? 'Legal' : 'admin'} review
        </span>
      );
    }
    return null;
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action}
          small
          disabled={busy}
          variant={
            action === 'reject'
              ? 'danger'
              : action === 'publish' || action === 'approve'
                ? 'primary'
                : 'secondary'
          }
          onClick={() => void run(action)}
        >
          {ACTION_LABEL[action]}
        </Button>
      ))}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}

/** Editor for a script: a list of spoken segments, each with an emotion and a gesture. */
export function SegmentsEditor({
  segments,
  onChange,
}: {
  segments: ScriptSegment[];
  onChange: (next: ScriptSegment[]) => void;
}): ReactElement {
  const patch = (index: number, change: Partial<ScriptSegment>) =>
    onChange(segments.map((s, i) => (i === index ? { ...s, ...change } : s)));
  const move = (index: number, by: number) => {
    const next = [...segments];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + by, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {segments.map((segment, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Textarea
            value={segment.text}
            maxLength={1200}
            onChange={(e) => patch(index, { text: e.target.value })}
            placeholder="What the presenter says"
            aria-label={`Segment ${index + 1} text`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Select
              className="!w-40"
              value={segment.emotion}
              onChange={(e) =>
                patch(index, { emotion: e.target.value as ScriptSegment['emotion'] })
              }
              aria-label="Emotion"
            >
              {EMOTIONS.map((emotion) => (
                <option key={emotion} value={emotion}>
                  {pretty(emotion)}
                </option>
              ))}
            </Select>
            <Select
              className="!w-44"
              value={segment.gesture}
              onChange={(e) =>
                patch(index, { gesture: e.target.value as ScriptSegment['gesture'] })
              }
              aria-label="Gesture"
            >
              {GESTURES.map((gesture) => (
                <option key={gesture} value={gesture}>
                  {gesture === 'NONE' ? 'No gesture' : pretty(gesture)}
                </option>
              ))}
            </Select>
            <span className="flex-1" />
            <Button
              small
              variant="ghost"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label="Move up"
            >
              ↑
            </Button>
            <Button
              small
              variant="ghost"
              disabled={index === segments.length - 1}
              onClick={() => move(index, 1)}
              aria-label="Move down"
            >
              ↓
            </Button>
            <Button
              small
              variant="danger"
              onClick={() => onChange(segments.filter((_, i) => i !== index))}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button
        small
        disabled={segments.length >= 40}
        onClick={() => onChange([...segments, { text: '', emotion: 'FRIENDLY', gesture: 'NONE' }])}
      >
        + Add segment
      </Button>
    </div>
  );
}

/** A presenter on a small stage with a button to hear and see a script. */
export function PresenterPreview({
  avatar,
  segments,
  className = 'h-64',
}: {
  avatar: AvatarDto;
  segments: ScriptSegment[];
  className?: string;
}): ReactElement {
  const { view, present, stop, setEmotion } = usePresenter(avatar.defaultEmotion);
  const [error, setError] = useState('');
  const playable = segments.filter((s) => s.text.trim());

  useEffect(() => {
    if (!view.speaking) setEmotion(avatar.defaultEmotion);
  }, [avatar.defaultEmotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div
        className={`overflow-hidden rounded-xl ${className}`}
        style={{
          background: `radial-gradient(ellipse at 50% 110%, ${avatar.themeColor} 0%, #131c3d 75%)`,
        }}
      >
        <Avatar
          avatar={avatar}
          emotion={view.emotion}
          gesture={view.gesture}
          speaking={view.speaking}
          mouthCue={view.mouthCue}
          className="h-full w-full"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          small
          variant="primary"
          disabled={playable.length === 0}
          onClick={() => {
            setError('');
            if (view.speaking) return stop();
            present(playable, avatar).catch((err: unknown) => setError(errorMessage(err)));
          }}
        >
          {view.speaking ? '■ Stop' : '▶ Preview'}
        </Button>
        <span className="text-xs text-slate-500">Uses this browser's built-in voice.</span>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

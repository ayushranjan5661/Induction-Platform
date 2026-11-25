/** Presenters: look, voice, personality, and a live preview of every emotion and gesture. */
import {
  EMOTIONS,
  GESTURES,
  HAIR_STYLES,
  type AvatarDto,
  type AvatarUpsertInput,
  type Emotion,
  type Gesture,
} from '@induction/shared';
import { useState, type ReactElement } from 'react';
import { Avatar } from '../avatar/Avatar';
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Textarea,
  pretty,
} from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { PresenterPreview, useAvatars, useRefreshContent } from './shared';

const BLANK: AvatarUpsertInput = {
  name: '',
  title: '',
  themeColor: '#2563EB',
  personalityNotes: '',
  defaultEmotion: 'FRIENDLY',
  entryGesture: 'WAVE',
  exitGesture: 'NOD',
  energy: 1,
  appearance: {
    skin: '#C68B5E',
    hair: '#2B1B12',
    hairStyle: 'short',
    outfit: '#2563EB',
    shirt: '#FFFFFF',
    glasses: false,
    beard: false,
    earrings: false,
  },
  voiceGender: 'female',
  voiceLang: 'en-IN',
  voicePitch: 1,
  voiceRate: 1,
};

const toInput = (a: AvatarDto): AvatarUpsertInput => ({
  name: a.name,
  title: a.title,
  themeColor: a.themeColor,
  personalityNotes: a.personalityNotes,
  defaultEmotion: a.defaultEmotion,
  entryGesture: a.entryGesture,
  exitGesture: a.exitGesture,
  energy: a.energy,
  appearance: a.appearance,
  voiceGender: a.voice.gender,
  voiceLang: a.voice.lang,
  voicePitch: a.voice.pitch,
  voiceRate: a.voice.rate,
});

const toPreview = (form: AvatarUpsertInput): AvatarDto => ({
  id: 'preview',
  name: form.name || 'Presenter',
  title: form.title,
  themeColor: form.themeColor,
  personalityNotes: form.personalityNotes,
  defaultEmotion: form.defaultEmotion,
  entryGesture: form.entryGesture,
  exitGesture: form.exitGesture,
  energy: form.energy,
  appearance: form.appearance,
  voice: {
    gender: form.voiceGender,
    lang: form.voiceLang,
    pitch: form.voicePitch,
    rate: form.voiceRate,
  },
});

export function AvatarsPage(): ReactElement {
  const avatars = useAvatars();
  const refresh = useRefreshContent();
  const [editing, setEditing] = useState<AvatarDto | 'new' | null>(null);
  const [error, setError] = useState('');

  if (avatars.isLoading) return <Loading />;
  if (avatars.isError || !avatars.data) return <ErrorNote>{errorMessage(avatars.error)}</ErrorNote>;

  const remove = async (avatar: AvatarDto) => {
    if (!window.confirm(`Delete the presenter ${avatar.name}?`)) return;
    setError('');
    try {
      await api.del(`/admin/avatars/${avatar.id}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Presenters"
        subtitle="Built-in animated presenters. Each has its own look, voice and manner."
        actions={
          <Button variant="primary" onClick={() => setEditing('new')}>
            + New presenter
          </Button>
        }
      />
      <div className="mb-3">
        <ErrorNote>{error}</ErrorNote>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {avatars.data.map((avatar) => (
          <Card key={avatar.id} className="!p-0 overflow-hidden">
            <div
              className="h-48"
              style={{
                background: `radial-gradient(ellipse at 50% 110%, ${avatar.themeColor} 0%, #131c3d 75%)`,
              }}
            >
              <Avatar avatar={avatar} emotion={avatar.defaultEmotion} className="h-full w-full" />
            </div>
            <div className="p-4">
              <p className="font-semibold text-slate-900">{avatar.name}</p>
              <p className="text-sm text-slate-500">{avatar.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {pretty(avatar.defaultEmotion)} · {avatar.voice.gender} voice ({avatar.voice.lang})
              </p>
              <div className="mt-3 flex gap-2">
                <Button small onClick={() => setEditing(avatar)}>
                  Edit
                </Button>
                <Button small variant="danger" onClick={() => void remove(avatar)}>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && (
        <AvatarForm
          avatar={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await refresh();
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function Colour({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): ReactElement {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-slate-300"
      />
      {label}
    </label>
  );
}

function AvatarForm({
  avatar,
  onClose,
  onSaved,
}: {
  avatar?: AvatarDto;
  onClose: () => void;
  onSaved: () => Promise<void>;
}): ReactElement {
  const [form, setForm] = useState<AvatarUpsertInput>(avatar ? toInput(avatar) : BLANK);
  const [tryEmotion, setTryEmotion] = useState<Emotion>(form.defaultEmotion);
  const [tryGesture, setTryGesture] = useState<{ name: Gesture; nonce: number } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const look = (patch: Partial<AvatarUpsertInput['appearance']>) =>
    setForm({ ...form, appearance: { ...form.appearance, ...patch } });
  const preview = toPreview(form);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (avatar) await api.put(`/admin/avatars/${avatar.id}`, form);
      else await api.post('/admin/avatars', form);
      await onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={avatar ? `Edit ${avatar.name}` : 'New presenter'} onClose={onClose} wide>
      <div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                maxLength={80}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Role shown to learners">
              <Input
                value={form.title}
                maxLength={80}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Personality notes"
            hint="Used by the AI assistant to match this presenter's tone."
          >
            <Textarea
              value={form.personalityNotes}
              maxLength={500}
              onChange={(e) => setForm({ ...form, personalityNotes: e.target.value })}
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Look</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Colour
                label="Skin"
                value={form.appearance.skin}
                onChange={(skin) => look({ skin })}
              />
              <Colour
                label="Hair"
                value={form.appearance.hair}
                onChange={(hair) => look({ hair })}
              />
              <Colour
                label="Jacket"
                value={form.appearance.outfit}
                onChange={(outfit) => look({ outfit })}
              />
              <Colour
                label="Shirt"
                value={form.appearance.shirt}
                onChange={(shirt) => look({ shirt })}
              />
              <Colour
                label="Stage colour"
                value={form.themeColor}
                onChange={(themeColor) => setForm({ ...form, themeColor })}
              />
              <Select
                value={form.appearance.hairStyle}
                onChange={(e) =>
                  look({ hairStyle: e.target.value as (typeof HAIR_STYLES)[number] })
                }
                aria-label="Hair style"
              >
                {HAIR_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style === 'sidePart' ? 'Side part' : pretty(style.toUpperCase())}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
              {(['glasses', 'beard', 'earrings'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.appearance[key]}
                    onChange={(e) => look({ [key]: e.target.checked })}
                  />
                  {pretty(key.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Default emotion">
              <Select
                value={form.defaultEmotion}
                onChange={(e) => {
                  setForm({ ...form, defaultEmotion: e.target.value as Emotion });
                  setTryEmotion(e.target.value as Emotion);
                }}
              >
                {EMOTIONS.map((x) => (
                  <option key={x} value={x}>
                    {pretty(x)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Entry gesture">
              <Select
                value={form.entryGesture}
                onChange={(e) => setForm({ ...form, entryGesture: e.target.value as Gesture })}
              >
                {GESTURES.map((x) => (
                  <option key={x} value={x}>
                    {pretty(x)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Exit gesture">
              <Select
                value={form.exitGesture}
                onChange={(e) => setForm({ ...form, exitGesture: e.target.value as Gesture })}
              >
                {GESTURES.map((x) => (
                  <option key={x} value={x}>
                    {pretty(x)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Energy (${form.energy.toFixed(1)})`}>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={form.energy}
                onChange={(e) => setForm({ ...form, energy: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
            <Field label="Voice">
              <Select
                value={form.voiceGender}
                onChange={(e) =>
                  setForm({ ...form, voiceGender: e.target.value as 'female' | 'male' })
                }
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Accent">
              <Select
                value={form.voiceLang}
                onChange={(e) => setForm({ ...form, voiceLang: e.target.value })}
              >
                {['en-IN', 'en-US', 'en-GB', 'en-AU'].map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </Select>
            </Field>
            <Field label={`Pitch (${form.voicePitch.toFixed(2)})`}>
              <input
                type="range"
                min={0.5}
                max={1.6}
                step={0.05}
                value={form.voicePitch}
                onChange={(e) => setForm({ ...form, voicePitch: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
            <Field label={`Speed (${form.voiceRate.toFixed(2)})`}>
              <input
                type="range"
                min={0.6}
                max={1.4}
                step={0.05}
                value={form.voiceRate}
                onChange={(e) => setForm({ ...form, voiceRate: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <PresenterPreview
            key={`${tryEmotion}-${tryGesture?.nonce ?? 0}`}
            avatar={{ ...preview, defaultEmotion: tryEmotion }}
            segments={[
              {
                text: `Hello, I am ${preview.name}. This is how I look and sound when I present.`,
                emotion: tryEmotion,
                gesture: tryGesture?.name ?? form.entryGesture,
              },
            ]}
            className="h-72"
          />
          <Field label="Try an emotion">
            <Select value={tryEmotion} onChange={(e) => setTryEmotion(e.target.value as Emotion)}>
              {EMOTIONS.map((x) => (
                <option key={x} value={x}>
                  {pretty(x)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Try a gesture (then press Preview)">
            <Select
              value={tryGesture?.name ?? ''}
              onChange={(e) =>
                setTryGesture({ name: e.target.value as Gesture, nonce: Date.now() })
              }
            >
              <option value="" disabled>
                Choose…
              </option>
              {GESTURES.filter((g) => g !== 'NONE').map((x) => (
                <option key={x} value={x}>
                  {pretty(x)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={busy || !form.name.trim() || !form.title.trim()}
            onClick={() => void save()}
          >
            Save presenter
          </Button>
        </div>
      </div>
    </Modal>
  );
}

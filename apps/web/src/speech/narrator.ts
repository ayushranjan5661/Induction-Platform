/**
 * Free text-to-speech using the browser's own voices (Web Speech API).
 * No cloud service and no key. When a browser has no voices, or refuses to
 * speak, the narrator falls back to a silent timer so captions and the avatar
 * keep the same pace and the induction still plays.
 */
import type { AvatarDto, Emotion } from '@induction/shared';
import { effectiveVolume } from './settings';

type VoiceProfile = AvatarDto['voice'];

/** How each emotion colours the voice: multipliers on the avatar's pitch and rate. */
export const EMOTION_VOICE: Record<Emotion, { pitch: number; rate: number }> = {
  NEUTRAL: { pitch: 1, rate: 1 },
  FRIENDLY: { pitch: 1.04, rate: 1 },
  CHEERFUL: { pitch: 1.1, rate: 1.04 },
  EXCITED: { pitch: 1.15, rate: 1.08 },
  PROUD: { pitch: 0.98, rate: 0.96 },
  HOPEFUL: { pitch: 1.06, rate: 0.98 },
  EMPATHETIC: { pitch: 0.95, rate: 0.92 },
  SERIOUS: { pitch: 0.9, rate: 0.93 },
  ENCOURAGING: { pitch: 1.07, rate: 1 },
};

const FEMALE_HINTS =
  /female|zira|heera|neerja|swara|aria|jenny|sonia|libby|samantha|susan|hazel|catherine|natasha|michelle|ana\b|emma|ava\b|karen|moira|tessa|veena|kalpana|priya/i;
const MALE_HINTS =
  /\bmale|david|ravi|mark|prabhat|hemant|guy|ryan|george|daniel|james|william|thomas|rishi|alex\b|fred|brian|andrew|eric|christopher|madhur/i;

export interface SpeakCallbacks {
  /** A sentence starts: its character range within the full text. */
  onSentence?: (start: number, end: number) => void;
  /** A word starts: its character range within the full text. */
  onWord?: (start: number, end: number) => void;
}

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/** Splits text into sentence-sized pieces. Short utterances avoid Chrome's long-speech cut-off. */
export function splitSentences(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  const pattern = /[^.!?…]+[.!?…]*["')\]]*\s*/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    if (!raw.trim()) continue;
    const start = match.index + (raw.length - raw.trimStart().length);
    out.push({ start, end: match.index + raw.trimEnd().length });
  }
  return out.length ? out : [{ start: 0, end: text.length }];
}

class Narrator {
  private token = 0;
  private paused = false;
  private voices: SpeechSynthesisVoice[] = [];
  private failures = 0;
  private lastCancel = 0;
  /** Held so the browser does not garbage-collect an utterance mid-speech. */
  private current: SpeechSynthesisUtterance | null = null;
  /** Dev only: plays faster so a full run-through can be checked quickly. */
  private speed = 1;

  constructor() {
    const s = synth();
    if (!s) return;
    const load = () => {
      this.voices = s.getVoices();
    };
    load();
    s.addEventListener?.('voiceschanged', load);
    if (import.meta.env.DEV) {
      const fast = Number(new URLSearchParams(window.location.search).get('speed'));
      if (fast > 1) this.speed = Math.min(fast, 40);
    }
  }

  /** True when the browser has at least one voice to speak with. */
  get hasVoice(): boolean {
    return this.voices.length > 0 && this.speed === 1;
  }

  /** Playback speed multiplier (1 normally; higher in the dev fast-forward mode). */
  get pace(): number {
    return this.speed;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private pickVoice(profile: VoiceProfile): SpeechSynthesisVoice | null {
    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -1;
    const base = profile.lang.slice(0, 2).toLowerCase();
    for (const voice of this.voices) {
      const lang = voice.lang.replace('_', '-').toLowerCase();
      if (!lang.startsWith(base)) continue;
      let score = lang === profile.lang.toLowerCase() ? 4 : 1;
      const female = FEMALE_HINTS.test(voice.name);
      const male = !female && MALE_HINTS.test(voice.name);
      if ((profile.gender === 'female' && female) || (profile.gender === 'male' && male))
        score += 6;
      else if (female || male) score -= 2;
      if (/natural|online|neural/i.test(voice.name)) score += 2;
      if (score > bestScore) {
        best = voice;
        bestScore = score;
      }
    }
    return best;
  }

  /** Waits `ms`, standing still while paused. Resolves false if cancelled. */
  wait(ms: number): Promise<boolean> {
    const token = this.token;
    let left = ms / this.speed;
    return new Promise((resolve) => {
      let last = performance.now();
      const step = () => {
        if (token !== this.token) return resolve(false);
        const now = performance.now();
        if (!this.paused) left -= now - last;
        last = now;
        if (left <= 0) return resolve(true);
        window.setTimeout(step, Math.min(left, 60));
      };
      step();
    });
  }

  /** Silent stand-in for speech: walks through the words at speaking pace. */
  private async timed(
    text: string,
    offset: number,
    rate: number,
    cb: SpeakCallbacks,
  ): Promise<boolean> {
    const pattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const word = match[0];
      cb.onWord?.(offset + match.index, offset + match.index + word.length);
      const pause = /[.!?]$/.test(word) ? 260 : /[,;:]$/.test(word) ? 140 : 0;
      const ok = await this.wait((230 + word.length * 22 + pause) / rate);
      if (!ok) return false;
    }
    return true;
  }

  private utter(
    text: string,
    offset: number,
    voice: SpeechSynthesisVoice | null,
    profile: VoiceProfile,
    pitch: number,
    rate: number,
    cb: SpeakCallbacks,
  ): Promise<'ok' | 'cancelled' | 'failed'> {
    const s = synth();
    if (!s) return Promise.resolve('failed');
    const token = this.token;
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? profile.lang;
      u.pitch = pitch;
      u.rate = rate;
      u.volume = effectiveVolume();
      let started = false;
      let settled = false;
      let watchdog = 0;
      let ceiling = 0;
      const finish = (result: 'ok' | 'cancelled' | 'failed') => {
        if (settled) return;
        settled = true;
        window.clearTimeout(watchdog);
        window.clearTimeout(ceiling);
        if (this.current === u) this.current = null;
        resolve(token !== this.token ? 'cancelled' : result);
      };
      const arm = () => {
        watchdog = window.setTimeout(() => {
          if (token !== this.token) return finish('cancelled');
          if (started) return;
          if (this.paused) return arm();
          s.cancel();
          finish('failed');
        }, 2500);
      };
      // Some browsers drop `onend` (long utterances, network voices, background tabs). Once speech
      // has started, give up waiting after about twice its expected length so the step moves on.
      const words = text.trim().split(/\s+/).length;
      const ceilingMs = 3000 + (words / (2.5 * Math.max(0.1, rate))) * 1000 * 2;
      const armCeiling = () => {
        ceiling = window.setTimeout(() => {
          if (token !== this.token) return finish('cancelled');
          if (this.paused) return armCeiling();
          finish('ok');
        }, ceilingMs);
      };
      const markStarted = () => {
        if (started) return;
        started = true;
        armCeiling();
      };
      u.onstart = markStarted;
      u.onboundary = (event) => {
        markStarted();
        if (event.name && event.name !== 'word') return;
        const rest = text.slice(event.charIndex);
        const length = event.charLength || (rest.match(/^\S+/)?.[0].length ?? 1);
        cb.onWord?.(offset + event.charIndex, offset + event.charIndex + length);
      };
      u.onend = () => finish('ok');
      u.onerror = (event) =>
        finish(
          event.error === 'interrupted' || event.error === 'canceled' ? 'cancelled' : 'failed',
        );
      this.current = u;
      s.speak(u);
      arm();
    });
  }

  /**
   * Speaks `text` in the avatar's voice. Resolves true when it finished and
   * false when it was cancelled.
   */
  async speak(
    text: string,
    profile: VoiceProfile,
    emotion: Emotion,
    cb: SpeakCallbacks = {},
  ): Promise<boolean> {
    this.cancel();
    const token = this.token;
    const style = EMOTION_VOICE[emotion];
    const pitch = Math.max(0.1, Math.min(2, profile.pitch * style.pitch));
    const rate = Math.max(0.5, Math.min(2, profile.rate * style.rate));

    // Give the browser a moment after a cancel, or it may drop the next utterance.
    const sinceCancel = performance.now() - this.lastCancel;
    if (sinceCancel < 90) await new Promise((r) => window.setTimeout(r, 90 - sinceCancel));
    if (token !== this.token) return false;

    const voice = this.pickVoice(profile);
    for (const { start, end } of splitSentences(text)) {
      if (token !== this.token) return false;
      const sentence = text.slice(start, end);
      cb.onSentence?.(start, end);
      const useSynth = this.hasVoice && this.failures < 2 && synth() !== null;
      if (useSynth) {
        const result = await this.utter(sentence, start, voice, profile, pitch, rate, cb);
        if (result === 'cancelled') return false;
        if (result === 'ok') {
          this.failures = 0;
          continue;
        }
        this.failures += 1;
      }
      if (!(await this.timed(sentence, start, rate, cb))) return false;
    }
    return token === this.token;
  }

  pause(): void {
    this.paused = true;
    synth()?.pause();
  }

  resume(): void {
    this.paused = false;
    synth()?.resume();
  }

  /** Stops whatever is being said. Pending `speak` and `wait` calls resolve false. */
  cancel(): void {
    this.token += 1;
    this.lastCancel = performance.now();
    this.current = null;
    const s = synth();
    if (s) {
      s.cancel();
      if (this.paused) s.resume();
    }
    this.paused = false;
  }
}

export const narrator = new Narrator();

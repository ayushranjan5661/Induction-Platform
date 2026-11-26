/** Animation clips: keyframed or procedural, sampled at a time in milliseconds. */
import type { PartialPose, PoseKey } from '../pose';

export type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back' | 'step';

export function ease(kind: Ease, t: number): number {
  const x = Math.min(1, Math.max(0, t));
  switch (kind) {
    case 'linear':
      return x;
    case 'in':
      return x * x * x;
    case 'out':
      return 1 - (1 - x) ** 3;
    case 'back': {
      // Overshoots a little, then settles: a cartoon "snap" into a pose.
      const c = 1.70158;
      return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
    }
    case 'step':
      return x < 1 ? 0 : 1;
    case 'inOut':
    default:
      return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  }
}

/** Which mixer layer a clip plays on. Higher layers override lower ones for the keys they set. */
export type Layer = 'body' | 'gesture' | 'face';

export interface Clip {
  name: string;
  layer: Layer;
  /** Length in ms. */
  duration: number;
  /** Loops forever; with `loopFrom`, loops only the part after that time (an intro, then a hold). */
  loop: boolean;
  loopFrom?: number;
  /** Higher priority clips cannot be interrupted by lower ones on the same layer until they finish. */
  priority: number;
  /** Crossfade time in ms when this clip starts and ends. */
  fade: number;
  sample: (t: number) => PartialPose;
}

export interface Keyframe {
  /** Time in ms. */
  t: number;
  pose: PartialPose;
  /** Easing used to arrive at this keyframe. */
  ease?: Ease;
}

/**
 * A clip from keyframes. Each key is interpolated between the keyframes that
 * set it, holding its first value before and its last value after.
 */
export function keyframes(
  def: Omit<Clip, 'sample' | 'fade' | 'priority' | 'loop'> & {
    frames: Keyframe[];
    fade?: number;
    priority?: number;
    loop?: boolean;
    /** Procedural extras added on top of the keyframes (shakes, beats). */
    extra?: (t: number, base: PartialPose) => PartialPose;
  },
): Clip {
  const frames = [...def.frames].sort((a, b) => a.t - b.t);
  const tracks = new Map<PoseKey, { t: number; v: number; ease: Ease }[]>();
  for (const frame of frames) {
    for (const [key, value] of Object.entries(frame.pose)) {
      if (value === undefined) continue;
      const list = tracks.get(key as PoseKey) ?? [];
      list.push({ t: frame.t, v: value, ease: frame.ease ?? 'inOut' });
      tracks.set(key as PoseKey, list);
    }
  }
  return {
    name: def.name,
    layer: def.layer,
    duration: def.duration,
    loop: def.loop ?? false,
    loopFrom: def.loopFrom,
    priority: def.priority ?? 1,
    fade: def.fade ?? 250,
    sample: (t: number) => {
      const out: PartialPose = {};
      for (const [key, list] of tracks) {
        const first = list[0]!;
        const last = list[list.length - 1]!;
        if (t <= first.t) out[key] = first.v;
        else if (t >= last.t) out[key] = last.v;
        else {
          let i = 1;
          while (i < list.length && list[i]!.t < t) i += 1;
          const a = list[i - 1]!;
          const b = list[i]!;
          const f = ease(b.ease, (t - a.t) / Math.max(1, b.t - a.t));
          out[key] = a.v + (b.v - a.v) * f;
        }
      }
      if (def.extra) Object.assign(out, def.extra(t, out));
      return out;
    },
  };
}

/** A procedural clip (walk and run cycles, idle sway). */
export function procedural(
  def: Omit<Clip, 'fade' | 'priority'> & { fade?: number; priority?: number },
): Clip {
  return { ...def, fade: def.fade ?? 300, priority: def.priority ?? 1 };
}

/** Local time inside a clip, honouring loops. Returns null once a one-shot clip has ended. */
export function clipTime(clip: Clip, elapsed: number): number | null {
  if (!clip.loop) return elapsed <= clip.duration ? elapsed : null;
  const from = Math.min(clip.loopFrom ?? 0, clip.duration);
  if (elapsed <= from) return elapsed;
  const span = Math.max(1, clip.duration - from);
  return from + ((elapsed - from) % span);
}

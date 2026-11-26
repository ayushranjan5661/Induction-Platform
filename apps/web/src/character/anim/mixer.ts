/**
 * The mixer: plays clips on three layers (body, gesture, face) and blends
 * them into one pose.
 *
 * - Each layer has at most one "current" clip plus clips fading out.
 * - Starting a clip crossfades from whatever the layer showed before.
 * - A clip can only replace a current clip of equal or lower priority, unless
 *   forced; this stops, say, a background talking beat from cutting off a wave.
 * - When a one-shot clip ends it fades out, and the layer falls back to its
 *   default clip (idle on the body layer) or to the layers beneath.
 */
import { REST_POSE, blendInto, type PartialPose, type Pose, type PoseKey } from '../pose';
import { clipTime, type Clip, type Layer } from './clip';

interface Track {
  clip: Clip;
  start: number;
  weight: number;
  /** Set when fading out: the time it began. */
  endedAt: number | null;
  fade: number;
}

export const LAYERS: Layer[] = ['body', 'gesture', 'face'];

export interface PlayOptions {
  /** Overrides the clip's own priority. */
  priority?: number;
  /** Replace the current clip even if it has a higher priority. */
  force?: boolean;
  /** Overall strength of the clip, 0 to 1. */
  weight?: number;
  /** Crossfade time in ms. */
  fade?: number;
}

export class Mixer {
  private tracks: Record<Layer, Track[]> = { body: [], gesture: [], face: [] };
  private priorities = new Map<Track, number>();
  private defaults: Partial<Record<Layer, Clip>> = {};
  private now = 0;

  /** The clip a layer returns to when nothing else plays (for example idle). */
  setDefault(layer: Layer, clip: Clip | undefined): void {
    this.defaults[layer] = clip;
    if (clip && !this.current(layer)) this.play(clip, { force: true, fade: 0 });
  }

  /** The clip currently playing (not fading out) on a layer. */
  current(layer: Layer): Clip | null {
    const live = this.tracks[layer].find((t) => t.endedAt === null);
    return live?.clip ?? null;
  }

  /** Starts a clip. Returns false if a higher-priority clip on its layer is still playing. */
  play(clip: Clip, options: PlayOptions = {}): boolean {
    const list = this.tracks[clip.layer];
    const priority = options.priority ?? clip.priority;
    const live = list.find((t) => t.endedAt === null);
    if (live && !options.force) {
      const livePriority = this.priorities.get(live) ?? live.clip.priority;
      if (livePriority > priority) return false;
    }
    const fade = options.fade ?? clip.fade;
    if (live) {
      live.endedAt = this.now;
      live.fade = fade;
    }
    const track: Track = {
      clip,
      start: this.now,
      weight: options.weight ?? 1,
      endedAt: null,
      fade,
    };
    this.priorities.set(track, priority);
    list.push(track);
    return true;
  }

  /** Fades out the current clip on a layer (the default clip, if any, takes over). */
  stop(layer: Layer, fade?: number): void {
    const live = this.tracks[layer].find((t) => t.endedAt === null);
    if (!live) return;
    if (this.defaults[layer] && live.clip === this.defaults[layer]) return;
    live.endedAt = this.now;
    if (fade !== undefined) live.fade = fade;
    const fallback = this.defaults[layer];
    if (fallback) this.play(fallback, { force: true, fade: fade ?? live.fade });
  }

  /** Advances time and returns the blended pose. */
  update(dt: number): Pose {
    this.now += dt;
    const pose: Pose = { ...REST_POSE };
    for (const layer of LAYERS) {
      const list = this.tracks[layer];
      // Tracks on one layer are averaged by weight, then the layer is blended once over the
      // layers beneath. Lerping track after track would pull a crossfade back towards REST_POSE.
      const sums: PartialPose = {};
      const weights: PartialPose = {};
      for (const track of [...list]) {
        const elapsed = this.now - track.start;
        const t = clipTime(track.clip, elapsed);
        if (t === null && track.endedAt === null) {
          // A one-shot clip just finished: fade it out and fall back.
          track.endedAt = this.now;
          const fallback = this.defaults[layer];
          if (fallback && fallback !== track.clip)
            this.play(fallback, { force: true, fade: track.fade });
        }
        const fadeIn = track.fade > 0 ? Math.min(1, elapsed / track.fade) : 1;
        const fadeOut =
          track.endedAt === null
            ? 1
            : track.fade > 0
              ? Math.max(0, 1 - (this.now - track.endedAt) / track.fade)
              : 0;
        const weight = track.weight * fadeIn * fadeOut;
        if (weight <= 0 && track.endedAt !== null) {
          list.splice(list.indexOf(track), 1);
          this.priorities.delete(track);
          continue;
        }
        // Clips fading out keep showing their last frame.
        const sampleAt = t ?? track.clip.duration;
        if (weight <= 0) continue;
        const sample = track.clip.sample(sampleAt);
        for (const key in sample) {
          const k = key as PoseKey;
          const v = sample[k];
          if (v === undefined) continue;
          sums[k] = (sums[k] ?? 0) + v * weight;
          weights[k] = (weights[k] ?? 0) + weight;
        }
      }
      for (const key in sums) {
        const k = key as PoseKey;
        const total = weights[k] ?? 0;
        if (total > 0) blendInto(pose, { [k]: (sums[k] ?? 0) / total }, Math.min(1, total));
      }
    }
    return pose;
  }
}

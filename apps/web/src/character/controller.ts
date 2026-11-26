/**
 * The character controller: the one object the rest of the app talks to.
 *
 *   character.play('walkIn');           // body: idle, walking, running, jump, sit, stand…
 *   character.play('wave');             // gestures, on top of the body
 *   character.setExpression('happy');
 *   character.lookAt('left');
 *   character.blink();
 *   character.setSpeaking(true);
 *   character.speakWord('hello', 320);  // lip-sync cue for one word
 *   character.stop();
 *
 * It owns the mixer and adds the procedural "life" on top: breathing,
 * blinking, eye movements, lip-sync with jaw, emphasis on stressed words and
 * talking head motion. Face values are smoothed so nothing snaps.
 */
import { BODY_CLIPS, type BodyClipName } from './anim/clips/body';
import { expressionClip, type ExpressionName } from './anim/clips/expressions';
import { GESTURE_CLIPS, type GestureClip, type GestureClipName } from './anim/clips/gestures';
import { Mixer, type PlayOptions } from './anim/mixer';
import type { Layer } from './anim/clip';
import { REST_POSE, type Pose, type PoseKey } from './pose';
import {
  isStressed,
  MOUTH_SHAPES,
  visemeAt,
  visemeTimeline,
  type MouthShape,
  type VisemeKey,
} from './visemes';

export type ClipName = BodyClipName | GestureClipName;
export type LookTarget = 'left' | 'right' | 'up' | 'down' | 'center' | { x: number; y: number };

/** Body clips skipped when the viewer prefers reduced motion. */
const BIG_MOTION = new Set<ClipName>(['walkIn', 'walkOut', 'jump', 'running', 'walking']);

/** How fast each smoothed key follows its target (per second); unlisted keys are not smoothed. */
const SMOOTHING: Partial<Record<PoseKey, number>> = {
  'mouth.open': 28,
  'mouth.wide': 22,
  'mouth.round': 22,
  'mouth.teeth': 30,
  'mouth.tongue': 24,
  'mouth.tuck': 30,
  'mouth.smile': 10,
  jaw: 24,
  'eyeL.open': 40,
  'eyeR.open': 40,
  'gaze.x': 18,
  'gaze.y': 18,
  'browL.y': 12,
  'browR.y': 12,
  'browL.tilt': 12,
  'browR.tilt': 12,
  'head.turn': 6,
  'head.nod': 14,
  'head.tilt': 9,
};

export interface ControllerOptions {
  energy?: number;
  reducedMotion?: boolean;
  /** Random source, replaceable in tests. */
  random?: () => number;
}

interface ActiveWord {
  timeline: VisemeKey[];
  start: number;
  ms: number;
}

export class CharacterController {
  private readonly mixer = new Mixer();
  private readonly random: () => number;
  private time = 0;
  private energy: number;
  private reducedMotion: boolean;
  private expression: ExpressionName = 'normal';
  private expressionOverride: { name: ExpressionName; until: number } | null = null;
  private speaking = false;
  private word: ActiveWord | null = null;
  private emphasisUntil = 0;
  private look: { x: number; y: number; until: number } | null = null;
  private glance = { x: 0, y: 0, next: 400 };
  private blinkAt: number[] = [];
  private nextBlink = 1500;
  private smoothed: Pose = { ...REST_POSE };
  private last: Pose = { ...REST_POSE };

  constructor(options: ControllerOptions = {}) {
    this.energy = options.energy ?? 1;
    this.reducedMotion = options.reducedMotion ?? false;
    this.random = options.random ?? Math.random;
    this.mixer.setDefault('body', BODY_CLIPS.idle);
    this.mixer.setDefault('face', expressionClip('normal'));
  }

  configure(options: { energy?: number; reducedMotion?: boolean }): void {
    if (options.energy !== undefined) this.energy = options.energy;
    if (options.reducedMotion !== undefined) this.reducedMotion = options.reducedMotion;
  }

  /** The clip playing on a layer, or null. */
  playing(layer: Layer): string | null {
    return this.mixer.current(layer)?.name ?? null;
  }

  /** Plays a body or gesture clip. Returns false if a more important clip is playing. */
  play(name: ClipName, options: PlayOptions = {}): boolean {
    if (this.reducedMotion && BIG_MOTION.has(name)) return false;
    const clip =
      (BODY_CLIPS as Record<string, (typeof BODY_CLIPS)[BodyClipName]>)[name] ??
      (GESTURE_CLIPS as Record<string, GestureClip>)[name];
    if (!clip) return false;
    const started = this.mixer.play(clip, options);
    const wanted = (clip as GestureClip).expression;
    if (started && wanted) {
      this.expressionOverride = { name: wanted, until: this.time + clip.duration };
      const face = expressionClip(wanted);
      if (this.mixer.current('face') !== face) this.mixer.play(face, { force: true });
    }
    return started;
  }

  /** Stops gestures (default), the body action (back to idle), or both. */
  stop(layer: 'gesture' | 'body' | 'all' = 'gesture'): void {
    if (layer === 'gesture' || layer === 'all') this.mixer.stop('gesture');
    if (layer === 'body' || layer === 'all') this.mixer.stop('body');
  }

  setExpression(name: ExpressionName, fade?: number): void {
    if (name === this.expression && !this.expressionOverride) return;
    this.expression = name;
    if (!this.expressionOverride) this.mixer.play(expressionClip(name), { force: true, fade });
  }

  /** Turns the eyes (and a little of the head) toward a direction, for `holdMs` or until changed. */
  lookAt(target: LookTarget, holdMs = 2500): void {
    const map = {
      left: [-1, 0],
      right: [1, 0],
      up: [0, -1],
      down: [0, 1],
      center: [0, 0],
    } as const;
    const [x, y] = typeof target === 'string' ? map[target] : [target.x, target.y];
    this.look = target === 'center' ? null : { x, y, until: this.time + holdMs };
  }

  blink(times = 1): void {
    for (let i = 0; i < times; i += 1) this.blinkAt.push(this.time + i * 260);
  }

  setSpeaking(speaking: boolean): void {
    if (speaking === this.speaking) return;
    this.speaking = speaking;
    if (speaking) {
      if (!this.mixer.current('gesture')) this.mixer.play(GESTURE_CLIPS.talkBeat, { weight: 0.85 });
    } else {
      this.word = null;
      if (this.mixer.current('gesture')?.name === 'talkBeat') this.mixer.stop('gesture', 600);
    }
  }

  /** Lip-sync: the word now being spoken and roughly how long it lasts. */
  speakWord(text: string, ms: number): void {
    this.word = { timeline: visemeTimeline(text), start: this.time, ms };
    if (isStressed(text)) this.emphasisUntil = this.time + 340;
  }

  /** Advances the animation by `dt` ms and returns the pose to draw. */
  update(dt: number): Pose {
    // Capped both ways: hidden tabs give huge steps, and the first rAF stamp can precede `last`.
    const step = Math.max(0, Math.min(dt, 64));
    this.time += step;
    const t = this.time;
    const calm = this.reducedMotion;

    if (this.expressionOverride && t >= this.expressionOverride.until) {
      this.expressionOverride = null;
      const face = expressionClip(this.expression);
      // Re-playing the face already shown would crossfade it into itself and flicker.
      if (this.mixer.current('face') !== face) this.mixer.play(face, { force: true });
    }
    if (this.speaking && !this.mixer.current('gesture'))
      this.mixer.play(GESTURE_CLIPS.talkBeat, { weight: 0.85 });

    const pose = this.mixer.update(step);
    const sway = calm ? 0 : this.energy;

    // Breathing.
    pose.breath = calm ? 0 : Math.sin((t / 4200) * Math.PI * 2);

    // Talking: head bob and emphasis on stressed words.
    if (this.speaking) pose['head.nod'] += Math.sin(t / 155) * 1.1 * sway;
    if (t < this.emphasisUntil) {
      pose['browL.y'] -= 4;
      pose['browR.y'] -= 4;
      pose['head.nod'] += 2.5 * Math.max(0.4, sway);
      pose['eyeL.open'] += 0.06;
      pose['eyeR.open'] += 0.06;
    }

    // Eyes: a held look, or small darting glances.
    if (this.look && t > this.look.until) this.look = null;
    if (t > this.glance.next) {
      const range = this.speaking ? 0.2 : 0.5;
      const centre = this.speaking && this.random() < 0.55;
      this.glance.x = centre ? 0 : (this.random() * 2 - 1) * range;
      this.glance.y = centre ? 0 : (this.random() * 2 - 1) * range * 0.5;
      this.glance.next = t + 700 + this.random() * (this.speaking ? 1600 : 2600);
    }
    if (this.look) {
      pose['gaze.x'] = this.look.x;
      pose['gaze.y'] = this.look.y;
      pose['head.turn'] += this.look.x * 0.3;
      pose['head.tilt'] += this.look.y * -2;
    } else if (!calm) {
      pose['gaze.x'] = Math.max(-1, Math.min(1, pose['gaze.x'] + this.glance.x));
      pose['gaze.y'] = Math.max(-1, Math.min(1, pose['gaze.y'] + this.glance.y));
    }

    // Blinking: automatic, plus requested blinks.
    if (t > this.nextBlink) {
      this.blinkAt.push(t);
      if (this.random() < 0.15) this.blinkAt.push(t + 260);
      this.nextBlink = t + 2200 + this.random() * 3600;
    }
    this.blinkAt = this.blinkAt.filter((at) => t - at < 200);
    const closing = this.blinkAt.some((at) => t >= at && t - at < 130);
    if (closing) {
      pose['eyeL.open'] = 0;
      pose['eyeR.open'] = 0;
    }

    // Lip-sync: the current word's mouth shapes; a talking rhythm if the voice gives no word timing.
    if (this.speaking) {
      let shape: MouthShape;
      const w = this.word;
      if (w && t - w.start < w.ms + 1200) {
        shape = MOUTH_SHAPES[visemeAt(w.timeline, (t - w.start) / w.ms)];
      } else {
        const syllable = Math.abs(Math.sin((t / 1000) * Math.PI * 5.2));
        const variety = 0.55 + 0.45 * Math.abs(Math.sin((t / 1000) * 2.3 + 1));
        shape = {
          open: 0.14 + 0.62 * syllable * variety,
          wide: Math.sin(t / 320),
          round: 0,
          teeth: 0.5,
          tongue: 0.2,
          tuck: 0,
        };
      }
      pose['mouth.open'] = shape.open;
      pose['mouth.wide'] = shape.wide;
      pose['mouth.round'] = shape.round;
      pose['mouth.teeth'] = shape.teeth;
      pose['mouth.tongue'] = shape.tongue;
      pose['mouth.tuck'] = shape.tuck;
      pose.jaw = shape.open * 0.85;
      pose['mouth.smile'] *= 1 - shape.round * 0.7;
    }

    // Smooth the face so expressions, glances and visemes blend instead of snapping.
    const k = (speed: number) => 1 - Math.exp((-step / 1000) * speed);
    for (const key of Object.keys(pose) as PoseKey[]) {
      const speed = SMOOTHING[key];
      this.smoothed[key] = speed
        ? this.smoothed[key] + (pose[key] - this.smoothed[key]) * k(speed)
        : pose[key];
    }
    // Blinks must be crisp, so the lids close fast but open smoothly.
    if (closing) {
      this.smoothed['eyeL.open'] = Math.min(this.smoothed['eyeL.open'], 0.15);
      this.smoothed['eyeR.open'] = Math.min(this.smoothed['eyeR.open'], 0.15);
    }
    this.last = { ...this.smoothed };
    return this.last;
  }

  /** The most recent pose. */
  get pose(): Pose {
    return this.last;
  }
}

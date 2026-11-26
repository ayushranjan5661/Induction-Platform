/**
 * Gesture-layer clips: what the arms, hands and head do on top of the body
 * (so a presenter can wave while sitting or walking). Each covers every
 * gesture name stored in scripts, plus extra ones the player uses.
 */
import type { Gesture } from '@induction/shared';
import { arm, both, hand, reach } from '../../pose';
import { keyframes, procedural, type Clip } from '../clip';
import type { ExpressionName } from './expressions';

/** A gesture clip can ask for a facial expression while it plays (a laugh needs a laughing face). */
export type GestureClip = Clip & { expression?: ExpressionName };

const g = (
  def: Parameters<typeof keyframes>[0] & { expression?: ExpressionName },
): GestureClip => ({
  ...keyframes({ priority: 2, fade: 280, ...def }),
  expression: def.expression,
});

const TAU = Math.PI * 2;

export const wave = g({
  name: 'wave',
  layer: 'gesture',
  duration: 2300,
  frames: [
    { t: 0, pose: { ...arm('R', 8, 10) } },
    {
      t: 320,
      pose: {
        ...arm('R', 78, 82, { wrist: -8, shrug: 4 }),
        ...hand('R', 'wave'),
        lean: 3,
        'head.tilt': 5,
      },
      ease: 'back',
    },
    { t: 1900, pose: { ...arm('R', 78, 82, { wrist: -8, shrug: 4 }), lean: 3, 'head.tilt': 5 } },
    {
      t: 2300,
      pose: {
        ...arm('R', 8, 10, { wrist: 0, shrug: 0 }),
        lean: 0,
        'head.tilt': 0,
        ...hand('R', 'relaxed'),
      },
    },
  ],
  extra: (t) =>
    t > 320 && t < 1900
      ? {
          'armR.e': 82 + Math.sin(((t - 320) / 380) * Math.PI) * 15,
          'armR.wrist': -8 + Math.sin(((t - 320) / 380) * Math.PI) * 7,
        }
      : {},
});

export const greet = g({
  name: 'greet',
  layer: 'gesture',
  duration: 2300,
  frames: [
    { t: 0, pose: both((s) => arm(s, 8, 10)) },
    {
      t: 380,
      pose: {
        ...both((s) => ({ ...arm(s, 46, 22, { shrug: 4 }), ...hand(s, 'open') })),
        'head.nod': 6,
      },
      ease: 'back',
    },
    { t: 700, pose: { 'head.nod': 0 } },
    { t: 1800, pose: both((s) => arm(s, 42, 20, { shrug: 3 })) },
    { t: 2300, pose: both((s) => ({ ...arm(s, 8, 10, { shrug: 0 }), ...hand(s, 'relaxed') })) },
  ],
});

export const openArms: GestureClip = { ...greet, name: 'openArms' };

export const nod = g({
  name: 'nod',
  layer: 'gesture',
  duration: 1400,
  frames: [
    { t: 0, pose: { 'head.nod': 0 } },
    { t: 250, pose: { 'head.nod': 8 } },
    { t: 520, pose: { 'head.nod': 0 } },
    { t: 790, pose: { 'head.nod': 8 } },
    { t: 1100, pose: { 'head.nod': 0 } },
  ],
});

/** Palm-up "here is the point" beats with the forearm toward the viewer. */
export const explain = g({
  name: 'explain',
  layer: 'gesture',
  duration: 2800,
  frames: [
    { t: 0, pose: both((s) => arm(s, 8, 10)) },
    {
      t: 400,
      pose: {
        ...arm('R', 24, 62, { u: 0.75 }),
        ...hand('R', 'presenting'),
        ...arm('L', 16, 34, { u: 0.9 }),
        ...hand('L', 'presenting'),
        lean: 1.5,
      },
      ease: 'back',
    },
    { t: 2350, pose: { ...arm('R', 24, 62, { u: 0.75 }), ...arm('L', 16, 34, { u: 0.9 }) } },
    {
      t: 2800,
      pose: { ...both((s) => ({ ...arm(s, 8, 10, { u: 1 }), ...hand(s, 'relaxed') })), lean: 0 },
    },
  ],
  extra: (t) =>
    t > 400 && t < 2350
      ? {
          'armR.e': 62 + Math.sin(((t - 400) / 900) * TAU) * 4,
          'armL.e': 34 + Math.sin(((t - 400) / 900) * TAU + 1.4) * 3,
          'head.nod': Math.max(0, Math.sin(((t - 400) / 900) * TAU)) * 2,
        }
      : {},
});

export const showFront = g({
  name: 'showFront',
  layer: 'gesture',
  duration: 2400,
  frames: [
    { t: 0, pose: both((s) => arm(s, 8, 10)) },
    {
      t: 380,
      pose: {
        ...both((s) => ({ ...arm(s, 20, 100, { u: 0.85 }), ...hand(s, 'presenting') })),
        lean: 2,
      },
      ease: 'back',
    },
    { t: 1100, pose: both((s) => arm(s, 26, 92, { u: 0.85 })) },
    { t: 1800, pose: both((s) => arm(s, 20, 100, { u: 0.85 })) },
    {
      t: 2400,
      pose: { ...both((s) => ({ ...arm(s, 8, 10, { u: 1 }), ...hand(s, 'relaxed') })), lean: 0 },
    },
  ],
});

function point(side: 'L' | 'R'): GestureClip {
  const sign = side === 'R' ? 1 : -1;
  return g({
    name: side === 'R' ? 'pointRight' : 'pointLeft',
    layer: 'gesture',
    duration: 2200,
    frames: [
      { t: 0, pose: { ...arm(side, 8, 10) } },
      {
        t: 330,
        pose: {
          ...arm(side, 84, 4, { shrug: 3 }),
          ...hand(side, 'point'),
          lean: sign * 5,
          'head.turn': sign * 0.3,
          'gaze.x': sign * 0.85,
        },
        ease: 'back',
      },
      { t: 700, pose: { ...arm(side, 88, 6, { shrug: 3 }) } },
      { t: 1050, pose: { ...arm(side, 84, 4, { shrug: 3 }) } },
      { t: 1750, pose: { lean: sign * 5, 'head.turn': sign * 0.3, 'gaze.x': sign * 0.85 } },
      {
        t: 2200,
        pose: {
          ...arm(side, 8, 10, { shrug: 0 }),
          ...hand(side, 'relaxed'),
          lean: 0,
          'head.turn': 0,
          'gaze.x': 0,
        },
      },
    ],
  });
}
export const pointRight = point('R');
export const pointLeft = point('L');

export const think = g({
  name: 'think',
  layer: 'gesture',
  duration: 2800,
  frames: [
    { t: 0, pose: { 'armR.ik': 0, 'armL.ik': 0 } },
    {
      t: 450,
      pose: {
        ...reach('R', 8, -150, 1),
        ...hand('R', 'fist'),
        ...reach('L', 22, -88, 1),
        ...hand('L', 'relaxed'),
        'head.tilt': 7,
        'gaze.x': 0.55,
        'gaze.y': -0.8,
        lean: -2.5,
      },
      ease: 'out',
    },
    { t: 1500, pose: { 'head.tilt': 9, 'head.nod': 2 } },
    {
      t: 2300,
      pose: { 'head.tilt': 6, 'head.nod': 0, ...reach('R', 8, -150, 1), ...reach('L', 22, -88, 1) },
    },
    {
      t: 2800,
      pose: {
        'armR.ik': 0,
        'armL.ik': 0,
        ...hand('R', 'relaxed'),
        'head.tilt': 0,
        'gaze.x': 0,
        'gaze.y': 0,
        lean: 0,
      },
    },
  ],
});

export const handOnHeart = g({
  name: 'handOnHeart',
  layer: 'gesture',
  duration: 2500,
  frames: [
    { t: 0, pose: { 'armR.ik': 0 } },
    {
      t: 420,
      pose: {
        ...reach('R', 18, -112, 1),
        ...hand('R', 'open'),
        'handR.spread': 0.1,
        'head.nod': 4,
        'head.tilt': -3,
        lean: -2,
      },
      ease: 'out',
    },
    { t: 900, pose: { 'head.nod': 0 } },
    { t: 2000, pose: { ...reach('R', 18, -112, 1), lean: -2, 'head.tilt': -3 } },
    { t: 2500, pose: { 'armR.ik': 0, ...hand('R', 'relaxed'), lean: 0, 'head.tilt': 0 } },
  ],
});

/** Hands on hips, head tilted, slow nods: attentive while the learner answers. */
export const listen: GestureClip = {
  ...procedural({
    name: 'listen',
    layer: 'gesture',
    duration: 4200,
    loop: true,
    loopFrom: 600,
    priority: 1,
    fade: 450,
    sample: (t) => {
      const settle = Math.min(1, t / 600);
      const a = (t / 4200) * TAU;
      return {
        ...reach('L', -52, -42, 1, settle),
        ...reach('R', 52, -42, 1, settle),
        ...hand('L', 'fist'),
        ...hand('R', 'fist'),
        'head.tilt': 5 * settle + Math.sin(a) * 1.5,
        'head.nod': Math.max(0, Math.sin(a * 2)) * 3,
        lean: -1.5 * settle,
      };
    },
  }),
};

export const laugh: GestureClip = {
  ...keyframes({
    name: 'laugh',
    layer: 'gesture',
    duration: 2000,
    priority: 2,
    fade: 250,
    frames: [
      { t: 0, pose: { 'armR.ik': 0 } },
      {
        t: 300,
        pose: {
          ...reach('R', 10, -58, 1),
          ...hand('R', 'open'),
          'handR.spread': 0.2,
          ...arm('L', 26, 40),
          ...hand('L', 'relaxed'),
          'head.tilt': -4,
          'head.nod': -6,
          lean: -3,
        },
        ease: 'out',
      },
      { t: 1600, pose: { ...reach('R', 10, -58, 1), 'head.nod': -4, lean: -2 } },
      {
        t: 2000,
        pose: {
          'armR.ik': 0,
          ...arm('L', 8, 10),
          ...hand('R', 'relaxed'),
          'head.nod': 0,
          'head.tilt': 0,
          lean: 0,
        },
      },
    ],
    extra: (t) => {
      if (t < 300 || t > 1600) return {};
      const shake = Math.sin(((t - 300) / 115) * Math.PI);
      return {
        'armL.shrug': 3 + shake * 3,
        'armR.shrug': 3 + shake * 3,
        'root.y': Math.abs(shake) * 2,
      };
    },
  }),
  expression: 'laughing',
};

export const cheer = g({
  name: 'cheer',
  layer: 'gesture',
  duration: 1600,
  expression: 'excited',
  frames: [
    { t: 0, pose: both((s) => arm(s, 8, 10)) },
    {
      t: 260,
      pose: both((s) => ({ ...arm(s, 145, 18, { shrug: 6 }), ...hand(s, 'fist') })),
      ease: 'back',
    },
    { t: 1200, pose: both((s) => arm(s, 150, 10, { shrug: 6 })) },
    { t: 1600, pose: both((s) => ({ ...arm(s, 8, 10, { shrug: 0 }), ...hand(s, 'relaxed') })) },
  ],
});

export const scratchHead = g({
  name: 'scratchHead',
  layer: 'gesture',
  duration: 2300,
  expression: 'confused',
  frames: [
    { t: 0, pose: { 'armR.ik': 0 } },
    {
      t: 420,
      pose: { ...reach('R', 100, -296, 1), ...hand('R', 'relaxed'), 'head.tilt': -6 },
      ease: 'out',
    },
    { t: 1850, pose: { ...reach('R', 100, -296, 1), 'head.tilt': -6 } },
    { t: 2300, pose: { 'armR.ik': 0, 'head.tilt': 0 } },
  ],
  extra: (t) => (t > 420 && t < 1850 ? { 'armR.tx': 100 + Math.sin(t / 90) * 3 } : {}),
});

export const thumbsUp = g({
  name: 'thumbsUp',
  layer: 'gesture',
  duration: 2100,
  frames: [
    { t: 0, pose: arm('R', 8, 10) },
    {
      t: 360,
      pose: { ...arm('R', 26, 118, { shrug: 2 }), ...hand('R', 'thumb'), 'head.nod': 4, lean: 2 },
      ease: 'back',
    },
    { t: 700, pose: { ...arm('R', 30, 124), 'head.nod': 0 } },
    { t: 1650, pose: { ...arm('R', 26, 118, { shrug: 2 }), lean: 2 } },
    { t: 2100, pose: { ...arm('R', 8, 10, { shrug: 0 }), ...hand('R', 'relaxed'), lean: 0 } },
  ],
});

export const applaud = g({
  name: 'applaud',
  layer: 'gesture',
  duration: 2300,
  frames: [
    { t: 0, pose: both((s) => arm(s, 8, 10)) },
    {
      t: 300,
      pose: both((s) => ({
        ...arm(s, 18, -112, { u: 0.85, shrug: 2 }),
        ...hand(s, 'open'),
        [`hand${s}.spread`]: 0.1,
      })),
    },
    { t: 1900, pose: both((s) => arm(s, 18, -112, { u: 0.85, shrug: 2 })) },
    {
      t: 2300,
      pose: both((s) => ({ ...arm(s, 8, 10, { u: 1, shrug: 0 }), ...hand(s, 'relaxed') })),
    },
  ],
  extra: (t) => {
    if (t < 300 || t > 1900) return {};
    const clap = Math.abs(Math.sin(((t - 300) / 210) * Math.PI));
    return { 'armL.e': -100 - clap * 26, 'armR.e': -100 - clap * 26 };
  },
});

function count(name: string, shape: 'one' | 'two' | 'three'): GestureClip {
  return g({
    name,
    layer: 'gesture',
    duration: 2100,
    frames: [
      { t: 0, pose: arm('R', 8, 10) },
      {
        t: 340,
        pose: { ...arm('R', 22, 136, { shrug: 2 }), ...hand('R', shape), lean: 1.5 },
        ease: 'back',
      },
      { t: 700, pose: arm('R', 26, 140) },
      { t: 1650, pose: { ...arm('R', 22, 136, { shrug: 2 }), lean: 1.5 } },
      { t: 2100, pose: { ...arm('R', 8, 10, { shrug: 0 }), ...hand('R', 'relaxed'), lean: 0 } },
    ],
  });
}
export const countOne = count('countOne', 'one');
export const countTwo = count('countTwo', 'two');
export const countThree = count('countThree', 'three');

export const caution = g({
  name: 'caution',
  layer: 'gesture',
  duration: 2300,
  frames: [
    { t: 0, pose: arm('R', 8, 10) },
    { t: 320, pose: { ...arm('R', 24, 136), ...hand('R', 'point'), lean: 2.5 }, ease: 'back' },
    { t: 1850, pose: { ...arm('R', 24, 136), lean: 2.5 } },
    { t: 2300, pose: { ...arm('R', 8, 10), ...hand('R', 'relaxed'), lean: 0 } },
  ],
  extra: (t) =>
    t > 320 && t < 1850 ? { 'armR.e': 136 + Math.sin(((t - 320) / 400) * Math.PI) * 6 } : {},
});

/** Small hand beats while talking with no scripted gesture. Lowest priority: any gesture replaces it. */
export const talkBeat: GestureClip = procedural({
  name: 'talkBeat',
  layer: 'gesture',
  duration: 8000,
  loop: true,
  priority: 0,
  fade: 700,
  // While talking the hands stay low and relaxed, with only a small, slow drift.
  sample: (t) => {
    const a = (t / 8000) * TAU;
    return {
      ...arm('R', 11 + Math.sin(a) * 1.5, 20 + Math.sin(a * 2) * 4),
      ...arm('L', 10 + Math.sin(a + 2) * 1, 15 + Math.sin(a * 2 + 2) * 3),
      ...hand('R', 'relaxed'),
      ...hand('L', 'relaxed'),
    };
  },
});

export const GESTURE_CLIPS = {
  wave,
  greet,
  openArms,
  nod,
  explain,
  showFront,
  pointRight,
  pointLeft,
  think,
  handOnHeart,
  listen,
  laugh,
  cheer,
  scratchHead,
  thumbsUp,
  applaud,
  countOne,
  countTwo,
  countThree,
  caution,
  talkBeat,
};
export type GestureClipName = keyof typeof GESTURE_CLIPS;

/** Which clip plays each gesture stored in scripts. */
export const GESTURE_TO_CLIP: Record<Exclude<Gesture, 'NONE'>, GestureClipName> = {
  WAVE: 'wave',
  NOD: 'nod',
  THUMBS_UP: 'thumbsUp',
  APPLAUD: 'applaud',
  OPEN_ARMS: 'greet',
  POINT_RIGHT: 'pointRight',
  POINT_LEFT: 'pointLeft',
  SHOW_FRONT: 'showFront',
  COUNT_ONE: 'countOne',
  COUNT_TWO: 'countTwo',
  COUNT_THREE: 'countThree',
  THINK: 'think',
  HAND_ON_HEART: 'handOnHeart',
  CAUTION: 'caution',
};

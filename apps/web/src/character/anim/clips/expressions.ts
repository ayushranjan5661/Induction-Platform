/**
 * Facial expressions: held poses on the face layer. Changing expression
 * crossfades between them. Lip-sync and blinking are layered on top by the
 * controller.
 */
import type { Emotion } from '@induction/shared';
import type { PartialPose } from '../../pose';
import { procedural, type Clip } from '../clip';

const brows = (y: number, tilt: number, y2 = y, tilt2 = tilt): PartialPose => ({
  'browL.y': y,
  'browL.tilt': tilt,
  'browR.y': y2,
  'browR.tilt': tilt2,
});
const eyes = (open: number): PartialPose => ({ 'eyeL.open': open, 'eyeR.open': open });

/** Every face key an expression controls, so switching expression resets the others. */
const NEUTRAL_FACE: PartialPose = {
  ...brows(0, 0),
  ...eyes(1),
  'eye.squint': 0,
  'eye.happy': 0,
  'eye.pupil': 1,
  'mouth.smile': 0.2,
  'mouth.open': 0,
  'mouth.wide': 0,
  'mouth.round': 0,
  'mouth.teeth': 0,
  'mouth.tongue': 0,
  jaw: 0,
  blush: 0,
  tears: 0,
  sweat: 0,
};

export const EXPRESSIONS = {
  normal: {},
  talking: { ...brows(-1.5, 1), 'mouth.smile': 0.35 },
  friendly: { ...brows(-2, 1.5), 'mouth.smile': 0.55, 'eye.squint': 0.1, blush: 0.15 },
  happy: { ...brows(-3, 2), 'eye.squint': 0.25, 'mouth.smile': 0.8, blush: 0.3 },
  cheerful: {
    ...brows(-4, 1),
    'eye.squint': 0.35,
    'mouth.smile': 0.95,
    'mouth.open': 0.14,
    'mouth.teeth': 0.6,
    blush: 0.45,
  },
  excited: {
    ...brows(-8, 0),
    ...eyes(1.15),
    'mouth.smile': 1,
    'mouth.open': 0.4,
    'mouth.teeth': 0.6,
    'mouth.tongue': 0.5,
    blush: 0.55,
  },
  laughing: {
    ...brows(-6, 3),
    'eye.happy': 1,
    'mouth.smile': 1,
    'mouth.open': 0.8,
    'mouth.teeth': 0.7,
    'mouth.tongue': 0.85,
    jaw: 0.6,
    blush: 0.7,
  },
  proud: { ...brows(-2, -3), ...eyes(0.85), 'mouth.smile': 0.62, blush: 0.2 },
  hopeful: { ...brows(-5, 8), ...eyes(1.08), 'mouth.smile': 0.45, blush: 0.15 },
  encouraging: { ...brows(-4, 4), 'mouth.smile': 0.72, 'mouth.open': 0.05, blush: 0.25 },
  empathetic: { ...brows(-2, 12), ...eyes(0.9), 'mouth.smile': 0.1, blush: 0.1 },
  sad: {
    ...brows(-2, 15),
    ...eyes(0.8),
    'mouth.smile': -0.65,
    'gaze.y': 0.35,
  },
  crying: {
    ...brows(-3, 17),
    ...eyes(0.75),
    'mouth.smile': -0.7,
    'mouth.open': 0.35,
    'mouth.wide': 0.3,
    tears: 1,
  },
  serious: { ...brows(3, -9), ...eyes(0.92), 'mouth.smile': -0.1 },
  angry: {
    ...brows(6, -16),
    ...eyes(0.85),
    'eye.squint': 0.3,
    'mouth.smile': -0.55,
    'mouth.wide': 0.35,
    'mouth.open': 0.12,
    'mouth.teeth': 0.9,
  },
  surprised: {
    ...brows(-10, 2),
    ...eyes(1.25),
    'eye.pupil': 0.6,
    'mouth.smile': 0,
    'mouth.open': 0.6,
    'mouth.round': 0.75,
    jaw: 0.4,
  },
  confused: {
    ...brows(-8, 5, 3, -8),
    'mouth.smile': -0.15,
    'mouth.wide': -0.35,
    sweat: 1,
  },
} satisfies Record<string, PartialPose>;

export type ExpressionName = keyof typeof EXPRESSIONS;

/** The expression shown for each script emotion. */
export const EMOTION_TO_EXPRESSION: Record<Emotion, ExpressionName> = {
  NEUTRAL: 'normal',
  FRIENDLY: 'friendly',
  CHEERFUL: 'cheerful',
  EXCITED: 'excited',
  PROUD: 'proud',
  HOPEFUL: 'hopeful',
  EMPATHETIC: 'empathetic',
  SERIOUS: 'serious',
  ENCOURAGING: 'encouraging',
};

const cache = new Map<ExpressionName, Clip>();

/** The face-layer clip that holds an expression. */
export function expressionClip(name: ExpressionName): Clip {
  let clip = cache.get(name);
  if (!clip) {
    const pose: PartialPose = { ...NEUTRAL_FACE, ...EXPRESSIONS[name] };
    clip = procedural({
      name: `expression:${name}`,
      layer: 'face',
      duration: 1000,
      loop: true,
      fade: 260,
      priority: 1,
      sample: () => pose,
    });
    cache.set(name, clip);
  }
  return clip;
}

/**
 * What each emotion and gesture looks like on the built-in avatar.
 *
 * Arm angles are in degrees: `s` is the shoulder (0 = hanging straight down,
 * positive = raised outward), `e` is the elbow bend added on top of that
 * (positive = keeps going outward/up, negative = folds across the body), and
 * `u` shortens the upper arm to suggest it pointing toward the viewer.
 */
import type { Emotion, Gesture } from '@induction/shared';

export type HandShape = 'relaxed' | 'open' | 'fist' | 'thumb' | 'point' | 'one' | 'two' | 'three';

export interface ArmPose {
  s: number;
  e: number;
  u: number;
  hand: HandShape;
}

export interface FacePose {
  /** Eyebrow height in px; negative is raised. */
  browY: number;
  /** Positive lifts the inner ends (soft, concerned); negative lowers them (stern). */
  browTilt: number;
  /** 1 = normal, >1 wide, <1 narrowed. */
  eyeOpen: number;
  /** -1 frown to 1 big smile. */
  smile: number;
  /** Resting mouth opening, 0 to 1. */
  mouthOpen: number;
  /** Head tilt in degrees. */
  tilt: number;
  /** Cheek colour, 0 to 1. */
  blush: number;
}

export const REST_ARM: ArmPose = { s: 7, e: 9, u: 1, hand: 'relaxed' };

export const EMOTION_FACES: Record<Emotion, FacePose> = {
  NEUTRAL: { browY: 0, browTilt: 0, eyeOpen: 1, smile: 0.15, mouthOpen: 0, tilt: 0, blush: 0 },
  FRIENDLY: {
    browY: -1.5,
    browTilt: 1,
    eyeOpen: 1,
    smile: 0.55,
    mouthOpen: 0,
    tilt: 2,
    blush: 0.15,
  },
  CHEERFUL: {
    browY: -3.5,
    browTilt: 1,
    eyeOpen: 0.88,
    smile: 0.9,
    mouthOpen: 0.12,
    tilt: 3.5,
    blush: 0.45,
  },
  EXCITED: {
    browY: -7,
    browTilt: 0,
    eyeOpen: 1.18,
    smile: 1,
    mouthOpen: 0.3,
    tilt: -1,
    blush: 0.5,
  },
  PROUD: {
    browY: -2,
    browTilt: -2,
    eyeOpen: 0.84,
    smile: 0.62,
    mouthOpen: 0,
    tilt: -3.5,
    blush: 0.2,
  },
  HOPEFUL: {
    browY: -4.5,
    browTilt: 7,
    eyeOpen: 1.08,
    smile: 0.45,
    mouthOpen: 0,
    tilt: 4.5,
    blush: 0.15,
  },
  EMPATHETIC: {
    browY: -1.5,
    browTilt: 12,
    eyeOpen: 0.9,
    smile: 0.12,
    mouthOpen: 0,
    tilt: 6.5,
    blush: 0.1,
  },
  SERIOUS: { browY: 3, browTilt: -9, eyeOpen: 0.9, smile: -0.12, mouthOpen: 0, tilt: 0, blush: 0 },
  ENCOURAGING: {
    browY: -3.5,
    browTilt: 4,
    eyeOpen: 1.02,
    smile: 0.7,
    mouthOpen: 0.05,
    tilt: 4,
    blush: 0.25,
  },
};

/** A moment in a gesture. Anything left out stays as it was in the frame before. */
export interface GestureFrame {
  /** Milliseconds from the start of the gesture. */
  at: number;
  r?: Partial<ArmPose>;
  l?: Partial<ArmPose>;
  /** Extra head nod (px down) and tilt (degrees) on top of the emotion. */
  nod?: number;
  tilt?: number;
}

export interface GestureDef {
  /** When the avatar returns to rest. */
  duration: number;
  frames: GestureFrame[];
}

const raisedHand = { s: 20, e: 140, u: 1 };

export const GESTURES: Record<Gesture, GestureDef> = {
  NONE: { duration: 0, frames: [] },

  WAVE: {
    duration: 2000,
    frames: [
      { at: 0, r: { s: 55, e: 92, hand: 'open' }, tilt: 3 },
      { at: 380, r: { e: 68 } },
      { at: 660, r: { e: 112 } },
      { at: 940, r: { e: 68 } },
      { at: 1220, r: { e: 112 } },
      { at: 1500, r: { e: 84 } },
    ],
  },

  NOD: {
    duration: 1500,
    frames: [
      { at: 0, nod: 7 },
      { at: 280, nod: 0 },
      { at: 560, nod: 7 },
      { at: 840, nod: 0 },
      { at: 1120, nod: 4 },
    ],
  },

  THUMBS_UP: {
    duration: 2100,
    frames: [
      { at: 0, r: { ...raisedHand, hand: 'thumb' }, nod: 3 },
      { at: 420, r: { s: 26, e: 146 }, nod: 0 },
      { at: 760, r: { s: 20, e: 140 } },
    ],
  },

  APPLAUD: {
    duration: 2200,
    frames: [
      {
        at: 0,
        r: { s: 14, e: -118, u: 0.9, hand: 'open' },
        l: { s: 14, e: -118, u: 0.9, hand: 'open' },
      },
      { at: 260, r: { e: -132 }, l: { e: -132 } },
      { at: 460, r: { e: -116 }, l: { e: -116 } },
      { at: 660, r: { e: -132 }, l: { e: -132 } },
      { at: 860, r: { e: -116 }, l: { e: -116 } },
      { at: 1060, r: { e: -132 }, l: { e: -132 } },
      { at: 1260, r: { e: -116 }, l: { e: -116 } },
      { at: 1460, r: { e: -132 }, l: { e: -132 } },
      { at: 1700, r: { e: -120 }, l: { e: -120 } },
    ],
  },

  OPEN_ARMS: {
    duration: 2300,
    frames: [
      { at: 0, r: { s: 42, e: 46, hand: 'open' }, l: { s: 42, e: 46, hand: 'open' } },
      { at: 900, r: { s: 38, e: 40 }, l: { s: 38, e: 40 } },
    ],
  },

  POINT_RIGHT: {
    duration: 2100,
    frames: [
      { at: 0, r: { s: 50, e: 40, hand: 'point' }, tilt: 3 },
      { at: 520, r: { s: 54, e: 44 } },
      { at: 900, r: { s: 50, e: 40 } },
    ],
  },

  POINT_LEFT: {
    duration: 2100,
    frames: [
      { at: 0, l: { s: 50, e: 40, hand: 'point' }, tilt: -3 },
      { at: 520, l: { s: 54, e: 44 } },
      { at: 900, l: { s: 50, e: 40 } },
    ],
  },

  SHOW_FRONT: {
    duration: 2300,
    frames: [
      { at: 0, r: { s: 16, e: 108, hand: 'open' }, l: { s: 16, e: 108, hand: 'open' } },
      { at: 700, r: { s: 22, e: 100 }, l: { s: 22, e: 100 } },
      { at: 1400, r: { s: 16, e: 108 }, l: { s: 16, e: 108 } },
    ],
  },

  COUNT_ONE: {
    duration: 2100,
    frames: [
      { at: 0, r: { ...raisedHand, hand: 'one' } },
      { at: 500, r: { s: 24, e: 144 } },
      { at: 900, r: { s: 20, e: 140 } },
    ],
  },

  COUNT_TWO: {
    duration: 2100,
    frames: [
      { at: 0, r: { ...raisedHand, hand: 'two' } },
      { at: 500, r: { s: 24, e: 144 } },
      { at: 900, r: { s: 20, e: 140 } },
    ],
  },

  COUNT_THREE: {
    duration: 2100,
    frames: [
      { at: 0, r: { ...raisedHand, hand: 'three' } },
      { at: 500, r: { s: 24, e: 144 } },
      { at: 900, r: { s: 20, e: 140 } },
    ],
  },

  THINK: {
    duration: 2500,
    frames: [
      { at: 0, r: { s: 18, e: -158, u: 0.45, hand: 'fist' }, tilt: 6 },
      { at: 900, tilt: 8, nod: 2 },
      { at: 1700, tilt: 5, nod: 0 },
    ],
  },

  HAND_ON_HEART: {
    duration: 2400,
    frames: [
      { at: 0, r: { s: 30, e: -140, u: 0.8, hand: 'open' }, nod: 3 },
      { at: 700, nod: 0 },
    ],
  },

  CAUTION: {
    duration: 2200,
    frames: [
      { at: 0, r: { s: 24, e: 138, hand: 'point' } },
      { at: 380, r: { e: 128 } },
      { at: 640, r: { e: 148 } },
      { at: 900, r: { e: 128 } },
      { at: 1160, r: { e: 148 } },
      { at: 1420, r: { e: 138 } },
    ],
  },
};

export interface GestureTarget {
  r: ArmPose;
  l: ArmPose;
  nod: number;
  tilt: number;
}

/** The pose a gesture asks for `elapsed` ms after it began (rest once it is over). */
export function gestureTargetAt(gesture: Gesture, elapsed: number): GestureTarget {
  const target: GestureTarget = { r: { ...REST_ARM }, l: { ...REST_ARM }, nod: 0, tilt: 0 };
  const def = GESTURES[gesture];
  if (elapsed < 0 || elapsed >= def.duration) return target;
  for (const frame of def.frames) {
    if (frame.at > elapsed) break;
    Object.assign(target.r, frame.r);
    Object.assign(target.l, frame.l);
    if (frame.nod !== undefined) target.nod = frame.nod;
    if (frame.tilt !== undefined) target.tilt = frame.tilt;
  }
  return target;
}

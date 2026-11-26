/**
 * The pose: every number that animation controls, in one flat record.
 *
 * Animation (clips, mixer, controller) only ever produces a `Pose`; drawing
 * only ever reads one. Keeping it flat makes blending and crossfading a
 * simple per-key interpolation.
 *
 * Conventions
 * - Sides: `R` is the viewer's right (+x), `L` the viewer's left (-x).
 * - Arm angles (degrees): `s` raises the upper arm outward from hanging
 *   straight down (90 = horizontal, 180 = straight up; negative crosses the
 *   body). `e` bends the forearm further outward (negative folds inward).
 *   `u` (0 to 1) shortens the upper arm when it points at the viewer.
 * - Feet: `x` is the foot's offset from its standing spot, `lift` raises it
 *   off the floor. Knees are solved by inverse kinematics from the hips to
 *   the feet; `bend` picks the side the knee points to (-1 or 1, 0 = outward).
 * - Fingers: curl 0 = straight, 1 = folded into the palm.
 */

const SIDES = ['L', 'R'] as const;
export type Side = (typeof SIDES)[number];

const FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'] as const;
export type Finger = (typeof FINGERS)[number];

const BODY_KEYS = [
  'root.x', // whole body sideways (walk in / out)
  'root.y', // whole body up (negative) or down
  'root.sy', // squash (<1) and stretch (>1) from the feet
  'hip', // pelvis shifted sideways over planted feet (weight shift)
  'lean', // upper body rotation around the pelvis, degrees
  'turn', // body facing: -1 three-quarter left, 0 front, 1 three-quarter right
  'breath', // -1 to 1
  'seat', // a stool appears for sitting, 0 to 1
  'neck', // neck rotation, degrees
  'head.tilt',
  'head.nod', // px, positive = down
  'head.turn', // -1 to 1
] as const;

const ARM_KEYS = SIDES.flatMap((s) =>
  (
    [
      's',
      'e',
      'u',
      'wrist',
      'shrug',
      'ik', // 0 to 1: blend from the angles above to reaching for (tx, ty)
      'tx', // reach target in upper-body space
      'ty',
      'bend', // elbow side for reaching: 1 = outward, -1 = inward
    ] as const
  ).map((k) => `arm${s}.${k}` as const),
);

const HAND_KEYS = SIDES.flatMap((s) =>
  ([...FINGERS, 'spread', 'thumbOut', 'palm'] as const).map((k) => `hand${s}.${k}` as const),
);

const LEG_KEYS = SIDES.flatMap((s) =>
  (['x', 'lift', 'bend', 'fore', 'toe'] as const).map((k) => `leg${s}.${k}` as const),
);

const FACE_KEYS = [
  'browL.y',
  'browL.tilt',
  'browR.y',
  'browR.tilt',
  'eyeL.open',
  'eyeR.open',
  'eye.squint', // lower lids rise
  'eye.happy', // eyes become closed upward arcs (laughing)
  'eye.pupil', // pupil size, 1 = normal
  'gaze.x', // -1 to 1
  'gaze.y',
  'mouth.smile', // -1 frown to 1 big smile
  'mouth.open',
  'mouth.wide',
  'mouth.round',
  'mouth.teeth',
  'mouth.tongue',
  'mouth.tuck',
  'jaw', // 0 to 1
  'blush',
  'tears',
  'sweat',
] as const;

export const POSE_KEYS = [...BODY_KEYS, ...ARM_KEYS, ...HAND_KEYS, ...LEG_KEYS, ...FACE_KEYS];
export type PoseKey = (typeof POSE_KEYS)[number];
export type Pose = Record<PoseKey, number>;
export type PartialPose = Partial<Pose>;

/** Relaxed standing pose. */
export const REST_POSE: Pose = (() => {
  const pose = Object.fromEntries(POSE_KEYS.map((k) => [k, 0])) as Pose;
  const set = (values: PartialPose) => Object.assign(pose, values);
  set({ 'root.sy': 1 });
  for (const s of SIDES) {
    set({
      [`arm${s}.s`]: 8,
      [`arm${s}.e`]: 10,
      [`arm${s}.u`]: 1,
      [`arm${s}.bend`]: 1,
      [`hand${s}.thumb`]: 0.3,
      [`hand${s}.index`]: 0.25,
      [`hand${s}.middle`]: 0.3,
      [`hand${s}.ring`]: 0.35,
      [`hand${s}.little`]: 0.4,
      [`hand${s}.spread`]: 0.15,
      [`hand${s}.thumbOut`]: 0.2,
      [`leg${s}.fore`]: 1,
      [`eye${s}.open`]: 1,
    } as PartialPose);
  }
  set({ 'eye.pupil': 1, 'mouth.smile': 0.2 });
  return pose;
})();

export const sideSign = (side: Side): 1 | -1 => (side === 'R' ? 1 : -1);

/** Writes `pose` with `over` blended in at `weight` (0 to 1). Keys `over` lacks are left alone. */
export function blendInto(pose: Pose, over: PartialPose, weight: number): void {
  if (weight <= 0) return;
  const w = Math.min(1, weight);
  for (const key in over) {
    const k = key as PoseKey;
    const v = over[k];
    if (v === undefined) continue;
    pose[k] = w >= 1 ? v : pose[k] + (v - pose[k]) * w;
  }
}

/** Hand shapes as finger values, for clips and for the legacy gesture names. */
export type HandShape =
  'relaxed' | 'open' | 'wave' | 'fist' | 'point' | 'thumb' | 'one' | 'two' | 'three' | 'presenting';

const HAND_SHAPES: Record<HandShape, Record<Finger | 'spread' | 'thumbOut' | 'palm', number>> = {
  relaxed: {
    thumb: 0.3,
    index: 0.25,
    middle: 0.3,
    ring: 0.35,
    little: 0.4,
    spread: 0.15,
    thumbOut: 0.2,
    palm: 0,
  },
  open: {
    thumb: 0,
    index: 0,
    middle: 0,
    ring: 0,
    little: 0,
    spread: 0.55,
    thumbOut: 0.75,
    palm: 1,
  },
  wave: {
    thumb: 0,
    index: 0,
    middle: 0,
    ring: 0,
    little: 0.05,
    spread: 0.8,
    thumbOut: 0.9,
    palm: 1,
  },
  presenting: {
    thumb: 0.1,
    index: 0.1,
    middle: 0.12,
    ring: 0.18,
    little: 0.22,
    spread: 0.35,
    thumbOut: 0.7,
    palm: 1,
  },
  fist: { thumb: 0.85, index: 1, middle: 1, ring: 1, little: 1, spread: 0, thumbOut: 0, palm: 0 },
  point: { thumb: 0.85, index: 0, middle: 1, ring: 1, little: 1, spread: 0, thumbOut: 0, palm: 0 },
  one: { thumb: 0.85, index: 0, middle: 1, ring: 1, little: 1, spread: 0, thumbOut: 0, palm: 1 },
  two: { thumb: 0.85, index: 0, middle: 0, ring: 1, little: 1, spread: 0.45, thumbOut: 0, palm: 1 },
  three: {
    thumb: 0.85,
    index: 0,
    middle: 0,
    ring: 0,
    little: 1,
    spread: 0.4,
    thumbOut: 0,
    palm: 1,
  },
  thumb: { thumb: 0, index: 1, middle: 1, ring: 1, little: 1, spread: 0, thumbOut: 0.05, palm: 0 },
};

/** The pose keys for one hand in a given shape. */
export function hand(side: Side, shape: HandShape): PartialPose {
  const out: PartialPose = {};
  for (const [k, v] of Object.entries(HAND_SHAPES[shape])) out[`hand${side}.${k}` as PoseKey] = v;
  return out;
}

/** Arm angles for one side. */
export function arm(
  side: Side,
  s: number,
  e: number,
  extra: { u?: number; wrist?: number; shrug?: number } = {},
): PartialPose {
  const out: PartialPose = { [`arm${side}.s`]: s, [`arm${side}.e`]: e } as PartialPose;
  if (extra.u !== undefined) out[`arm${side}.u`] = extra.u;
  if (extra.wrist !== undefined) out[`arm${side}.wrist`] = extra.wrist;
  if (extra.shrug !== undefined) out[`arm${side}.shrug`] = extra.shrug;
  return out;
}

/** Reach a hand toward a point in upper-body space (pelvis at 0, 0; up is negative). */
export function reach(side: Side, tx: number, ty: number, bend = 1, weight = 1): PartialPose {
  return {
    [`arm${side}.ik`]: weight,
    [`arm${side}.tx`]: tx,
    [`arm${side}.ty`]: ty,
    [`arm${side}.bend`]: bend,
  } as PartialPose;
}

/** Same pose for both sides, mirrored where it matters (x targets). */
export function both(make: (side: Side, sign: 1 | -1) => PartialPose): PartialPose {
  return { ...make('L', -1), ...make('R', 1) };
}

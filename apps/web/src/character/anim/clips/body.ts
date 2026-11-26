/** Body-layer clips: standing, idle, walking, running, jumping, sitting. */
import { REST_POSE, both, hand, reach, type PartialPose, type Pose } from '../../pose';
import { ease, keyframes, procedural, type Clip } from '../clip';

const TAU = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);

/** Blends a partial pose toward the rest pose by `k` (1 = fully `pose`, 0 = rest). */
function fadeToRest(pose: PartialPose, k: number): PartialPose {
  const out: PartialPose = {};
  for (const [key, value] of Object.entries(pose)) {
    const rest = REST_POSE[key as keyof Pose];
    out[key as keyof Pose] = rest + ((value as number) - rest) * k;
  }
  return out;
}

interface GaitOptions {
  /** -1 walks toward the viewer's left, 1 toward the right. */
  dir: 1 | -1;
  /** One full stride cycle (two steps), ms. */
  period: number;
  /** Foot travel per step, px. */
  stride: number;
  lift: number;
  lean: number;
  /** Arm swing, degrees. */
  swing: number;
  /** Forearm bend, degrees (running pumps with bent arms). */
  elbow: number;
  bob: number;
  fists?: boolean;
}

/**
 * A walk or run cycle seen three-quarter: the body turns toward the direction
 * of travel, each foot plants and slides back (stance) then lifts and swings
 * forward, knees point forward, and the arms swing against the legs.
 */
function gait(o: GaitOptions, t: number): PartialPose {
  const phase = t / o.period;
  const pose: PartialPose = {
    turn: o.dir * 0.7,
    'head.turn': o.dir * 0.5,
    lean: o.dir * o.lean,
    'root.y': o.bob * 0.6 + o.bob * Math.cos(phase * TAU * 2),
  };
  for (const [side, offset] of [
    ['R', 0],
    ['L', 0.5],
  ] as const) {
    const sign = side === 'R' ? 1 : -1;
    const u = frac(phase + offset);
    let x: number;
    let lift = 0;
    if (u < 0.5) {
      x = o.stride * (0.5 - u * 2 * 1); // planted, sliding back under the body
    } else {
      const a = (u - 0.5) * 2;
      x = o.stride * (-0.5 + ease('inOut', a));
      lift = Math.sin(Math.PI * a) * o.lift;
    }
    // Feet come in toward the centre line when seen from the side.
    pose[`leg${side}.x`] = o.dir * x - sign * 12;
    pose[`leg${side}.lift`] = lift;
    pose[`leg${side}.bend`] = o.dir;
    pose[`leg${side}.toe`] = u >= 0.5 ? -o.dir * 12 * Math.sin(Math.PI * (u - 0.5) * 2) : 0;
  }
  // Arms swing opposite the legs: the right arm goes back as the right foot steps forward.
  const swing = Math.cos(phase * TAU);
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    const toward = side === 'R' ? -swing : swing; // +1 = arm swings in the direction of travel
    pose[`arm${side}.s`] = 10 + o.dir * sign * toward * o.swing;
    pose[`arm${side}.e`] = 10 + o.dir * sign * o.elbow * (0.6 + 0.4 * Math.max(0, toward));
    pose[`arm${side}.shrug`] = o.fists ? 3 : 0;
    Object.assign(pose, hand(side, o.fists ? 'fist' : 'relaxed'));
  }
  pose['head.nod'] = Math.cos(phase * TAU * 2) * 1.5;
  return pose;
}

const WALK: Omit<GaitOptions, 'dir'> = {
  period: 1000,
  stride: 74,
  lift: 26,
  lean: 3,
  swing: 24,
  elbow: 16,
  bob: 4,
};
const RUN: Omit<GaitOptions, 'dir'> = {
  period: 520,
  stride: 116,
  lift: 58,
  lean: 10,
  swing: 42,
  elbow: 85,
  bob: 9,
  fists: true,
};

export const idle: Clip = procedural({
  name: 'idle',
  layer: 'body',
  duration: 6000,
  loop: true,
  fade: 450,
  priority: 0,
  sample: (t) => {
    const a = (t / 6000) * TAU;
    return {
      hip: Math.sin(a) * 3.5,
      lean: Math.sin(a + 1) * 1.2,
      'root.y': 2,
      'legL.x': -3,
      'legR.x': 2,
      'armL.s': 8 + Math.sin(a + 2) * 1.5,
      'armR.s': 8 + Math.sin(a) * 1.5,
      'armL.e': 10 + Math.sin(a * 2) * 2,
      'armR.e': 10 + Math.sin(a * 2 + 1) * 2,
      'head.tilt': Math.sin(a + 0.5) * 1.6,
      ...hand('L', 'relaxed'),
      ...hand('R', 'relaxed'),
    };
  },
});

export const stand: Clip = keyframes({
  name: 'stand',
  layer: 'body',
  duration: 800,
  priority: 2,
  frames: [
    { t: 0, pose: sittingPose() },
    { t: 350, pose: { 'root.y': 60, lean: 8, 'legL.fore': 0.75, 'legR.fore': 0.75 }, ease: 'in' },
    {
      t: 800,
      pose: {
        'root.y': 0,
        lean: 0,
        seat: 0,
        'legL.fore': 1,
        'legR.fore': 1,
        'legL.x': 0,
        'legR.x': 0,
        'armL.ik': 0,
        'armR.ik': 0,
      },
      ease: 'out',
    },
  ],
});

function sittingPose(): PartialPose {
  return {
    seat: 1,
    'root.y': 108,
    'legL.fore': 0.3,
    'legR.fore': 0.3,
    'legL.x': -10,
    'legR.x': 10,
    ...reach('L', -50, 34, 1),
    ...reach('R', 50, 34, 1),
    ...hand('L', 'relaxed'),
    ...hand('R', 'relaxed'),
  };
}

export const sit: Clip = keyframes({
  name: 'sit',
  layer: 'body',
  duration: 4800,
  loop: true,
  loopFrom: 800,
  priority: 2,
  frames: [
    { t: 0, pose: { seat: 0, 'root.y': 0, lean: 0, 'legL.fore': 1, 'legR.fore': 1 } },
    { t: 250, pose: { seat: 1 } },
    { t: 450, pose: { 'root.y': 70, lean: 7, 'legL.fore': 0.6, 'legR.fore': 0.6 }, ease: 'in' },
    { t: 800, pose: { ...sittingPose(), lean: 0 }, ease: 'back' },
  ],
  extra: (t) => (t > 800 ? { lean: Math.sin((t - 800) / 640) * 0.8 } : {}),
});

export const walking: Clip = procedural({
  name: 'walking',
  layer: 'body',
  duration: WALK.period,
  loop: true,
  sample: (t) => gait({ ...WALK, dir: 1 }, t),
});

export const running: Clip = procedural({
  name: 'running',
  layer: 'body',
  duration: RUN.period,
  loop: true,
  sample: (t) => gait({ ...RUN, dir: 1 }, t),
});

/** Walks in from off-stage (`from` = -1: from the viewer's left) and stops facing front. */
function walkAcross(name: string, direction: 'in' | 'out', from: 1 | -1): Clip {
  const travel = 2400;
  const settle = 500;
  const distance = 560;
  const dir = (direction === 'in' ? -from : from) as 1 | -1;
  // Stride matched to travel speed so planted feet do not slide.
  const period = 900;
  const stride = (distance / travel) * (period / 2);
  return procedural({
    name,
    layer: 'body',
    duration: travel + settle,
    // Walking out holds off-stage (a loop of its last instant) until another body clip starts.
    loop: direction === 'out',
    loopFrom: travel + settle,
    priority: 3,
    fade: 200,
    sample: (t) => {
      const moving = Math.min(1, t / travel);
      const x = direction === 'in' ? from * distance * (1 - moving) : from * distance * moving;
      // In: the cycle winds down over the settle time. Out: it winds up at the start.
      const k =
        direction === 'in'
          ? Math.min(1, Math.max(0, (travel + settle - t) / settle))
          : Math.min(1, t / 250);
      const cycle = fadeToRest(
        gait({ ...WALK, dir, period, stride }, t),
        direction === 'in' && t > travel ? k * 0.6 : k,
      );
      return { ...cycle, 'root.x': x };
    },
  });
}

export const walkIn = walkAcross('walkIn', 'in', -1);
export const walkOut = walkAcross('walkOut', 'out', 1);

export const jump: Clip = keyframes({
  name: 'jump',
  layer: 'body',
  duration: 1050,
  priority: 3,
  fade: 120,
  frames: [
    { t: 0, pose: { 'root.y': 0, 'root.sy': 1 } },
    {
      t: 230,
      pose: {
        'root.y': 38,
        'root.sy': 0.9,
        'head.nod': 5,
        ...both((s) => ({ [`arm${s}.s`]: 28, [`arm${s}.e`]: 22 })),
        ...hand('L', 'fist'),
        ...hand('R', 'fist'),
      },
      ease: 'out',
    },
    {
      t: 330,
      pose: {
        'root.y': -50,
        'root.sy': 1.1,
        'legL.lift': 34,
        'legR.lift': 34,
        'head.nod': -3,
        ...both((s) => ({ [`arm${s}.s`]: 150, [`arm${s}.e`]: 12 })),
      },
      ease: 'in',
    },
    {
      t: 540,
      pose: { 'root.y': -92, 'root.sy': 1, 'legL.lift': 84, 'legR.lift': 78 },
      ease: 'out',
    },
    {
      t: 740,
      pose: { 'root.y': -35, 'legL.lift': 30, 'legR.lift': 30, 'root.sy': 1.05 },
      ease: 'in',
    },
    {
      t: 830,
      pose: {
        'root.y': 32,
        'root.sy': 0.9,
        'legL.lift': 0,
        'legR.lift': 0,
        'head.nod': 4,
        ...both((s) => ({ [`arm${s}.s`]: 40, [`arm${s}.e`]: 20 })),
      },
      ease: 'out',
    },
    {
      t: 1050,
      pose: {
        'root.y': 0,
        'root.sy': 1,
        'head.nod': 0,
        ...both((s) => ({ [`arm${s}.s`]: 8, [`arm${s}.e`]: 10 })),
        ...hand('L', 'relaxed'),
        ...hand('R', 'relaxed'),
      },
      ease: 'back',
    },
  ],
});

export const BODY_CLIPS = { idle, stand, sit, walking, running, walkIn, walkOut, jump };
export type BodyClipName = keyof typeof BODY_CLIPS;

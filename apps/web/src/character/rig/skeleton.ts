/**
 * The skeleton: proportions for each body type, and the solver that turns a
 * pose into world positions for every joint.
 *
 * Hierarchy (each joint pivots on its parent):
 *
 *   root (pelvis)
 *   ├── spine ─ neck ─ head ─ jaw
 *   │   ├── shoulder L ─ elbow L ─ wrist L ─ hand L (5 fingers)
 *   │   └── shoulder R ─ elbow R ─ wrist R ─ hand R (5 fingers)
 *   ├── hip L ─ knee L ─ ankle L ─ foot L
 *   └── hip R ─ knee R ─ ankle R ─ foot R
 *
 * World space: the floor is y = 0, up is negative y, the character stands at
 * x = 0. Legs are solved from the hips to the feet with inverse kinematics so
 * feet stay planted while the body moves; arms use forward kinematics, or
 * inverse kinematics when a clip asks a hand to reach a point.
 */
import type { Pose, Side } from '../pose';
import {
  add,
  deg,
  len,
  lerpVec,
  limbAngle,
  limbDir,
  rotate,
  scale,
  solveTwoBone,
  sub,
  vec,
  type Vec,
} from './ik';

export type Build = 'slim' | 'regular' | 'broad';
export type Figure = 'masculine' | 'feminine';

export interface Proportions {
  pelvisY: number;
  spine: number;
  neck: number;
  shoulderX: number;
  shoulderDrop: number;
  waistX: number;
  hipX: number;
  legX: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  shin: number;
  ankleY: number;
  /** Limb thickness (radius) at each joint. */
  r: {
    shoulder: number;
    elbow: number;
    wrist: number;
    hip: number;
    knee: number;
    ankle: number;
    neck: number;
  };
  handScale: number;
}

export function proportions(figure: Figure, build: Build): Proportions {
  const wide = build === 'slim' ? 0.9 : build === 'broad' ? 1.12 : 1;
  const thick = build === 'slim' ? 0.88 : build === 'broad' ? 1.14 : 1;
  const fem = figure === 'feminine';
  return {
    // Longer legs and arms than a chibi figure: closer to real proportions.
    pelvisY: -272,
    spine: 160,
    neck: 30,
    shoulderX: (fem ? 54 : 63) * wide,
    shoulderDrop: 12,
    waistX: (fem ? 37 : 45) * wide,
    hipX: (fem ? 50 : 47) * wide,
    legX: (fem ? 24 : 25) * wide,
    upperArm: 100,
    forearm: 90,
    thigh: 128,
    shin: 126,
    ankleY: -16,
    r: {
      shoulder: (fem ? 14.5 : 17) * thick,
      elbow: (fem ? 11.5 : 13.5) * thick,
      wrist: (fem ? 9 : 10.5) * thick,
      hip: (fem ? 23 : 22) * thick,
      knee: (fem ? 15 : 16) * thick,
      ankle: (fem ? 10 : 11) * thick,
      neck: (fem ? 12 : 15) * thick,
    },
    handScale: (fem ? 1.22 : 1.36) * (build === 'broad' ? 1.05 : 1),
  };
}

export interface ArmJoints {
  shoulder: Vec;
  elbow: Vec;
  wrist: Vec;
  /** World direction angles of the bones, in SVG degrees (0 = pointing down). */
  upperAngle: number;
  foreAngle: number;
  handAngle: number;
  /** How sharply the elbow bends, 0 (straight) to 1. */
  bend: number;
}

export interface LegJoints {
  hip: Vec;
  knee: Vec;
  ankle: Vec;
  /** Thigh seen end-on (sitting toward the viewer), 0 to 1. */
  fore: number;
  bend: number;
}

export interface Skeleton {
  p: Proportions;
  pelvis: Vec;
  /** Upper-body rotation around the pelvis, degrees. */
  lean: number;
  neckBase: Vec;
  neckTop: Vec;
  /** Head rotation, degrees, around `neckTop`. */
  headAngle: number;
  arms: Record<Side, ArmJoints>;
  legs: Record<Side, LegJoints>;
  /** Maps a point from upper-body space (pelvis at 0, 0) to world space. */
  toWorld: (p: Vec) => Vec;
}

/** SVG rotation angle of a world direction, where 0 means pointing straight down. */
const downAngle = (d: Vec): number => deg(Math.atan2(-d.x, d.y));

export function solveSkeleton(pose: Pose, p: Proportions): Skeleton {
  const pelvis = vec(pose['root.x'] + pose.hip, p.pelvisY + pose['root.y']);
  const lean = pose.lean;
  const toWorld = (q: Vec): Vec => add(pelvis, rotate(q, lean));

  const neckBase = toWorld(vec(0, -p.spine));
  const neckAngle = lean + pose.neck;
  const neckTop = add(neckBase, rotate(vec(0, -p.neck), neckAngle));
  const headAngle = neckAngle + pose['head.tilt'];

  const arms = {} as Record<Side, ArmJoints>;
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    const k = (name: string) => pose[`arm${side}.${name}` as keyof Pose];
    // Shoulders sit narrower on the far side when the body turns three-quarter.
    const turnSquash = 1 - 0.28 * Math.max(0, sign * pose.turn);
    const turnShift = pose.turn * 10;
    const shoulderLocal = vec(
      sign * p.shoulderX * turnSquash + turnShift,
      -p.spine + p.shoulderDrop - k('shrug'),
    );
    const shoulder = toWorld(shoulderLocal);
    const u = Math.max(0.2, k('u'));
    const l1 = p.upperArm * u;
    const l2 = p.forearm;

    // Forward kinematics in upper-body space, then rotated by the lean.
    let elbowLocal = add(shoulderLocal, scale(limbDir(k('s'), sign), l1));
    let wristLocal = add(elbowLocal, scale(limbDir(k('s') + k('e'), sign), l2));

    const ik = Math.min(1, Math.max(0, k('ik')));
    if (ik > 0) {
      const target = vec(k('tx'), k('ty'));
      // Elbow points outward (and a little down) by default, or inward.
      const bendTo = k('bend') >= 0 ? vec(sign, 0.35) : vec(-sign, 0.6);
      const solved = solveTwoBone(shoulderLocal, target, l1, l2, bendTo);
      elbowLocal = lerpVec(elbowLocal, solved.mid, ik);
      // Keep bone lengths exact after blending.
      elbowLocal = add(
        shoulderLocal,
        scale(
          sub(elbowLocal, shoulderLocal),
          l1 / Math.max(1e-6, len(sub(elbowLocal, shoulderLocal))),
        ),
      );
      const wantWrist = lerpVec(wristLocal, solved.end, ik);
      const fore = sub(wantWrist, elbowLocal);
      wristLocal = add(elbowLocal, scale(fore, l2 / Math.max(1e-6, len(fore))));
    }

    const elbow = toWorld(elbowLocal);
    const wrist = toWorld(wristLocal);
    const upperDir = sub(elbow, shoulder);
    const foreDir = sub(wrist, elbow);
    const upperAngle = downAngle(upperDir);
    const foreAngle = downAngle(foreDir);
    const between = Math.abs(
      limbAngle(rotate(foreDir, -lean), sign) - limbAngle(rotate(upperDir, -lean), sign),
    );
    arms[side] = {
      shoulder,
      elbow,
      wrist,
      upperAngle,
      foreAngle,
      handAngle: foreAngle + k('wrist') * sign,
      bend: Math.min(1, (between > 180 ? 360 - between : between) / 150),
    };
  }

  const legs = {} as Record<Side, LegJoints>;
  for (const side of ['L', 'R'] as const) {
    const sign = side === 'R' ? 1 : -1;
    const k = (name: string) => pose[`leg${side}.${name}` as keyof Pose];
    const hip = add(pelvis, vec(sign * p.legX + pose.turn * 6, 4));
    // Feet are planted relative to the root, not the swaying pelvis.
    const ankle = vec(pose['root.x'] + sign * p.legX * 1.3 + k('x'), p.ankleY - k('lift'));
    const fore = Math.min(1, Math.max(0.15, k('fore')));
    const l1 = p.thigh * fore;
    const bendSign = k('bend');
    // Knees point outward by default; a walking or running clip turns them forward.
    const bendTo = bendSign === 0 ? vec(sign, -0.2) : vec(Math.sign(bendSign), -0.15);
    const solved = solveTwoBone(hip, ankle, l1, p.shin, bendTo);
    {
      // Seen from the front, a slight bend points the knee at the viewer, so it
      // should not splay sideways; only a deep crouch pushes the knees out.
      // The squash fades out as `bend` grows, so blending into a walk doesn't snap the knee.
      const amount = Math.min(1, Math.abs(bendSign));
      const onLine = lerpVec(hip, solved.end, l1 / (l1 + p.shin));
      const off = sub(solved.mid, onLine);
      const squash = Math.min(1, len(off) / 45) ** 1.6;
      const k = squash + (1 - squash) * amount;
      solved.mid = add(onLine, scale(off, k));
    }
    const straight = Math.abs(
      deg(Math.atan2(solved.mid.y - hip.y, solved.mid.x - hip.x)) -
        deg(Math.atan2(solved.end.y - solved.mid.y, solved.end.x - solved.mid.x)),
    );
    legs[side] = {
      hip,
      knee: solved.mid,
      ankle: solved.end,
      fore,
      bend: Math.min(1, (straight > 180 ? 360 - straight : straight) / 120),
    };
  }

  return { p, pelvis, lean, neckBase, neckTop, headAngle, arms, legs, toWorld };
}

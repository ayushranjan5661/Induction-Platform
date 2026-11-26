import { describe, expect, it } from 'vitest';
import { REST_POSE, reach, type Pose } from '../pose';
import { len, limbAngle, limbDir, rotate, solveTwoBone, sub, vec } from './ik';
import { proportions, solveSkeleton } from './skeleton';

const close = (a: number, b: number, eps = 0.01) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('ik helpers', () => {
  it('rotates clockwise on screen', () => {
    const r = rotate(vec(1, 0), 90);
    close(r.x, 0);
    close(r.y, 1);
  });

  it('limbAngle inverts limbDir on both sides', () => {
    for (const sign of [1, -1]) {
      for (const angle of [-30, 0, 45, 90, 170])
        close(limbAngle(limbDir(angle, sign), sign), angle);
    }
  });
});

describe('solveTwoBone', () => {
  it('reaches a target within range and keeps bone lengths', () => {
    const root = vec(0, 0);
    const target = vec(60, 80);
    const { mid, end, clamped } = solveTwoBone(root, target, 70, 60, vec(1, 0));
    expect(clamped).toBe(false);
    close(end.x, 60);
    close(end.y, 80);
    close(len(sub(mid, root)), 70);
    close(len(sub(end, mid)), 60);
  });

  it('bends toward the requested side', () => {
    const right = solveTwoBone(vec(0, 0), vec(0, 100), 70, 60, vec(1, 0));
    const left = solveTwoBone(vec(0, 0), vec(0, 100), 70, 60, vec(-1, 0));
    expect(right.mid.x).toBeGreaterThan(0);
    expect(left.mid.x).toBeLessThan(0);
  });

  it('clamps an unreachable target onto the reach limit', () => {
    const { end, clamped } = solveTwoBone(vec(0, 0), vec(0, 500), 70, 60, vec(1, 0));
    expect(clamped).toBe(true);
    expect(end.y).toBeLessThan(130);
    expect(end.y).toBeGreaterThan(129);
  });
});

describe('solveSkeleton', () => {
  const p = proportions('masculine', 'regular');

  it('stands with the feet on the floor and the head above the hips', () => {
    const s = solveSkeleton(REST_POSE, p);
    for (const side of ['L', 'R'] as const) close(s.legs[side].ankle.y, p.ankleY);
    expect(s.neckTop.y).toBeLessThan(s.pelvis.y);
    expect(s.arms.R.shoulder.x).toBeGreaterThan(0);
    expect(s.arms.L.shoulder.x).toBeLessThan(0);
  });

  it('keeps limb lengths whatever the pose', () => {
    const pose: Pose = { ...REST_POSE, 'root.y': 60, lean: 12, 'armR.s': 140, 'armR.e': 70 };
    const s = solveSkeleton(pose, p);
    close(len(sub(s.arms.R.elbow, s.arms.R.shoulder)), p.upperArm);
    close(len(sub(s.arms.R.wrist, s.arms.R.elbow)), p.forearm);
    close(len(sub(s.legs.L.knee, s.legs.L.hip)), p.thigh, 0.5);
    close(len(sub(s.legs.L.ankle, s.legs.L.knee)), p.shin, 0.5);
    // Crouching bends the knees, which point outward by default.
    expect(s.legs.R.knee.x).toBeGreaterThan(s.legs.R.hip.x);
    expect(s.legs.L.knee.x).toBeLessThan(s.legs.L.hip.x);
  });

  it('puts the hand on an IK target in upper-body space', () => {
    const pose: Pose = { ...REST_POSE, ...reach('R', 20, -120) } as Pose;
    const s = solveSkeleton(pose, p);
    const wrist = s.toWorld(vec(20, -120));
    close(s.arms.R.wrist.x, wrist.x, 0.5);
    close(s.arms.R.wrist.y, wrist.y, 0.5);
  });

  it('keeps planted feet still when the hips sway', () => {
    const a = solveSkeleton(REST_POSE, p);
    const b = solveSkeleton({ ...REST_POSE, hip: 10 }, p);
    close(a.legs.R.ankle.x, b.legs.R.ankle.x);
    expect(b.pelvis.x).toBeGreaterThan(a.pelvis.x);
  });
});

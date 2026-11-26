/** Two-bone inverse kinematics (shoulder-elbow-wrist, hip-knee-ankle) and small vector helpers. */

export interface Vec {
  x: number;
  y: number;
}

export const vec = (x: number, y: number): Vec => ({ x, y });
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const len = (a: Vec): number => Math.hypot(a.x, a.y);
export const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const rad = (deg: number): number => (deg * Math.PI) / 180;
export const deg = (r: number): number => (r * 180) / Math.PI;

/** Rotates a vector by `degrees` (SVG convention: positive turns clockwise on screen). */
export function rotate(a: Vec, degrees: number): Vec {
  const r = rad(degrees);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

/**
 * Direction of a limb `angle` degrees outward from hanging straight down, on
 * side `sign` (1 = viewer's right). 0 points down, 90 points sideways out,
 * 180 points up; negative angles cross toward the middle.
 */
export function limbDir(angle: number, sign: number): Vec {
  const r = rad(angle);
  return { x: Math.sin(r) * sign, y: Math.cos(r) };
}

/** The inverse of `limbDir`: the outward angle of direction `d` on side `sign`. */
export function limbAngle(d: Vec, sign: number): number {
  return deg(Math.atan2(d.x * sign, d.y));
}

export interface TwoBoneSolution {
  /** Middle joint (elbow or knee). */
  mid: Vec;
  /** End joint (wrist or ankle); equals the target unless it was out of reach. */
  end: Vec;
  /** True when the target was closer or farther than the limb can bend or stretch. */
  clamped: boolean;
}

/**
 * Solves a two-bone chain from `root` toward `target`. Of the two possible
 * bends, it picks the one whose middle joint lies toward `bendTo` (a direction).
 */
export function solveTwoBone(
  root: Vec,
  target: Vec,
  l1: number,
  l2: number,
  bendTo: Vec,
): TwoBoneSolution {
  const toTarget = sub(target, root);
  const rawDist = len(toTarget);
  const min = Math.abs(l1 - l2) + 0.001;
  const max = l1 + l2 - 0.001;
  const dist = Math.min(max, Math.max(min, rawDist));
  const clamped = dist !== rawDist;
  const dir = rawDist > 1e-6 ? scale(toTarget, 1 / rawDist) : vec(0, 1);
  const end = add(root, scale(dir, dist));

  // Law of cosines: angle at the root between the target line and the first bone.
  const cosA = Math.min(1, Math.max(-1, (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist)));
  const a = Math.acos(cosA);
  const base = Math.atan2(dir.y, dir.x);
  const candidates = [base + a, base - a].map((angle) =>
    add(root, vec(Math.cos(angle) * l1, Math.sin(angle) * l1)),
  );
  // Which candidate sits further toward `bendTo`, measured from the straight line?
  const mid = (p: Vec) => (p.x - root.x) * bendTo.x + (p.y - root.y) * bendTo.y;
  const [first, second] = candidates as [Vec, Vec];
  return { mid: mid(first) >= mid(second) ? first : second, end, clamped };
}

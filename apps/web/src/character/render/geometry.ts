/**
 * Shape helpers for drawing a rigged body without gaps.
 *
 * A limb segment is the convex hull of two circles (one per joint), so it
 * tapers smoothly and its rounded ends sit exactly on the joints. Joining two
 * segments at a shared joint circle gives a continuous elbow or knee at any
 * angle. Outlines come from drawing all pieces of a part twice: first fat in
 * ink, then in colour on top, so overlapping pieces merge into one silhouette.
 */
import type { Vec } from '../rig/ik';

export interface Circle {
  c: Vec;
  r: number;
}

function circlePoints({ c, r }: Circle, count = 20): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    out.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
  }
  return out;
}

/** Convex hull (Andrew's monotone chain), counter-clockwise. */
export function convexHull(points: Vec[]): Vec[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: Vec, a: Vec, b: Vec) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Vec[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Vec[] = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** A closed path through points. */
export function polyPath(points: Vec[]): string {
  if (points.length === 0) return '';
  return `M${points.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`;
}

/** A smooth closed path through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(points: Vec[], tension = 0.5): string {
  const n = points.length;
  if (n < 3) return polyPath(points);
  let d = `M${f(points[0]!.x)} ${f(points[0]!.y)}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n]!;
    const p1 = points[i]!;
    const p2 = points[(i + 1) % n]!;
    const p3 = points[(i + 2) % n]!;
    const t = tension / 3;
    d += `C${f(p1.x + (p2.x - p0.x) * t)} ${f(p1.y + (p2.y - p0.y) * t)} ${f(p2.x - (p3.x - p1.x) * t)} ${f(p2.y - (p3.y - p1.y) * t)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return `${d}Z`;
}

/** The tapered segment between two joint circles. */
export function capsule(a: Circle, b: Circle): string {
  return polyPath(convexHull([...circlePoints(a), ...circlePoints(b)]));
}

/**
 * A sleeve or trouser-leg tube: round at the joint it starts from, cut
 * square at its open end (`end`, with half-width `r`), facing along a→b.
 */
export function tube(a: Circle, end: Vec, r: number, from: Vec): string {
  const dx = end.x - from.x;
  const dy = end.y - from.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  return polyPath(
    convexHull([
      ...circlePoints(a),
      { x: end.x + nx * r, y: end.y + ny * r },
      { x: end.x - nx * r, y: end.y - ny * r },
    ]),
  );
}

/** Point a fraction `t` of the way from a to b. */
export const along = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** Radius a fraction `t` of the way between two radii. */
export const taper = (r1: number, r2: number, t: number): number => r1 + (r2 - r1) * t;

/** Unit vector perpendicular to a→b. */
export function normal(a: Vec, b: Vec): Vec {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: -dy / l, y: dx / l };
}

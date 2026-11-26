/**
 * Drives a ready-drawn character (sprites/svg) from the engine's `Pose`.
 *
 * The artwork has named parts: `upper` (everything above the hips), `head`, `eyes`, `look`
 * (pupils), `brows`, `smC`/`smO` (closed and open mouth), and the right arm as `shrug` >
 * `armU` > `armF` > `handR`/`handO`. The left arm is an unnamed mirror of the right one; it is
 * found by structure and given an open hand too, so both arms gesture. Legs and shoes are the
 * left ones plus mirrored copies.
 *
 * Arm angles come from the same skeleton solver the drawn characters use, so keyframe clips,
 * IK reaches (hand on heart, pointing) and lean all carry over. Each bone is rotated by how far
 * it has moved from the rest pose, so the rest pose looks exactly as the artist drew it.
 */
import { REST_POSE, type Pose, type Side } from '../pose';
import { proportions, solveSkeleton, type Skeleton } from '../rig/skeleton';
import type { Pivot } from './prepare';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Rig units to artwork units (the rig figure is about 700 tall, the artwork about 455). */
const S = 0.65;
/** Face features are drawn larger than life, so face motion is scaled up a little. */
const FACE = 0.9;
const FLOOR_Y = 494;
const HIP: Pivot = { x: 256, y: 350 };
const DEFAULT_PIVOTS: Record<string, Pivot> = {
  head: { x: 256, y: 226 },
  armU: { x: 310, y: 250 },
  armF: { x: 322, y: 294 },
};
/** Where the wrist sits in the arm's own frame (rest pose). */
const WRIST: Pivot = { x: 322, y: 332 };

const P = proportions('feminine', 'regular');
const REST = solveSkeleton(REST_POSE, P);

interface ArmParts {
  shrug: SVGGElement[];
  upper: SVGGElement;
  fore: SVGGElement;
  rest: SVGGElement;
  open: SVGGElement;
}

interface Centred {
  el: SVGGraphicsElement;
  c: Pivot;
}

export interface SpriteParts {
  figure: SVGGElement;
  shadow: SVGGElement;
  upper: SVGGElement;
  head: SVGGElement;
  eyes: Centred | null;
  looks: SVGGElement[];
  brows: Centred[];
  mouthClosed: Centred | null;
  mouthOpen: (Centred & { top: number }) | null;
  blush: SVGElement[];
  arms: Partial<Record<Side, ArmParts>>;
  legs: Record<Side, SVGGElement[]>;
  sways: { el: SVGGElement; c: Pivot; follow: 'head' | 'body' }[];
  pivots: Record<string, Pivot>;
}

const g = (): SVGGElement => document.createElementNS(SVG_NS, 'g');

/** Puts `el` inside a new group in its place, so the group can move it. */
function wrap(el: Element): SVGGElement {
  const group = g();
  el.parentNode?.insertBefore(group, el);
  group.appendChild(el);
  return group;
}

/** Puts a run of siblings inside one new group. */
function wrapAll(els: Element[]): SVGGElement {
  const group = g();
  const first = els[0];
  first?.parentNode?.insertBefore(group, first);
  for (const el of els) group.appendChild(el);
  return group;
}

function centre(el: SVGGraphicsElement, fallback: Pivot): Pivot {
  try {
    const b = el.getBBox();
    if (b.width > 0 || b.height > 0) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  } catch {
    // Not rendered yet (hidden container): the fallback is close enough.
  }
  return fallback;
}

const parentG = (el: Element | null): SVGGElement | null => {
  let p = el?.parentElement ?? null;
  while (p && p.tagName.toLowerCase() !== 'g') p = p.parentElement;
  return p as SVGGElement | null;
};

/** Finds and prepares the moving parts. Call once, after the SVG is in the document. */
export function findParts(svg: SVGSVGElement, pivots: Record<string, Pivot>): SpriteParts | null {
  const q = <T extends Element>(sel: string): T | null => svg.querySelector<T>(sel);
  const upper = q<SVGGElement>('g.upper');
  const head = q<SVGGElement>('g.head');
  if (!upper || !head) return null;

  // Floor shadows, then the whole figure, as two groups we can move.
  const top = [...svg.children].filter(
    (el) => !['defs', 'style', 'title', 'desc'].includes(el.tagName.toLowerCase()),
  );
  const shadows = top.filter(
    (el) => el.tagName.toLowerCase() === 'ellipse' && el.getAttribute('cy') === String(FLOOR_Y),
  );
  const shadow = wrapAll(shadows);
  const figure = wrapAll(top.filter((el) => !shadows.includes(el)));

  // Legs and shoes: the drawn left ones and their mirrored copies.
  const legs: Record<Side, SVGGElement[]> = { L: [], R: [] };
  for (const el of [...figure.children]) {
    const tag = el.tagName.toLowerCase();
    const id = el.getAttribute('id') ?? '';
    const href = el.getAttribute('href') ?? el.getAttribute('xlink:href') ?? '';
    if (tag === 'g' && /-(shoeL|legL)$/.test(id)) legs.L.push(wrap(el));
    else if (tag === 'use' && /-(shoeL|legL)$/.test(href)) legs.R.push(wrap(el));
  }

  // Right arm (viewer's right): named parts.
  const arms: Partial<Record<Side, ArmParts>> = {};
  const armU = q<SVGGElement>('g.armU');
  const armF = q<SVGGElement>('g.armF');
  const handR = q<SVGGElement>('g.handR');
  const handO = q<SVGGElement>('g.handO');
  if (armU && armF && handR && handO) {
    arms.R = {
      shrug: [...svg.querySelectorAll<SVGGElement>('g.shrug')],
      upper: armU,
      fore: armF,
      rest: handR,
      open: handO,
    };
    // Left arm: the mirrored copy holds the resting hand; its groups nest the same way.
    const leftUse = [...upper.querySelectorAll('use')].find(
      (u) =>
        !u.closest('g.armU') &&
        /handRest$/.test(u.getAttribute('href') ?? u.getAttribute('xlink:href') ?? ''),
    );
    const foreL = parentG(leftUse ?? null);
    const upperL = parentG(foreL);
    const shrugL = parentG(upperL);
    if (leftUse && foreL && upperL && shrugL) {
      const rest = wrap(leftUse);
      const open = handO.cloneNode(true) as SVGGElement;
      open.removeAttribute('class');
      rest.after(open);
      arms.L = { shrug: [shrugL], upper: upperL, fore: foreL, rest, open };
    }
  }

  const eyesEl = q<SVGGElement>('g.eyes');
  const brows = [...(q<SVGGElement>('g.brows')?.children ?? [])]
    .filter((el): el is SVGGraphicsElement => el instanceof SVGGraphicsElement)
    .map((el, i) => ({ el, c: centre(el, { x: i === 0 ? 230 : 284, y: 115 }) }));
  const smC = q<SVGGElement>('g.smC');
  const smO = q<SVGGElement>('g.smO');
  let mouthOpen: SpriteParts['mouthOpen'] = null;
  if (smO) {
    let box = { x: 238, y: 184, width: 42, height: 26 };
    try {
      const b = smO.getBBox();
      if (b.width > 0) box = b;
    } catch {
      // keep the fallback
    }
    mouthOpen = {
      el: smO,
      c: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
      top: box.y + 2,
    };
  }

  const sways: SpriteParts['sways'] = [];
  for (const name of ['tail', 'tuft', 'str1', 'str2']) {
    const el = q<SVGGElement>(`g.${name}`);
    const c = pivots[name];
    if (el && c) sways.push({ el, c, follow: name.startsWith('str') ? 'body' : 'head' });
  }

  return {
    figure,
    shadow,
    upper,
    head,
    eyes: eyesEl ? { el: eyesEl, c: centre(eyesEl, { x: 257, y: 142 }) } : null,
    looks: [...svg.querySelectorAll<SVGGElement>('g.look')],
    brows,
    mouthClosed: smC ? { el: smC, c: centre(smC, { x: 258, y: 190 }) } : null,
    mouthOpen,
    blush: [...svg.querySelectorAll<SVGElement>('[fill$="-blush)"]')],
    arms,
    legs,
    sways,
    pivots: { ...DEFAULT_PIVOTS, ...pivots },
  };
}

const f = (n: number): string => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(2));
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const rot = (a: number, c: Pivot): string => `rotate(${f(a)} ${f(c.x)} ${f(c.y)})`;
const scaleAt = (sx: number, sy: number, c: Pivot): string =>
  `translate(${f(c.x)} ${f(c.y)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f(-c.x)} ${f(-c.y)})`;

/** Writes an attribute only when it changes, to keep each frame cheap. */
function set(el: Element, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function armAngles(skel: Skeleton, side: Side): { upper: number; fore: number; hand: number } {
  const a = skel.arms[side];
  const r = REST.arms[side];
  const upper = a.upperAngle - skel.lean - (r.upperAngle - REST.lean);
  const fore = a.foreAngle - a.upperAngle - (r.foreAngle - r.upperAngle);
  const hand = a.handAngle - a.foreAngle;
  // The left arm is drawn in a mirrored frame, so its turns are mirrored too.
  return side === 'R' ? { upper, fore, hand } : { upper: -upper, fore: -fore, hand: -hand };
}

/** Open hand for waves, presenting and counting; the drawn resting hand otherwise. */
function handIsOpen(pose: Pose, side: Side): boolean {
  const k = (name: string) => pose[`hand${side}.${name}` as keyof Pose];
  const curl = (k('index') + k('middle') + k('ring') + k('little')) / 4;
  // Pointing shows the open hand too: a flat hand directs attention better than a fist.
  const pointing = k('index') < 0.2 && curl > 0.5;
  return k('palm') >= 0.5 || curl < 0.18 || pointing;
}

export function applyPose(parts: SpriteParts, pose: Pose): void {
  const skel = solveSkeleton(pose, P);
  const pv = parts.pivots;

  // Whole figure: walk in and out, jump, squash and stretch from the feet.
  const x = pose['root.x'] * S;
  const air = Math.max(0, -pose['root.y']) * S;
  const crouch = Math.max(0, pose['root.y']);
  const sy = (pose['root.sy'] || 1) * (1 - Math.min(0.14, crouch * 0.0016));
  const sx = (1 / Math.sqrt(sy)) * (1 - 0.06 * Math.abs(pose.turn));
  set(
    parts.figure,
    'transform',
    `translate(${f(x)} ${f(-air)}) ${scaleAt(sx, sy, { x: 256, y: FLOOR_Y })}`,
  );
  const shadowScale = Math.max(0.55, 1 - air * 0.004);
  set(
    parts.shadow,
    'transform',
    `translate(${f(x)} 0) ${scaleAt(shadowScale, 1, { x: 256, y: FLOOR_Y })}`,
  );
  set(parts.shadow, 'opacity', f(Math.max(0.35, 1 - air * 0.006)));

  // Upper body: weight shift, breathing, lean around the hips.
  set(
    parts.upper,
    'transform',
    `translate(${f(pose.hip * S)} ${f(-pose.breath * 1.6)}) ${rot(pose.lean, HIP)}`,
  );

  // Head: tilt and neck follow the solver; nod moves it down, turn slides it sideways.
  const headAngle = skel.headAngle - skel.lean;
  set(
    parts.head,
    'transform',
    `${rot(headAngle, pv.head ?? DEFAULT_PIVOTS.head!)} translate(${f(pose['head.turn'] * 5)} ${f(pose['head.nod'] * 0.55)})`,
  );

  // Eyes: blink, squint and the happy squeeze; pupils follow the gaze.
  if (parts.eyes) {
    const open = clamp(
      ((pose['eyeL.open'] + pose['eyeR.open']) / 2) *
        (1 - 0.6 * pose['eye.happy']) *
        (1 - 0.35 * pose['eye.squint']),
      0.07,
      1.15,
    );
    set(parts.eyes.el, 'transform', scaleAt(1, open, parts.eyes.c));
  }
  const look = `translate(${f(pose['gaze.x'] * 4.5 + pose['head.turn'] * 2)} ${f(pose['gaze.y'] * 3.5)})`;
  for (const el of parts.looks) set(el, 'transform', look);

  // Brows: up and down, and tilted (mirrored for the two sides).
  parts.brows.forEach((b, i) => {
    const side = i === 0 ? 'L' : 'R';
    const y = pose[`brow${side}.y`] * FACE * 1.4;
    const tilt = pose[`brow${side}.tilt`] * 2.5 * (side === 'R' ? 1 : -1);
    set(b.el, 'transform', `translate(0 ${f(y)}) ${rot(tilt, b.c)}`);
  });

  // Mouth: the open shape for speech (sized by the viseme), the closed smile otherwise,
  // flipped into a frown for sad moods.
  const open = clamp(Math.max(pose['mouth.open'], pose.jaw * 0.9), 0, 1);
  const width = clamp(1 + pose['mouth.wide'] * 0.25 - pose['mouth.round'] * 0.3, 0.6, 1.3);
  const smile = pose['mouth.smile'];
  if (parts.mouthOpen && parts.mouthClosed) {
    const talking = open > 0.16;
    set(parts.mouthOpen.el, 'opacity', talking ? '1' : '0');
    set(parts.mouthClosed.el, 'opacity', talking ? '0' : '1');
    if (talking) {
      const h = clamp(0.35 + open * 0.95, 0.35, 1.25);
      set(
        parts.mouthOpen.el,
        'transform',
        scaleAt(width, h, { x: parts.mouthOpen.c.x, y: parts.mouthOpen.top }),
      );
    } else {
      const curve =
        smile >= -0.25
          ? clamp(0.3 + smile * 1.2, 0.3, 1.15)
          : -clamp(0.3 + (-smile - 0.25) * 1.2, 0.3, 0.9);
      set(parts.mouthClosed.el, 'transform', scaleAt(width, curve, parts.mouthClosed.c));
    }
  }
  const blush = clamp(0.75 + pose.blush * 0.8, 0.5, 1.3);
  for (const el of parts.blush) set(el, 'opacity', f(Math.min(1, blush)));

  // Arms: shoulder shrug, upper arm and forearm turns, wrist, open or resting hand.
  for (const side of ['L', 'R'] as const) {
    const arm = parts.arms[side];
    if (!arm) continue;
    const a = armAngles(skel, side);
    const shrug = `translate(0 ${f(-pose[`arm${side}.shrug`] * S)})`;
    for (const el of arm.shrug) set(el, 'transform', shrug);
    set(arm.upper, 'transform', rot(a.upper, pv.armU ?? DEFAULT_PIVOTS.armU!));
    set(arm.fore, 'transform', rot(a.fore, pv.armF ?? DEFAULT_PIVOTS.armF!));
    const isOpen = handIsOpen(pose, side);
    const wrist = rot(clamp(a.hand, -40, 40), WRIST);
    set(arm.open, 'opacity', isOpen ? '1' : '0');
    set(arm.rest, 'opacity', isOpen ? '0' : '1');
    set(arm.open, 'transform', wrist);
    set(arm.rest, 'transform', wrist);
  }

  // Legs: steps and weight changes lift and slide each leg a little.
  for (const side of ['L', 'R'] as const) {
    const lift = Math.min(14, pose[`leg${side}.lift`] * S * 0.4);
    const t = `translate(${f(clamp(pose[`leg${side}.x`] * S * 0.5, -18, 18))} ${f(-lift)})`;
    for (const el of parts.legs[side]) set(el, 'transform', t);
  }

  // Hair and hoodie strings swing against the movement.
  for (const s of parts.sways) {
    const a =
      s.follow === 'head' ? -headAngle * 0.7 + pose.breath * 3 : -pose.lean * 0.8 + pose.breath * 2;
    set(s.el, 'transform', rot(clamp(a, -14, 14), s.c));
  }
}

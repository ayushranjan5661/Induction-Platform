/**
 * Body parts drawn from a solved skeleton: arms with sleeves and hands, the
 * torso and its top, the neck, legs with socks and shoes, the bottoms, and a
 * stool for sitting. Everything is in world space (floor at y = 0).
 *
 * Each part is drawn twice (ink first, fat; colour on top) so its pieces
 * merge into one outlined silhouette with no seams at the joints.
 */
import type { ReactElement } from 'react';
import type { Pose, Side } from '../pose';
import { sideSign } from '../pose';
import type { Vec } from '../rig/ik';
import type { Skeleton } from '../rig/skeleton';
import { along, capsule, normal, polyPath, smoothPath, taper, tube } from './geometry';
import { Hand } from './Hand';
import { DETAIL, INK, LINE, shade, type Look } from './look';

const f = (n: number) => n.toFixed(1);

/** Pieces of one part: ink silhouette first, then the colour. */
function Inked({
  paths,
  fill,
  width = LINE,
}: {
  paths: string[];
  fill: string;
  width?: number;
}): ReactElement {
  return (
    <g>
      {paths.map((d, i) => (
        <path
          key={`i${i}`}
          d={d}
          fill={INK}
          stroke={INK}
          strokeWidth={width * 2}
          strokeLinejoin="round"
        />
      ))}
      {paths.map((d, i) => (
        <path key={`c${i}`} d={d} fill={fill} />
      ))}
    </g>
  );
}

const LONG_SLEEVES = new Set(['sweater', 'shirt', 'jacket', 'vest']);
/** Tie colour for the vest outfit. */
const TIE = '#B91C2C';

/* ------------------------------------------------------------------ */
/* Arms                                                                */
/* ------------------------------------------------------------------ */

export function Arm({
  skel,
  look,
  pose,
  side,
}: {
  skel: Skeleton;
  look: Look;
  pose: Pose;
  side: Side;
}): ReactElement {
  const { p } = skel;
  const a = skel.arms[side];
  const sign = sideSign(side);
  const sh = { c: a.shoulder, r: p.r.shoulder };
  const el = { c: a.elbow, r: p.r.elbow };
  const wr = { c: a.wrist, r: p.r.wrist };
  const long = LONG_SLEEVES.has(look.top);
  // A vest has no sleeves: the arms show the shirt underneath.
  const vest = look.top === 'vest';
  const sleeveColour = vest ? look.shirt : look.outfit;
  const sleeveShadow = vest ? shade(look.shirt, -0.16) : look.outfitShadow;
  const palm = pose[`hand${side}.palm` as keyof Pose];
  const flipX = sign * (palm > 0.5 ? -1 : 1);
  const hs = p.handScale;

  const skin = [capsule(sh, el), capsule(el, wr)];
  let sleeve: string[];
  let cuff: ReactElement | null = null;
  if (long) {
    const cuffAt = along(a.elbow, a.wrist, 0.86);
    const cuffR = taper(p.r.elbow, p.r.wrist, 0.86) + 4;
    sleeve = [
      capsule({ c: a.shoulder, r: p.r.shoulder + 4 }, { c: a.elbow, r: p.r.elbow + 4 }),
      tube({ c: a.elbow, r: p.r.elbow + 4 }, cuffAt, cuffR, a.elbow),
    ];
    const n = normal(a.elbow, a.wrist);
    const back = along(a.elbow, a.wrist, 0.74);
    const cuffColour =
      look.top === 'jacket'
        ? shade(look.outfit, -0.1)
        : look.top === 'sweater'
          ? shade(look.outfit, -0.08)
          : vest
            ? shade(look.shirt, -0.06)
            : look.outfit;
    cuff = (
      <path
        d={polyPath([
          { x: back.x + n.x * cuffR, y: back.y + n.y * cuffR },
          { x: cuffAt.x + n.x * cuffR, y: cuffAt.y + n.y * cuffR },
          { x: cuffAt.x - n.x * cuffR, y: cuffAt.y - n.y * cuffR },
          { x: back.x - n.x * cuffR, y: back.y - n.y * cuffR },
        ])}
        fill={cuffColour}
        stroke={INK}
        strokeWidth={DETAIL}
        strokeLinejoin="round"
      />
    );
  } else {
    const end = along(a.shoulder, a.elbow, 0.55);
    sleeve = [
      tube(
        { c: a.shoulder, r: p.r.shoulder + 5 },
        end,
        taper(p.r.shoulder, p.r.elbow, 0.55) + 6,
        a.shoulder,
      ),
    ];
  }

  // Fold lines: inside the elbow when it bends, and from the armpit.
  const n = normal(a.shoulder, a.elbow);
  const inner = { x: -sign * n.y, y: sign * n.x };
  const folds: string[] = [];
  if (long && a.bend > 0.25) {
    const c = a.elbow;
    folds.push(
      `M ${f(c.x + n.x * 6)} ${f(c.y + n.y * 6)} q ${f(-n.x * 4 + 3)} ${f(-n.y * 4 + 3)} ${f(-n.x * 12)} ${f(-n.y * 12)}`,
    );
  }
  const mid = along(a.shoulder, long ? a.elbow : along(a.shoulder, a.elbow, 0.55), 0.45);
  folds.push(`M ${f(mid.x - inner.x * 2)} ${f(mid.y - inner.y * 2)} l ${f(n.x * 6)} ${f(n.y * 6)}`);

  return (
    <g>
      <Inked paths={skin} fill={look.skin} />
      {!long && a.bend > 0.3 && (
        <path
          d={`M ${f(a.elbow.x - 4)} ${f(a.elbow.y)} q 4 3 8 0`}
          stroke={look.skinShadow}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      )}
      <Inked paths={sleeve} fill={sleeveColour} />
      {cuff}
      {folds.map((d) => (
        <path
          key={d}
          d={d}
          stroke={sleeveShadow}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {!long && look.top === 'polo' && (
        <path
          d={(() => {
            const end = along(a.shoulder, a.elbow, 0.55);
            const r = taper(p.r.shoulder, p.r.elbow, 0.55) + 6;
            const b = along(a.shoulder, a.elbow, 0.47);
            const nn = normal(a.shoulder, a.elbow);
            return `M ${f(b.x + nn.x * r)} ${f(b.y + nn.y * r)} L ${f(b.x - nn.x * r)} ${f(b.y - nn.y * r)} M ${f(end.x + nn.x * r)} ${f(end.y + nn.y * r)} L ${f(end.x - nn.x * r)} ${f(end.y - nn.y * r)}`;
          })()}
          stroke={shade(look.outfit, -0.3)}
          strokeWidth={2}
        />
      )}
      <g
        transform={`translate(${f(a.wrist.x)} ${f(a.wrist.y)}) rotate(${f(a.handAngle)}) scale(${f(flipX * hs)} ${f(hs)}) translate(0 -4)`}
      >
        <Hand pose={pose} side={side} skin={look.skin} shadow={look.skinShadow} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Torso and top                                                       */
/* ------------------------------------------------------------------ */

/** The torso outline in upper-body space (pelvis at 0, 0), for a given turn. */
function torsoPoints(look: Look, turn: number, hemY: number): Vec[] {
  const { p } = look;
  const shift = turn * 10;
  const fem = look.figure === 'feminine';
  const side = (sign: 1 | -1): Vec[] => {
    const q = 1 - 0.28 * Math.max(0, sign * turn);
    const x = (v: number, k = 1) => sign * v * q + shift * k;
    return [
      { x: x(16), y: -p.spine - 2 },
      { x: x(p.shoulderX - 8), y: -p.spine + p.shoulderDrop - 8 },
      { x: x(p.shoulderX + p.r.shoulder * 0.55), y: -p.spine + p.shoulderDrop + 8 },
      { x: x(p.shoulderX + 1), y: -p.spine + 52 },
      { x: x(fem ? p.waistX + 6 : p.shoulderX - 6, 0.8), y: -p.spine + 82 },
      { x: x(p.waistX, 0.6), y: -58 },
      { x: x(p.hipX + 2, 0.4), y: hemY - 6 },
      { x: x(p.hipX, 0.4), y: hemY },
    ];
  };
  const right = side(1);
  const left = side(-1).reverse();
  return [...right, ...left];
}

function TopDetails({ look, turn }: { look: Look; turn: number }): ReactElement | null {
  const { p } = look;
  const cx = turn * 10;
  const neckY = -p.spine;
  const shirt = look.shirt;
  const dark = shade(look.outfit, -0.3);
  const stroke = { stroke: INK, strokeWidth: DETAIL, strokeLinejoin: 'round' as const };
  const button = (y: number, colour = shade(look.outfit, 0.35)) => (
    <circle key={y} cx={cx} cy={y} r={2.8} fill={colour} stroke={INK} strokeWidth={1.4} />
  );
  switch (look.top) {
    case 'tee':
      return (
        <g>
          <path
            d={`M ${f(cx - 20)} ${neckY - 2} Q ${f(cx)} ${neckY + 22} ${f(cx + 20)} ${neckY - 2}`}
            fill="none"
            stroke={INK}
            strokeWidth={LINE}
            strokeLinecap="round"
          />
          <path
            d={`M ${f(cx - 15)} ${neckY + 1} Q ${f(cx)} ${neckY + 15} ${f(cx + 15)} ${neckY + 1}`}
            fill="none"
            stroke={dark}
            strokeWidth={2}
          />
        </g>
      );
    case 'polo':
      return (
        <g>
          {/* Placket with buttons, then two collar flaps. */}
          <path
            d={`M ${f(cx - 6)} ${neckY + 4} L ${f(cx - 6)} ${neckY + 46} L ${f(cx + 6)} ${neckY + 46} L ${f(cx + 6)} ${neckY + 4}`}
            fill="none"
            {...stroke}
          />
          {button(neckY + 22)}
          {button(neckY + 36)}
          {([-1, 1] as const).map((s) => (
            <path
              key={s}
              d={`M ${f(cx + s * 2)} ${neckY + 6} L ${f(cx + s * 22)} ${neckY - 6} L ${f(cx + s * 30)} ${neckY + 2} L ${f(cx + s * 14)} ${neckY + 24} Z`}
              fill={look.outfit}
              {...stroke}
            />
          ))}
        </g>
      );
    case 'sweater':
      return (
        <g>
          {([-1, 1] as const).map((s) => (
            <path
              key={s}
              d={`M ${f(cx)} ${neckY + 12} L ${f(cx + s * 20)} ${neckY - 4} L ${f(cx + s * 22)} ${neckY + 10} L ${f(cx + s * 6)} ${neckY + 22} Z`}
              fill={shirt}
              {...stroke}
            />
          ))}
          <path
            d={`M ${f(cx - 24)} ${neckY - 2} Q ${f(cx)} ${neckY + 30} ${f(cx + 24)} ${neckY - 2}`}
            fill="none"
            stroke={INK}
            strokeWidth={LINE}
          />
          <path
            d={`M ${f(cx - 19)} ${neckY + 3} Q ${f(cx)} ${neckY + 23} ${f(cx + 19)} ${neckY + 3}`}
            fill="none"
            stroke={dark}
            strokeWidth={2}
          />
          <path
            d={`M ${f(-p.hipX + cx * 0.4)} -16 L ${f(p.hipX + cx * 0.4)} -16`}
            stroke={INK}
            strokeWidth={DETAIL}
          />
          {[-0.7, -0.35, 0, 0.35, 0.7].map((t) => (
            <path
              key={t}
              d={`M ${f(t * p.hipX + cx * 0.4)} -14 L ${f(t * p.hipX + cx * 0.4)} -2`}
              stroke={dark}
              strokeWidth={1.6}
            />
          ))}
        </g>
      );
    case 'shirt':
      return (
        <g>
          <path d={`M ${f(cx)} ${neckY + 12} L ${f(cx)} -12`} stroke={INK} strokeWidth={DETAIL} />
          {[neckY + 30, neckY + 62, neckY + 94, neckY + 126].map((y) => button(y, '#FFFFFF'))}
          {/* Breast pocket on the wearer's left (viewer's right). */}
          <path
            d={`M ${f(cx + 18)} ${neckY + 44} L ${f(cx + 42)} ${neckY + 44} L ${f(cx + 42)} ${neckY + 68} Q ${f(cx + 30)} ${neckY + 74} ${f(cx + 18)} ${neckY + 68} Z`}
            fill="none"
            {...stroke}
          />
          {([-1, 1] as const).map((s) => (
            <path
              key={s}
              d={`M ${f(cx)} ${neckY + 12} L ${f(cx + s * 20)} ${neckY - 6} L ${f(cx + s * 28)} ${neckY + 4} L ${f(cx + s * 10)} ${neckY + 22} Z`}
              fill={look.outfit}
              {...stroke}
            />
          ))}
        </g>
      );
    case 'jacket':
      return (
        <g>
          {/* The shirt showing between the lapels. */}
          <path
            d={`M ${f(cx - 22)} ${neckY - 2} L ${f(cx + 22)} ${neckY - 2} L ${f(cx + 6)} ${neckY + 80} L ${f(cx - 6)} ${neckY + 80} Z`}
            fill={shirt}
            {...stroke}
          />
          {([-1, 1] as const).map((s) => (
            <path
              key={`c${s}`}
              d={`M ${f(cx)} ${neckY + 10} L ${f(cx + s * 16)} ${neckY - 4} L ${f(cx + s * 20)} ${neckY + 8} L ${f(cx + s * 6)} ${neckY + 18} Z`}
              fill={shirt}
              {...stroke}
            />
          ))}
          {([-1, 1] as const).map((s) => (
            <path
              key={`l${s}`}
              d={`M ${f(cx + s * 22)} ${neckY - 4} L ${f(cx + s * 36)} ${neckY + 30} L ${f(cx + s * 26)} ${neckY + 36} L ${f(cx + s * 8)} ${neckY + 84} L ${f(cx + s * 2)} ${neckY + 84} L ${f(cx + s * 2)} -8`}
              fill={look.outfit}
              {...stroke}
            />
          ))}
          {button(neckY + 104, shade(look.outfit, -0.4))}
          {button(neckY + 132, shade(look.outfit, -0.4))}
          {([-1, 1] as const).map((s) => (
            <path
              key={`p${s}`}
              d={`M ${f(cx + s * 22)} -38 L ${f(cx + s * 44)} -40`}
              stroke={INK}
              strokeWidth={DETAIL}
              strokeLinecap="round"
            />
          ))}
        </g>
      );
    case 'vest': {
      // Shirt collar and tie, then the two vest fronts over them (the tie tucks under the V).
      const sx = p.shoulderX;
      const vBottom = neckY + 88;
      const half = (s: 1 | -1): Vec[] => [
        { x: cx + s * 1, y: vBottom },
        { x: cx + s * 19, y: neckY - 2 },
        { x: cx + s * (sx - 14), y: neckY + p.shoulderDrop - 6 },
        { x: cx + s * (sx - 6), y: neckY + 28 },
        { x: cx + s * (sx - 3), y: neckY + 62 },
        { x: s * (p.waistX + 2) + cx * 0.6, y: -58 },
        { x: s * (p.hipX + 2) + cx * 0.4, y: 2 },
        { x: cx * 0.4 + s * 16, y: 20 },
        { x: cx + s * 1, y: 10 },
      ];
      return (
        <g>
          {([-1, 1] as const).map((s) => (
            <path
              key={`c${s}`}
              d={`M ${f(cx + s * 1)} ${neckY + 12} L ${f(cx + s * 18)} ${neckY - 6} L ${f(cx + s * 24)} ${neckY + 6} L ${f(cx + s * 9)} ${neckY + 22} Z`}
              fill={shirt}
              {...stroke}
            />
          ))}
          {/* Tie: knot, then the blade widening toward its point. */}
          <path
            d={`M ${f(cx - 7)} ${neckY + 8} L ${f(cx + 7)} ${neckY + 8} L ${f(cx + 5)} ${neckY + 20} L ${f(cx - 5)} ${neckY + 20} Z`}
            fill={shade(TIE, -0.12)}
            {...stroke}
          />
          <path
            d={`M ${f(cx - 5)} ${neckY + 20} L ${f(cx + 5)} ${neckY + 20} L ${f(cx + 11)} ${neckY + 86} L ${f(cx)} ${neckY + 98} L ${f(cx - 11)} ${neckY + 86} Z`}
            fill={TIE}
            {...stroke}
          />
          <path
            d={`M ${f(cx + 2)} ${neckY + 24} L ${f(cx + 6)} ${neckY + 84}`}
            stroke={shade(TIE, 0.25)}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          {([-1, 1] as const).map((s) => (
            <path key={`v${s}`} d={smoothPath(half(s), 0.25)} fill={look.outfit} {...stroke} />
          ))}
          {/* Shading on the far panel and a seam on each front. */}
          <path d={smoothPath(half(1), 0.25)} fill={INK} opacity={0.08} />
          {([-1, 1] as const).map((s) => (
            <path
              key={`s${s}`}
              d={`M ${f(cx + s * (sx - 22))} ${neckY + 30} Q ${f(cx + s * (sx - 26))} ${neckY + 90} ${f(s * (p.hipX - 10) + cx * 0.4)} 6`}
              stroke={look.outfitShadow}
              strokeWidth={1.6}
              fill="none"
            />
          ))}
          {/* Welt pockets. */}
          {([-1, 1] as const).map((s) => (
            <path
              key={`p${s}`}
              d={`M ${f(cx + s * 16)} -34 L ${f(cx + s * 38)} -37`}
              stroke={dark}
              strokeWidth={3.2}
              strokeLinecap="round"
            />
          ))}
          {[vBottom + 10, vBottom + 32, vBottom + 54].map((y) =>
            button(y, shade(look.outfit, -0.45)),
          )}
        </g>
      );
    }
    default:
      return null;
  }
}

export function Torso({
  skel,
  look,
  pose,
  uid,
}: {
  skel: Skeleton;
  look: Look;
  pose: Pose;
  uid: string;
}): ReactElement {
  const turn = pose.turn;
  const tucked = look.top === 'shirt';
  const hemY = tucked ? -10 : look.top === 'jacket' ? 14 : 4;
  const pts = torsoPoints(look, turn, hemY);
  const d = smoothPath(pts, 0.55);
  const lit = smoothPath(
    pts.map((q) => ({ x: q.x - 11, y: q.y - 4 })),
    0.55,
  );
  const breathe = 1 + pose.breath * 0.01;
  const { p } = look;
  // Under a vest, the body is the shirt.
  const vest = look.top === 'vest';
  const body = vest ? look.shirt : look.outfit;
  const bodyShadow = vest ? shade(look.shirt, -0.16) : look.outfitShadow;
  return (
    <g
      transform={`translate(${f(skel.pelvis.x)} ${f(skel.pelvis.y)}) rotate(${f(skel.lean)}) scale(${(1 + pose.breath * 0.004).toFixed(4)} ${breathe.toFixed(4)})`}
    >
      <clipPath id={`${uid}-torso`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={INK} stroke={INK} strokeWidth={LINE * 2} strokeLinejoin="round" />
      <path d={d} fill={bodyShadow} />
      <path d={lit} fill={body} clipPath={`url(#${uid}-torso)`} />
      {look.figure === 'feminine' && (
        <path
          d={`M ${f(-30 + turn * 10)} ${-p.spine + 70} Q ${f(-16 + turn * 10)} ${-p.spine + 78} ${f(-4 + turn * 10)} ${-p.spine + 72} M ${f(4 + turn * 10)} ${-p.spine + 72} Q ${f(16 + turn * 10)} ${-p.spine + 78} ${f(30 + turn * 10)} ${-p.spine + 70}`}
          stroke={look.outfitShadow}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      <path
        d={`M ${f(-p.waistX + 8 + turn * 6)} -70 q 10 6 20 2 M ${f(p.waistX - 12 + turn * 6)} -88 q -8 8 -18 6`}
        stroke={look.outfitShadow}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <TopDetails look={look} turn={turn} />
      {tucked && (
        <g>
          <rect
            x={-p.hipX - 2}
            y={-16}
            width={p.hipX * 2 + 4}
            height={12}
            rx={3}
            fill={shade(look.shoes, 0.05)}
            stroke={INK}
            strokeWidth={DETAIL}
          />
          <rect
            x={turn * 4 - 8}
            y={-18}
            width={16}
            height={16}
            rx={3}
            fill="#D9B44A"
            stroke={INK}
            strokeWidth={DETAIL}
          />
        </g>
      )}
    </g>
  );
}

export function Neck({ skel, look }: { skel: Skeleton; look: Look }): ReactElement {
  const r = skel.p.r.neck;
  const base = { c: { x: skel.neckBase.x, y: skel.neckBase.y + 6 }, r: r + 2 };
  const top = { c: skel.neckTop, r };
  return (
    <g>
      <Inked paths={[capsule(base, top)]} fill={look.skin} />
      <path
        d={`M ${f(skel.neckTop.x - r)} ${f(skel.neckTop.y + 2)} Q ${f(skel.neckTop.x)} ${f(skel.neckTop.y + 16)} ${f(skel.neckTop.x + r)} ${f(skel.neckTop.y + 2)} L ${f(skel.neckTop.x + r)} ${f(skel.neckTop.y - 6)} L ${f(skel.neckTop.x - r)} ${f(skel.neckTop.y - 6)} Z`}
        fill={look.skinShadow}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Legs, shoes and bottoms                                             */
/* ------------------------------------------------------------------ */

function Shoe({
  at,
  look,
  sign,
  turn,
  toe,
}: {
  at: Vec;
  look: Look;
  sign: 1 | -1;
  turn: number;
  toe: number;
}): ReactElement {
  // The toe points where the body faces; in front view it points at the viewer.
  const dx = turn * 22 + sign * 3;
  const fwd = Math.max(0, dx);
  const back = Math.min(0, dx);
  const pts: Vec[] = [
    { x: -13 + back * 0.4, y: -10 },
    { x: 0, y: -15 },
    { x: 13 + fwd * 0.4, y: -10 },
    { x: 20 + fwd, y: 3 },
    { x: 19 + fwd, y: 15 },
    { x: -17 + back, y: 15 },
    { x: -20 + back, y: 3 },
  ];
  const d = smoothPath(pts, 0.7);
  // Polished dress shoes: dark sole, subtle laces and a shine on the toe.
  const sole = shade(look.shoes, -0.5);
  const cap = shade(look.shoes, 0.1);
  const lace = shade(look.shoes, -0.35);
  const lx = dx * 0.25;
  return (
    <g
      transform={`translate(${f(at.x)} ${f(at.y)}) rotate(${f(toe * 18 * (turn >= 0 ? 1 : -1))} 0 15) translate(0 15) scale(1.3) translate(0 -15)`}
    >
      <path d={d} fill={look.shoes} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
      {/* Rounded toe cap, laces and a light sole so the shoe reads against dark trousers. */}
      <ellipse cx={f(fwd * 0.6 + back * 0.6)} cy={5} rx={13} ry={5.5} fill={cap} />
      <path
        d={`M ${f(lx - 6)} -9 L ${f(lx + 6)} -6 M ${f(lx - 6)} -6 L ${f(lx + 6)} -9 M ${f(lx - 6)} -3 L ${f(lx + 6)} 0 M ${f(lx - 6)} 0 L ${f(lx + 6)} -3`}
        stroke={lace}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d={`M ${f(-19 + back)} 10 L ${f(20 + fwd)} 10 L ${f(19 + fwd)} 15.5 L ${f(-17 + back)} 15.5 Z`}
        fill={sole}
        stroke={INK}
        strokeWidth={DETAIL}
        strokeLinejoin="round"
      />
      <ellipse cx={f(6 + fwd * 0.7)} cy={2} rx={6} ry={2.4} fill="#FFFFFF" opacity={0.3} />
    </g>
  );
}

export function LowerBody({
  skel,
  look,
  pose,
}: {
  skel: Skeleton;
  look: Look;
  pose: Pose;
}): ReactElement {
  const { p } = skel;
  const turn = pose.turn;
  const pelvis = skel.pelvis;
  const sides = ['L', 'R'] as const;
  const showLegs = look.bottom !== 'trousers';

  const skinLegs = sides.flatMap((s) => {
    const l = skel.legs[s];
    return [
      capsule({ c: l.hip, r: p.r.hip - 2 }, { c: l.knee, r: p.r.knee }),
      capsule({ c: l.knee, r: p.r.knee }, { c: l.ankle, r: p.r.ankle }),
    ];
  });

  // The pelvis block the bottoms hang from; it follows the hip shift, not the lean.
  const block = smoothPath(
    [
      { x: pelvis.x - p.waistX + 4 + turn * 4, y: pelvis.y - 34 },
      { x: pelvis.x + p.waistX - 4 + turn * 4, y: pelvis.y - 34 },
      { x: pelvis.x + p.hipX, y: pelvis.y + 6 },
      { x: pelvis.x + turn * 6, y: pelvis.y + 22 },
      { x: pelvis.x - p.hipX, y: pelvis.y + 6 },
    ],
    0.35,
  );

  let bottoms: ReactElement;
  if (look.bottom === 'skirt') {
    const knees = sides.map((s) => skel.legs[s].knee);
    const lowest = Math.max(...knees.map((k) => k.y)) - 10;
    const hemY = Math.max(pelvis.y + 60, Math.min(lowest, pelvis.y + 118));
    const minX = Math.min(...knees.map((k) => k.x)) - p.r.knee - 16;
    const maxX = Math.max(...knees.map((k) => k.x)) + p.r.knee + 16;
    const skirt = smoothPath(
      [
        { x: pelvis.x - p.waistX + 4 + turn * 4, y: pelvis.y - 34 },
        { x: pelvis.x + p.waistX - 4 + turn * 4, y: pelvis.y - 34 },
        { x: pelvis.x + p.hipX + 6, y: pelvis.y },
        { x: maxX, y: hemY },
        { x: (minX + maxX) / 2, y: hemY + 4 },
        { x: minX, y: hemY },
        { x: pelvis.x - p.hipX - 6, y: pelvis.y },
      ],
      0.3,
    );
    const mx = (minX + maxX) / 2;
    bottoms = (
      <g>
        <Inked paths={[skirt]} fill={look.pants} />
        <path
          d={`M ${f(mx - 10)} ${f(pelvis.y)} L ${f(mx - 18)} ${f(hemY)} M ${f(mx + 14)} ${f(pelvis.y + 4)} L ${f(mx + 24)} ${f(hemY)}`}
          stroke={look.pantsShadow}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </g>
    );
  } else {
    const shorts = look.bottom === 'shorts';
    const legs = sides.flatMap((s) => {
      const l = skel.legs[s];
      const hipC = { c: l.hip, r: p.r.hip + 3 };
      if (shorts) {
        const end = along(l.hip, l.knee, 0.72);
        return [tube(hipC, end, taper(p.r.hip, p.r.knee, 0.72) + 7, l.hip)];
      }
      // The hem stops just above the shoe so the shoe shows below it.
      const hem = along(
        l.knee,
        l.ankle,
        1 - 15 / Math.max(1, Math.hypot(l.ankle.x - l.knee.x, l.ankle.y - l.knee.y)),
      );
      return [
        capsule(hipC, { c: l.knee, r: p.r.knee + 4 }),
        tube({ c: l.knee, r: p.r.knee + 4 }, hem, p.r.ankle + 6, l.knee),
      ];
    });
    const creases = sides.map((s) => {
      const l = skel.legs[s];
      const sign = sideSign(s);
      const a = along(l.hip, l.knee, 0.25);
      const b = shorts ? along(l.hip, l.knee, 0.66) : l.knee;
      const c = shorts ? b : along(l.knee, l.ankle, 0.85);
      return `M ${f(a.x + sign * 2)} ${f(a.y)} L ${f(b.x + sign * 2)} ${f(b.y)} L ${f(c.x + sign * 2)} ${f(c.y)}`;
    });
    bottoms = (
      <g>
        <Inked paths={[block, ...legs]} fill={look.pants} />
        {creases.map((d) => (
          <path
            key={d}
            d={d}
            stroke={look.pantsShadow}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {sides.map((s) => {
          const l = skel.legs[s];
          if (l.bend < 0.2) return null;
          return (
            <path
              key={`k${s}`}
              d={`M ${f(l.knee.x - 8)} ${f(l.knee.y - 6)} q 8 6 16 0`}
              stroke={look.pantsShadow}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        <path
          d={`M ${f(pelvis.x + turn * 6)} ${f(pelvis.y - 30)} L ${f(pelvis.x + turn * 6)} ${f(pelvis.y + 4)}`}
          stroke={look.pantsShadow}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g>
      {showLegs && <Inked paths={skinLegs} fill={look.skin} />}
      {showLegs &&
        sides.map((s) => {
          const l = skel.legs[s];
          const top = along(l.ankle, l.knee, 0.22);
          return (
            <path
              key={`sock${s}`}
              d={capsule({ c: top, r: p.r.ankle + 1.5 }, { c: l.ankle, r: p.r.ankle + 1.5 })}
              fill="#F4F1EA"
              stroke={INK}
              strokeWidth={DETAIL}
            />
          );
        })}
      {sides.map((s) => (
        <Shoe
          key={`shoe${s}`}
          at={{ x: skel.legs[s].ankle.x, y: skel.legs[s].ankle.y }}
          look={look}
          sign={sideSign(s)}
          turn={turn}
          toe={pose[`leg${s}.toe` as keyof Pose]}
        />
      ))}
      {bottoms}
    </g>
  );
}

/** A plain wooden stool, drawn when the character sits. */
export function Stool({ skel, pose }: { skel: Skeleton; pose: Pose }): ReactElement | null {
  if (pose.seat < 0.02) return null;
  const x = pose['root.x'];
  const top = skel.pelvis.y + skel.p.r.hip - 2;
  const wood = '#B07A47';
  return (
    <g opacity={Math.min(1, pose.seat)}>
      <path
        d={`M ${f(x - 56)} 0 L ${f(x - 44)} ${f(top)} M ${f(x + 56)} 0 L ${f(x + 44)} ${f(top)}`}
        stroke={INK}
        strokeWidth={12}
        strokeLinecap="round"
      />
      <path
        d={`M ${f(x - 56)} 0 L ${f(x - 44)} ${f(top)} M ${f(x + 56)} 0 L ${f(x + 44)} ${f(top)}`}
        stroke={shade(wood, -0.15)}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d={`M ${f(x - 50)} ${f(top * 0.45)} L ${f(x + 50)} ${f(top * 0.45)}`}
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d={`M ${f(x - 50)} ${f(top * 0.45)} L ${f(x + 50)} ${f(top * 0.45)}`}
        stroke={shade(wood, -0.15)}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <rect
        x={x - 66}
        y={top - 6}
        width={132}
        height={16}
        rx={8}
        fill={wood}
        stroke={INK}
        strokeWidth={LINE}
      />
    </g>
  );
}

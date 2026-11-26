/**
 * The head, drawn in head space: the top of the neck is (0, 0) and up is -y.
 * Face, ears, eyes, eyelids, brows, nose, mouth and jaw, cheeks, tears,
 * sweat, glasses, beard and hair are separate parts driven by the pose.
 */
import type { ReactElement } from 'react';
import type { Pose } from '../pose';
import type { Vec } from '../rig/ik';
import { polyPath, smoothPath } from './geometry';
import { DETAIL, INK, IRIS, LINE, shade, type Look } from './look';

const EYE_Y = -88;
const EYE_X = 25;

/** Points on an ellipse arc, angles in degrees (0 = right, 90 = down). */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  n: number,
): Vec[] {
  const out: Vec[] = [];
  for (let i = 0; i <= n; i += 1) {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return out;
}

function facePoints(look: Look, jaw: number, turn: number): Vec[] {
  const narrow = look.figure === 'feminine' ? 0.93 : 1;
  const chinY = -2 + jaw * 7;
  const lower = (x: number) => x * narrow + turn * 5;
  // An oval face with cheekbones and a defined jaw tapering to the chin.
  return [
    { x: 0, y: -154 },
    { x: 42, y: -146 },
    { x: 60, y: -116 },
    { x: 62, y: -84 },
    { x: lower(58), y: -52 + jaw * 2 },
    { x: lower(44), y: -22 + jaw * 4 },
    { x: lower(22), y: chinY - 4 },
    { x: lower(0), y: chinY },
    { x: lower(-22), y: chinY - 4 },
    { x: lower(-44), y: -22 + jaw * 4 },
    { x: lower(-58), y: -52 + jaw * 2 },
    { x: -62, y: -84 },
    { x: -60, y: -116 },
    { x: -42, y: -146 },
  ];
}

/* ------------------------------------------------------------------ */
/* Hair                                                                */
/* ------------------------------------------------------------------ */

/** Hair drawn behind the head and body (long hair, ponytail, bun). */
export function HairBack({ look }: { look: Look }): ReactElement | null {
  const style = {
    fill: look.hair,
    stroke: INK,
    strokeWidth: LINE,
    strokeLinejoin: 'round' as const,
  };
  switch (look.hairStyle) {
    case 'long':
      return (
        <path
          d="M -72 -100 C -84 -170 84 -170 72 -100 C 80 -40 86 40 74 96 C 50 106 30 92 22 80 L -22 80 C -30 92 -50 106 -74 96 C -86 40 -80 -40 -72 -100 Z"
          {...style}
        />
      );
    case 'bob':
      return (
        <path
          d="M -74 -96 C -84 -172 84 -172 74 -96 C 80 -60 82 -26 76 -6 C 60 2 44 -4 38 -10 L -38 -10 C -44 -4 -60 2 -76 -6 C -82 -26 -80 -60 -74 -96 Z"
          {...style}
        />
      );
    case 'ponytail':
      return (
        <g>
          <path
            d="M 34 -150 C 70 -150 96 -120 94 -80 C 92 -40 104 -10 92 18 C 84 2 74 -16 70 -40 C 64 -80 56 -110 34 -126 Z"
            {...style}
          />
          <ellipse
            cx={44}
            cy={-140}
            rx={9}
            ry={7}
            fill={shade(look.shirt, -0.1)}
            stroke={INK}
            strokeWidth={DETAIL}
          />
        </g>
      );
    case 'bun':
      return <circle cx={0} cy={-170} r={28} {...style} />;
    default:
      return null;
  }
}

/** The part of the hair in front of the head. */
function HairFront({ look }: { look: Look }): ReactElement | null {
  const fill = look.hair;
  const style = { fill, stroke: INK, strokeWidth: LINE, strokeLinejoin: 'round' as const };
  const cap = arc(0, -96, 72, 74, 180, 360, 18);
  const highlight = (
    <path
      d="M -44 -138 C -30 -156 4 -164 30 -156 C 6 -154 -16 -148 -34 -132 Z"
      fill={look.hairLight}
      opacity={0.8}
    />
  );
  switch (look.hairStyle) {
    case 'bald':
      return (
        <g>
          <path
            d="M -68 -84 C -72 -104 -66 -116 -60 -122 C -60 -106 -62 -96 -68 -84 Z"
            {...style}
          />
          <path d="M 68 -84 C 72 -104 66 -116 60 -122 C 60 -106 62 -96 68 -84 Z" {...style} />
          <ellipse
            cx={-20}
            cy={-138}
            rx={14}
            ry={6}
            fill="#FFFFFF"
            opacity={0.35}
            transform="rotate(-18 -20 -138)"
          />
        </g>
      );
    case 'spiky': {
      // Clumps fanning out from the crown, plus a spiky fringe.
      const pts: Vec[] = [{ x: -70, y: -80 }];
      const n = 13;
      for (let i = 0; i <= n; i += 1) {
        const a = ((178 + (i / n) * 184) * Math.PI) / 180;
        const r = i % 2 === 0 ? 74 : 100 + (i % 4 === 1 ? 6 : -2);
        const lean = (i - n / 2) * 2.5;
        pts.push({ x: Math.cos(a) * r + (i % 2 ? lean : 0), y: -98 + Math.sin(a) * r * 0.92 });
      }
      pts.push(
        { x: 70, y: -80 },
        { x: 56, y: -98 },
        { x: 48, y: -88 },
        { x: 40, y: -114 },
        { x: 24, y: -98 },
        { x: 14, y: -122 },
        { x: -2, y: -100 },
        { x: -14, y: -122 },
        { x: -28, y: -100 },
        { x: -40, y: -116 },
        { x: -52, y: -92 },
        { x: -58, y: -104 },
      );
      return (
        <g>
          <path d={polyPath(pts)} {...style} />
          {highlight}
          <path
            d="M 22 -150 L 34 -128 M -18 -152 L -10 -130"
            stroke={look.hairShadow}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      );
    }
    case 'sidePart':
      return (
        <g>
          <path
            d={polyPath([
              ...cap,
              { x: 66, y: -88 },
              { x: 58, y: -106 },
              { x: 30, y: -122 },
              { x: -6, y: -118 },
              { x: -38, y: -104 },
              { x: -60, y: -86 },
            ])}
            {...style}
          />
          {highlight}
          <path
            d="M 18 -158 Q 6 -138 -8 -124"
            stroke={look.hairShadow}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case 'curly': {
      const bumps: [number, number][] = [
        [-62, -86],
        [-66, -110],
        [-56, -134],
        [-36, -152],
        [-12, -162],
        [14, -162],
        [38, -152],
        [58, -134],
        [66, -110],
        [62, -86],
        [-40, -120],
        [-14, -128],
        [12, -128],
        [38, -120],
      ];
      return (
        <g>
          {bumps.map(([x, y]) => (
            <circle key={`i${x}${y}`} cx={x} cy={y} r={20 + LINE} fill={INK} />
          ))}
          {bumps.map(([x, y]) => (
            <circle key={`c${x}${y}`} cx={x} cy={y} r={20} fill={fill} />
          ))}
          {bumps.slice(0, 10).map(([x, y]) => (
            <path
              key={`h${x}${y}`}
              d={`M ${x - 8} ${y - 4} Q ${x} ${y - 12} ${x + 8} ${y - 4}`}
              stroke={look.hairLight}
              strokeWidth={2}
              fill="none"
            />
          ))}
        </g>
      );
    }
    case 'bob':
    case 'long':
      return (
        <g>
          <path
            d={polyPath([
              ...cap,
              { x: 70, y: -70 },
              { x: 64, y: -62 },
              { x: 58, y: -100 },
              { x: 34, y: -114 },
              { x: 4, y: -124 },
              { x: -4, y: -124 },
              { x: -34, y: -114 },
              { x: -58, y: -100 },
              { x: -64, y: -62 },
              { x: -70, y: -70 },
            ])}
            {...style}
          />
          {highlight}
          <path
            d="M 0 -168 L 0 -126"
            stroke={look.hairShadow}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      );
    case 'ponytail':
    case 'bun':
      return (
        <g>
          <path
            d={polyPath([
              ...cap,
              { x: 66, y: -86 },
              { x: 54, y: -110 },
              { x: 24, y: -126 },
              { x: -12, y: -124 },
              { x: -44, y: -110 },
              { x: -62, y: -88 },
            ])}
            {...style}
          />
          {highlight}
          <path
            d="M -20 -160 Q -10 -140 -4 -126 M 20 -160 Q 12 -142 10 -126"
            stroke={look.hairShadow}
            strokeWidth={1.8}
            fill="none"
          />
        </g>
      );
    case 'short':
    default:
      return (
        <g>
          <path
            d={polyPath([
              ...cap,
              { x: 66, y: -86 },
              { x: 54, y: -104 },
              { x: 46, y: -96 },
              { x: 36, y: -118 },
              { x: 20, y: -108 },
              { x: 8, y: -124 },
              { x: -6, y: -110 },
              { x: -20, y: -124 },
              { x: -34, y: -108 },
              { x: -46, y: -118 },
              { x: -54, y: -98 },
              { x: -64, y: -88 },
            ])}
            {...style}
          />
          {highlight}
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Face parts                                                          */
/* ------------------------------------------------------------------ */

function Eye({
  id,
  cx,
  open,
  squint,
  happy,
  pupil,
  gazeX,
  gazeY,
  lid,
  crease,
  lashes,
  side,
}: {
  id: string;
  cx: number;
  open: number;
  squint: number;
  happy: number;
  pupil: number;
  gazeX: number;
  gazeY: number;
  lid: string;
  crease: string;
  lashes: boolean;
  side: 1 | -1;
}): ReactElement {
  const cy = EYE_Y;
  const rx = 15;
  const ry = 13.5 * Math.max(1, open);
  // Almond shape: a high arch on top, a flatter curve underneath; the outer corner lifts a little.
  const top = cy - ry * 0.8;
  const bottom = cy + ry * 0.6;
  const inner = cx - side * rx;
  const outer = cx + side * rx;
  const almond = `M ${inner} ${cy + 1} Q ${cx} ${cy - ry * 1.6} ${outer} ${cy - 1.5} Q ${cx} ${cy + ry * 1.2} ${inner} ${cy + 1} Z`;
  const ff = (n: number) => n.toFixed(1);
  if (happy > 0.5) {
    // Laughing: closed eyes curved upward, with a lash line.
    return (
      <path
        d={`M ${cx - 12} ${cy + 3} Q ${cx} ${cy - 9} ${cx + 12} ${cy + 3}`}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  }
  const height = bottom - top;
  const upper = top + (1 - Math.min(1, Math.max(0, open))) * height;
  const lower = bottom - squint * height * 0.7;
  const ix = cx + gazeX * 5;
  const iy = cy - 1 + gazeY * 3;
  const w = rx + 2;
  // The lid line follows the top of the eye, and sags into a closed curve as the lid drops.
  const lidCtrl = 2 * upper - cy;
  return (
    <g>
      {/* Crease above the eye. */}
      <path
        d={`M ${ff(cx - rx + 2)} ${ff(top - 3)} Q ${cx} ${ff(top - 9)} ${ff(cx + rx - 2)} ${ff(top - 2)}`}
        stroke={crease}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <clipPath id={id}>
        <path d={almond} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={cx - w} y={top - 2} width={w * 2} height={height + 4} fill="#FBF8F3" />
        <circle cx={ix} cy={iy} r={8.6} fill={IRIS} />
        <circle cx={ix} cy={iy} r={8.6} fill="none" stroke={INK} strokeWidth={1} opacity={0.6} />
        <circle cx={ix} cy={iy} r={3.6 * pupil} fill="#140C08" />
        <circle cx={ix + 2.6} cy={iy - 2.8} r={2.2} fill="#FFFFFF" />
        <circle cx={ix - 2.4} cy={iy + 2.6} r={0.9} fill="#FFFFFF" opacity={0.8} />
        {/* Shadow the upper lid casts on the eyeball. */}
        <path
          d={`M ${cx - w} ${top - 2} H ${cx + w} V ${ff(upper + 3)} H ${cx - w} Z`}
          fill={INK}
          opacity={0.12}
        />
        <rect
          x={cx - w}
          y={top - 3}
          width={w * 2}
          height={Math.max(0, upper - top + 3)}
          fill={lid}
        />
        <rect x={cx - w} y={lower} width={w * 2} height={height + 4} fill={lid} />
      </g>
      {/* Upper lid line, thick, with a small flick at the outer corner. */}
      <path
        d={`M ${ff(inner - side * 0.5)} ${cy + 1} Q ${cx} ${ff(lidCtrl)} ${ff(outer + side * 1)} ${cy - 1.5}${
          lashes && open > 0.3 ? ` l ${side * 6} -4` : ` l ${side * 3} -1`
        }`}
        stroke={INK}
        strokeWidth={lashes ? 3.4 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Lower lid, thin. */}
      <path
        d={`M ${ff(inner + side * 3)} ${ff(Math.min(lower, bottom) + 0.5)} Q ${cx} ${ff(Math.min(lower, bottom) + 3)} ${ff(outer - side * 2)} ${ff(Math.min(lower, bottom) - 1)}`}
        stroke={INK}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
        opacity={0.65}
      />
      {squint > 0.15 && (
        <path
          d={`M ${ff(cx - rx + 3)} ${ff(bottom + 4)} Q ${cx} ${ff(bottom + 7)} ${ff(cx + rx - 3)} ${ff(bottom + 4)}`}
          stroke={crease}
          strokeWidth={1.4}
          fill="none"
          opacity={Math.min(1, squint * 2)}
        />
      )}
    </g>
  );
}

/** Lips shaped by the pose: smile, open, spread or rounded, with teeth and tongue inside. */
function Mouth({ id, pose }: { id: string; pose: Pose }): ReactElement {
  const open = Math.max(0, pose['mouth.open'], pose.jaw * 0.9);
  const smile = pose['mouth.smile'];
  const round = pose['mouth.round'];
  const tuck = pose['mouth.tuck'];
  const halfWidth = Math.max(7, 21 + pose['mouth.wide'] * 6 - round * 9 + Math.max(0, smile) * 5);
  const corner = -7 * smile;
  const upper = 5 * smile - open * 3 - round * (5 + open * 9) + tuck * 1.5;
  const lower = 5 * smile + 5 + open * 32 + round * 4 - tuck * 2;
  const k = 0.2 + 0.55 * round;
  const top = (8 * upper - 2 * corner) / 6;
  const bottom = (8 * lower - 2 * corner) / 6;
  const f = (n: number) => n.toFixed(1);
  const d = `M ${f(-halfWidth)} ${f(corner)} C ${f(-halfWidth * k)} ${f(top)} ${f(halfWidth * k)} ${f(top)} ${f(halfWidth)} ${f(corner)} C ${f(halfWidth * k)} ${f(bottom)} ${f(-halfWidth * k)} ${f(bottom)} ${f(-halfWidth)} ${f(corner)} Z`;
  const gap = lower - upper;
  return (
    <g>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="#7A1C28" />
      {gap > 4 && (
        <g clipPath={`url(#${id})`}>
          <ellipse
            cx={0}
            cy={lower - 1}
            rx={halfWidth * 0.62}
            ry={7 + open * 5}
            fill="#E0676F"
            opacity={Math.max(0.35, pose['mouth.tongue'])}
          />
          <rect
            x={-halfWidth}
            y={upper - 4}
            width={halfWidth * 2}
            height={5 + pose['mouth.teeth'] * 3.5}
            fill="#FFFFFF"
            opacity={pose['mouth.teeth']}
          />
        </g>
      )}
      <path d={d} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {/* Smile creases at the corners of a big smile. */}
      {smile > 0.6 && (
        <path
          d={`M ${f(-halfWidth - 4)} ${f(corner + 4)} q -3 -3 -2 -7 M ${f(halfWidth + 4)} ${f(corner + 4)} q 3 -3 2 -7`}
          stroke={INK}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

export function Head({ look, pose, uid }: { look: Look; pose: Pose; uid: string }): ReactElement {
  const turn = pose['head.turn'];
  const fx = turn * 12;
  const jaw = Math.max(pose.jaw, pose['mouth.open'] * 0.5);
  const face = facePoints(look, jaw, turn);
  const faceD = smoothPath(face, 0.85);
  const lit = smoothPath(
    face.map((p) => ({ x: p.x - 8, y: p.y - 6 })),
    0.85,
  );
  const browColour = shade(look.hair, -0.3);
  const fem = look.figure === 'feminine';

  return (
    <g>
      {/* Ears: the far ear tucks behind as the head turns. */}
      {([-1, 1] as const).map((side) => {
        const far = side * turn > 0;
        const scaleX = 1 - (far ? Math.abs(turn) * 0.5 : 0);
        return (
          <g
            key={side}
            transform={`translate(${side * 59 + turn * 5} -80) scale(${side * scaleX} 1)`}
          >
            <path
              d="M -4 -14 C 10 -22 18 -6 12 6 C 8 14 0 16 -4 12 Z"
              fill={look.skin}
              stroke={INK}
              strokeWidth={LINE}
              strokeLinejoin="round"
            />
            <path
              d="M 0 -8 C 8 -10 10 0 6 6"
              stroke={look.skinShadow}
              strokeWidth={2.2}
              fill="none"
              strokeLinecap="round"
            />
            {look.earrings && (
              <circle cx={4} cy={18} r={4.5} fill="#F5C542" stroke={INK} strokeWidth={1.6} />
            )}
          </g>
        );
      })}

      {/* Face: flat colour with a hard-edged shadow on the lower right. */}
      <clipPath id={`${uid}-face`}>
        <path d={faceD} />
      </clipPath>
      <path d={faceD} fill={look.skinShadow} />
      <path d={lit} fill={look.skin} clipPath={`url(#${uid}-face)`} />
      <path d={faceD} fill="none" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />

      {look.beard && (
        <g transform={`translate(${fx * 0.5} ${jaw * 4})`}>
          <path
            d="M -64 -76 C -64 -24 -36 6 0 8 C 36 6 64 -24 64 -76 C 58 -52 44 -44 30 -46 Q 0 -54 -30 -46 C -44 -44 -58 -52 -64 -76 Z"
            fill={look.hair}
            stroke={INK}
            strokeWidth={DETAIL}
          />
        </g>
      )}

      <g opacity={Math.min(1, pose.blush)} transform={`translate(${fx * 0.8} 0)`}>
        <ellipse cx={-42} cy={-52} rx={12} ry={7} fill="#F08A8F" opacity={0.55} />
        <ellipse cx={42} cy={-52} rx={12} ry={7} fill="#F08A8F" opacity={0.55} />
        <path
          d="M -48 -54 l 4 4 M -42 -55 l 4 4 M 38 -55 l 4 4 M 44 -54 l 4 4"
          stroke="#E0676F"
          strokeWidth={1.2}
        />
      </g>

      <g transform={`translate(${fx} 0)`}>
        {([-1, 1] as const).map((side) => (
          <Eye
            key={side}
            id={`${uid}-eye${side}`}
            cx={side * EYE_X}
            open={pose[side === 1 ? 'eyeR.open' : 'eyeL.open']}
            squint={pose['eye.squint']}
            happy={pose['eye.happy']}
            pupil={pose['eye.pupil']}
            gazeX={pose['gaze.x']}
            gazeY={pose['gaze.y']}
            lid={look.skin}
            crease={shade(look.skin, -0.28)}
            lashes={fem}
            side={side}
          />
        ))}
        {([-1, 1] as const).map((side) => {
          const y = pose[side === 1 ? 'browR.y' : 'browL.y'];
          const tilt = pose[side === 1 ? 'browR.tilt' : 'browL.tilt'];
          return (
            <path
              key={side}
              // Tapered brows: full at the inner end, thinning to a point at the outer end.
              d={
                fem
                  ? 'M -14 2 C -8 -4 4 -7 17 -2 C 6 -3 -4 -1 -13 5 Z'
                  : 'M -15 3 C -8 -5 4 -8 18 -2 C 6 -2 -4 1 -14 7 Z'
              }
              transform={`translate(${side * (EYE_X + 1)} ${(-110 + y).toFixed(1)}) scale(${side} 1) rotate(${tilt.toFixed(1)})`}
              fill={browColour}
              stroke={browColour}
              strokeWidth={fem ? 1.4 : 2}
              strokeLinejoin="round"
            />
          );
        })}

        {/* Nose: a shaded bridge on the shadow side, a rounded tip and nostrils. */}
        <g transform={`translate(${turn * 6} 0)`}>
          <path d="M 4 -84 C 6 -74 10 -66 11 -60 C 8 -62 6 -70 2 -82 Z" fill={look.skinShadow} />
          <path
            d="M -10 -57 Q -8 -51 -3 -51.5 Q 1 -49.5 5 -51.5 Q 10 -51 11 -57"
            stroke={INK}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <ellipse cx={-1} cy={-60} rx={3.5} ry={2} fill="#FFFFFF" opacity={0.22} />
        </g>

        {/* Shadow under the lower lip and on the chin. */}
        <path
          d={`M -9 ${(-14 + jaw * 6).toFixed(1)} Q 0 ${(-10 + jaw * 6).toFixed(1)} 9 ${(-14 + jaw * 6).toFixed(1)}`}
          stroke={look.skinShadow}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />

        <g transform={`translate(0 ${(-33 + jaw * 3).toFixed(1)})`}>
          <Mouth id={`${uid}-mouth`} pose={pose} />
        </g>

        {look.beard && (
          <path
            d="M -26 -44 Q 0 -54 26 -44 Q 14 -38 0 -42 Q -14 -38 -26 -44 Z"
            transform={`translate(0 ${jaw * 2})`}
            fill={look.hair}
            stroke={INK}
            strokeWidth={DETAIL}
          />
        )}

        {pose.tears > 0.05 && (
          <g
            opacity={Math.min(1, pose.tears)}
            fill="none"
            stroke="#7CC7F2"
            strokeWidth={5}
            strokeLinecap="round"
          >
            <path d="M -28 -66 C -30 -50 -34 -36 -32 -20" />
            <path d="M 28 -66 C 30 -50 34 -36 32 -20" />
          </g>
        )}

        {look.glasses && (
          <g fill="none" stroke={INK} strokeWidth={2.6}>
            <rect
              x={-EYE_X - 19}
              y={EYE_Y - 14}
              width={38}
              height={28}
              rx={11}
              fill="rgba(255,255,255,0.12)"
            />
            <rect
              x={EYE_X - 19}
              y={EYE_Y - 14}
              width={38}
              height={28}
              rx={11}
              fill="rgba(255,255,255,0.12)"
            />
            <path
              d={`M -6 ${EYE_Y - 4} Q 0 ${EYE_Y - 9} 6 ${EYE_Y - 4} M -44 ${EYE_Y - 6} L -60 ${EYE_Y - 9} M 44 ${EYE_Y - 6} L 60 ${EYE_Y - 9}`}
            />
          </g>
        )}
      </g>

      <HairFront look={look} />

      {pose.sweat > 0.05 && (
        <path
          d="M 58 -132 C 50 -118 52 -108 58 -106 C 64 -108 66 -118 58 -132 Z"
          fill="#9AD9FF"
          stroke={INK}
          strokeWidth={1.8}
          opacity={Math.min(1, pose.sweat)}
        />
      )}
    </g>
  );
}

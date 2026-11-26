/**
 * A hand with a palm, a thumb and four separate fingers. Each finger curls on
 * its own, the fingers spread, the thumb swings out or folds across the palm,
 * and the hand can show its palm or its back.
 *
 * Local space: the wrist is at (0, 0) and the fingers point along +y. The
 * thumb is on the -x side; the caller mirrors the hand for the other side.
 */
import type { ReactElement } from 'react';
import type { Pose, Side } from '../pose';
import { DETAIL, INK } from './look';

const FINGERS = [
  // name, base x, length, width, spread direction (positive tilts toward -x)
  ['index', -9.2, 19, 6.6, 12],
  ['middle', -3.1, 21, 6.8, 4],
  ['ring', 3.1, 19.5, 6.4, -4],
  ['little', 9, 15, 5.6, -13],
] as const;

export function Hand({
  pose,
  side,
  skin,
  shadow,
}: {
  pose: Pose;
  side: Side;
  skin: string;
  shadow: string;
}): ReactElement {
  const k = (name: string) => pose[`hand${side}.${name}` as keyof Pose];
  const spread = k('spread');
  const thumbCurl = k('thumb');
  const palmOut = k('palm') > 0.5;
  const line = { stroke: INK, strokeWidth: DETAIL, strokeLinejoin: 'round' as const };

  const finger = ([name, x, length, width, dir]: (typeof FINGERS)[number]) => {
    const curl = Math.min(1, Math.max(0, k(name)));
    const visible = length * (1 - 0.72 * curl);
    const tipR = width / 2 + curl * 1.2;
    const angle = dir * spread;
    return (
      <g key={name} transform={`translate(${x} 20) rotate(${angle.toFixed(1)})`}>
        <rect
          x={-width / 2}
          y={-6}
          width={width}
          height={visible + 6}
          rx={Math.min(width / 2, tipR)}
          fill={skin}
          {...line}
        />
        {/* A curled finger shows its middle knuckle; a straight one its joint crease. */}
        {curl > 0.4 ? (
          <path
            d={`M ${-width / 2 + 1.2} ${visible - 3} Q 0 ${visible - 0.5} ${width / 2 - 1.2} ${visible - 3}`}
            fill="none"
            stroke={INK}
            strokeWidth={1.3}
          />
        ) : (
          <path
            d={`M ${-width / 2 + 1.5} ${visible * 0.55} L ${width / 2 - 1.5} ${visible * 0.55}`}
            stroke={shadow}
            strokeWidth={1.1}
          />
        )}
      </g>
    );
  };

  const thumbAcross = thumbCurl > 0.6;
  const thumbAngle = 18 + 58 * k('thumbOut');
  const thumbLength = 17 * (1 - 0.5 * thumbCurl);
  const thumb = (
    <g transform={`translate(-11 6) rotate(${thumbAngle.toFixed(1)})`}>
      <rect x={-3.9} y={-4} width={7.8} height={thumbLength + 4} rx={3.9} fill={skin} {...line} />
      <path
        d={`M -2 ${thumbLength - 4} Q 0 ${thumbLength - 6} 2 ${thumbLength - 4}`}
        stroke={shadow}
        strokeWidth={1}
        fill="none"
      />
    </g>
  );
  const fist = (['index', 'middle', 'ring', 'little'] as const).every((f) => k(f) > 0.7);

  return (
    <g>
      {!thumbAcross && thumb}
      {FINGERS.map(finger)}
      {/* Palm: a little wider at the knuckles than at the wrist. */}
      <path
        d={
          fist
            ? 'M -10.5 -2 C -14 4 -15 14 -14 21 C -13 27 -6 29 0 29 C 6 29 13 27 14 21 C 15 14 14 4 10.5 -2 Z'
            : 'M -10 -2 C -13.5 5 -14.5 14 -13.5 21 C -12 25 -6 26 0 26 C 6 26 12 25 13.5 21 C 14.5 14 13.5 5 10 -2 Z'
        }
        fill={skin}
        {...line}
      />
      {palmOut && !fist && (
        <path
          d="M -8 13 Q -1 18 8 12 M -6 6 Q -2 12 -3 19"
          fill="none"
          stroke={shadow}
          strokeWidth={1.2}
        />
      )}
      {fist && (
        <path
          d="M -12 21 Q -9 25 -6 21 M -6 22 Q -3 26 0 22 M 0 22 Q 3 26 6 21 M 6 21 Q 9 24 12 20"
          fill="none"
          stroke={INK}
          strokeWidth={1.3}
        />
      )}
      {thumbAcross && (
        <g transform="translate(-12 9) rotate(-78)">
          <rect x={-4} y={-3} width={8} height={18} rx={4} fill={skin} {...line} />
        </g>
      )}
    </g>
  );
}

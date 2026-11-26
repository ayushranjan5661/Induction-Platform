/**
 * Draws a character for one pose. Pure rendering: it solves the skeleton for
 * the pose and draws the parts in order; it never animates anything itself.
 */
import type { AvatarAppearance } from '@induction/shared';
import { useId, useMemo, type ReactElement } from 'react';
import type { Pose } from '../pose';
import { solveSkeleton } from '../rig/skeleton';
import { Arm, LowerBody, Neck, Stool, Torso } from './Body';
import { Head, HairBack } from './Head';
import { resolveLook } from './look';

const f = (n: number) => n.toFixed(2);

/** Cartoon proportions: the head is drawn larger than life. */
export const HEAD_SCALE = 1.0;
export const FULL_VIEW = '-300 -740 600 770';
export const PORTRAIT_VIEW = '-150 -680 300 340';

export function Character({
  appearance,
  pose,
  portrait = false,
  className,
  label,
}: {
  appearance: AvatarAppearance;
  pose: Pose;
  portrait?: boolean;
  className?: string;
  label: string;
}): ReactElement {
  const uid = `ch${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const look = useMemo(() => resolveLook(appearance), [appearance]);
  const skel = solveSkeleton(pose, look.p);

  // The far arm goes behind the body when it is turned three-quarter.
  const farSide = Math.abs(pose.turn) > 0.25 ? (pose.turn > 0 ? 'R' : 'L') : null;
  const nearSides = (['L', 'R'] as const).filter((s) => s !== farSide);

  const headTransform = `translate(${f(skel.neckTop.x)} ${f(skel.neckTop.y)}) rotate(${f(skel.headAngle)}) translate(0 ${f(pose['head.nod'] * 0.6 + 8)}) scale(${HEAD_SCALE})`;

  // Squash and stretch from the floor under the character.
  const sy = pose['root.sy'] || 1;
  const sx = 1 / Math.sqrt(sy);
  const rx = pose['root.x'];
  const squash = `translate(${f(rx)} 0) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${f(-rx)} 0)`;
  const air = Math.max(0, -pose['root.y']);

  return (
    <svg
      viewBox={portrait ? PORTRAIT_VIEW : FULL_VIEW}
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMax meet"
    >
      {!portrait && (
        <ellipse
          cx={rx}
          cy={4}
          rx={Math.max(40, 92 - air * 0.3)}
          ry={11}
          fill="#000000"
          opacity={Math.max(0.05, 0.16 - air * 0.0008)}
        />
      )}
      <g transform={squash}>
        <g transform={headTransform}>
          <HairBack look={look} />
        </g>
        <Stool skel={skel} pose={pose} />
        {farSide && <Arm skel={skel} look={look} pose={pose} side={farSide} />}
        <LowerBody skel={skel} look={look} pose={pose} />
        <Neck skel={skel} look={look} />
        <Torso skel={skel} look={look} pose={pose} uid={uid} />
        <g transform={headTransform}>
          <Head look={look} pose={pose} uid={uid} />
        </g>
        {nearSides.map((s) => (
          <Arm key={s} skel={skel} look={look} pose={pose} side={s} />
        ))}
      </g>
    </svg>
  );
}

/** Resolves a presenter's appearance into colours and proportions for drawing. */
import type { AvatarAppearance } from '@induction/shared';
import { proportions, type Proportions } from '../rig/skeleton';

/** Outline colour: a warm dark brown reads softer than black, like a storybook drawing. */
export const INK = '#2E211C';
/** Outline width for silhouettes; inner detail lines are thinner. */
export const LINE = 2.4;
export const DETAIL = 1.6;
/** Iris colour. */
export const IRIS = '#5B3A24';

/** Darkens (negative) or lightens (positive) a hex colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const v = (n >> shift) & 255;
    const out = amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

export interface Look extends AvatarAppearance {
  figure: 'masculine' | 'feminine';
  p: Proportions;
  skinShadow: string;
  outfitShadow: string;
  pantsShadow: string;
  hairShadow: string;
  hairLight: string;
}

export function resolveLook(appearance: AvatarAppearance): Look {
  const figure = appearance.figure ?? 'masculine';
  return {
    ...appearance,
    figure,
    p: proportions(figure, appearance.build ?? 'regular'),
    skinShadow: shade(appearance.skin, -0.14),
    outfitShadow: shade(appearance.outfit, -0.18),
    pantsShadow: shade(appearance.pants, -0.22),
    hairShadow: shade(appearance.hair, -0.3),
    hairLight: shade(appearance.hair, 0.28),
  };
}

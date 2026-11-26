/**
 * Draws one of the ready-drawn characters for a pose. The artwork is inserted once; after that
 * each frame only changes a few transforms (see spriteRig.ts), so it stays smooth.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import type { Pose } from '../pose';
import { loadSprite, type SpriteSource } from './prepare';
import { applyPose, findParts, type SpriteParts } from './spriteRig';

/**
 * The artwork is 512 square with the figure in the middle. These crops match the shape of the
 * drawn characters' views, so either kind fills a presenter frame the same way.
 */
const FULL_VIEW = '66 -6 380 512';
const PORTRAIT_VIEW = '136 30 240 272';

export function SpriteCharacter({
  character,
  pose,
  portrait = false,
  className,
  label,
}: {
  character: string;
  pose: Pose;
  portrait?: boolean;
  className?: string;
  label: string;
}): ReactElement {
  const prefix = `sp${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [source, setSource] = useState<SpriteSource | null>(null);
  const [failed, setFailed] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const parts = useRef<SpriteParts | null>(null);
  const latest = useRef(pose);
  latest.current = pose;

  useEffect(() => {
    let live = true;
    setSource(null);
    setFailed(false);
    loadSprite(character)
      .then((s) => live && setSource(s))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [character]);

  // Insert the artwork once per character, then find its moving parts.
  useLayoutEffect(() => {
    const el = host.current;
    if (!el || !source) return;
    el.innerHTML = source.markup.replaceAll('__P__', prefix);
    const svg = el.querySelector('svg');
    parts.current = null;
    if (!svg) return;
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    svg.setAttribute('overflow', 'visible');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';
    parts.current = findParts(svg, source.pivots);
    if (parts.current) applyPose(parts.current, latest.current);
    return () => {
      parts.current = null;
      el.innerHTML = '';
    };
  }, [source, prefix]);

  // The view box changes with the crop, without re-inserting the artwork.
  useLayoutEffect(() => {
    const svg = host.current?.querySelector('svg');
    svg?.setAttribute('viewBox', portrait ? PORTRAIT_VIEW : FULL_VIEW);
  }, [portrait, source]);

  useLayoutEffect(() => {
    if (parts.current) applyPose(parts.current, pose);
  }, [pose]);

  return (
    <div role="img" aria-label={label} className={className}>
      <div ref={host} className="h-full w-full" />
      {failed && <span className="sr-only">The presenter picture could not be loaded.</span>}
    </div>
  );
}

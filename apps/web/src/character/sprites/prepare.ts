/**
 * Turns one of the ready-drawn character SVGs (sprites/svg) into markup the sprite renderer can
 * drive. The source files animate themselves with a CSS loop; here the loop is removed, ids are
 * made unique per instance (several presenters can be on one page), the backdrop is dropped so
 * the character stands on the player's own stage, and the pivots the artist used are read out.
 */

export interface Pivot {
  x: number;
  y: number;
}

export interface SpriteSource {
  /** SVG markup with ids prefixed by `__P__`, to be replaced per instance. */
  markup: string;
  /** Rotation centres by part class (`head`, `armU`, `armF`, `tail`, …). */
  pivots: Record<string, Pivot>;
}

/** The artist's outline rule; it is the only non-animation style the files use. */
const OUTLINE = 'stroke:#2E1E16;stroke-width:3;stroke-linejoin:round;stroke-linecap:round';

export function prepareSprite(raw: string): SpriteSource {
  const pivots: Record<string, Pivot> = {};
  const style = /<style>([\s\S]*?)<\/style>/.exec(raw)?.[1] ?? '';
  for (const m of style.matchAll(
    /\.([A-Za-z0-9_-]+)\{[^}]*transform-origin:\s*([\d.]+)px\s+([\d.]+)px/g,
  )) {
    const [, name, x, y] = m;
    if (name && x && y) pivots[name] = { x: Number(x), y: Number(y) };
  }

  let svg = raw
    // Our own animation drives every part; the self-running CSS loop goes.
    .replace(/<style>[\s\S]*?<\/style>/, '<style>.__P__-o{' + OUTLINE + '}</style>')
    // Nothing executable or external, ever.
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+="[^"]*"/gi, '')
    .replace(/(?:xlink:)?href="(?!#)[^"]*"/gi, '')
    // The backdrop: the player draws its own stage.
    .replace(/<rect width="512" height="512" fill="url\(#bg\)"\/>/, '')
    .replace(/<circle cx="256" cy="215" r="200" fill="url\(#glow\)"\/>/, '')
    .replace(/<rect y="400" width="512" height="112" fill="url\(#floor\)"\/>/, '')
    .replace(/<rect width="512" height="512" fill="url\(#vig\)"\/>/, '')
    .replace(/<title[^>]*>[\s\S]*?<\/title>/, '')
    .replace(/\saria-labelledby="[^"]*"/, '')
    .replace(/\s(?:width|height)="512"(?=[^>]*viewBox)/g, '')
    .replace(/\sxmlns:c2pa="[^"]*"/, '');

  // Unique ids per instance: every id and every reference to one.
  svg = svg
    .replace(/\bid="([^"]+)"/g, 'id="__P__-$1"')
    .replace(/url\(#([^)]+)\)/g, 'url(#__P__-$1)')
    .replace(/href="#([^"]+)"/g, 'href="#__P__-$1"')
    // The outline class is generic; scope it to this instance too.
    .replace(/class="o(\s[^"]*)?"/g, 'class="__P__-o$1"');

  return { markup: svg, pivots };
}

/** Loads a character's artwork on demand, so each one is its own small download. */
const FILES = import.meta.glob('./svg/*.svg', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

const cache = new Map<string, Promise<SpriteSource>>();

export function loadSprite(id: string): Promise<SpriteSource> {
  let hit = cache.get(id);
  if (!hit) {
    const load = FILES[`./svg/${id}.svg`];
    hit = load ? load().then(prepareSprite) : Promise.reject(new Error(`Unknown character ${id}`));
    cache.set(id, hit);
    hit.catch(() => cache.delete(id));
  }
  return hit;
}

/** For pages that show many characters: start downloading them early. */
export function preloadSprites(ids: readonly string[]): void {
  for (const id of ids) void loadSprite(id).catch(() => undefined);
}

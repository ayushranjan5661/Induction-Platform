import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHARACTER_IDS } from '@induction/shared';
import { describe, expect, it } from 'vitest';
import { prepareSprite } from './prepare';

const DIR = join(__dirname, 'svg');
const files = readdirSync(DIR).filter((f) => f.endsWith('.svg'));

describe('ready-drawn characters', () => {
  it('has artwork for every character in the shared list, and nothing else', () => {
    expect(files.map((f) => f.replace(/\.svg$/, '')).sort()).toEqual([...CHARACTER_IDS].sort());
  });

  it.each(files)('%s prepares cleanly', (file) => {
    const { markup, pivots } = prepareSprite(readFileSync(join(DIR, file), 'utf8'));
    // Our animation replaces the self-running loop; only the outline rule is kept.
    expect(markup).not.toMatch(/@keyframes|animation:/);
    expect(markup).toContain('.__P__-o{');
    // The backdrop is gone so the character stands on the player's stage.
    expect(markup).not.toMatch(/url\(#__P__-(bg|glow|floor|vig)\)"\/>/);
    // Every id and reference is scoped per instance.
    expect(markup).not.toMatch(/\bid="(?!__P__-)/);
    expect(markup).not.toMatch(/url\(#(?!__P__-)/);
    expect(markup).not.toMatch(/href="#(?!__P__-)/);
    expect(markup).not.toMatch(/class="o[\s"]/);
    // Nothing executable or external.
    expect(markup).not.toMatch(/<script|\son[a-z]+=|href="http/i);
    // The parts the renderer moves.
    for (const part of ['upper', 'head', 'armU', 'armF', 'handR', 'handO', 'eyes', 'smC', 'smO'])
      expect(markup).toContain(`class="${part}"`);
    expect(pivots.head).toEqual({ x: 256, y: 226 });
    expect(pivots.armU).toEqual({ x: 310, y: 250 });
    expect(pivots.armF).toEqual({ x: 322, y: 294 });
  });
});

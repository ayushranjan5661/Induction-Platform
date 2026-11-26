/**
 * Lip-sync: turns a spoken word into a timed sequence of mouth shapes
 * (visemes). The browser tells us when each word starts; this module works
 * out which shapes the lips make inside it, so the presenter's mouth follows
 * the sounds instead of flapping open and shut.
 *
 * Spelling is only an approximation of sound, so the rules aim for "looks
 * right" rather than phonetic accuracy: lips close on M/B/P, teeth touch the
 * lower lip on F/V, lips round on O/U/W, and spread on E/I/S.
 */

export type Viseme =
  | 'rest' // lips together, relaxed
  | 'mbp' // lips pressed shut
  | 'aa' // jaw open (father, cat)
  | 'ee' // spread, slightly open (see, yes)
  | 'ih' // relaxed half-open (sit, the)
  | 'oh' // rounded, open (go, saw)
  | 'oo' // tight round (you, who)
  | 'fv' // upper teeth on lower lip
  | 'th' // tongue between teeth
  | 'l' // tongue up behind teeth
  | 'sz' // teeth almost closed, spread (s, z, t, d, n)
  | 'ch' // lips pushed forward (sh, ch, j)
  | 'r' // slightly rounded
  | 'kg'; // back of the mouth, small opening

export interface MouthShape {
  /** Jaw opening, 0 to 1. */
  open: number;
  /** Spread (positive) or narrowed (negative), -1 to 1. */
  wide: number;
  /** Lip rounding, 0 to 1. */
  round: number;
  /** How much upper teeth show, 0 to 1. */
  teeth: number;
  /** Tongue visible, 0 to 1. */
  tongue: number;
  /** Lower lip tucked under the teeth (F/V), 0 to 1. */
  tuck: number;
}

export const MOUTH_SHAPES: Record<Viseme, MouthShape> = {
  rest: { open: 0.02, wide: 0, round: 0, teeth: 0, tongue: 0, tuck: 0 },
  mbp: { open: 0, wide: -0.1, round: 0, teeth: 0, tongue: 0, tuck: 0 },
  aa: { open: 0.85, wide: 0.15, round: 0, teeth: 0.6, tongue: 0.5, tuck: 0 },
  ee: { open: 0.32, wide: 0.9, round: 0, teeth: 0.9, tongue: 0.1, tuck: 0 },
  ih: { open: 0.45, wide: 0.35, round: 0, teeth: 0.6, tongue: 0.3, tuck: 0 },
  oh: { open: 0.62, wide: -0.55, round: 0.75, teeth: 0.2, tongue: 0.2, tuck: 0 },
  oo: { open: 0.3, wide: -0.9, round: 1, teeth: 0, tongue: 0, tuck: 0 },
  fv: { open: 0.14, wide: 0.2, round: 0, teeth: 1, tongue: 0, tuck: 1 },
  th: { open: 0.24, wide: 0.25, round: 0, teeth: 0.9, tongue: 0.9, tuck: 0 },
  l: { open: 0.4, wide: 0.2, round: 0, teeth: 0.7, tongue: 0.8, tuck: 0 },
  sz: { open: 0.12, wide: 0.6, round: 0, teeth: 1, tongue: 0, tuck: 0 },
  ch: { open: 0.24, wide: -0.5, round: 0.6, teeth: 0.8, tongue: 0, tuck: 0 },
  r: { open: 0.28, wide: -0.35, round: 0.45, teeth: 0.3, tongue: 0.2, tuck: 0 },
  kg: { open: 0.36, wide: 0.1, round: 0, teeth: 0.5, tongue: 0.4, tuck: 0 },
};

const DIGRAPHS: [string, Viseme[]][] = [
  ['tch', ['ch']],
  ['th', ['th']],
  ['sh', ['ch']],
  ['ch', ['ch']],
  ['ph', ['fv']],
  ['wh', ['oo']],
  ['ck', ['kg']],
  ['ng', ['kg']],
  ['qu', ['kg', 'oo']],
  ['oo', ['oo']],
  ['ou', ['aa', 'oo']],
  ['ow', ['oh', 'oo']],
  ['oa', ['oh']],
  ['oi', ['oh', 'ee']],
  ['oy', ['oh', 'ee']],
  ['ee', ['ee']],
  ['ea', ['ee']],
  ['ie', ['ee']],
  ['ai', ['aa', 'ee']],
  ['ay', ['aa', 'ee']],
  ['au', ['oh']],
  ['aw', ['oh']],
];

const LETTERS: Record<string, Viseme> = {
  a: 'aa',
  e: 'ee',
  i: 'ih',
  o: 'oh',
  u: 'oo',
  y: 'ee',
  b: 'mbp',
  m: 'mbp',
  p: 'mbp',
  f: 'fv',
  v: 'fv',
  w: 'oo',
  l: 'l',
  r: 'r',
  s: 'sz',
  z: 'sz',
  t: 'sz',
  d: 'sz',
  n: 'sz',
  c: 'kg',
  k: 'kg',
  g: 'kg',
  q: 'kg',
  x: 'kg',
  j: 'ch',
  h: 'ih',
};

/** Rough mouth shapes for a digit, as if it were spoken. */
const DIGITS: Record<string, Viseme[]> = {
  '0': ['sz', 'ee', 'r', 'oh'],
  '1': ['oo', 'aa', 'sz'],
  '2': ['sz', 'oo'],
  '3': ['th', 'r', 'ee'],
  '4': ['fv', 'oh', 'r'],
  '5': ['fv', 'aa', 'fv'],
  '6': ['sz', 'ih', 'kg', 'sz'],
  '7': ['sz', 'ee', 'fv', 'sz'],
  '8': ['ee', 'sz'],
  '9': ['sz', 'aa', 'sz'],
};

const VOWELS = new Set<Viseme>(['aa', 'ee', 'ih', 'oh', 'oo']);

/** The mouth shapes for one word, in order. Empty when nothing is pronounced. */
export function wordToVisemes(word: string): Viseme[] {
  let text = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  // A silent final "e" (make, time) is not voiced.
  if (text.length > 3 && /[^aeiou]e$/.test(text)) text = text.slice(0, -1);

  const out: Viseme[] = [];
  const push = (v: Viseme) => {
    if (out[out.length - 1] !== v) out.push(v);
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (DIGITS[ch]) {
      DIGITS[ch].forEach(push);
      i += 1;
      continue;
    }
    const digraph = DIGRAPHS.find(([spelling]) => text.startsWith(spelling, i));
    if (digraph) {
      digraph[1].forEach(push);
      i += digraph[0].length;
      continue;
    }
    const v = LETTERS[ch];
    if (v) push(v);
    i += 1;
  }
  return out;
}

export interface VisemeKey {
  viseme: Viseme;
  /** Start, as a fraction (0 to 1) of the word's duration. */
  at: number;
}

/** Spreads a word's shapes over its duration. Vowels are held longer than consonants. */
export function visemeTimeline(word: string): VisemeKey[] {
  const visemes = wordToVisemes(word);
  if (visemes.length === 0) return [];
  const weights = visemes.map((v) => (VOWELS.has(v) ? 1.7 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return visemes.map((viseme, index) => {
    const key = { viseme, at: at / total };
    at += weights[index]!;
    return key;
  });
}

/** The shape to aim for at `progress` (0 to 1) through a word. */
export function visemeAt(timeline: readonly VisemeKey[], progress: number): Viseme {
  if (timeline.length === 0 || progress < 0 || progress >= 1) return 'rest';
  let current: Viseme = timeline[0]!.viseme;
  for (const key of timeline) {
    if (key.at > progress) break;
    current = key.viseme;
  }
  return current;
}

/** Roughly how long a word takes to say at normal pace, in milliseconds. */
export function estimateWordMs(word: string, rate = 1): number {
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '').length;
  const ms = 90 + letters * 58;
  return Math.max(140, Math.min(1100, ms)) / Math.max(0.3, rate);
}

/** True when a word deserves a little emphasis: a long word, a number, or an exclamation. */
export function isStressed(word: string): boolean {
  const core = word.replace(/[^\p{L}\p{N}]/gu, '');
  return /!$/.test(word.trim()) || /\d/.test(core) || core.length >= 8;
}

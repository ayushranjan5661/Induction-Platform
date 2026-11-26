import { describe, expect, it } from 'vitest';
import { estimateWordMs, isStressed, visemeAt, visemeTimeline, wordToVisemes } from './visemes';

describe('wordToVisemes', () => {
  it('closes the lips on m, b and p', () => {
    expect(wordToVisemes('mob')).toEqual(['mbp', 'oh', 'mbp']);
  });

  it('reads digraphs as one sound', () => {
    expect(wordToVisemes('the')).toEqual(['th', 'ee']);
    expect(wordToVisemes('phone')).toEqual(['fv', 'oh', 'sz']);
    expect(wordToVisemes('you')).toEqual(['ee', 'aa', 'oo']);
  });

  it('drops a silent final e and punctuation', () => {
    expect(wordToVisemes('Welcome!')).toEqual(['oo', 'ee', 'l', 'kg', 'oh', 'mbp']);
  });

  it('collapses repeated shapes and handles digits', () => {
    expect(wordToVisemes('mmm')).toEqual(['mbp']);
    expect(wordToVisemes('2')).toEqual(['sz', 'oo']);
    expect(wordToVisemes('—')).toEqual([]);
  });
});

describe('visemeTimeline and visemeAt', () => {
  it('starts at 0, holds vowels longer and rests outside the word', () => {
    const timeline = visemeTimeline('map');
    expect(timeline[0]).toEqual({ viseme: 'mbp', at: 0 });
    expect(timeline[2]!.at - timeline[1]!.at).toBeGreaterThan(timeline[1]!.at);
    expect(visemeAt(timeline, 0.5)).toBe('aa');
    expect(visemeAt(timeline, 1)).toBe('rest');
    expect(visemeAt([], 0.2)).toBe('rest');
  });
});

describe('estimateWordMs and isStressed', () => {
  it('scales with length and rate within bounds', () => {
    expect(estimateWordMs('a')).toBe(148);
    expect(estimateWordMs('induction', 2)).toBeLessThan(estimateWordMs('induction'));
    expect(estimateWordMs('x'.repeat(50))).toBe(1100);
  });

  it('stresses long words, numbers and exclamations', () => {
    expect(isStressed('congratulations')).toBe(true);
    expect(isStressed('2026')).toBe(true);
    expect(isStressed('great!')).toBe(true);
    expect(isStressed('the')).toBe(false);
  });
});

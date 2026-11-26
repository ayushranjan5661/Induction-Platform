import { describe, expect, it } from 'vitest';
import { REST_POSE } from '../pose';
import { clipTime, ease, keyframes, procedural } from './clip';
import { BODY_CLIPS } from './clips/body';
import { EMOTION_TO_EXPRESSION, EXPRESSIONS } from './clips/expressions';
import { GESTURE_CLIPS, GESTURE_TO_CLIP } from './clips/gestures';
import { Mixer } from './mixer';

describe('ease', () => {
  it('starts at 0 and ends at 1 for every curve', () => {
    for (const kind of ['linear', 'in', 'out', 'inOut', 'back', 'step'] as const) {
      expect(ease(kind, 0)).toBeCloseTo(0);
      expect(ease(kind, 1)).toBeCloseTo(1);
    }
  });
});

describe('keyframes', () => {
  const clip = keyframes({
    name: 'test',
    layer: 'gesture',
    duration: 1000,
    frames: [
      { t: 0, pose: { lean: 0 } },
      { t: 1000, pose: { lean: 10 }, ease: 'linear' },
    ],
  });

  it('interpolates and holds the ends', () => {
    expect(clip.sample(500).lean).toBeCloseTo(5);
    expect(clip.sample(-10).lean).toBe(0);
    expect(clip.sample(2000).lean).toBe(10);
  });

  it('reports the end of a one-shot clip', () => {
    expect(clipTime(clip, 900)).toBe(900);
    expect(clipTime(clip, 1100)).toBeNull();
  });

  it('loops after an intro with loopFrom', () => {
    const looped = { ...clip, loop: true, loopFrom: 600 };
    expect(clipTime(looped, 500)).toBe(500);
    expect(clipTime(looped, 1100)).toBe(700);
  });
});

describe('Mixer', () => {
  const steady = (
    name: string,
    value: number,
    priority = 1,
    layer: 'body' | 'gesture' = 'gesture',
  ) =>
    procedural({
      name,
      layer,
      duration: 400,
      loop: false,
      priority,
      fade: 100,
      sample: () => ({ lean: value }),
    });

  it('crossfades into a new clip', () => {
    const mixer = new Mixer();
    mixer.play(steady('a', 10), { fade: 0 });
    mixer.update(16);
    expect(mixer.update(16).lean).toBeCloseTo(10);
    mixer.play(steady('b', 20));
    const mid = mixer.update(50).lean;
    expect(mid).toBeGreaterThan(10);
    expect(mid).toBeLessThan(20);
    expect(mixer.update(100).lean).toBeCloseTo(20);
  });

  it('refuses a lower-priority clip unless forced', () => {
    const mixer = new Mixer();
    mixer.play(steady('important', 5, 3));
    expect(mixer.play(steady('minor', 1, 1))).toBe(false);
    expect(mixer.current('gesture')?.name).toBe('important');
    expect(mixer.play(steady('minor', 1, 1), { force: true })).toBe(true);
  });

  it('falls back to the default clip when a one-shot ends', () => {
    const mixer = new Mixer();
    mixer.setDefault('body', BODY_CLIPS.idle);
    mixer.play(BODY_CLIPS.jump);
    expect(mixer.current('body')?.name).toBe('jump');
    for (let t = 0; t < BODY_CLIPS.jump.duration + 600; t += 16) mixer.update(16);
    expect(mixer.current('body')?.name).toBe('idle');
  });

  it('starts from the rest pose', () => {
    expect(new Mixer().update(16)).toEqual(REST_POSE);
  });
});

describe('clip library', () => {
  it('maps every stored gesture and emotion', () => {
    for (const clip of Object.values(GESTURE_TO_CLIP)) expect(GESTURE_CLIPS[clip]).toBeDefined();
    for (const name of Object.values(EMOTION_TO_EXPRESSION))
      expect(EXPRESSIONS[name]).toBeDefined();
  });

  it('samples finite values from every clip', () => {
    const clips = [...Object.values(BODY_CLIPS), ...Object.values(GESTURE_CLIPS)];
    for (const clip of clips) {
      for (const t of [0, clip.duration / 3, clip.duration / 2, clip.duration]) {
        for (const v of Object.values(clip.sample(t))) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it('walks in from off-stage and ends at the centre', () => {
    expect(BODY_CLIPS.walkIn.sample(0)['root.x']).toBeLessThan(-400);
    expect(BODY_CLIPS.walkIn.sample(BODY_CLIPS.walkIn.duration)['root.x']).toBeCloseTo(0);
  });
});

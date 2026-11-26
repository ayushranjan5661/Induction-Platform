import { describe, expect, it } from 'vitest';
import { CharacterController } from './controller';

const run = (c: CharacterController, ms: number) => {
  let pose = c.update(0);
  for (let t = 0; t < ms; t += 16) pose = c.update(16);
  return pose;
};

describe('CharacterController', () => {
  it('idles by default and plays gestures on top', () => {
    const c = new CharacterController({ random: () => 0.5 });
    run(c, 100);
    expect(c.playing('body')).toBe('idle');
    expect(c.play('wave')).toBe(true);
    expect(c.playing('gesture')).toBe('wave');
    const pose = run(c, 800);
    expect(pose['armR.s']).toBeGreaterThan(50);
  });

  it('changes the face with setExpression', () => {
    const c = new CharacterController({ random: () => 0.5 });
    c.setExpression('sad');
    const sad = run(c, 1500);
    c.setExpression('happy');
    const happy = run(c, 1500);
    expect(happy['mouth.smile']).toBeGreaterThan(sad['mouth.smile']);
  });

  it('uses the laughing face while a laugh plays, then returns', () => {
    const c = new CharacterController({ random: () => 0.5 });
    c.play('laugh');
    expect(run(c, 600)['eye.happy']).toBeGreaterThan(0.5);
    expect(run(c, 4000)['eye.happy']).toBeLessThan(0.2);
  });

  it('opens and closes the mouth while speaking', () => {
    const c = new CharacterController({ random: () => 0.5 });
    c.setSpeaking(true);
    c.speakWord('hello', 400);
    const opens: number[] = [];
    for (let i = 0; i < 40; i += 1) opens.push(c.update(16)['mouth.open']);
    expect(Math.max(...opens)).toBeGreaterThan(0.2);
    c.setSpeaking(false);
    expect(run(c, 600)['mouth.open']).toBeLessThan(0.1);
  });

  it('blinks on request', () => {
    const c = new CharacterController({ random: () => 0.5 });
    run(c, 300);
    c.blink();
    const pose = run(c, 64);
    expect(pose['eyeL.open']).toBeLessThan(0.3);
  });

  it('looks where it is told', () => {
    const c = new CharacterController({ random: () => 0.5 });
    c.lookAt('left', 5000);
    expect(run(c, 800)['gaze.x']).toBeLessThan(-0.6);
  });

  it('skips big moves when the viewer prefers reduced motion', () => {
    const c = new CharacterController({ reducedMotion: true });
    expect(c.play('walkIn')).toBe(false);
    expect(c.play('wave')).toBe(true);
  });

  it('stops gestures and body actions', () => {
    const c = new CharacterController({ random: () => 0.5 });
    c.play('sit');
    c.play('think');
    run(c, 200);
    c.stop('all');
    run(c, 50);
    expect(c.playing('gesture')).toBeNull();
    expect(c.playing('body')).toBe('idle');
  });
});

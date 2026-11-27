import { describe, expect, it } from 'vitest';
import { LoginThrottle } from './login-throttle';
import { sessionRevoked } from './auth.service';

const limits = { perEmail: 3, perAddress: 5, windowMs: 60_000 };

describe('LoginThrottle', () => {
  it('blocks an email after its failures run out, then lets it in after the window', () => {
    let t = 0;
    const th = new LoginThrottle(limits, () => t);
    for (let i = 0; i < 3; i++) {
      expect(th.retryAfter('A@x.com', '1.1.1.1')).toBe(0);
      th.fail('A@x.com', '1.1.1.1');
    }
    expect(th.retryAfter('a@x.com', '2.2.2.2')).toBe(60);
    t = 60_000;
    expect(th.retryAfter('a@x.com', '2.2.2.2')).toBe(0);
  });

  it('blocks an address that tries many emails', () => {
    const th = new LoginThrottle(limits, () => 0);
    for (let i = 0; i < 5; i++) th.fail(`u${i}@x.com`, '9.9.9.9');
    expect(th.retryAfter('new@x.com', '9.9.9.9')).toBeGreaterThan(0);
    expect(th.retryAfter('new@x.com', '8.8.8.8')).toBe(0);
  });

  it('clears an email on success', () => {
    const th = new LoginThrottle(limits, () => 0);
    for (let i = 0; i < 3; i++) th.fail('a@x.com', `${i}`);
    th.succeed('a@x.com');
    expect(th.retryAfter('a@x.com', 'z')).toBe(0);
  });
});

describe('sessionRevoked', () => {
  const changed = new Date(1_700_000_000_500);
  it('refuses tokens issued before the change and accepts ones from the same second on', () => {
    expect(sessionRevoked(1_699_999_999, changed)).toBe(true);
    expect(sessionRevoked(1_700_000_000, changed)).toBe(false);
    expect(sessionRevoked(1_700_000_001, changed)).toBe(false);
    expect(sessionRevoked(1, null)).toBe(false);
  });
});

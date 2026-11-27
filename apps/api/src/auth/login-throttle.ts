/**
 * Slows down password guessing: after too many failed sign-ins for one email, or from one
 * address, further attempts are refused for a while. In memory, per API process; enough for a
 * single server. A successful sign-in clears that email's count.
 */
export interface ThrottleLimits {
  /** Failures allowed per email in the window. */
  perEmail: number;
  /** Failures allowed per client address in the window. */
  perAddress: number;
  windowMs: number;
}

export const DEFAULT_LIMITS: ThrottleLimits = {
  perEmail: 8,
  perAddress: 40,
  windowMs: 15 * 60 * 1000,
};

interface Bucket {
  count: number;
  resetAt: number;
}

export class LoginThrottle {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limits: ThrottleLimits = DEFAULT_LIMITS,
    private readonly now: () => number = Date.now,
  ) {}

  /** Seconds to wait before trying again, or 0 when an attempt is allowed. */
  retryAfter(email: string, address: string): number {
    const t = this.now();
    let wait = 0;
    for (const [key, max] of this.keys(email, address)) {
      const b = this.live(key, t);
      if (b && b.count >= max) wait = Math.max(wait, Math.ceil((b.resetAt - t) / 1000));
    }
    return wait;
  }

  fail(email: string, address: string): void {
    const t = this.now();
    for (const [key] of this.keys(email, address)) {
      const b = this.live(key, t);
      if (b) b.count += 1;
      else this.buckets.set(key, { count: 1, resetAt: t + this.limits.windowMs });
    }
    if (this.buckets.size > 10_000) this.sweep(t);
  }

  succeed(email: string): void {
    this.buckets.delete(`e:${email.toLowerCase()}`);
  }

  private keys(email: string, address: string): [string, number][] {
    return [
      [`e:${email.toLowerCase()}`, this.limits.perEmail],
      [`a:${address}`, this.limits.perAddress],
    ];
  }

  private live(key: string, t: number): Bucket | undefined {
    const b = this.buckets.get(key);
    if (b && b.resetAt <= t) {
      this.buckets.delete(key);
      return undefined;
    }
    return b;
  }

  private sweep(t: number): void {
    for (const [key, b] of this.buckets) if (b.resetAt <= t) this.buckets.delete(key);
  }
}

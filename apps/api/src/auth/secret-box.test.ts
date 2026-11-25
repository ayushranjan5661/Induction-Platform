import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Env } from '../config/env';
import { SecretBox } from './secret-box';

const boxWith = (values: Partial<Env>) =>
  new SecretBox({
    get: (key: keyof Env) => values[key],
  } as unknown as ConfigService<Env, true>);

describe('SecretBox', () => {
  const box = boxWith({ JWT_SECRET: 'test-secret-at-least-16' });

  it('decrypts what it encrypts', () => {
    const sealed = box.encrypt('Blue-Tiger-42!');
    expect(sealed).not.toContain('Blue-Tiger');
    expect(box.decrypt(sealed)).toBe('Blue-Tiger-42!');
  });

  it('uses a fresh IV each time', () => {
    expect(box.encrypt('same')).not.toBe(box.encrypt('same'));
  });

  it('returns null for tampered data or a different key', () => {
    const sealed = box.encrypt('secret');
    const bytes = Buffer.from(sealed, 'base64');
    bytes.writeUInt8(bytes.readUInt8(bytes.length - 1) ^ 1, bytes.length - 1);
    expect(box.decrypt(bytes.toString('base64'))).toBeNull();
    const other = boxWith({ JWT_SECRET: 'a-different-secret-value' });
    expect(other.decrypt(sealed)).toBeNull();
  });
});

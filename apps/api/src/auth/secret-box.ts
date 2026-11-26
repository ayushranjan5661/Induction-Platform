import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import type { Env } from '../config/env';

/**
 * AES-256-GCM encryption for the readable secrets the database keeps: a system-set
 * default password (shown until the user replaces it) and a candidate's invite token
 * (shown while the link is valid).
 * The key comes from CREDENTIALS_KEY, or is derived from JWT_SECRET when that is unset.
 * Stored format: base64(iv | tag | ciphertext).
 */
@Injectable()
export class SecretBox {
  private readonly key: Buffer;

  constructor(config: ConfigService<Env, true>) {
    const material: string =
      config.get('CREDENTIALS_KEY', { infer: true }) ??
      config.get('JWT_SECRET', { infer: true }) ??
      '';
    if (!material) throw new Error('JWT_SECRET or CREDENTIALS_KEY is required');
    this.key = Buffer.from(
      hkdfSync('sha256', material, 'induction', 'default-password-display', 32),
    );
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
  }

  /** Null when the value cannot be read (for example after the key changed). */
  decrypt(sealed: string): string | null {
    try {
      const raw = Buffer.from(sealed, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', this.key, raw.subarray(0, 12));
      decipher.setAuthTag(raw.subarray(12, 28));
      return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    } catch {
      return null;
    }
  }
}

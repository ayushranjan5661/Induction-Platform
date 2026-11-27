/** Password hashing, system-set default passwords and invite-link tokens. Node crypto only. */
import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

/** scrypt on the libuv thread pool, so hashing never blocks other requests. */
function scryptAsync(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** Returns `scrypt$<salt>$<hash>` (hex). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  if (expected.length === 0) return false;
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// No look-alike characters (0/O, 1/l/I), so a password read out or typed by hand works first time.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '@#$%&*';

const pick = (alphabet: string): string => alphabet[randomInt(alphabet.length)] ?? 'x';

/** A random 12-character default password with upper, lower, digit and symbol. */
export function generatePassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT), pick(SYMBOL)];
  const all = UPPER + LOWER + DIGIT;
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j] ?? 'x', chars[i] ?? 'x'];
  }
  return chars.join('');
}

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** A new invite token. Only the hash is stored; the token itself goes in the link. */
export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export const INVITE_DAYS = 14;
export const inviteExpiry = (): Date => new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { SESSION_HOURS } from './auth.types';
import { hashPassword, hashToken, verifyPassword } from './password';

export interface Session {
  userId: string;
  /** The session began with a default password that still has to be replaced. */
  mustChangePassword: boolean;
}

// Compared against when the email is unknown, so both cases take about as long.
const DUMMY_HASH = hashPassword('not-a-real-password');

/**
 * Sign-in: email and password, or a candidate's invite link. Company SSO can
 * be added later as another way to obtain a user without touching the rest.
 */
@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.secret = config.get('JWT_SECRET', { infer: true });
    this.isProduction = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  /** Password-less sign-in for the seeded demo accounts. Never available in production. */
  get devLoginEnabled(): boolean {
    return !this.isProduction && this.config.get('AUTH_PROVIDER', { infer: true }) === 'dev';
  }

  get secureCookies(): boolean {
    return this.isProduction;
  }

  get appUrl(): string {
    return this.config.get('APP_URL', { infer: true }).replace(/\/$/, '');
  }

  inviteUrl(token: string): string {
    return `${this.appUrl}/invite/${token}`;
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    return user && user.isActive && user.passwordHash && ok ? user : null;
  }

  async authenticateDev(email: string): Promise<User | null> {
    if (!this.devLoginEnabled) return null;
    return this.prisma.user.findFirst({ where: { email, isActive: true } });
  }

  /** Invite links work for active candidates until they expire. */
  async authenticateInvite(token: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { inviteTokenHash: hashToken(token) },
    });
    if (!user || !user.isActive || user.role !== 'LEARNER') return null;
    if (!user.inviteExpiresAt || user.inviteExpiresAt.getTime() < Date.now()) return null;
    return user;
  }

  signSession(userId: string, mustChangePassword = false): string {
    return jwt.sign({ sub: userId, ...(mustChangePassword ? { mcp: true } : {}) }, this.secret, {
      algorithm: 'HS256',
      expiresIn: `${SESSION_HOURS}h`,
    });
  }

  /** Returns the session, or null when the token is missing, forged or expired. */
  verifySession(token: string): Session | null {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload !== 'object' || typeof payload.sub !== 'string') return null;
      return { userId: payload.sub, mustChangePassword: payload.mcp === true };
    } catch {
      return null;
    }
  }
}

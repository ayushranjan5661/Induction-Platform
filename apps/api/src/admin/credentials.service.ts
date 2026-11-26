import { Injectable } from '@nestjs/common';
import type { CredentialsDto } from '@induction/shared';
import { AuthService } from '../auth/auth.service';
import type { AuthUser } from '../auth/auth.types';
import { generatePassword, hashPassword, inviteExpiry, newInviteToken } from '../auth/password';
import { SecretBox } from '../auth/secret-box';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Issues sign-in details: a system-set default password and, for candidates,
 * an invite link. The database keeps hashes for sign-in. The default password and
 * the invite token are also kept AES-GCM encrypted (owner-approved) so admins and HR
 * can show them again: the password until the user replaces it, the link while it is
 * valid. Readable values are never logged or audited.
 */
@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly box: SecretBox,
  ) {}

  async issue(
    actor: AuthUser,
    userId: string,
    what: { password: boolean; invite: boolean },
    action: string,
  ): Promise<CredentialsDto> {
    const password = what.password ? generatePassword() : null;
    const invite = what.invite ? newInviteToken() : null;
    const expires = invite ? inviteExpiry() : null;

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(password
            ? {
                passwordHash: hashPassword(password),
                mustChangePassword: true,
                defaultPasswordEnc: this.box.encrypt(password),
              }
            : {}),
          ...(invite
            ? {
                inviteTokenHash: invite.hash,
                inviteTokenEnc: this.box.encrypt(invite.token),
                inviteExpiresAt: expires,
              }
            : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action,
          entityType: 'user',
          entityId: userId,
          // Never the password or the token themselves.
          details: { password: what.password, invite: what.invite },
        },
      });
      return updated;
    });

    return {
      userId: user.id,
      firstName: user.firstName,
      email: user.email,
      employeeId: user.employeeId,
      password,
      inviteUrl: invite ? this.auth.inviteUrl(invite.token) : null,
      inviteExpiresAt: expires?.toISOString() ?? null,
      signInUrl: this.auth.signInUrl(user.role),
      isActive: user.isActive,
      inviteHidden: false,
    };
  }

  /**
   * The sign-in details as stored now: the default password while the user still has it, and
   * the invite link while it is valid. Audited without the values.
   */
  async view(actor: AuthUser, userId: string, action: string): Promise<CredentialsDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const password =
      user.passwordHash !== null && user.mustChangePassword && user.defaultPasswordEnc
        ? this.box.decrypt(user.defaultPasswordEnc)
        : null;
    const linkValid =
      user.inviteTokenHash !== null && (user.inviteExpiresAt?.getTime() ?? 0) > Date.now();
    const token = linkValid && user.inviteTokenEnc ? this.box.decrypt(user.inviteTokenEnc) : null;
    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        entityType: 'user',
        entityId: userId,
        details: { password: password !== null, invite: token !== null },
      },
    });
    return {
      userId: user.id,
      firstName: user.firstName,
      email: user.email,
      employeeId: user.employeeId,
      password,
      inviteUrl: token ? this.auth.inviteUrl(token) : null,
      inviteExpiresAt: token ? (user.inviteExpiresAt?.toISOString() ?? null) : null,
      signInUrl: this.auth.signInUrl(user.role),
      isActive: user.isActive,
      inviteHidden: linkValid && token === null,
    };
  }
}

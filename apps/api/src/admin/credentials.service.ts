import { Injectable } from '@nestjs/common';
import type { CredentialsDto } from '@induction/shared';
import { AuthService } from '../auth/auth.service';
import type { AuthUser } from '../auth/auth.types';
import { generatePassword, hashPassword, inviteExpiry, newInviteToken } from '../auth/password';
import { SecretBox } from '../auth/secret-box';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Issues sign-in details: a system-set default password and, for candidates,
 * an invite link. The database keeps hashes for sign-in. For staff accounts only,
 * the default password is also kept AES-GCM encrypted so admins can see it until
 * the user replaces it. Readable values are never logged or audited.
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
      const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      // Staff default passwords are kept encrypted so admins can see them until changed.
      const staff = current.role !== 'LEARNER';
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(password
            ? {
                passwordHash: hashPassword(password),
                mustChangePassword: true,
                defaultPasswordEnc: staff ? this.box.encrypt(password) : null,
              }
            : {}),
          ...(invite ? { inviteTokenHash: invite.hash, inviteExpiresAt: expires } : {}),
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
      email: user.email,
      employeeId: user.employeeId,
      password,
      inviteUrl: invite ? this.auth.inviteUrl(invite.token) : null,
      inviteExpiresAt: expires?.toISOString() ?? null,
      signInUrl: this.auth.signInUrl(user.role),
    };
  }
}

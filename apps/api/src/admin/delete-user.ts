import type { User } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Permanently deletes an account. Their progress, answers, acknowledgments, feedback and
 * saved drafts go with it (cascade). Audit entries and content reviews they made are kept,
 * with the person link cleared. The deletion itself is audited without name or email.
 */
export async function deleteUser(
  prisma: PrismaService,
  actor: AuthUser,
  user: User,
  action: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.delete({ where: { id: user.id } }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        entityType: 'user',
        entityId: user.id,
        details: { role: user.role, employeeId: user.employeeId },
      },
    }),
  ]);
}

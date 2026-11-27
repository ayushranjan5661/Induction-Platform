import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';

/**
 * Makes sure the Admin account named by SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD exists,
 * is active, has the Admin role and signs in with that password. Runs at every startup,
 * so changing the password in .env and restarting resets it. Does nothing when unset.
 */
@Injectable()
export class SuperAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** True for the account named by SUPER_ADMIN_EMAIL. Other admins cannot change it. */
  isSuperAdmin(email: string): boolean {
    const superEmail = this.config.get('SUPER_ADMIN_EMAIL', { infer: true });
    return Boolean(superEmail) && email.toLowerCase() === superEmail?.toLowerCase();
  }

  async onApplicationBootstrap(): Promise<void> {
    const rawEmail = this.config.get('SUPER_ADMIN_EMAIL', { infer: true });
    const password = this.config.get('SUPER_ADMIN_PASSWORD', { infer: true });
    if (!rawEmail || !password) return;

    // Sign-in lowercases the email, so store it the same way.
    const email = rawEmail.toLowerCase();
    const name = this.config.get('SUPER_ADMIN_NAME', { infer: true });
    const [firstName = 'Super', ...rest] = name.split(/\s+/);
    const lastName = rest.join(' ') || 'Admin';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await this.prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          firstName,
          lastName,
          department: 'Administration',
          location: 'Head office',
          role: 'ADMIN',
          joiningDate: new Date(),
        },
      });
      this.logger.log('Super admin account created');
      return;
    }

    const passwordChanged = !(await verifyPassword(password, existing.passwordHash));
    if (passwordChanged || existing.role !== 'ADMIN' || !existing.isActive) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'ADMIN',
          isActive: true,
          ...(passwordChanged
            ? {
                passwordHash: await hashPassword(password),
                mustChangePassword: false,
                defaultPasswordEnc: null,
                sessionsValidFrom: new Date(),
              }
            : {}),
        },
      });
      this.logger.log('Super admin account updated');
    }
  }
}

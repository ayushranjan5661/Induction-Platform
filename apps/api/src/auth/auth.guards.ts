import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@induction/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, sessionRevoked } from './auth.service';
import {
  ALLOW_DEFAULT_PASSWORD,
  CANDIDATE_SESSION_COOKIE,
  IS_PUBLIC,
  isRoleAllowed,
  portalOf,
  ROLES,
  SESSION_COOKIE,
  sessionCookieName,
  type AuthedRequest,
} from './auth.types';

/** Requires a valid session cookie on every route not marked @Public(). */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const portal = portalOf(req);
    const base = portal === 'candidate' ? CANDIDATE_SESSION_COOKIE : SESSION_COOKIE;
    const token = cookies?.[sessionCookieName(base, req)];
    const session = typeof token === 'string' ? this.auth.verifySession(token) : null;
    if (!session) throw new UnauthorizedException('Please sign in');
    const userId = session.userId;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { businessUnit: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Please sign in');
    // A password change or reset ends every session that began before it.
    if (sessionRevoked(session.issuedAt, user.sessionsValidFrom))
      throw new UnauthorizedException('Please sign in');
    // The candidate app only serves candidates and the staff app only staff.
    if ((portal === 'candidate') !== (user.role === 'LEARNER'))
      throw new UnauthorizedException('Please sign in');

    // A default password only opens the door far enough to replace it.
    const mustChangePassword = session.mustChangePassword && user.mustChangePassword;
    if (mustChangePassword) {
      const allowed = this.reflector.getAllAndOverride<boolean | undefined>(
        ALLOW_DEFAULT_PASSWORD,
        [ctx.getHandler(), ctx.getClass()],
      );
      if (!allowed) throw new ForbiddenException('Set a new password to continue');
    }

    req.user = {
      mustChangePassword,
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      businessUnit: user.businessUnit
        ? { id: user.businessUnit.id, slug: user.businessUnit.slug, name: user.businessUnit.name }
        : null,
    };
    return true;
  }
}

/** Enforces @Roles(). Runs after SessionGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const role = ctx.switchToHttp().getRequest<AuthedRequest>().user?.role;
    if (!isRoleAllowed(required, role)) {
      throw new ForbiddenException('You do not have access to this area');
    }
    return true;
  }
}

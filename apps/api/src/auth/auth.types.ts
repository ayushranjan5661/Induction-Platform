import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Role } from '@induction/shared';
import type { Request } from 'express';

export const SESSION_COOKIE = 'induction_session';
export const SESSION_HOURS = 8;

/** The signed-in user, loaded fresh from the database on every request. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  businessUnit: { id: string; slug: string; name: string } | null;
  /** Signed in with the system-set default password and has not replaced it yet. */
  mustChangePassword: boolean;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}

export const IS_PUBLIC = 'auth:isPublic';
export const ROLES = 'auth:roles';
export const ALLOW_DEFAULT_PASSWORD = 'auth:allowDefaultPassword';

/** Route stays reachable while the user still has to replace a default password. */
export const AllowDefaultPassword = () => SetMetadata(ALLOW_DEFAULT_PASSWORD, true);

/** Route needs no session. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Route is limited to these roles. Without it, any signed-in user may call it. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new Error('CurrentUser used on a route without a session');
    return user;
  },
);

/** Pure role check, shared by the guard and its tests. */
export function isRoleAllowed(
  required: readonly Role[] | undefined,
  role: Role | undefined,
): boolean {
  if (!required || required.length === 0) return role !== undefined;
  return role !== undefined && required.includes(role);
}

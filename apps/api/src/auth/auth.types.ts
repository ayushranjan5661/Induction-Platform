import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Role } from '@induction/shared';
import type { Request } from 'express';

export const SESSION_COOKIE = 'induction_session';
export const SESSION_HOURS = 8;

/**
 * Candidates use their own web app (its own port). Browsers share cookies across ports on one
 * host, so each app has its own session cookie and names itself in the `x-portal` header.
 */
export const CANDIDATE_SESSION_COOKIE = 'induction_candidate_session';
export const PORTAL_HEADER = 'x-portal';
export type Portal = 'staff' | 'candidate';

export const sessionCookieFor = (role: Role): string =>
  role === 'LEARNER' ? CANDIDATE_SESSION_COOKIE : SESSION_COOKIE;

/**
 * Browser tabs share cookies, so without this, signing in as someone else in one tab would sign
 * every other tab in as them too. Each tab names its own session in the `x-session` header and
 * gets its own httpOnly cookie (`<base>_<id>`). Requests without a valid id use the base cookie.
 */
export const TAB_SESSION_HEADER = 'x-session';
const TAB_ID = /^[A-Za-z0-9]{8,40}$/;
export const isTabId = (id: string): boolean => TAB_ID.test(id);

export function sessionCookieName(base: string, req: Request): string {
  const id = req.headers[TAB_SESSION_HEADER];
  return typeof id === 'string' && isTabId(id) ? `${base}_${id}` : base;
}

/** Which app sent the request. Anything without the header counts as the staff app. */
export const portalOf = (req: Request): Portal =>
  req.headers[PORTAL_HEADER] === 'candidate' ? 'candidate' : 'staff';

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

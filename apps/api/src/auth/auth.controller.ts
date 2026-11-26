import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ChangePasswordSchema,
  DevLoginSchema,
  InviteLoginSchema,
  LoginSchema,
  ROLES,
  type ChangePasswordInput,
  type DevUserDto,
  type InvitePreviewDto,
  type LoginInput,
  type LoginResultDto,
  type MeDto,
  type Role,
} from '@induction/shared';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import {
  AllowDefaultPassword,
  CANDIDATE_SESSION_COOKIE,
  CurrentUser,
  isTabId,
  portalOf,
  Public,
  SESSION_COOKIE,
  SESSION_HOURS,
  sessionCookieFor,
  sessionCookieName,
  type AuthUser,
} from './auth.types';
import { hashPassword, verifyPassword } from './password';

const DEV_NOTES: Record<Role, string> = {
  ADMIN: 'Presenters, content, HR accounts, dashboard',
  HR_ADMIN: 'Invites candidates and tracks their progress',
  LEGAL_REVIEWER: 'Reviews Policies and Compliance',
  LEARNER: 'Candidate',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  /** Candidates get the candidate app's cookie, staff the staff app's; one per browser tab. */
  private startSession(
    req: Request,
    res: Response,
    user: { id: string; role: Role },
    mustChangePassword: boolean,
  ): LoginResultDto {
    const name = sessionCookieName(sessionCookieFor(user.role), req);
    res.cookie(name, this.auth.signSession(user.id, mustChangePassword), {
      httpOnly: true,
      secure: this.auth.secureCookies,
      sameSite: 'lax',
      maxAge: SESSION_HOURS * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, mustChangePassword };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodPipe(LoginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    const user = await this.auth.authenticate(body.email, body.password);
    if (!user) throw new UnauthorizedException('The email or password is not right');
    // Each page signs in only its own people (checked after the password, so it reveals nothing).
    if (body.portal === 'candidate' && user.role !== 'LEARNER') {
      throw new UnauthorizedException(
        'This page is for candidates. Admin, HR and Legal staff sign in on the staff page.',
      );
    }
    if (body.portal === 'staff' && user.role === 'LEARNER') {
      throw new UnauthorizedException(
        'This page is for staff. Candidates sign in on the candidate page.',
      );
    }
    return this.startSession(req, res, user, user.mustChangePassword);
  }

  /** The invitation landing page: who the link is for, before they start. Signs nobody in. */
  @Public()
  @Post('invite/check')
  @HttpCode(200)
  async inviteCheck(
    @Body(new ZodPipe(InviteLoginSchema)) body: z.infer<typeof InviteLoginSchema>,
  ): Promise<InvitePreviewDto> {
    const user = await this.auth.authenticateInvite(body.token);
    if (!user?.inviteExpiresAt) {
      throw new UnauthorizedException(
        'This invitation link is not valid any more. Please ask HR for a new one.',
      );
    }
    return { firstName: user.firstName, expiresAt: user.inviteExpiresAt.toISOString() };
  }

  /** Dev convenience: sign in as a seeded demo account without a password. Off in production. */
  @Public()
  @Post('dev-login')
  @HttpCode(200)
  async devLogin(
    @Body(new ZodPipe(DevLoginSchema)) body: z.infer<typeof DevLoginSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    if (!this.auth.devLoginEnabled) throw new ForbiddenException('Demo sign-in is switched off');
    const user = await this.auth.authenticateDev(body.email);
    if (!user)
      throw new UnauthorizedException('We could not find an active account for that email');
    return this.startSession(req, res, user, false);
  }

  /** A candidate opening the link HR sent them. */
  @Public()
  @Post('invite')
  @HttpCode(200)
  async invite(
    @Body(new ZodPipe(InviteLoginSchema)) body: z.infer<typeof InviteLoginSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    const user = await this.auth.authenticateInvite(body.token);
    if (!user) {
      throw new UnauthorizedException(
        'This invitation link is not valid any more. Please ask HR for a new one.',
      );
    }
    return this.startSession(req, res, user, false);
  }

  @AllowDefaultPassword()
  @Post('change-password')
  @HttpCode(200)
  async changePassword(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(ChangePasswordSchema)) body: ChangePasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResultDto> {
    const user = await this.prisma.user.findUnique({ where: { id: actor.id } });
    if (!user) throw new UnauthorizedException('Please sign in');
    if (user.passwordHash && !verifyPassword(body.currentPassword, user.passwordHash)) {
      throw new BadRequestException('Your current password is not right');
    }
    if (body.newPassword === body.currentPassword) {
      throw new BadRequestException('Choose a password that is different from the current one');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        // The user's own password replaces the default; the readable default copy is wiped.
        data: {
          passwordHash: hashPassword(body.newPassword),
          mustChangePassword: false,
          defaultPasswordEnc: null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'user.change-password',
          entityType: 'user',
          entityId: user.id,
          details: {},
        },
      }),
    ]);
    return this.startSession(req, res, user, false);
  }

  @AllowDefaultPassword()
  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): { ok: true } {
    // Only this tab in this app signs out; other tabs and the other app keep their sessions.
    const base = portalOf(req) === 'candidate' ? CANDIDATE_SESSION_COOKIE : SESSION_COOKIE;
    res.clearCookie(sessionCookieName(base, req), { path: '/' });
    return { ok: true };
  }

  /**
   * A newly opened tab starts as a copy of the tab that signed in last, under its own id, so
   * signing in or out later in either tab never changes the other. Copies only a valid session
   * cookie this browser already holds; it never signs anyone in from scratch.
   */
  @Public()
  @Post('fork')
  @HttpCode(200)
  fork(
    @Req() req: Request,
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): { ok: boolean } {
    const from = (body as { from?: unknown } | null)?.from;
    const base = portalOf(req) === 'candidate' ? CANDIDATE_SESSION_COOKIE : SESSION_COOKIE;
    const target = sessionCookieName(base, req);
    if (typeof from !== 'string' || !isTabId(from) || target === base) return { ok: false };
    const source = `${base}_${from}`;
    if (source === target) return { ok: false };
    const token = (req.cookies as Record<string, unknown> | undefined)?.[source];
    if (typeof token !== 'string' || !this.auth.verifySession(token)) return { ok: false };
    // The token keeps its own expiry; the guard re-checks the user on every request.
    res.cookie(target, token, {
      httpOnly: true,
      secure: this.auth.secureCookies,
      sameSite: 'lax',
      maxAge: SESSION_HOURS * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true };
  }

  @AllowDefaultPassword()
  @Get('me')
  me(@CurrentUser() user: AuthUser): MeDto {
    return user;
  }

  /** Dev convenience: a few seeded accounts to sign in with. Empty in production. */
  @Public()
  @Get('dev-users')
  async devUsers(): Promise<DevUserDto[]> {
    if (!this.auth.devLoginEnabled) return [];
    const [staff, learners] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { not: 'LEARNER' }, isActive: true, email: { endsWith: '@example.com' } },
        orderBy: { email: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { role: 'LEARNER', isActive: true, email: { endsWith: '@example.com' } },
        include: { enrollment: true },
        orderBy: { email: 'asc' },
      }),
    ]);
    const pickLearner = (status: string) =>
      learners.find((l) => (l.enrollment?.status ?? 'NOT_STARTED') === status);
    const samples = [
      { user: pickLearner('NOT_STARTED'), note: 'New joiner, not started' },
      { user: pickLearner('IN_PROGRESS'), note: 'Part-way through' },
      { user: pickLearner('COMPLETED'), note: 'Completed the induction' },
    ];
    return [
      ...[...staff]
        .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
        .map((u) => ({
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          note: DEV_NOTES[u.role],
        })),
      ...samples.flatMap(({ user, note }) =>
        user
          ? [
              {
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role,
                note,
              },
            ]
          : [],
      ),
    ];
  }
}

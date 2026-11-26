import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CandidateCreateSchema,
  type CandidateCreateInput,
  type CandidateDto,
  type CredentialsDto,
} from '@induction/shared';
import { z } from 'zod';
import { CredentialsService } from '../admin/credentials.service';
import { deleteUser } from '../admin/delete-user';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import { PrismaService } from '../prisma/prisma.service';

const ActiveSchema = z.object({ isActive: z.boolean() });

const capitalise = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/** "priya.nair2@example.com" -> { firstName: "Priya", lastName: "Nair" } */
export function nameFromEmail(email: string): { firstName: string; lastName: string } {
  const words = (email.split('@')[0] ?? '')
    .split(/[._\-+]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean)
    .map(capitalise);
  return { firstName: words[0] ?? 'Candidate', lastName: words.slice(1).join(' ') };
}

/** HR's candidate list: invite someone with an employee id and email, then share the link or the login. */
@Roles('HR_ADMIN', 'ADMIN')
@Controller('hr/candidates')
export class CandidatesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
  ) {}

  @Get()
  async list(): Promise<CandidateDto[]> {
    const [users, totalModules] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'LEARNER' },
        include: {
          enrollment: true,
          moduleProgress: { where: { status: 'COMPLETED', module: { status: 'PUBLISHED' } } },
          attempts: { where: { attemptNo: 1 } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.module.count({ where: { status: 'PUBLISHED' } }),
    ]);
    const now = Date.now();
    return users.map((u) => {
      const correct = u.attempts.filter((a) => a.isCorrect).length;
      return {
        id: u.id,
        employeeId: u.employeeId,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
        isActive: u.isActive,
        status: u.enrollment?.status ?? 'NOT_STARTED',
        modulesCompleted: u.moduleProgress.length,
        totalModules,
        correctAnswers: correct,
        wrongAnswers: u.attempts.length - correct,
        hasPassword: u.passwordHash !== null,
        inviteActive: u.inviteTokenHash !== null && (u.inviteExpiresAt?.getTime() ?? 0) > now,
        inviteExpiresAt: u.inviteExpiresAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    });
  }

  /** Creates the candidate and returns the invite link and default password, shown once. */
  @Post()
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(CandidateCreateSchema)) body: CandidateCreateInput,
  ): Promise<CredentialsDto> {
    if (await this.prisma.user.findUnique({ where: { email: body.email } })) {
      throw new ConflictException('Someone with that email already exists');
    }
    if (await this.prisma.user.findUnique({ where: { employeeId: body.employeeId } })) {
      throw new ConflictException('That employee id is already in use');
    }
    const guessed = nameFromEmail(body.email);
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        employeeId: body.employeeId,
        firstName: body.firstName || guessed.firstName,
        lastName: body.firstName ? body.lastName : body.lastName || guessed.lastName,
        department: 'Not set',
        location: 'Not set',
        role: 'LEARNER',
        joiningDate: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`),
        enrollment: { create: {} },
      },
    });
    return this.credentials.issue(
      actor,
      user.id,
      { password: true, invite: true },
      'candidate.create',
    );
  }

  private async candidate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'LEARNER') throw new NotFoundException('Candidate not found');
    return user;
  }

  /** Permanently deletes a candidate with all their induction progress and answers. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() actor: AuthUser, @Param('id') id: string): Promise<void> {
    const user = await this.candidate(id);
    await deleteUser(this.prisma, actor, user, 'candidate.delete');
  }

  /** A fresh link. The previous link stops working. */
  @Post(':id/invite')
  @HttpCode(200)
  async invite(@CurrentUser() actor: AuthUser, @Param('id') id: string): Promise<CredentialsDto> {
    await this.candidate(id);
    return this.credentials.issue(actor, id, { password: false, invite: true }, 'candidate.invite');
  }

  /** A fresh default password. The previous password stops working. */
  @Post(':id/reset-password')
  @HttpCode(200)
  async resetPassword(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
  ): Promise<CredentialsDto> {
    await this.candidate(id);
    return this.credentials.issue(
      actor,
      id,
      { password: true, invite: false },
      'candidate.reset-password',
    );
  }

  /** Switching a candidate off blocks both their password and their link. */
  @Put(':id/active')
  async setActive(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(ActiveSchema)) body: z.infer<typeof ActiveSchema>,
  ): Promise<{ ok: true }> {
    await this.candidate(id);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        // Blocking also voids the current link, so re-activating needs a fresh invite.
        data: body.isActive
          ? { isActive: true }
          : { isActive: false, inviteTokenHash: null, inviteExpiresAt: null },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'candidate.set-active',
          entityType: 'user',
          entityId: id,
          details: { isActive: body.isActive },
        },
      }),
    ]);
    return { ok: true };
  }
}

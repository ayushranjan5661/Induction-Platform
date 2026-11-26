import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  CsvImportSchema,
  UserUpsertSchema,
  type AdminUserDto,
  type CredentialsDto,
  type CsvImportResultDto,
  type UserUpsertInput,
} from '@induction/shared';
import type { Prisma, User } from '@prisma/client';
import { SecretBox } from '../auth/secret-box';
import { SuperAdminService } from '../auth/super-admin.service';
import { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from './credentials.service';
import { parseCsv } from './csv';
import { deleteUser } from './delete-user';

const CSV_COLUMNS = [
  'email',
  'firstName',
  'lastName',
  'department',
  'location',
  'businessUnit',
  'joiningDate',
] as const;

const ActiveSchema = z.object({ isActive: z.boolean() });

@Roles('ADMIN')
@Controller('admin/users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
    private readonly superAdmin: SuperAdminService,
    private readonly box: SecretBox,
  ) {}

  /** Admins have full access, except that only the super admin may change the super admin account. */
  private async editable(actor: AuthUser, id: string): Promise<User> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('User not found');
    if (this.superAdmin.isSuperAdmin(target.email) && target.id !== actor.id) {
      throw new ForbiddenException('Only the super admin can change the super admin account');
    }
    return target;
  }

  @Get()
  async list(): Promise<AdminUserDto[]> {
    // Staff only: candidates are managed on the Candidates page.
    const users = await this.prisma.user.findMany({
      where: { role: { not: 'LEARNER' } },
      include: { businessUnit: true },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
    return users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      isSuperAdmin: this.superAdmin.isSuperAdmin(u.email),
      hasPassword: u.passwordHash !== null,
      mustChangePassword: u.passwordHash !== null && u.mustChangePassword,
      defaultPassword:
        u.passwordHash !== null && u.mustChangePassword && u.defaultPasswordEnc
          ? this.box.decrypt(u.defaultPasswordEnc)
          : null,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      department: u.department,
      location: u.location,
      businessUnitId: u.businessUnitId,
      businessUnitName: u.businessUnit?.name ?? null,
      role: u.role,
      joiningDate: u.joiningDate.toISOString().slice(0, 10),
      isActive: u.isActive,
    }));
  }

  private data(input: UserUpsertInput): Prisma.UserUncheckedCreateInput {
    return { ...input, joiningDate: new Date(`${input.joiningDate}T00:00:00Z`) };
  }

  @Post()
  async create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(UserUpsertSchema)) body: UserUpsertInput,
  ): Promise<CredentialsDto> {
    if (await this.prisma.user.findUnique({ where: { email: body.email } })) {
      throw new ConflictException('Someone with that email already exists');
    }
    await this.assertEmployeeIdFree(body.employeeId);
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...this.data(body),
          ...(body.role === 'LEARNER' ? { enrollment: { create: {} } } : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'user.create',
          entityType: 'user',
          entityId: user.id,
          details: { role: body.role },
        },
      });
      return user;
    });
    // Every new account gets a system-set default password; candidates also get an invite link.
    return this.credentials.issue(
      actor,
      created.id,
      { password: true, invite: created.role === 'LEARNER' },
      'user.issue-credentials',
    );
  }

  private async assertEmployeeIdFree(employeeId: string | null, exceptId?: string): Promise<void> {
    if (!employeeId) return;
    const clash = await this.prisma.user.findUnique({ where: { employeeId } });
    if (clash && clash.id !== exceptId)
      throw new ConflictException('That employee id is already in use');
  }

  /** The account's current sign-in details (eye button): the default password until changed. */
  @Get(':id/credentials')
  async viewCredentials(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
  ): Promise<CredentialsDto> {
    await this.editable(actor, id);
    return this.credentials.view(actor, id, 'user.view-credentials');
  }

  /** A fresh default password for any account. The old one stops working. */
  @Post(':id/reset-password')
  @HttpCode(200)
  async resetPassword(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
  ): Promise<CredentialsDto> {
    await this.editable(actor, id);
    return this.credentials.issue(
      actor,
      id,
      { password: true, invite: false },
      'user.reset-password',
    );
  }

  /**
   * Deactivating blocks the account at once: password sign-in, invite link and any open
   * session (the guard re-checks isActive on every request). Reactivating restores access.
   */
  @Put(':id/active')
  async setActive(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(ActiveSchema)) body: z.infer<typeof ActiveSchema>,
  ): Promise<{ ok: true }> {
    await this.editable(actor, id);
    if (id === actor.id && !body.isActive)
      throw new ConflictException('You cannot deactivate your own account');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive: body.isActive } }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'user.set-active',
          entityType: 'user',
          entityId: id,
          details: { isActive: body.isActive },
        },
      }),
    ]);
    return { ok: true };
  }

  /** Permanently deletes a staff account. Not your own, and not the super admin's. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() actor: AuthUser, @Param('id') id: string): Promise<void> {
    const target = await this.editable(actor, id);
    if (target.id === actor.id) throw new ConflictException('You cannot delete your own account');
    if (this.superAdmin.isSuperAdmin(target.email))
      throw new ForbiddenException('The super admin account cannot be deleted');
    if (target.role === 'LEARNER')
      throw new ConflictException('Delete candidates from the Candidates page');
    await deleteUser(this.prisma, actor, target, 'user.delete');
  }

  @Put(':id')
  async update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(UserUpsertSchema)) body: UserUpsertInput,
  ): Promise<{ ok: true }> {
    const existing = await this.editable(actor, id);
    // The super admin's email is fixed by SUPER_ADMIN_EMAIL; changing it here would orphan the account.
    if (
      this.superAdmin.isSuperAdmin(existing.email) &&
      body.email.toLowerCase() !== existing.email.toLowerCase()
    ) {
      throw new ConflictException('The super admin email is set in the server settings');
    }
    const clash = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (clash && clash.id !== id)
      throw new ConflictException('Someone with that email already exists');
    await this.assertEmployeeIdFree(body.employeeId, id);
    if (id === actor.id && (body.role !== 'ADMIN' || !body.isActive)) {
      throw new ConflictException('You cannot remove your own admin access');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        // Candidates never keep a readable default password.
        data: {
          ...this.data(body),
          ...(body.role === 'LEARNER' ? { defaultPasswordEnc: null } : {}),
        },
      });
      if (body.role === 'LEARNER') {
        await tx.enrollment.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'user.update',
          entityType: 'user',
          entityId: id,
          details: { role: body.role, isActive: body.isActive },
        },
      });
    });
    return { ok: true };
  }

  /**
   * CSV import of new joiners. Header row required:
   * email,firstName,lastName,department,location,businessUnit,joiningDate
   * Rows that fail validation or already exist are skipped and reported.
   */
  @Post('import')
  @HttpCode(200)
  async importCsv(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(CsvImportSchema)) body: z.infer<typeof CsvImportSchema>,
  ): Promise<CsvImportResultDto> {
    const rows = parseCsv(body.csv);
    const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
    const missing = CSV_COLUMNS.filter((c) => !header.includes(c.toLowerCase()));
    if (missing.length > 0) {
      return {
        created: 0,
        skipped: [{ line: 1, reason: `Missing column(s): ${missing.join(', ')}` }],
      };
    }
    const cell = (row: string[], column: string): string =>
      (row[header.indexOf(column.toLowerCase())] ?? '').trim();

    const units = await this.prisma.businessUnit.findMany();
    const findUnit = (value: string) =>
      units.find(
        (u) => u.slug === value.toLowerCase() || u.name.toLowerCase() === value.toLowerCase(),
      );

    const result: CsvImportResultDto = { created: 0, skipped: [] };
    const seen = new Set<string>();

    for (const [index, row] of rows.slice(1).entries()) {
      const line = index + 2;
      const unitValue = cell(row, 'businessUnit');
      const unit = unitValue ? findUnit(unitValue) : undefined;
      if (unitValue && !unit) {
        result.skipped.push({ line, reason: `Unknown business unit "${unitValue}"` });
        continue;
      }
      const parsed = UserUpsertSchema.safeParse({
        email: cell(row, 'email'),
        firstName: cell(row, 'firstName'),
        lastName: cell(row, 'lastName'),
        department: cell(row, 'department'),
        location: cell(row, 'location'),
        businessUnitId: unit?.id ?? null,
        joiningDate: cell(row, 'joiningDate'),
        role: 'LEARNER',
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        result.skipped.push({
          line,
          reason: `${issue?.path.join('.') ?? 'row'}: ${issue?.message ?? 'invalid'}`,
        });
        continue;
      }
      if (
        seen.has(parsed.data.email) ||
        (await this.prisma.user.findUnique({ where: { email: parsed.data.email } }))
      ) {
        result.skipped.push({ line, reason: `${parsed.data.email} already exists` });
        continue;
      }
      seen.add(parsed.data.email);
      await this.prisma.user.create({
        data: { ...this.data(parsed.data), enrollment: { create: {} } },
      });
      result.created++;
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: 'user.import',
        entityType: 'user',
        entityId: 'csv',
        details: { created: result.created, skipped: result.skipped.length },
      },
    });
    return result;
  }
}

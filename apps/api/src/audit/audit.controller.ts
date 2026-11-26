import { Controller, ForbiddenException, Get, Query } from '@nestjs/common';
import {
  AuditQuerySchema,
  type AuditEntryDto,
  type AuditLogDto,
  type AuditQuery,
} from '@induction/shared';
import type { AuditLog, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { SuperAdminService } from '../auth/super-admin.service';
import { ZodPipe } from '../common/zod.pipe';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import {
  actorFiltersFor,
  actorWhere,
  categoryOf,
  categoryWhere,
  dateWhere,
  publicDetails,
  scopeOf,
  summarize,
  visibleWhere,
} from './audit.logic';

/** Read-only audit trail, filtered to what the viewer's place in the hierarchy allows. */
@Roles('ADMIN', 'HR_ADMIN')
@Controller('audit')
export class AuditController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly superAdmin: SuperAdminService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  async list(
    @CurrentUser() viewer: AuthUser,
    @Query(new ZodPipe(AuditQuerySchema)) query: AuditQuery,
  ): Promise<AuditLogDto> {
    const configured = Boolean(this.config.get('SUPER_ADMIN_EMAIL', { infer: true }));
    const scope = scopeOf(viewer.role, this.superAdmin.isSuperAdmin(viewer.email), configured);
    if (!scope) throw new ForbiddenException('You do not have access to the audit log');
    const actorFilters = actorFiltersFor(scope);
    if (query.actor && !actorFilters.includes(query.actor)) {
      throw new ForbiddenException('You cannot see the actions of that group');
    }

    const and: Prisma.AuditLogWhereInput[] = [visibleWhere(scope, viewer.id), dateWhere(query)];
    if (query.category) and.push(categoryWhere(query.category));
    if (query.actor) and.push(actorWhere(query.actor, viewer.id));
    if (query.search) and.push(await this.searchWhere(query.search));
    const where: Prisma.AuditLogWhereInput = { AND: and };

    const [total, entries] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const labels = await this.labels(entries);
    return {
      total,
      actorFilters,
      scope,
      rows: entries.map((e) => this.toDto(e, labels)),
    };
  }

  /** Matches the actor, the action, or a person or module the entry is about. */
  private async searchWhere(search: string): Promise<Prisma.AuditLogWhereInput> {
    const contains = { contains: search, mode: 'insensitive' as const };
    const words = search.split(/\s+/).filter(Boolean);
    const [users, modules] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          AND: words.map((w) => ({
            OR: [
              { firstName: { contains: w, mode: 'insensitive' as const } },
              { lastName: { contains: w, mode: 'insensitive' as const } },
              { email: { contains: w, mode: 'insensitive' as const } },
              { employeeId: { contains: w, mode: 'insensitive' as const } },
            ],
          })),
        },
        select: { id: true },
        take: 200,
      }),
      this.prisma.module.findMany({ where: { title: contains }, select: { id: true }, take: 50 }),
    ]);
    const ids = [...users, ...modules].map((x) => x.id);
    return {
      OR: [
        { actorName: contains },
        { actorEmail: contains },
        { action: contains },
        ...(ids.length > 0 ? [{ entityId: { in: ids } }] : []),
      ],
    };
  }

  /** Names for what each entry is about. Steps and questions are named by their module. */
  private async labels(entries: AuditLog[]): Promise<Map<string, string>> {
    const ids = (type: string) => [
      ...new Set(entries.filter((e) => e.entityType === type).map((e) => e.entityId)),
    ];
    const moduleIdOf = (e: AuditLog): string | null => {
      const d = e.details as Record<string, unknown> | null;
      return typeof d?.moduleId === 'string' ? d.moduleId : null;
    };
    const [users, questions, avatars, units] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids('user') } },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.question.findMany({
        where: { id: { in: ids('question') } },
        select: { id: true, moduleId: true },
      }),
      this.prisma.avatar.findMany({
        where: { id: { in: ids('avatar') } },
        select: { id: true, name: true },
      }),
      this.prisma.businessUnit.findMany({
        where: { id: { in: ids('businessUnit') } },
        select: { id: true, name: true },
      }),
    ]);
    const questionModule = new Map(questions.map((q) => [q.id, q.moduleId]));
    const moduleIds = new Set<string>(ids('module'));
    for (const e of entries) {
      const m =
        e.entityType === 'question'
          ? (questionModule.get(e.entityId) ?? moduleIdOf(e))
          : e.entityType === 'step'
            ? moduleIdOf(e)
            : null;
      if (m) moduleIds.add(m);
    }
    const modules = await this.prisma.module.findMany({
      where: { id: { in: [...moduleIds] } },
      select: { id: true, title: true },
    });
    const moduleTitle = new Map(modules.map((m) => [m.id, m.title]));

    const out = new Map<string, string>();
    for (const u of users) out.set(`user:${u.id}`, `${u.firstName} ${u.lastName}`);
    // Deleted accounts: names are not kept, but the deletion entry records the employee id.
    const gone = ids('user').filter((id) => !users.some((u) => u.id === id));
    if (gone.length > 0) {
      const deletions = await this.prisma.auditLog.findMany({
        where: { action: { in: ['user.delete', 'candidate.delete'] }, entityId: { in: gone } },
        select: { entityId: true, details: true },
      });
      for (const d of deletions) {
        const employeeId = (d.details as Record<string, unknown> | null)?.employeeId;
        if (typeof employeeId === 'string' && employeeId) {
          out.set(`user:${d.entityId}`, `${employeeId} (deleted account)`);
        }
      }
    }
    for (const a of avatars) out.set(`avatar:${a.id}`, a.name);
    for (const b of units) out.set(`businessUnit:${b.id}`, b.name);
    for (const [id, title] of moduleTitle) out.set(`module:${id}`, title);
    for (const e of entries) {
      if (e.entityType !== 'step' && e.entityType !== 'question') continue;
      const m = e.entityType === 'question' ? questionModule.get(e.entityId) : null;
      const title = moduleTitle.get(m ?? moduleIdOf(e) ?? '');
      if (title) out.set(`${e.entityType}:${e.entityId}`, title);
    }
    return out;
  }

  private toDto(e: AuditLog, labels: Map<string, string>): AuditEntryDto {
    const details = publicDetails(e.details);
    // A deleted module or presenter keeps the name it had when the entry was written.
    const fallback =
      typeof details.title === 'string'
        ? details.title
        : typeof details.name === 'string'
          ? details.name
          : null;
    const label = labels.get(`${e.entityType}:${e.entityId}`) ?? fallback;
    return {
      id: e.id,
      createdAt: e.createdAt.toISOString(),
      action: e.action,
      category: categoryOf(e.action),
      summary: summarize(e.action, label, details),
      actor: {
        id: e.actorId,
        name: e.actorName ?? (e.actorId ? 'Unknown' : 'System'),
        email: e.actorEmail,
        role: e.actorRole,
        isSuperAdmin: e.actorEmail ? this.superAdmin.isSuperAdmin(e.actorEmail) : false,
      },
      target: { type: e.entityType, id: e.entityId, label },
      details,
    };
  }
}

import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import {
  EmployeeQuerySchema,
  type AcknowledgmentRowDto,
  type DashboardSummaryDto,
  type EmployeeDetailDto,
  type EmployeeQuery,
  type EmployeesDto,
  type EnrollmentStatus,
  type FeedbackDto,
  type QuizAnalyticsDto,
} from '@induction/shared';
import type { Prisma } from '@prisma/client';
import { Roles } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import { PrismaService } from '../prisma/prisma.service';

const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);
const day = (value: string): Date => new Date(`${value}T00:00:00Z`);

/** Read-only reporting for HR. All figures are computed from live data. */
@Roles('ADMIN', 'HR_ADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  private readonly learners: Prisma.UserWhereInput = { role: 'LEARNER', isActive: true };

  @Get('summary')
  async summary(): Promise<DashboardSummaryDto> {
    const [
      learners,
      started,
      completedCount,
      firstAttempts,
      firstCorrect,
      rating,
      modules,
      progress,
    ] = await Promise.all([
      this.prisma.user.count({ where: this.learners }),
      this.prisma.enrollment.count({ where: { status: 'IN_PROGRESS', user: this.learners } }),
      this.prisma.enrollment.count({ where: { status: 'COMPLETED', user: this.learners } }),
      this.prisma.attempt.count({ where: { attemptNo: 1, user: this.learners } }),
      this.prisma.attempt.count({ where: { attemptNo: 1, isCorrect: true, user: this.learners } }),
      this.prisma.feedback.aggregate({
        _avg: { rating: true },
        _count: true,
        where: { user: this.learners },
      }),
      this.prisma.module.findMany({ where: { status: 'PUBLISHED' }, orderBy: { order: 'asc' } }),
      this.prisma.moduleProgress.groupBy({
        by: ['moduleId'],
        where: { status: 'COMPLETED', user: this.learners },
        _count: true,
      }),
    ]);

    const byStatus: Record<EnrollmentStatus, number> = {
      // Learners without an enrollment row have simply not started.
      NOT_STARTED: learners - started - completedCount,
      IN_PROGRESS: started,
      COMPLETED: completedCount,
    };
    const completedByModule = new Map(progress.map((p) => [p.moduleId, p._count]));

    return {
      learners,
      byStatus,
      completionRate: ratio(completedCount, learners) ?? 0,
      firstAttemptAccuracy: ratio(firstCorrect, firstAttempts),
      averageRating: rating._avg.rating,
      feedbackCount: rating._count,
      completionsByModule: modules.map((m) => ({
        moduleId: m.id,
        title: m.title,
        order: m.order,
        completed: completedByModule.get(m.id) ?? 0,
      })),
    };
  }

  @Get('employees')
  async employees(
    @Query(new ZodPipe(EmployeeQuerySchema)) query: EmployeeQuery,
  ): Promise<EmployeesDto> {
    const where: Prisma.UserWhereInput = {
      ...this.learners,
      ...(query.department ? { department: query.department } : {}),
      ...(query.location ? { location: query.location } : {}),
      ...(query.businessUnitId ? { businessUnitId: query.businessUnitId } : {}),
      ...(query.joinedFrom || query.joinedTo
        ? {
            joiningDate: {
              ...(query.joinedFrom ? { gte: day(query.joinedFrom) } : {}),
              ...(query.joinedTo ? { lte: day(query.joinedTo) } : {}),
            },
          }
        : {}),
      ...(query.status === 'NOT_STARTED'
        ? { OR: [{ enrollment: null }, { enrollment: { status: 'NOT_STARTED' } }] }
        : query.status
          ? { enrollment: { status: query.status } }
          : {}),
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  { firstName: { contains: query.search, mode: 'insensitive' } },
                  { lastName: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                  { employeeId: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            ],
          }
        : {}),
    };

    const [total, users, totalModules, departments, locations, businessUnits] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          businessUnit: true,
          enrollment: true,
          moduleProgress: { where: { status: 'COMPLETED', module: { status: 'PUBLISHED' } } },
          attempts: { where: { attemptNo: 1 } },
        },
        orderBy: [{ joiningDate: 'desc' }, { firstName: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.module.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.user.findMany({
        where: this.learners,
        distinct: ['department'],
        select: { department: true },
      }),
      this.prisma.user.findMany({
        where: this.learners,
        distinct: ['location'],
        select: { location: true },
      }),
      this.prisma.businessUnit.findMany({ orderBy: { order: 'asc' } }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      filters: {
        departments: departments.map((d) => d.department).sort(),
        locations: locations.map((l) => l.location).sort(),
        businessUnits: businessUnits.map((b) => ({ id: b.id, name: b.name })),
      },
      rows: users.map((u) => ({
        id: u.id,
        employeeId: u.employeeId,
        questionsAnswered: u.attempts.length,
        correctAnswers: u.attempts.filter((a) => a.isCorrect).length,
        wrongAnswers: u.attempts.filter((a) => !a.isCorrect).length,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        department: u.department,
        location: u.location,
        businessUnit: u.businessUnit?.name ?? null,
        joiningDate: u.joiningDate.toISOString().slice(0, 10),
        status: u.enrollment?.status ?? 'NOT_STARTED',
        modulesCompleted: u.moduleProgress.length,
        totalModules,
        firstAttemptAccuracy: ratio(
          u.attempts.filter((a) => a.isCorrect).length,
          u.attempts.length,
        ),
        startedAt: u.enrollment?.startedAt?.toISOString() ?? null,
        completedAt: u.enrollment?.completedAt?.toISOString() ?? null,
      })),
    };
  }

  /** One candidate: progress through each module and how every question went. */
  @Get('employees/:id')
  async employee(@Param('id') id: string): Promise<EmployeeDetailDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        enrollment: true,
        moduleProgress: true,
        attempts: {
          include: { question: { include: { module: true } } },
          orderBy: [{ createdAt: 'asc' }, { attemptNo: 'asc' }],
        },
        acknowledgments: { include: { module: true }, orderBy: { acknowledgedAt: 'asc' } },
      },
    });
    if (!user || user.role !== 'LEARNER') throw new NotFoundException('Candidate not found');
    const modules = await this.prisma.module.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
    });

    const byQuestion = new Map<string, typeof user.attempts>();
    for (const attempt of user.attempts) {
      byQuestion.set(attempt.questionId, [...(byQuestion.get(attempt.questionId) ?? []), attempt]);
    }
    const answers: EmployeeDetailDto['answers'] = [];
    for (const attempts of byQuestion.values()) {
      const first = attempts[0];
      const last = attempts[attempts.length - 1];
      if (!first || !last) continue;
      answers.push({
        questionId: first.questionId,
        moduleTitle: first.question.module.title,
        question: first.question.text,
        outcome: first.isCorrect
          ? 'RIGHT'
          : last.isCorrect
            ? 'SECOND_TRY'
            : attempts.length >= 2
              ? 'WRONG'
              : 'OPEN',
        attempts: attempts.length,
        answeredAt: last.createdAt.toISOString(),
      });
    }

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      employeeId: user.employeeId,
      status: user.enrollment?.status ?? 'NOT_STARTED',
      startedAt: user.enrollment?.startedAt?.toISOString() ?? null,
      completedAt: user.enrollment?.completedAt?.toISOString() ?? null,
      modules: modules.map((m) => {
        const progress = user.moduleProgress.find((p) => p.moduleId === m.id);
        const firstTries = user.attempts.filter(
          (a) => a.attemptNo === 1 && a.question.moduleId === m.id,
        );
        const correct = firstTries.filter((a) => a.isCorrect).length;
        return {
          moduleId: m.id,
          title: m.title,
          order: m.order,
          status: progress?.status ?? 'NOT_STARTED',
          completedAt: progress?.completedAt?.toISOString() ?? null,
          questionsAnswered: firstTries.length,
          correctAnswers: correct,
          wrongAnswers: firstTries.length - correct,
        };
      }),
      answers,
      acknowledgments: user.acknowledgments.map((a) => ({
        moduleTitle: a.module.title,
        topic: a.topic,
        acknowledgedAt: a.acknowledgedAt.toISOString(),
      })),
    };
  }

  @Get('quiz-analytics')
  async quizAnalytics(): Promise<QuizAnalyticsDto> {
    const [modules, attempts] = await Promise.all([
      this.prisma.module.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.attempt.findMany({
        where: { attemptNo: 1, user: this.learners },
        select: { isCorrect: true, question: { select: { id: true, text: true, moduleId: true } } },
      }),
    ]);
    const titles = new Map(modules.map((m) => [m.id, m.title]));

    const perModule = new Map<string, { answered: number; correct: number }>();
    const perQuestion = new Map<
      string,
      { text: string; moduleId: string; answered: number; missed: number }
    >();
    for (const attempt of attempts) {
      const m = perModule.get(attempt.question.moduleId) ?? { answered: 0, correct: 0 };
      m.answered++;
      if (attempt.isCorrect) m.correct++;
      perModule.set(attempt.question.moduleId, m);

      const q = perQuestion.get(attempt.question.id) ?? {
        text: attempt.question.text,
        moduleId: attempt.question.moduleId,
        answered: 0,
        missed: 0,
      };
      q.answered++;
      if (!attempt.isCorrect) q.missed++;
      perQuestion.set(attempt.question.id, q);
    }

    return {
      modules: modules
        .filter((m) => perModule.has(m.id))
        .map((m) => {
          const stats = perModule.get(m.id) ?? { answered: 0, correct: 0 };
          return {
            moduleId: m.id,
            title: m.title,
            order: m.order,
            answered: stats.answered,
            firstAttemptCorrect: stats.correct,
            accuracy: ratio(stats.correct, stats.answered),
          };
        }),
      mostMissed: [...perQuestion.entries()]
        .filter(([, q]) => q.missed > 0)
        .map(([questionId, q]) => ({
          questionId,
          text: q.text,
          moduleTitle: titles.get(q.moduleId) ?? '',
          answered: q.answered,
          missed: q.missed,
          missRate: q.missed / q.answered,
        }))
        .sort((a, b) => b.missRate - a.missRate || b.missed - a.missed)
        .slice(0, 10),
    };
  }

  @Get('acknowledgments')
  async acknowledgments(): Promise<AcknowledgmentRowDto[]> {
    const rows = await this.prisma.acknowledgment.findMany({
      include: { user: true, module: true },
      orderBy: { acknowledgedAt: 'desc' },
      take: 5000,
    });
    return rows.map((a) => ({
      id: a.id,
      name: `${a.user.firstName} ${a.user.lastName}`,
      email: a.user.email,
      moduleTitle: a.module.title,
      topic: a.topic,
      contentVersion: a.contentVersion,
      acknowledgedAt: a.acknowledgedAt.toISOString(),
    }));
  }

  @Get('feedback')
  async feedback(): Promise<FeedbackDto> {
    // Average and distribution over every candidate's feedback (same filter as the summary),
    // not just the latest rows listed below.
    const where = { user: this.learners };
    const [items, byRating] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.feedback.groupBy({ by: ['rating'], where, _count: true }),
    ]);
    const counts = new Map(byRating.map((g) => [g.rating, g._count]));
    const count = byRating.reduce((sum, g) => sum + g._count, 0);
    const total = byRating.reduce((sum, g) => sum + g.rating * g._count, 0);
    return {
      average: ratio(total, count),
      distribution: [1, 2, 3, 4, 5].map((rating) => ({ rating, count: counts.get(rating) ?? 0 })),
      items: items.map((f) => ({
        id: f.id,
        name: `${f.user.firstName} ${f.user.lastName}`,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }
}

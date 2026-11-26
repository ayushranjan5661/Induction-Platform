import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  segmentsToScript,
  type AdminModuleDto,
  type AdminQuestionDto,
  type AdminStepDto,
  type AvatarDto,
  type AvatarUpsertInput,
  type BusinessUnitDto,
  type BusinessUnitUpsertInput,
  type ContentType,
  type ModuleUpsertInput,
  type QuestionUpsertInput,
  type ReviewAction,
  type ReviewItemDto,
  type StepUpsertInput,
} from '@induction/shared';
import { Prisma, type Question, type QuestionOption, type Step } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { toAvatarDto, toSegments } from '../common/mappers';
import {
  AVATARS,
  MODULES,
  avatarCreateInput,
  createRng,
  createShuffle,
  questionCreateInputs,
  stepCreateInputs,
} from '../content/default-content';
import type { AvatarKey } from '../content/seed-content';
import { PrismaService } from '../prisma/prisma.service';
import { decideTransition } from './workflow.logic';

type Tx = Prisma.TransactionClient;

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

function toStepDto(step: Step): AdminStepDto {
  return {
    id: step.id,
    order: step.order,
    type: step.type,
    title: step.title,
    topic: step.topic,
    avatarId: step.avatarId,
    emotion: step.emotion,
    segments: toSegments(step.segments),
    ackText: step.ackText,
    questionPoolTopic: step.questionPoolTopic,
  };
}

function toQuestionDto(question: Question & { options: QuestionOption[] }): AdminQuestionDto {
  return {
    id: question.id,
    moduleId: question.moduleId,
    topic: question.topic,
    text: question.text,
    hint: question.hint,
    explanation: question.explanation,
    status: question.status,
    version: question.version,
    options: [...question.options]
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect, order: o.order })),
  };
}

/** Turns a foreign-key failure into a readable "still in use" error. */
function inUse(error: unknown, message: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2003' || error.code === 'P2014')
  ) {
    throw new ConflictException(message);
  }
  throw error;
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  private audit(
    tx: Tx,
    actor: AuthUser,
    action: string,
    entityType: string,
    entityId: string,
    details: object = {},
  ) {
    return tx.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        entityType,
        entityId,
        details: details as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Any edit to a module (or its steps) sends it back to DRAFT with a new
   * version, so changed content is always reviewed again before learners see it.
   */
  private async touchModule(tx: Tx, moduleId: string): Promise<void> {
    const mod = await tx.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    if (mod.status !== 'DRAFT') {
      await tx.module.update({
        where: { id: moduleId },
        data: { status: 'DRAFT', version: { increment: 1 } },
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Modules                                                           */
  /* ---------------------------------------------------------------- */

  async listModules(): Promise<AdminModuleDto[]> {
    const modules = await this.prisma.module.findMany({
      orderBy: { order: 'asc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        // Archived questions are retired: kept only so past quiz results still add up.
        questions: {
          where: { status: { not: 'ARCHIVED' } },
          include: { options: true },
          orderBy: [{ topic: 'asc' }, { id: 'asc' }],
        },
      },
    });
    return modules.map((m) => ({
      id: m.id,
      order: m.order,
      slug: m.slug,
      title: m.title,
      description: m.description,
      avatarId: m.avatarId,
      requiresAcknowledgment: m.requiresAcknowledgment,
      status: m.status,
      version: m.version,
      steps: m.steps.map(toStepDto),
      questions: m.questions.map(toQuestionDto),
    }));
  }

  async createModule(actor: AuthUser, input: ModuleUpsertInput): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.module.aggregate({ _max: { order: true } });
      const base = slugify(input.title);
      let slug = base;
      for (let n = 2; await tx.module.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

      const mod = await tx.module.create({
        data: { ...input, slug, order: (last._max.order ?? 0) + 1, status: 'DRAFT' },
      });
      await this.audit(tx, actor, 'module.create', 'module', mod.id, { title: mod.title });
      return { id: mod.id };
    });
  }

  async updateModule(actor: AuthUser, id: string, input: ModuleUpsertInput): Promise<{ ok: true }> {
    await this.prisma.$transaction(async (tx) => {
      await this.touchModule(tx, id);
      await tx.module.update({ where: { id }, data: input });
      await this.audit(tx, actor, 'module.update', 'module', id, { title: input.title });
    });
    return { ok: true };
  }

  async deleteModule(actor: AuthUser, id: string): Promise<{ ok: true }> {
    const mod = await this.prisma.module.findUnique({ where: { id } });
    if (!mod) throw new NotFoundException('Module not found');
    if (mod.status === 'PUBLISHED') {
      throw new ConflictException(
        'A published module cannot be deleted. Edit it first to return it to draft.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.module.delete({ where: { id } });
      await this.audit(tx, actor, 'module.delete', 'module', id, { title: mod.title });
    });
    return { ok: true };
  }

  /**
   * Restores the induction to the default content in seed-content.ts:
   * the default modules, steps and questions, all published. Modules that are
   * not part of the default are removed. Candidates' progress and
   * acknowledgments on the default modules are kept; questions candidates have
   * already answered are archived (not deleted) so their quiz results stay.
   * Default presenters are re-created only if missing; edited ones are kept.
   */
  async resetToDefault(actor: AuthUser): Promise<{ ok: true }> {
    await this.prisma.$transaction(
      async (tx) => {
        const avatarIds = new Map<AvatarKey, string>();
        for (const [index, def] of AVATARS.entries()) {
          const found = await tx.avatar.findUnique({ where: { name: def.name } });
          const id =
            found?.id ?? (await tx.avatar.create({ data: avatarCreateInput(def, index) })).id;
          avatarIds.set(def.key, id);
        }
        const avatarId = (key: AvatarKey): string => {
          const id = avatarIds.get(key);
          if (!id) throw new Error(`Unknown avatar key: ${key}`);
          return id;
        };

        const removed = await tx.module.findMany({
          where: { slug: { notIn: MODULES.map((m) => m.slug) } },
          select: { id: true, title: true },
        });
        await tx.module.deleteMany({ where: { id: { in: removed.map((m) => m.id) } } });

        // Free positions 1..N so the default order can be written without clashes.
        await tx.module.updateMany({ data: { order: { increment: 10_000 } } });

        const shuffle = createShuffle(createRng(20261125));
        for (const [index, def] of MODULES.entries()) {
          const fields = {
            order: index + 1,
            title: def.title,
            description: def.description,
            requiresAcknowledgment: def.requiresAcknowledgment,
            status: 'PUBLISHED' as const,
            avatar: { connect: { id: avatarId(def.avatar) } },
          };
          const existing = await tx.module.findUnique({ where: { slug: def.slug } });
          if (!existing) {
            await tx.module.create({
              data: {
                ...fields,
                slug: def.slug,
                steps: { create: stepCreateInputs(def, avatarId) },
                questions: { create: questionCreateInputs(def, shuffle) },
              },
            });
            continue;
          }
          const moduleId = existing.id;
          await tx.step.deleteMany({ where: { moduleId } });
          await tx.question.updateMany({
            where: { moduleId, attempts: { some: {} } },
            data: { status: 'ARCHIVED' },
          });
          await tx.question.deleteMany({ where: { moduleId, attempts: { none: {} } } });
          await tx.module.update({
            where: { id: moduleId },
            data: {
              ...fields,
              version: { increment: 1 },
              steps: { create: stepCreateInputs(def, avatarId) },
              questions: { create: questionCreateInputs(def, shuffle) },
            },
          });
        }

        await this.audit(tx, actor, 'content.resetToDefault', 'module', 'all', {
          removedModules: removed.map((m) => m.title),
        });
      },
      { timeout: 60_000 },
    );
    return { ok: true };
  }

  /* ---------------------------------------------------------------- */
  /* Steps                                                             */
  /* ---------------------------------------------------------------- */

  private stepData(input: StepUpsertInput) {
    const hasScript = input.type !== 'ACKNOWLEDGMENT';
    const segments = hasScript ? input.segments : [];
    return {
      type: input.type,
      title: input.title,
      topic: input.topic,
      emotion: input.emotion,
      avatarId: input.avatarId,
      segments: segments as Prisma.InputJsonValue,
      script: segmentsToScript(segments),
      ackText: input.type === 'ACKNOWLEDGMENT' ? input.ackText : null,
      questionPoolTopic: input.type === 'QUESTION' ? input.topic : null,
    };
  }

  async createStep(
    actor: AuthUser,
    moduleId: string,
    input: StepUpsertInput,
  ): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      await this.touchModule(tx, moduleId);
      const last = await tx.step.aggregate({ where: { moduleId }, _max: { order: true } });
      const step = await tx.step.create({
        data: { ...this.stepData(input), moduleId, order: (last._max.order ?? 0) + 1 },
      });
      await this.audit(tx, actor, 'step.create', 'step', step.id, { moduleId, type: input.type });
      return { id: step.id };
    });
  }

  async updateStep(actor: AuthUser, id: string, input: StepUpsertInput): Promise<{ ok: true }> {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Step not found');
    await this.prisma.$transaction(async (tx) => {
      await this.touchModule(tx, step.moduleId);
      await tx.step.update({ where: { id }, data: this.stepData(input) });
      await this.audit(tx, actor, 'step.update', 'step', id, { moduleId: step.moduleId });
    });
    return { ok: true };
  }

  async deleteStep(actor: AuthUser, id: string): Promise<{ ok: true }> {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Step not found');
    await this.prisma.$transaction(async (tx) => {
      await this.touchModule(tx, step.moduleId);
      await tx.step.delete({ where: { id } });
      await this.audit(tx, actor, 'step.delete', 'step', id, { moduleId: step.moduleId });
    });
    return { ok: true };
  }

  async moveStep(actor: AuthUser, id: string, direction: 'up' | 'down'): Promise<{ ok: true }> {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Step not found');
    const neighbour = await this.prisma.step.findFirst({
      where: {
        moduleId: step.moduleId,
        order: direction === 'up' ? { lt: step.order } : { gt: step.order },
      },
      orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
    });
    if (!neighbour) return { ok: true };

    await this.prisma.$transaction(async (tx) => {
      await this.touchModule(tx, step.moduleId);
      // (moduleId, order) is unique, so swap through a temporary value.
      await tx.step.update({ where: { id: step.id }, data: { order: -1 } });
      await tx.step.update({ where: { id: neighbour.id }, data: { order: step.order } });
      await tx.step.update({ where: { id: step.id }, data: { order: neighbour.order } });
      await this.audit(tx, actor, 'step.move', 'step', id, { direction });
    });
    return { ok: true };
  }

  /* ---------------------------------------------------------------- */
  /* Questions                                                         */
  /* ---------------------------------------------------------------- */

  async createQuestion(
    actor: AuthUser,
    moduleId: string,
    input: QuestionUpsertInput,
  ): Promise<{ id: string }> {
    const mod = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Module not found');
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          moduleId,
          topic: input.topic,
          text: input.text,
          hint: input.hint,
          explanation: input.explanation,
          status: 'DRAFT',
          options: { create: input.options.map((o, i) => ({ ...o, order: i + 1 })) },
        },
      });
      await this.audit(tx, actor, 'question.create', 'question', question.id, { moduleId });
      return { id: question.id };
    });
  }

  async updateQuestion(
    actor: AuthUser,
    id: string,
    input: QuestionUpsertInput,
  ): Promise<{ ok: true }> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    const existing = [...question.options].sort((a, b) => a.order - b.order);

    await this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          topic: input.topic,
          text: input.text,
          hint: input.hint,
          explanation: input.explanation,
          ...(question.status !== 'DRAFT' ? { status: 'DRAFT', version: { increment: 1 } } : {}),
        },
      });
      // Options are updated in place so earlier answers keep pointing at them.
      for (const [i, option] of input.options.entries()) {
        const current = existing[i];
        if (current) {
          await tx.questionOption.update({ where: { id: current.id }, data: option });
        } else {
          await tx.questionOption.create({ data: { ...option, questionId: id, order: i + 1 } });
        }
      }
      await this.audit(tx, actor, 'question.update', 'question', id);
    });
    return { ok: true };
  }

  async deleteQuestion(actor: AuthUser, id: string): Promise<{ ok: true }> {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');
    if (question.status === 'PUBLISHED') {
      throw new ConflictException(
        'A published question cannot be deleted. Edit it first to return it to draft.',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.question.delete({ where: { id } });
      await this.audit(tx, actor, 'question.delete', 'question', id);
    });
    return { ok: true };
  }

  /* ---------------------------------------------------------------- */
  /* Avatars                                                           */
  /* ---------------------------------------------------------------- */

  async listAvatars(): Promise<AvatarDto[]> {
    return (await this.prisma.avatar.findMany({ orderBy: { name: 'asc' } })).map(toAvatarDto);
  }

  private async assertAvatarNameFree(name: string, exceptId?: string): Promise<void> {
    const clash = await this.prisma.avatar.findUnique({ where: { name } });
    if (clash && clash.id !== exceptId)
      throw new ConflictException('Another avatar already has that name');
  }

  async createAvatar(actor: AuthUser, input: AvatarUpsertInput): Promise<{ id: string }> {
    await this.assertAvatarNameFree(input.name);
    return this.prisma.$transaction(async (tx) => {
      const avatar = await tx.avatar.create({
        data: {
          ...input,
          praiseClips: {
            create: [
              { text: "That's right, well done!", emotion: 'EXCITED', gesture: 'THUMBS_UP' },
              {
                text: "Spot on! You've clearly been paying attention.",
                emotion: 'CHEERFUL',
                gesture: 'APPLAUD',
              },
              { text: 'Exactly right. Great work!', emotion: 'PROUD', gesture: 'NOD' },
            ],
          },
        },
      });
      await this.audit(tx, actor, 'avatar.create', 'avatar', avatar.id, { name: avatar.name });
      return { id: avatar.id };
    });
  }

  async updateAvatar(actor: AuthUser, id: string, input: AvatarUpsertInput): Promise<{ ok: true }> {
    if (!(await this.prisma.avatar.findUnique({ where: { id } })))
      throw new NotFoundException('Avatar not found');
    await this.assertAvatarNameFree(input.name, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.avatar.update({ where: { id }, data: input });
      await this.audit(tx, actor, 'avatar.update', 'avatar', id, { name: input.name });
    });
    return { ok: true };
  }

  async deleteAvatar(actor: AuthUser, id: string): Promise<{ ok: true }> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.avatar.delete({ where: { id } });
        await this.audit(tx, actor, 'avatar.delete', 'avatar', id);
      });
    } catch (error) {
      inUse(error, 'This avatar presents a module or step. Reassign those first.');
    }
    return { ok: true };
  }

  /* ---------------------------------------------------------------- */
  /* Business units                                                    */
  /* ---------------------------------------------------------------- */

  async listBusinessUnits(): Promise<BusinessUnitDto[]> {
    return this.prisma.businessUnit.findMany({ orderBy: { order: 'asc' } });
  }

  async createBusinessUnit(
    actor: AuthUser,
    input: BusinessUnitUpsertInput,
  ): Promise<{ id: string }> {
    if (await this.prisma.businessUnit.findUnique({ where: { name: input.name } })) {
      throw new ConflictException('A business unit with that name already exists');
    }
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.businessUnit.aggregate({ _max: { order: true } });
      const base = slugify(input.name);
      let slug = base;
      for (let n = 2; await tx.businessUnit.findUnique({ where: { slug } }); n++)
        slug = `${base}-${n}`;
      const unit = await tx.businessUnit.create({
        data: { ...input, slug, order: (last._max.order ?? 0) + 1 },
      });
      await this.audit(tx, actor, 'businessUnit.create', 'businessUnit', unit.id, {
        name: unit.name,
      });
      return { id: unit.id };
    });
  }

  async updateBusinessUnit(
    actor: AuthUser,
    id: string,
    input: BusinessUnitUpsertInput,
  ): Promise<{ ok: true }> {
    const clash = await this.prisma.businessUnit.findUnique({ where: { name: input.name } });
    if (clash && clash.id !== id)
      throw new ConflictException('A business unit with that name already exists');
    if (!(await this.prisma.businessUnit.findUnique({ where: { id } }))) {
      throw new NotFoundException('Business unit not found');
    }
    await this.prisma.$transaction(async (tx) => {
      // The slug is kept: Module 6 steps refer to it by topic.
      await tx.businessUnit.update({ where: { id }, data: input });
      await this.audit(tx, actor, 'businessUnit.update', 'businessUnit', id, { name: input.name });
    });
    return { ok: true };
  }

  async deleteBusinessUnit(actor: AuthUser, id: string): Promise<{ ok: true }> {
    const members = await this.prisma.user.count({ where: { businessUnitId: id } });
    if (members > 0)
      throw new ConflictException(
        `${members} people belong to this business unit. Move them first.`,
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.businessUnit.delete({ where: { id } });
      await this.audit(tx, actor, 'businessUnit.delete', 'businessUnit', id);
    });
    return { ok: true };
  }

  /* ---------------------------------------------------------------- */
  /* Review workflow                                                   */
  /* ---------------------------------------------------------------- */

  async reviewQueue(): Promise<ReviewItemDto[]> {
    const [modules, questions] = await Promise.all([
      this.prisma.module.findMany({
        where: { status: { in: ['IN_REVIEW', 'APPROVED'] } },
        orderBy: { order: 'asc' },
      }),
      this.prisma.question.findMany({
        where: { status: { in: ['IN_REVIEW', 'APPROVED'] } },
        include: { module: true },
        orderBy: { id: 'asc' },
      }),
    ]);
    return [
      ...modules.map((m) => ({
        type: 'module' as const,
        id: m.id,
        title: m.title,
        moduleTitle: m.title,
        status: m.status,
        version: m.version,
        needsLegal: m.requiresAcknowledgment,
      })),
      ...questions.map((q) => ({
        type: 'question' as const,
        id: q.id,
        title: q.text,
        moduleTitle: q.module.title,
        status: q.status,
        version: q.version,
        needsLegal: q.module.requiresAcknowledgment,
      })),
    ];
  }

  async transition(
    actor: AuthUser,
    type: ContentType,
    id: string,
    action: ReviewAction,
    comment: string,
  ): Promise<{ status: string }> {
    const entity =
      type === 'module'
        ? await this.prisma.module.findUnique({
            where: { id },
            include: { _count: { select: { steps: true } } },
          })
        : null;
    const question =
      type === 'question'
        ? await this.prisma.question.findUnique({ where: { id }, include: { module: true } })
        : null;

    const current = entity ?? question;
    if (!current) throw new NotFoundException('Content not found');
    // Legal review applies to policy modules and to any module that asks for an acknowledgment,
    // so switching the flag off cannot route acknowledgment content around Legal.
    const moduleId = entity ? entity.id : question?.moduleId;
    const hasAckStep =
      !!moduleId &&
      (await this.prisma.step.count({ where: { moduleId, type: 'ACKNOWLEDGMENT' } })) > 0;
    const needsLegal =
      hasAckStep ||
      (entity ? entity.requiresAcknowledgment : (question?.module.requiresAcknowledgment ?? false));

    const decision = decideTransition({
      action,
      from: current.status,
      role: actor.role,
      needsLegal,
    });
    if (!decision.ok) {
      // Wrong role is a permission problem; wrong status is a conflict.
      const wrongRole =
        decision.reason.startsWith('Only admins') || decision.reason.includes('Legal reviewer');
      throw wrongRole
        ? new ForbiddenException(decision.reason)
        : new ConflictException(decision.reason);
    }
    if (entity && action === 'submit' && entity._count.steps === 0) {
      throw new BadRequestException('Add at least one step before sending this module for review');
    }

    await this.prisma.$transaction(async (tx) => {
      if (type === 'module') {
        await tx.module.update({ where: { id }, data: { status: decision.to } });
      } else {
        await tx.question.update({ where: { id }, data: { status: decision.to } });
      }
      await tx.contentReview.create({
        data: {
          entityType: type,
          entityId: id,
          version: current.version,
          status: decision.to,
          reviewerId: actor.id,
          comment,
        },
      });
      await this.audit(tx, actor, `${type}.${action}`, type, id, {
        from: current.status,
        to: decision.to,
      });
    });
    return { status: decision.to };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FEEDBACK_EXPRESSION,
  type AttemptResponseDto,
  type AvatarDto,
  type Clip,
  type FeedbackInput,
  type InductionDto,
  type PositionDto,
  type QuestionDto,
  type StepDto,
  type SummaryDto,
} from '@induction/shared';
import { Prisma, type Avatar, type Enrollment, type Module, type Step } from '@prisma/client';
import type { AuthUser } from '../auth/auth.types';
import { toAvatarDto, toSegments } from '../common/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { advance, orderStepsForUser, resolvePosition, type Position } from './progress.logic';
import {
  assignQuestion,
  evaluateAttempt,
  isResolved,
  type QuestionAssignmentStore,
} from './quiz.logic';

type StepWithAvatar = Step & { avatar: Avatar | null };
type LoadedModule = Module & { avatar: Avatar; steps: StepWithAvatar[] };

interface LearnerState {
  modules: LoadedModule[];
  enrollment: Enrollment;
  completed: Set<string>;
  position: Position | null;
}

@Injectable()
export class LearnerService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------------------------------------------- */
  /* State                                                             */
  /* ---------------------------------------------------------------- */

  /** Published modules in playing order, with steps ordered for this learner. */
  private async loadModules(user: AuthUser): Promise<LoadedModule[]> {
    const modules = await this.prisma.module.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { order: 'asc' },
      include: { avatar: true, steps: { include: { avatar: true } } },
    });
    return modules
      .map((m) => ({ ...m, steps: orderStepsForUser(m.steps, user.businessUnit?.slug ?? null) }))
      .filter((m) => m.steps.length > 0);
  }

  private async loadState(user: AuthUser): Promise<LearnerState> {
    const [modules, enrollment, progress] = await Promise.all([
      this.loadModules(user),
      this.prisma.enrollment.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      }),
      this.prisma.moduleProgress.findMany({ where: { userId: user.id, status: 'COMPLETED' } }),
    ]);
    const completed = new Set(progress.map((p) => p.moduleId));
    const position =
      enrollment.status === 'COMPLETED'
        ? null
        : resolvePosition(
            modules,
            { moduleId: enrollment.currentModuleId, stepId: enrollment.currentStepId },
            completed,
          );
    return { modules, enrollment, completed, position };
  }

  private toPositionDto(state: LearnerState): PositionDto {
    return {
      status: state.enrollment.status,
      currentModuleId: state.position?.moduleId ?? null,
      currentStepId: state.position?.stepId ?? null,
    };
  }

  /** The step the learner must be on for question and attempt calls. */
  private requireCurrentStep(
    state: LearnerState,
    stepId: string,
  ): { module: LoadedModule; step: StepWithAvatar } {
    if (!state.position || state.position.stepId !== stepId) {
      throw new ConflictException('That is not your current step');
    }
    const mod = state.modules.find((m) => m.id === state.position?.moduleId);
    const step = mod?.steps.find((s) => s.id === stepId);
    if (!mod || !step) throw new NotFoundException('Step not found');
    return { module: mod, step };
  }

  /* ---------------------------------------------------------------- */
  /* Induction overview and steps                                      */
  /* ---------------------------------------------------------------- */

  async getInduction(user: AuthUser): Promise<InductionDto> {
    const state = await this.loadState(user);
    const avatars: Record<string, AvatarDto> = {};
    for (const mod of state.modules) {
      avatars[mod.avatar.id] = toAvatarDto(mod.avatar);
      for (const step of mod.steps) {
        if (step.avatar) avatars[step.avatar.id] = toAvatarDto(step.avatar);
      }
    }
    const started = state.enrollment.status !== 'NOT_STARTED';
    return {
      firstName: user.firstName,
      position: this.toPositionDto(state),
      avatars,
      modules: state.modules.map((mod) => ({
        id: mod.id,
        order: mod.order,
        slug: mod.slug,
        title: mod.title,
        description: mod.description,
        requiresAcknowledgment: mod.requiresAcknowledgment,
        avatar: toAvatarDto(mod.avatar),
        stepCount: mod.steps.length,
        progress: state.completed.has(mod.id)
          ? 'COMPLETED'
          : started && state.position?.moduleId === mod.id
            ? 'IN_PROGRESS'
            : 'NOT_STARTED',
      })),
    };
  }

  async getSteps(user: AuthUser, moduleId: string): Promise<StepDto[]> {
    const state = await this.loadState(user);
    const mod = state.modules.find((m) => m.id === moduleId);
    if (!mod) throw new NotFoundException('Module not found');

    const isCurrent = state.position?.moduleId === mod.id;
    if (!isCurrent && !state.completed.has(mod.id)) {
      throw new ForbiddenException('This module unlocks after you finish the one before it');
    }

    // Opening the current module for the first time starts the induction.
    if (isCurrent && state.position && state.enrollment.status === 'NOT_STARTED') {
      await this.prisma.$transaction([
        this.prisma.enrollment.update({
          where: { userId: user.id },
          data: {
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            currentModuleId: state.position.moduleId,
            currentStepId: state.position.stepId,
          },
        }),
        this.prisma.moduleProgress.upsert({
          where: { userId_moduleId: { userId: user.id, moduleId: mod.id } },
          update: {},
          create: { userId: user.id, moduleId: mod.id, status: 'IN_PROGRESS' },
        }),
      ]);
    }

    const acknowledged = new Set(
      (
        await this.prisma.acknowledgment.findMany({
          where: { userId: user.id, moduleId: mod.id, contentVersion: mod.version },
        })
      ).map((a) => a.topic),
    );

    return mod.steps.map((step) => ({
      id: step.id,
      order: step.order,
      type: step.type,
      title: step.title,
      topic: step.topic,
      emotion: step.emotion,
      avatarId: step.avatarId ?? mod.avatarId,
      segments: toSegments(step.segments),
      ackText: step.ackText,
      acknowledged: step.type === 'ACKNOWLEDGMENT' && acknowledged.has(step.topic),
    }));
  }

  /* ---------------------------------------------------------------- */
  /* Progress                                                          */
  /* ---------------------------------------------------------------- */

  async completeStep(user: AuthUser, stepId: string): Promise<PositionDto> {
    const state = await this.loadState(user);

    // Replaying a finished module never changes progress.
    const owner = state.modules.find((m) => m.steps.some((s) => s.id === stepId));
    if (!owner) throw new NotFoundException('Step not found');
    if (state.completed.has(owner.id)) return this.toPositionDto(state);

    const { module: mod, step } = this.requireCurrentStep(state, stepId);

    if (step.type === 'QUESTION') {
      const assignment = await this.prisma.userQuestion.findUnique({
        where: { userId_stepId: { userId: user.id, stepId } },
      });
      if (assignment) {
        const attempts = await this.prisma.attempt.findMany({
          where: { userId: user.id, questionId: assignment.questionId },
        });
        if (!isResolved(attempts)) throw new ConflictException('Answer the question to continue');
      } else if (await this.poolHasQuestions(step)) {
        throw new ConflictException('Answer the question to continue');
      }
    }

    if (step.type === 'ACKNOWLEDGMENT') {
      const ack = await this.prisma.acknowledgment.findUnique({
        where: {
          userId_moduleId_topic_contentVersion: {
            userId: user.id,
            moduleId: mod.id,
            topic: step.topic,
            contentVersion: mod.version,
          },
        },
      });
      if (!ack) throw new ConflictException('Please confirm the acknowledgment to continue');
    }

    const next = advance(state.modules, { moduleId: mod.id, stepId }, state.completed);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (next.completedModuleId) {
        await tx.moduleProgress.upsert({
          where: { userId_moduleId: { userId: user.id, moduleId: next.completedModuleId } },
          update: { status: 'COMPLETED', completedAt: now },
          create: {
            userId: user.id,
            moduleId: next.completedModuleId,
            status: 'COMPLETED',
            completedAt: now,
          },
        });
      }
      if (next.kind === 'finished') {
        await tx.enrollment.update({
          where: { userId: user.id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            currentModuleId: null,
            currentStepId: null,
          },
        });
        return;
      }
      if (next.completedModuleId) {
        await tx.moduleProgress.upsert({
          where: { userId_moduleId: { userId: user.id, moduleId: next.position.moduleId } },
          update: {},
          create: { userId: user.id, moduleId: next.position.moduleId, status: 'IN_PROGRESS' },
        });
      }
      await tx.enrollment.update({
        where: { userId: user.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: state.enrollment.startedAt ?? now,
          currentModuleId: next.position.moduleId,
          currentStepId: next.position.stepId,
        },
      });
    });

    return next.kind === 'finished'
      ? { status: 'COMPLETED', currentModuleId: null, currentStepId: null }
      : {
          status: 'IN_PROGRESS',
          currentModuleId: next.position.moduleId,
          currentStepId: next.position.stepId,
        };
  }

  /* ---------------------------------------------------------------- */
  /* Quiz                                                              */
  /* ---------------------------------------------------------------- */

  private get assignmentStore(): QuestionAssignmentStore {
    return {
      findAssignment: async (userId, stepId) =>
        (
          await this.prisma.userQuestion.findUnique({
            where: { userId_stepId: { userId, stepId } },
          })
        )?.questionId ?? null,
      listPublishedQuestionIds: async (moduleId, topic) =>
        (
          await this.prisma.question.findMany({
            where: { moduleId, topic, status: 'PUBLISHED' },
            select: { id: true },
            orderBy: { id: 'asc' },
          })
        ).map((q) => q.id),
      saveAssignment: async (userId, stepId, questionId) => {
        // Idempotent: a parallel request that already assigned a question keeps its choice.
        await this.prisma.userQuestion.upsert({
          where: { userId_stepId: { userId, stepId } },
          update: {},
          create: { userId, stepId, questionId },
        });
      },
    };
  }

  private async poolHasQuestions(step: Step): Promise<boolean> {
    if (!step.questionPoolTopic) return false;
    const count = await this.prisma.question.count({
      where: { moduleId: step.moduleId, topic: step.questionPoolTopic, status: 'PUBLISHED' },
    });
    return count > 0;
  }

  /** The question chosen for this learner. Null when the pool is empty. */
  async getQuestion(user: AuthUser, stepId: string): Promise<QuestionDto | null> {
    const state = await this.loadState(user);
    const { step } = this.requireCurrentStep(state, stepId);
    if (step.type !== 'QUESTION') throw new BadRequestException('This step has no question');

    let questionId = await assignQuestion(this.assignmentStore, user.id, step);
    if (!questionId) return null;

    let question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    // The assigned question was edited back to draft before the learner answered it:
    // never show unreviewed text, pick again from the published pool.
    if (question && question.status !== 'PUBLISHED') {
      const tried = await this.prisma.attempt.count({ where: { userId: user.id, questionId } });
      if (tried === 0) {
        await this.prisma.userQuestion.deleteMany({ where: { userId: user.id, stepId } });
        questionId = await assignQuestion(this.assignmentStore, user.id, step);
        if (!questionId) return null;
        question = await this.prisma.question.findUnique({
          where: { id: questionId },
          include: { options: { orderBy: { order: 'asc' } } },
        });
      }
    }
    if (!question) return null;

    const attempts = await this.prisma.attempt.findMany({
      where: { userId: user.id, questionId },
      orderBy: { attemptNo: 'asc' },
    });
    const resolved = isResolved(attempts);
    const answeredWrongOnce = attempts.length === 1 && !attempts[0]?.isCorrect;

    return {
      id: question.id,
      text: question.text,
      options: question.options.map((o) => ({ id: o.id, text: o.text })),
      attemptsUsed: attempts.length,
      disabledOptionIds: attempts.filter((a) => !a.isCorrect).map((a) => a.optionId),
      resolved,
      hintText: answeredWrongOnce ? question.hint : null,
      // Only disclosed once the question is settled.
      correctOptionId: resolved ? (question.options.find((o) => o.isCorrect)?.id ?? null) : null,
    };
  }

  async submitAttempt(
    user: AuthUser,
    questionId: string,
    optionId: string,
  ): Promise<AttemptResponseDto> {
    const assignment = await this.prisma.userQuestion.findFirst({
      where: { userId: user.id, questionId },
    });
    if (!assignment) throw new NotFoundException('Question not found');

    const state = await this.loadState(user);
    const { module: mod, step } = this.requireCurrentStep(state, assignment.stepId);

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    const option = question?.options.find((o) => o.id === optionId);
    if (!question || !option)
      throw new BadRequestException('That option does not belong to this question');

    const previous = await this.prisma.attempt.findMany({ where: { userId: user.id, questionId } });
    if (question.status !== 'PUBLISHED' && previous.length === 0) {
      throw new ConflictException('This question has just been changed. Please reload the page.');
    }
    if (previous.some((a) => a.optionId === optionId)) {
      throw new ConflictException('You have already tried that option');
    }
    const decision = evaluateAttempt(previous, option.isCorrect);
    if (!decision.ok) throw new ConflictException('No attempts left for this question');

    try {
      await this.prisma.attempt.create({
        data: {
          userId: user.id,
          questionId,
          optionId,
          attemptNo: decision.attemptNo,
          isCorrect: option.isCorrect,
        },
      });
    } catch (error) {
      // Two answers sent at once (a double click): the unique key keeps only the first.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Your earlier answer was already saved. Please continue.');
      }
      throw error;
    }

    const correct = question.options.find((o) => o.isCorrect);
    switch (decision.result) {
      case 'CORRECT':
        return {
          result: 'CORRECT',
          clip: await this.pickPraise(step.avatarId ?? mod.avatarId),
          hintText: null,
          correctOptionId: correct?.id ?? null,
          explanation: null,
        };
      case 'HINT':
        return {
          result: 'HINT',
          clip: { text: `Not quite. Here's a hint. ${question.hint}`, ...FEEDBACK_EXPRESSION.HINT },
          hintText: question.hint,
          correctOptionId: null,
          explanation: null,
        };
      case 'REVEAL':
        return {
          result: 'REVEAL',
          clip: {
            text: `No problem, let's look at this one together. The answer is: ${correct?.text ?? ''}. ${question.explanation}`,
            ...FEEDBACK_EXPRESSION.REVEAL,
          },
          hintText: null,
          correctOptionId: correct?.id ?? null,
          explanation: question.explanation,
        };
    }
  }

  /** One of the presenter's reusable praise lines, chosen at random. */
  private async pickPraise(avatarId: string): Promise<Clip> {
    const clips = await this.prisma.avatarPraiseClip.findMany({ where: { avatarId } });
    const clip = clips[Math.floor(Math.random() * clips.length)];
    return clip
      ? { text: clip.text, emotion: clip.emotion, gesture: clip.gesture }
      : { text: "That's right, well done!", ...FEEDBACK_EXPRESSION.CORRECT };
  }

  /* ---------------------------------------------------------------- */
  /* Acknowledgments, feedback, summary                                */
  /* ---------------------------------------------------------------- */

  async acknowledge(user: AuthUser, moduleId: string, topic: string): Promise<{ ok: true }> {
    const state = await this.loadState(user);
    const mod = state.modules.find((m) => m.id === moduleId);
    const step = mod?.steps.find((s) => s.type === 'ACKNOWLEDGMENT' && s.topic === topic);
    if (!mod || !step) throw new NotFoundException('Acknowledgment not found');
    this.requireCurrentStep(state, step.id);

    await this.prisma.acknowledgment.upsert({
      where: {
        userId_moduleId_topic_contentVersion: {
          userId: user.id,
          moduleId,
          topic,
          contentVersion: mod.version,
        },
      },
      update: {},
      create: { userId: user.id, moduleId, topic, contentVersion: mod.version },
    });
    return { ok: true };
  }

  async submitFeedback(user: AuthUser, input: FeedbackInput): Promise<{ ok: true }> {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { userId: user.id } });
    if (enrollment?.status !== 'COMPLETED') {
      throw new ConflictException('Feedback opens once you finish the induction');
    }
    // One feedback entry per candidate (unique userId), so a double submit cannot add a second.
    await this.prisma.feedback.upsert({
      where: { userId: user.id },
      update: input,
      create: { userId: user.id, ...input },
    });
    return { ok: true };
  }

  async getSummary(user: AuthUser): Promise<SummaryDto> {
    const state = await this.loadState(user);
    const [firstAttempts, feedback] = await Promise.all([
      this.prisma.attempt.findMany({ where: { userId: user.id, attemptNo: 1 } }),
      this.prisma.feedback.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const correct = firstAttempts.filter((a) => a.isCorrect).length;
    return {
      firstName: user.firstName,
      status: state.enrollment.status,
      modulesCompleted: state.modules.filter((m) => state.completed.has(m.id)).length,
      totalModules: state.modules.length,
      questionsAnswered: firstAttempts.length,
      firstAttemptCorrect: correct,
      scorePercent: firstAttempts.length ? Math.round((correct / firstAttempts.length) * 100) : 0,
      completedAt: state.enrollment.completedAt?.toISOString() ?? null,
      feedback: feedback ? { rating: feedback.rating, comment: feedback.comment } : null,
    };
  }
}

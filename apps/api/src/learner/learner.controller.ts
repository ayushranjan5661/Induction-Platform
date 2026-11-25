import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  AcknowledgmentSchema,
  AttemptSchema,
  FeedbackSchema,
  ProgressSchema,
  type AttemptResponseDto,
  type FeedbackInput,
  type InductionDto,
  type PositionDto,
  type QuestionDto,
  type StepDto,
  type SummaryDto,
} from '@induction/shared';
import type { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import { LearnerService } from './learner.service';

@Roles('LEARNER')
@Controller()
export class LearnerController {
  constructor(private readonly learner: LearnerService) {}

  @Get('induction')
  induction(@CurrentUser() user: AuthUser): Promise<InductionDto> {
    return this.learner.getInduction(user);
  }

  @Get('modules/:id/steps')
  steps(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<StepDto[]> {
    return this.learner.getSteps(user, id);
  }

  @Post('progress')
  @HttpCode(200)
  progress(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(ProgressSchema)) body: z.infer<typeof ProgressSchema>,
  ): Promise<PositionDto> {
    return this.learner.completeStep(user, body.stepId);
  }

  @Get('steps/:stepId/question')
  async question(
    @CurrentUser() user: AuthUser,
    @Param('stepId') stepId: string,
  ): Promise<{ question: QuestionDto | null }> {
    return { question: await this.learner.getQuestion(user, stepId) };
  }

  @Post('questions/:id/attempts')
  @HttpCode(200)
  attempt(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(AttemptSchema)) body: z.infer<typeof AttemptSchema>,
  ): Promise<AttemptResponseDto> {
    return this.learner.submitAttempt(user, id, body.optionId);
  }

  @Post('acknowledgments')
  @HttpCode(200)
  acknowledge(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(AcknowledgmentSchema)) body: z.infer<typeof AcknowledgmentSchema>,
  ): Promise<{ ok: true }> {
    return this.learner.acknowledge(user, body.moduleId, body.topic);
  }

  @Post('feedback')
  @HttpCode(200)
  feedback(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(FeedbackSchema)) body: FeedbackInput,
  ): Promise<{ ok: true }> {
    return this.learner.submitFeedback(user, body);
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser): Promise<SummaryDto> {
    return this.learner.getSummary(user);
  }
}

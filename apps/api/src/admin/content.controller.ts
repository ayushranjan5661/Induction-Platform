import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  AvatarUpsertSchema,
  BusinessUnitUpsertSchema,
  ContentTypeSchema,
  ModuleUpsertSchema,
  QuestionUpsertSchema,
  REVIEW_ACTIONS,
  ReviewCommentSchema,
  StepMoveSchema,
  StepUpsertSchema,
  type AvatarUpsertInput,
  type BusinessUnitUpsertInput,
  type ModuleUpsertInput,
  type QuestionUpsertInput,
  type ReviewAction,
  type StepUpsertInput,
} from '@induction/shared';
import type { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import { ContentService } from './content.service';

@Roles('ADMIN')
@Controller('admin')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  /* Read access is shared with Legal so reviewers can see what they approve. */
  @Roles('ADMIN', 'LEGAL_REVIEWER')
  @Get('modules')
  listModules() {
    return this.content.listModules();
  }

  @Roles('ADMIN', 'LEGAL_REVIEWER')
  @Get('avatars')
  listAvatars() {
    return this.content.listAvatars();
  }

  @Roles('ADMIN', 'LEGAL_REVIEWER')
  @Get('business-units')
  listBusinessUnits() {
    return this.content.listBusinessUnits();
  }

  @Roles('ADMIN', 'LEGAL_REVIEWER')
  @Get('review-queue')
  reviewQueue() {
    return this.content.reviewQueue();
  }

  /* Modules */
  @Post('modules/reset-to-default')
  @HttpCode(200)
  resetToDefault(@CurrentUser() user: AuthUser) {
    return this.content.resetToDefault(user);
  }

  @Post('modules')
  createModule(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(ModuleUpsertSchema)) body: ModuleUpsertInput,
  ) {
    return this.content.createModule(user, body);
  }

  @Put('modules/:id')
  updateModule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(ModuleUpsertSchema)) body: ModuleUpsertInput,
  ) {
    return this.content.updateModule(user, id, body);
  }

  @Delete('modules/:id')
  deleteModule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.deleteModule(user, id);
  }

  /* Steps */
  @Post('modules/:id/steps')
  createStep(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(StepUpsertSchema)) body: StepUpsertInput,
  ) {
    return this.content.createStep(user, id, body);
  }

  @Put('steps/:id')
  updateStep(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(StepUpsertSchema)) body: StepUpsertInput,
  ) {
    return this.content.updateStep(user, id, body);
  }

  @Post('steps/:id/move')
  @HttpCode(200)
  moveStep(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(StepMoveSchema)) body: z.infer<typeof StepMoveSchema>,
  ) {
    return this.content.moveStep(user, id, body.direction);
  }

  @Delete('steps/:id')
  deleteStep(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.deleteStep(user, id);
  }

  /* Questions */
  @Post('modules/:id/questions')
  createQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(QuestionUpsertSchema)) body: QuestionUpsertInput,
  ) {
    return this.content.createQuestion(user, id, body);
  }

  @Put('questions/:id')
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(QuestionUpsertSchema)) body: QuestionUpsertInput,
  ) {
    return this.content.updateQuestion(user, id, body);
  }

  @Delete('questions/:id')
  deleteQuestion(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.deleteQuestion(user, id);
  }

  /* Avatars */
  @Post('avatars')
  createAvatar(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(AvatarUpsertSchema)) body: AvatarUpsertInput,
  ) {
    return this.content.createAvatar(user, body);
  }

  @Put('avatars/:id')
  updateAvatar(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(AvatarUpsertSchema)) body: AvatarUpsertInput,
  ) {
    return this.content.updateAvatar(user, id, body);
  }

  @Delete('avatars/:id')
  deleteAvatar(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.deleteAvatar(user, id);
  }

  /* Business units */
  @Post('business-units')
  createBusinessUnit(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(BusinessUnitUpsertSchema)) body: BusinessUnitUpsertInput,
  ) {
    return this.content.createBusinessUnit(user, body);
  }

  @Put('business-units/:id')
  updateBusinessUnit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodPipe(BusinessUnitUpsertSchema)) body: BusinessUnitUpsertInput,
  ) {
    return this.content.updateBusinessUnit(user, id, body);
  }

  @Delete('business-units/:id')
  deleteBusinessUnit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.deleteBusinessUnit(user, id);
  }

  /* Review workflow: submit, approve, reject, publish. Role rules live in workflow.logic.ts. */
  @Roles('ADMIN', 'LEGAL_REVIEWER')
  @Post('content/:type/:id/:action')
  @HttpCode(200)
  transition(
    @CurrentUser() user: AuthUser,
    @Param('type', new ZodPipe(ContentTypeSchema)) type: z.infer<typeof ContentTypeSchema>,
    @Param('id') id: string,
    @Param('action') action: string,
    @Body(new ZodPipe(ReviewCommentSchema)) body: z.infer<typeof ReviewCommentSchema>,
  ) {
    if (!(REVIEW_ACTIONS as readonly string[]).includes(action)) {
      throw new BadRequestException('Unknown review action');
    }
    return this.content.transition(user, type, id, action as ReviewAction, body.comment);
  }
}

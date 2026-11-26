import {
  BadGatewayException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Logger,
  NotFoundException,
  Post,
  Put,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiDirectOutputSchema,
  AiDirectRequestSchema,
  AiDraftSaveSchema,
  ScriptSegmentsSchema,
  type AiDraftDto,
  type AiDraftResponseDto,
  type AiDraftSave,
  AiQuestionsOutputSchema,
  AiQuestionsRequestSchema,
  AiScriptOutputSchema,
  AiScriptRequestSchema,
  EMOTIONS,
  GESTURES,
  type AiDirectRequest,
  type AiQuestionsRequest,
  type AiScriptRequest,
  type AiStatusDto,
  type ScriptSegment,
} from '@induction/shared';
import { AzureOpenAI } from 'openai';
import type { z } from 'zod';
import { CurrentUser, Roles, type AuthUser } from '../auth/auth.types';
import { ZodPipe } from '../common/zod.pipe';
import type { Env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, type AiDraft } from '@prisma/client';

function toDraftDto(row: AiDraft): AiDraftDto {
  const segments = ScriptSegmentsSchema.safeParse(row.segments);
  return {
    moduleId: row.moduleId,
    topic: row.topic,
    title: row.title,
    sourceText: row.sourceText,
    count: row.count,
    segments: segments.success ? segments.data : null,
    savedAt: row.updatedAt.toISOString(),
  };
}

const SCRIPT_SYSTEM = `You write short spoken scripts for a friendly animated presenter in a new-employee induction.
Use ONLY facts from the source text. Do not invent names, numbers, dates or policies.
Write warm, plain, spoken English in short sentences. No headings, lists or emojis.
Split the script into 2 to 6 segments. Each segment is one or two sentences.
For each segment choose the emotion and the body gesture that fit what is being said.
Allowed emotions: ${EMOTIONS.join(', ')}.
Allowed gestures: ${GESTURES.join(', ')}.
Reply with JSON only, in this shape:
{"segments":[{"text":"...","emotion":"FRIENDLY","gesture":"WAVE"}]}`;

const DIRECT_SYSTEM = `You are the director of a friendly animated 2D presenter in a new-employee induction.
You receive the presenter's script as numbered segments. For each segment, choose the facial emotion
and the body gesture that best fit what is said, so the performance feels natural and varied.
Rules:
- Return exactly one entry per segment, in the same order. Never change the text.
- Use NONE for most segments; a gesture should mark a moment, not every line.
- Do not use the same gesture twice in a row.
- WAVE only for greetings and goodbyes. COUNT_ONE/TWO/THREE only when listing that item number.
- POINT_LEFT/POINT_RIGHT/SHOW_FRONT when introducing something; THINK for questions or reflection;
  HAND_ON_HEART for values, care and welcome; CAUTION and SERIOUS for rules, risks and compliance;
  APPLAUD, THUMBS_UP, EXCITED or CHEERFUL for achievements and praise; EMPATHETIC for sensitive topics.
Allowed emotions: ${EMOTIONS.join(', ')}.
Allowed gestures: ${GESTURES.join(', ')}.
Reply with JSON only, in this shape:
{"segments":[{"emotion":"FRIENDLY","gesture":"WAVE"}]}`;

const QUESTIONS_SYSTEM = `You write multiple-choice questions that check understanding in a new-employee induction.
Use ONLY facts from the source text. Do not invent facts.
Each question has exactly four options and exactly one correct option. Wrong options must be plausible but clearly wrong.
The hint nudges the learner toward the answer without giving it away.
The explanation states the correct answer and why, written as a short, engaging story or fun fact. This is supportive learning, not an exam.
Reply with JSON only, in this shape:
{"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0,"hint":"...","explanation":"..."}]}`;

/** Drafts scripts and questions with Azure OpenAI. Never grades answers. */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: AzureOpenAI | null;
  private readonly deployment: string;

  constructor(config: ConfigService<Env, true>) {
    const endpoint = config.get('AZURE_OPENAI_ENDPOINT', { infer: true });
    const apiKey = config.get('AZURE_OPENAI_API_KEY', { infer: true });
    const apiVersion = config.get('AZURE_OPENAI_API_VERSION', { infer: true });
    this.deployment = config.get('AZURE_OPENAI_DEPLOYMENT', { infer: true }) ?? '';
    this.client =
      endpoint && apiKey && apiVersion && this.deployment
        ? new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment: this.deployment })
        : null;
  }

  get configured(): boolean {
    return this.client !== null;
  }

  /** Asks the model for JSON and validates it; invalid output is rejected. */
  private async generate<S extends z.ZodType>(
    system: string,
    user: string,
    schema: S,
  ): Promise<z.output<S>> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'The AI assistant is not set up. Add the Azure OpenAI settings to the .env file and restart the API.',
      );
    }
    let raw: string;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.deployment,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        response_format: { type: 'json_object' },
      });
      raw = completion.choices[0]?.message.content ?? '';
    } catch (error) {
      this.logger.error(
        `Azure OpenAI request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadGatewayException('The AI service could not be reached. Please try again.');
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new BadGatewayException(
        'The AI returned text that was not valid JSON. Nothing was saved.',
      );
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new BadGatewayException(
        `The AI output did not match the expected format (${issue?.path.join('.') ?? 'root'}: ${issue?.message ?? 'invalid'}). Nothing was saved.`,
      );
    }
    return parsed.data;
  }

  async script(request: AiScriptRequest): Promise<ScriptSegment[]> {
    const output = await this.generate(
      SCRIPT_SYSTEM,
      `Step title: ${request.title}\nTopic: ${request.topic}\n\nSource text:\n"""\n${request.sourceText}\n"""`,
      AiScriptOutputSchema,
    );
    return output.segments;
  }

  /** Chooses an emotion and gesture per segment. The text comes back unchanged. */
  async direct(request: AiDirectRequest): Promise<ScriptSegment[]> {
    const numbered = request.segments.map((s, i) => `${i + 1}. ${s.text}`).join('\n');
    const manner = request.manner ? `Presenter's manner: ${request.manner}\n\n` : '';
    const output = await this.generate(
      DIRECT_SYSTEM,
      `${manner}Script (${request.segments.length} segments):\n${numbered}`,
      AiDirectOutputSchema,
    );
    if (output.segments.length !== request.segments.length) {
      throw new BadGatewayException(
        `The AI returned direction for ${output.segments.length} of ${request.segments.length} segments. Nothing was changed.`,
      );
    }
    return request.segments.map((segment, i) => ({ text: segment.text, ...output.segments[i]! }));
  }

  async questions(request: AiQuestionsRequest) {
    const output = await this.generate(
      QUESTIONS_SYSTEM,
      `Write ${request.count} question(s) on the topic "${request.topic}".\n\nSource text:\n"""\n${request.sourceText}\n"""`,
      AiQuestionsOutputSchema,
    );
    return output.questions.slice(0, request.count);
  }
}

@Roles('ADMIN')
@Controller('admin/ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('status')
  status(): AiStatusDto {
    return { configured: this.ai.configured };
  }

  /** The signed-in admin's saved work in progress, if any. */
  @Get('draft')
  async getDraft(@CurrentUser() actor: AuthUser): Promise<AiDraftResponseDto> {
    const row = await this.prisma.aiDraft.findUnique({ where: { userId: actor.id } });
    return { draft: row ? toDraftDto(row) : null };
  }

  /** Saves (replaces) the signed-in admin's work in progress. */
  @Put('draft')
  async saveDraft(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(AiDraftSaveSchema)) body: AiDraftSave,
  ): Promise<AiDraftResponseDto> {
    const data = {
      moduleId: body.moduleId,
      topic: body.topic,
      title: body.title,
      sourceText: body.sourceText,
      count: body.count,
      segments: body.segments ?? Prisma.DbNull,
    };
    const row = await this.prisma.aiDraft.upsert({
      where: { userId: actor.id },
      create: { userId: actor.id, ...data },
      update: data,
    });
    return { draft: toDraftDto(row) };
  }

  @Delete('draft')
  @HttpCode(204)
  async discardDraft(@CurrentUser() actor: AuthUser): Promise<void> {
    await this.prisma.aiDraft.deleteMany({ where: { userId: actor.id } });
  }

  /** Returns a draft script for HR to review and add as a step. Saves nothing. */
  @Post('generate-script')
  @HttpCode(200)
  async generateScript(
    @Body(new ZodPipe(AiScriptRequestSchema)) body: AiScriptRequest,
  ): Promise<{ segments: ScriptSegment[] }> {
    return { segments: await this.ai.script(body) };
  }

  /** Returns the same segments with an AI-chosen emotion and gesture each. Saves nothing. */
  @Post('direct')
  @HttpCode(200)
  async direct(
    @Body(new ZodPipe(AiDirectRequestSchema)) body: AiDirectRequest,
  ): Promise<{ segments: ScriptSegment[] }> {
    return { segments: await this.ai.direct(body) };
  }

  /** Generates questions and saves them as DRAFT; they still need review. */
  @Post('generate-questions')
  @HttpCode(200)
  async generateQuestions(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(AiQuestionsRequestSchema)) body: AiQuestionsRequest,
  ): Promise<{ created: number }> {
    if (!(await this.prisma.module.findUnique({ where: { id: body.moduleId } }))) {
      throw new NotFoundException('Module not found');
    }
    const questions = await this.ai.questions(body);

    await this.prisma.$transaction(async (tx) => {
      for (const q of questions) {
        const created = await tx.question.create({
          data: {
            moduleId: body.moduleId,
            topic: body.topic,
            text: q.text,
            hint: q.hint,
            explanation: q.explanation,
            status: 'DRAFT',
            options: {
              create: q.options.map((text, i) => ({
                text,
                order: i + 1,
                isCorrect: i === q.correctIndex,
              })),
            },
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: 'question.ai-draft',
            entityType: 'question',
            entityId: created.id,
            details: { moduleId: body.moduleId, topic: body.topic },
          },
        });
      }
    });
    return { created: questions.length };
  }
}

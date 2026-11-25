/**
 * Turns the default induction content (seed-content.ts) into Prisma create
 * inputs. Shared by the database seed and the admin "Reset to default" action,
 * so both always produce the same modules, steps and questions.
 */
import { ScriptSegmentsSchema, segmentsToScript, type ScriptSegment } from '@induction/shared';
import type { Prisma } from '@prisma/client';
import {
  AVATARS,
  MODULES,
  PRAISE_LINES,
  QUESTION_LEAD_IN,
  type AvatarDef,
  type AvatarKey,
  type ModuleDef,
  type Seg,
} from './seed-content';

export { AVATARS, MODULES };

/** Small deterministic PRNG (mulberry32) so option order is repeatable. */
export function createRng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createShuffle(rng: () => number) {
  return <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  };
}

export type Shuffle = <T>(items: readonly T[]) => T[];

export function toSegments(segs: readonly Seg[]): ScriptSegment[] {
  return ScriptSegmentsSchema.parse(
    segs.map(([text, emotion, gesture]) => ({ text, emotion, gesture })),
  );
}

/** Create input for a default presenter, including its praise lines. */
export function avatarCreateInput(def: AvatarDef, index: number): Prisma.AvatarCreateInput {
  const data: Omit<AvatarDef, 'key'> & { key?: AvatarKey } = { ...def };
  delete data.key;
  const praise = [0, 1, 2].map((offset) => {
    const line = PRAISE_LINES[(index + offset) % PRAISE_LINES.length];
    if (!line) throw new Error('No praise lines defined');
    const [text, emotion, gesture] = line;
    return { text, emotion, gesture };
  });
  return { ...data, praiseClips: { create: praise } };
}

/** Steps of a default module, numbered from 1. */
export function stepCreateInputs(
  def: ModuleDef,
  avatarId: (key: AvatarKey) => string,
): Prisma.StepCreateWithoutModuleInput[] {
  const pools = new Set(def.questions.map((q) => q.topic));
  return def.steps.map((step, stepIndex) => {
    const order = stepIndex + 1;
    switch (step.type) {
      case 'VIDEO': {
        const segments = toSegments(step.segs);
        return {
          order,
          type: 'VIDEO',
          title: step.title,
          topic: step.topic,
          emotion: step.emotion,
          segments,
          script: segmentsToScript(segments),
          ...(step.avatar ? { avatar: { connect: { id: avatarId(step.avatar) } } } : {}),
        };
      }
      case 'QUESTION': {
        if (!pools.has(step.pool)) {
          throw new Error(`Module "${def.slug}" has no questions for pool "${step.pool}"`);
        }
        const segments = toSegments([QUESTION_LEAD_IN]);
        return {
          order,
          type: 'QUESTION',
          title: 'Quick check',
          topic: step.pool,
          questionPoolTopic: step.pool,
          emotion: 'ENCOURAGING',
          segments,
          script: segmentsToScript(segments),
        };
      }
      case 'ACKNOWLEDGMENT':
        return {
          order,
          type: 'ACKNOWLEDGMENT',
          title: step.title,
          topic: step.topic,
          ackText: step.ackText,
          emotion: 'SERIOUS',
        };
      case 'TRANSITION': {
        const segments = toSegments(step.segs);
        return {
          order,
          type: 'TRANSITION',
          title: 'Handover',
          topic: 'transition',
          emotion: segments[0]?.emotion ?? 'FRIENDLY',
          segments,
          script: segmentsToScript(segments),
          ...(step.avatar ? { avatar: { connect: { id: avatarId(step.avatar) } } } : {}),
        };
      }
    }
  });
}

/** Published questions of a default module; the first listed option is correct. */
export function questionCreateInputs(
  def: ModuleDef,
  shuffle: Shuffle,
): Prisma.QuestionCreateWithoutModuleInput[] {
  return def.questions.map((q) => {
    const [correct] = q.options;
    return {
      topic: q.topic,
      text: q.text,
      hint: q.hint,
      explanation: q.explanation,
      status: 'PUBLISHED',
      options: {
        create: shuffle(q.options).map((text, i) => ({
          text,
          order: i + 1,
          isCorrect: text === correct,
        })),
      },
    };
  });
}

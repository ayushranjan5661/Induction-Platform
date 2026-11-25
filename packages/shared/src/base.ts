import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Enums (mirror apps/api/prisma/schema.prisma)                        */
/* ------------------------------------------------------------------ */

export const ROLES = ['LEARNER', 'ADMIN', 'HR_ADMIN', 'LEGAL_REVIEWER'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const STEP_TYPES = ['VIDEO', 'QUESTION', 'TRANSITION', 'ACKNOWLEDGMENT'] as const;
export const StepTypeSchema = z.enum(STEP_TYPES);
export type StepType = z.infer<typeof StepTypeSchema>;

export const CONTENT_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export const ContentStatusSchema = z.enum(CONTENT_STATUSES);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

export const ENROLLMENT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const EnrollmentStatusSchema = z.enum(ENROLLMENT_STATUSES);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

export const MEDIA_KINDS = ['AVATAR_VIDEO', 'BACKGROUND', 'MUSIC', 'SFX', 'LOTTIE'] as const;
export const MediaKindSchema = z.enum(MEDIA_KINDS);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const JOB_STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;
export const JobStatusSchema = z.enum(JOB_STATUSES);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ATTEMPT_RESULTS = ['CORRECT', 'HINT', 'REVEAL'] as const;
export const AttemptResultSchema = z.enum(ATTEMPT_RESULTS);
export type AttemptResult = z.infer<typeof AttemptResultSchema>;

/* ------------------------------------------------------------------ */
/* Avatar expression: emotions and motions                             */
/* ------------------------------------------------------------------ */

/**
 * How the avatar feels while speaking a segment. Drives the voice style in
 * the Azure pipeline (M6) and the facial/idle animation in placeholder mode.
 */
export const EMOTIONS = [
  'NEUTRAL',
  'FRIENDLY',
  'CHEERFUL',
  'EXCITED',
  'PROUD',
  'HOPEFUL',
  'EMPATHETIC',
  'SERIOUS',
  'ENCOURAGING',
] as const;
export const EmotionSchema = z.enum(EMOTIONS);
export type Emotion = z.infer<typeof EmotionSchema>;

/**
 * A body motion the avatar performs at the start of a segment. These are
 * abstract names; the avatar pipeline maps each one to whatever the chosen
 * avatar character supports and falls back to NONE when it has no match.
 */
export const GESTURES = [
  'NONE',
  'WAVE',
  'NOD',
  'THUMBS_UP',
  'APPLAUD',
  'OPEN_ARMS',
  'POINT_LEFT',
  'POINT_RIGHT',
  'SHOW_FRONT',
  'COUNT_ONE',
  'COUNT_TWO',
  'COUNT_THREE',
  'THINK',
  'HAND_ON_HEART',
  'CAUTION',
] as const;
export const GestureSchema = z.enum(GESTURES);
export type Gesture = z.infer<typeof GestureSchema>;

/** One spoken chunk of a script with the emotion and motion that go with it. */
export const ScriptSegmentSchema = z.object({
  text: z.string().trim().min(1).max(1200),
  emotion: EmotionSchema.default('NEUTRAL'),
  gesture: GestureSchema.default('NONE'),
});
export type ScriptSegment = z.infer<typeof ScriptSegmentSchema>;

export const ScriptSegmentsSchema = z.array(ScriptSegmentSchema).min(1).max(40);

/** Default expression for the three quiz feedback clips. */
export const FEEDBACK_EXPRESSION: Record<AttemptResult, { emotion: Emotion; gesture: Gesture }> = {
  CORRECT: { emotion: 'EXCITED', gesture: 'THUMBS_UP' },
  HINT: { emotion: 'ENCOURAGING', gesture: 'THINK' },
  REVEAL: { emotion: 'EMPATHETIC', gesture: 'SHOW_FRONT' },
};

/** Joins segments into the plain narration text (used for captions and hashing). */
export function segmentsToScript(segments: readonly Pick<ScriptSegment, 'text'>[]): string {
  return segments.map((s) => s.text.trim()).join(' ');
}

/* ------------------------------------------------------------------ */
/* Quiz rules                                                          */
/* ------------------------------------------------------------------ */

export const MAX_ATTEMPTS_PER_QUESTION = 2;
export const OPTIONS_PER_QUESTION = 4;

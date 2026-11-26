/**
 * API contracts shared by the API and the web app: request schemas (validated
 * on the server with Zod) and response types.
 */
import { z } from 'zod';
import {
  EmotionSchema,
  EnrollmentStatusSchema,
  GestureSchema,
  RoleSchema,
  ScriptSegmentSchema,
  ScriptSegmentsSchema,
  StepTypeSchema,
  type AttemptResult,
  type ContentStatus,
  type Emotion,
  type EnrollmentStatus,
  type Gesture,
  type Role,
  type ScriptSegment,
  type StepType,
} from './base';

/* ------------------------------------------------------------------ */
/* Avatar look and voice                                               */
/* ------------------------------------------------------------------ */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #2563EB');

export const HAIR_STYLES = [
  'short',
  'spiky',
  'sidePart',
  'bun',
  'ponytail',
  'long',
  'curly',
  'bob',
  'bald',
] as const;
export const HairStyleSchema = z.enum(HAIR_STYLES);
export type HairStyle = z.infer<typeof HairStyleSchema>;

/** Presenter clothing and body. */
export const TOPS = ['polo', 'tee', 'sweater', 'shirt', 'jacket', 'vest'] as const;
export const BOTTOMS = ['trousers', 'shorts', 'skirt'] as const;
export const BUILDS = ['slim', 'regular', 'broad'] as const;
export const FIGURES = ['masculine', 'feminine'] as const;

/**
 * The 20 ready-drawn 2D characters (artwork in apps/web/src/character/sprites/svg). A presenter
 * with `appearance.character` set is drawn as that character and animated by the same engine;
 * without it, the presenter is built from the appearance fields below.
 */
export const CHARACTERS = [
  { id: '01-maya', name: 'Maya', figure: 'feminine', look: 'bob · bomber jacket · pleated skirt' },
  { id: '02-arjun', name: 'Arjun', figure: 'masculine', look: 'side part · denim jacket · chinos' },
  { id: '03-zoe', name: 'Zoe', figure: 'feminine', look: 'ponytail · sweater · jeans' },
  { id: '04-kofi', name: 'Kofi', figure: 'masculine', look: 'afro · varsity jacket · joggers' },
  { id: '05-hana', name: 'Hana', figure: 'feminine', look: 'space buns · hoodie · shorts' },
  {
    id: '06-mateo',
    name: 'Mateo',
    figure: 'masculine',
    look: 'swept spikes · zip hoodie · cargos',
  },
  { id: '07-amara', name: 'Amara', figure: 'feminine', look: 'braids · sweater · chinos' },
  { id: '08-liam', name: 'Liam', figure: 'masculine', look: 'curly top · flannel shirt · jeans' },
  { id: '09-sofia', name: 'Sofia', figure: 'feminine', look: 'long hair · bomber jacket · jeans' },
  { id: '10-ethan', name: 'Ethan', figure: 'masculine', look: 'backwards cap · sweater · joggers' },
  { id: '11-priya', name: 'Priya', figure: 'feminine', look: 'wavy bob · zip hoodie · skirt' },
  { id: '12-noah', name: 'Noah', figure: 'masculine', look: 'buzz cut · hoodie · jeans' },
  { id: '13-yuki', name: 'Yuki', figure: 'feminine', look: 'bob · varsity jacket · skirt' },
  { id: '14-omar', name: 'Omar', figure: 'masculine', look: 'side part · bomber jacket · chinos' },
  { id: '15-aisha', name: 'Aisha', figure: 'feminine', look: 'hijab · sweater · chinos' },
  { id: '16-lucas', name: 'Lucas', figure: 'masculine', look: 'beanie · flannel shirt · jeans' },
  { id: '17-mia', name: 'Mia', figure: 'feminine', look: 'ponytail · zip hoodie · joggers' },
  { id: '18-diego', name: 'Diego', figure: 'masculine', look: 'mohawk · hoodie · cargo pants' },
  { id: '19-chloe', name: 'Chloe', figure: 'feminine', look: 'wavy bob · sweater · jeans' },
  { id: '20-kai', name: 'Kai', figure: 'masculine', look: 'curly top · zip hoodie · shorts' },
] as const;
export const CHARACTER_IDS = CHARACTERS.map((c) => c.id) as [
  (typeof CHARACTERS)[number]['id'],
  ...(typeof CHARACTERS)[number]['id'][],
];
export const CharacterIdSchema = z.enum(CHARACTER_IDS);
export type CharacterId = z.infer<typeof CharacterIdSchema>;

export const AvatarAppearanceSchema = z.object({
  /** One of the ready-drawn characters; when set it replaces the built look below. */
  character: CharacterIdSchema.optional(),
  /** Body shape. When missing it follows the voice (set by the API). */
  figure: z.enum(FIGURES).optional(),
  build: z.enum(BUILDS).default('regular'),
  skin: hex.default('#C68B5E'),
  hair: hex.default('#2B1B12'),
  hairStyle: HairStyleSchema.default('short'),
  top: z.enum(TOPS).default('polo'),
  /** Main colour of the top. */
  outfit: hex.default('#2563EB'),
  /** Collar, inner shirt and cuffs. */
  shirt: hex.default('#FFFFFF'),
  bottom: z.enum(BOTTOMS).default('trousers'),
  pants: hex.default('#2B3A67'),
  shoes: hex.default('#3B2B25'),
  glasses: z.boolean().default(false),
  beard: z.boolean().default(false),
  earrings: z.boolean().default(false),
});
export type AvatarAppearance = z.infer<typeof AvatarAppearanceSchema>;

export const VoiceGenderSchema = z.enum(['female', 'male']);
export type VoiceGender = z.infer<typeof VoiceGenderSchema>;

export interface AvatarDto {
  id: string;
  name: string;
  title: string;
  themeColor: string;
  personalityNotes: string;
  defaultEmotion: Emotion;
  entryGesture: Gesture;
  exitGesture: Gesture;
  energy: number;
  appearance: AvatarAppearance;
  voice: { gender: VoiceGender; lang: string; pitch: number; rate: number };
}

/** A line the avatar speaks, with how to say it. Replaces a video clip. */
export interface Clip {
  text: string;
  emotion: Emotion;
  gesture: Gesture;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

const email = z.string().trim().toLowerCase().email().max(254);
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

/** Which sign-in page was used: candidates and staff each have their own. */
export const SIGN_IN_PORTALS = ['candidate', 'staff'] as const;
export type SignInPortal = (typeof SIGN_IN_PORTALS)[number];

export const LoginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  /** When given, the account's role must belong to this page. */
  portal: z.enum(SIGN_IN_PORTALS).optional(),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** What the invitation landing page shows before the candidate starts. */
export interface InvitePreviewDto {
  firstName: string;
  expiresAt: string;
}

/** Dev-only quick sign-in for the seeded demo accounts. */
export const DevLoginSchema = z.object({ email });

export const InviteLoginSchema = z.object({ token: z.string().min(20).max(200) });

export const ChangePasswordSchema = z.object({
  /** Not needed when the session came from an invite link and no password was ever chosen. */
  currentPassword: z.string().max(128).default(''),
  newPassword,
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export interface LoginResultDto {
  ok: true;
  mustChangePassword: boolean;
}

export interface MeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  businessUnit: { id: string; slug: string; name: string } | null;
  /** The account still has its system-set default password. */
  mustChangePassword: boolean;
}

export interface DevUserDto {
  email: string;
  name: string;
  role: Role;
  note: string;
}

/* ------------------------------------------------------------------ */
/* Learner                                                             */
/* ------------------------------------------------------------------ */

export interface ModuleSummaryDto {
  id: string;
  order: number;
  slug: string;
  title: string;
  description: string;
  requiresAcknowledgment: boolean;
  avatar: AvatarDto;
  stepCount: number;
  progress: EnrollmentStatus;
}

export interface PositionDto {
  status: EnrollmentStatus;
  currentModuleId: string | null;
  currentStepId: string | null;
}

export interface InductionDto {
  firstName: string;
  position: PositionDto;
  modules: ModuleSummaryDto[];
  /** Presenters that appear anywhere in the induction, keyed by id. */
  avatars: Record<string, AvatarDto>;
}

export interface StepDto {
  id: string;
  order: number;
  type: StepType;
  title: string;
  topic: string;
  emotion: Emotion;
  /** Presenter for this step (the module's avatar unless the step overrides it). */
  avatarId: string;
  segments: ScriptSegment[];
  ackText: string | null;
  /** ACKNOWLEDGMENT steps: whether this learner has already confirmed. */
  acknowledged: boolean;
}

export interface QuestionOptionDto {
  id: string;
  text: string;
}

/** Never contains which option is correct unless the question is revealed. */
export interface QuestionDto {
  id: string;
  text: string;
  options: QuestionOptionDto[];
  attemptsUsed: number;
  /** Wrong options the learner has already tried. */
  disabledOptionIds: string[];
  resolved: boolean;
  hintText: string | null;
  /** Set only after a REVEAL, or once the learner has answered correctly. */
  correctOptionId: string | null;
}

export const ProgressSchema = z.object({ stepId: z.string().min(1).max(64) });
export const AttemptSchema = z.object({ optionId: z.string().min(1).max(64) });
export const AcknowledgmentSchema = z.object({
  moduleId: z.string().min(1).max(64),
  topic: z.string().min(1).max(120),
});
export const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(''),
});
export type FeedbackInput = z.infer<typeof FeedbackSchema>;

export interface AttemptResponseDto {
  result: AttemptResult;
  clip: Clip;
  hintText: string | null;
  correctOptionId: string | null;
  explanation: string | null;
}

export interface SummaryDto {
  firstName: string;
  status: EnrollmentStatus;
  modulesCompleted: number;
  totalModules: number;
  questionsAnswered: number;
  firstAttemptCorrect: number;
  scorePercent: number;
  completedAt: string | null;
  feedback: { rating: number; comment: string } | null;
}

/* ------------------------------------------------------------------ */
/* Admin: content                                                      */
/* ------------------------------------------------------------------ */

const title = z.string().trim().min(1).max(160);
const topic = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lower-case words separated by hyphens');

export const ModuleUpsertSchema = z.object({
  title,
  description: z.string().trim().max(500).default(''),
  avatarId: z.string().min(1),
  requiresAcknowledgment: z.boolean().default(false),
});
export type ModuleUpsertInput = z.infer<typeof ModuleUpsertSchema>;

export const StepUpsertSchema = z
  .object({
    type: StepTypeSchema,
    title: z.string().trim().max(160).default(''),
    topic,
    avatarId: z.string().min(1).nullable().default(null),
    emotion: EmotionSchema.default('NEUTRAL'),
    segments: z.array(ScriptSegmentSchema).max(40).default([]),
    ackText: z.string().trim().max(2000).nullable().default(null),
  })
  .superRefine((step, ctx) => {
    if ((step.type === 'VIDEO' || step.type === 'TRANSITION') && step.segments.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['segments'],
        message: 'Add at least one script segment',
      });
    }
    if (step.type === 'ACKNOWLEDGMENT' && !step.ackText) {
      ctx.addIssue({
        code: 'custom',
        path: ['ackText'],
        message: 'Add the statement to acknowledge',
      });
    }
  });
export type StepUpsertInput = z.infer<typeof StepUpsertSchema>;

export const StepMoveSchema = z.object({ direction: z.enum(['up', 'down']) });

export const QuestionUpsertSchema = z.object({
  topic,
  text: z.string().trim().min(5).max(400),
  hint: z.string().trim().min(3).max(400),
  explanation: z.string().trim().min(3).max(800),
  options: z
    .array(z.object({ text: z.string().trim().min(1).max(200), isCorrect: z.boolean() }))
    .length(4, 'A question needs exactly four options')
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      'Mark exactly one option as correct',
    )
    .refine(
      (opts) => new Set(opts.map((o) => o.text.toLowerCase())).size === opts.length,
      'Options must be different from each other',
    ),
});
export type QuestionUpsertInput = z.infer<typeof QuestionUpsertSchema>;

export const AvatarUpsertSchema = z.object({
  name: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(80),
  themeColor: hex,
  personalityNotes: z.string().trim().max(500).default(''),
  defaultEmotion: EmotionSchema,
  entryGesture: GestureSchema,
  exitGesture: GestureSchema,
  energy: z.number().min(0.5).max(1.5),
  appearance: AvatarAppearanceSchema,
  voiceGender: VoiceGenderSchema,
  voiceLang: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Use a language tag like en-IN'),
  voicePitch: z.number().min(0.5).max(1.6),
  voiceRate: z.number().min(0.6).max(1.4),
});
export type AvatarUpsertInput = z.infer<typeof AvatarUpsertSchema>;

export const BusinessUnitUpsertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).default(''),
});
export type BusinessUnitUpsertInput = z.infer<typeof BusinessUnitUpsertSchema>;

export const ReviewCommentSchema = z.object({ comment: z.string().trim().max(1000).default('') });

export const CONTENT_TYPES = ['module', 'question'] as const;
export const ContentTypeSchema = z.enum(CONTENT_TYPES);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const REVIEW_ACTIONS = ['submit', 'approve', 'reject', 'publish'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export interface AdminOptionDto {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface AdminQuestionDto {
  id: string;
  moduleId: string;
  topic: string;
  text: string;
  hint: string;
  explanation: string;
  status: ContentStatus;
  version: number;
  options: AdminOptionDto[];
}

export interface AdminStepDto {
  id: string;
  order: number;
  type: StepType;
  title: string;
  topic: string;
  avatarId: string | null;
  emotion: Emotion;
  segments: ScriptSegment[];
  ackText: string | null;
  questionPoolTopic: string | null;
}

export interface AdminModuleDto {
  id: string;
  order: number;
  slug: string;
  title: string;
  description: string;
  avatarId: string;
  requiresAcknowledgment: boolean;
  status: ContentStatus;
  version: number;
  steps: AdminStepDto[];
  questions: AdminQuestionDto[];
}

export interface BusinessUnitDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
}

export interface ReviewItemDto {
  type: ContentType;
  id: string;
  title: string;
  moduleTitle: string;
  status: ContentStatus;
  version: number;
  needsLegal: boolean;
}

/* ------------------------------------------------------------------ */
/* Admin: users                                                        */
/* ------------------------------------------------------------------ */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD')
  // Rejects dates that do not exist, e.g. 2024-13-01 or 2024-02-31.
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'That date does not exist');

const employeeId = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, 'Use letters, numbers, dots, dashes or slashes');

export const UserUpsertSchema = z.object({
  email,
  employeeId: employeeId.nullable().default(null),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).default(''),
  department: z.string().trim().min(1).max(80),
  location: z.string().trim().max(80).default(''),
  businessUnitId: z.string().min(1).nullable().default(null),
  role: RoleSchema.default('LEARNER'),
  joiningDate: isoDate,
  isActive: z.boolean().default(true),
});
export type UserUpsertInput = z.infer<typeof UserUpsertSchema>;

export const CsvImportSchema = z.object({ csv: z.string().min(1).max(500_000) });

export interface CsvImportResultDto {
  created: number;
  skipped: { line: number; reason: string }[];
}

/** Shown once to whoever created the account or reset it. Never stored in readable form. */
export interface CredentialsDto {
  userId: string;
  /** For the greeting in the ready-to-send email. */
  firstName: string;
  email: string;
  employeeId: string | null;
  /** The system-set default password, or null when only a new link was issued. */
  password: string | null;
  /** One-click sign-in link for candidates, or null for staff accounts. */
  inviteUrl: string | null;
  inviteExpiresAt: string | null;
  /** The sign-in page for this account: the candidate page or the staff page. */
  signInUrl: string;
  /** False when the account is blocked or deactivated: nothing here can be used to sign in. */
  isActive: boolean;
  /** A valid link exists but was issued before links were kept, so it cannot be shown. */
  inviteHidden: boolean;
}

/** What HR types to invite a candidate. The name is optional and can be worked out from the email. */
export const CandidateCreateSchema = z.object({
  employeeId,
  email,
  firstName: z.string().trim().max(80).default(''),
  lastName: z.string().trim().max(80).default(''),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateSchema>;

export interface CandidateDto {
  id: string;
  employeeId: string | null;
  email: string;
  name: string;
  isActive: boolean;
  status: EnrollmentStatus;
  modulesCompleted: number;
  totalModules: number;
  correctAnswers: number;
  wrongAnswers: number;
  hasPassword: boolean;
  /** An unexpired invite link exists. */
  inviteActive: boolean;
  inviteExpiresAt: string | null;
  createdAt: string;
}

export interface AdminUserDto {
  id: string;
  employeeId: string | null;
  /** The account named in the server settings; only it can change itself. */
  isSuperAdmin: boolean;
  hasPassword: boolean;
  /** True while the account still has the system-set default password. */
  mustChangePassword: boolean;
  /** The default password, readable to admins only until the user sets their own. */
  defaultPassword: string | null;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  location: string;
  businessUnitId: string | null;
  businessUnitName: string | null;
  role: Role;
  joiningDate: string;
  isActive: boolean;
}

/* ------------------------------------------------------------------ */
/* Admin: AI authoring assistant                                       */
/* ------------------------------------------------------------------ */

export const AiScriptRequestSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(40, 'Paste at least a few sentences of source text')
    .max(12_000),
  moduleId: z.string().min(1),
  topic,
  title: z.string().trim().min(1).max(160),
});
export type AiScriptRequest = z.infer<typeof AiScriptRequestSchema>;

export const AiQuestionsRequestSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(40, 'Paste at least a few sentences of source text')
    .max(12_000),
  moduleId: z.string().min(1),
  topic,
  count: z.number().int().min(1).max(5).default(3),
});
export type AiQuestionsRequest = z.infer<typeof AiQuestionsRequestSchema>;

/** What the model must return for a script. */
export const AiScriptOutputSchema = z.object({ segments: ScriptSegmentsSchema });

/** "Direct with AI": choose an emotion and gesture for each segment of an existing script. */
export const AiDirectRequestSchema = z.object({
  segments: z
    .array(z.object({ text: z.string().trim().min(1).max(1200) }))
    .min(1)
    .max(40),
  /** The presenter's personality notes, so the direction fits the character. */
  manner: z.string().trim().max(600).optional(),
});
export type AiDirectRequest = z.infer<typeof AiDirectRequestSchema>;

/** What the model must return for direction: one entry per segment, in order. */
export const AiDirectOutputSchema = z.object({
  segments: z
    .array(z.object({ emotion: EmotionSchema, gesture: GestureSchema }))
    .min(1)
    .max(40),
});

/** What the model must return for questions. */
export const AiQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().trim().min(5).max(400),
        options: z
          .array(z.string().trim().min(1).max(200))
          .length(4)
          .refine(
            (opts) => new Set(opts.map((o) => o.toLowerCase())).size === opts.length,
            'Options must be different from each other',
          ),
        correctIndex: z.number().int().min(0).max(3),
        hint: z.string().trim().min(3).max(400),
        explanation: z.string().trim().min(3).max(800),
      }),
    )
    .min(1)
    .max(5),
});

export interface AiStatusDto {
  configured: boolean;
}

/** Work in progress on the AI assistant page, saved for the signed-in admin. Lenient: it may be half-filled. */
export const AiDraftSaveSchema = z.object({
  moduleId: z.string().max(64).default(''),
  topic: z.string().max(80).default(''),
  title: z.string().max(160).default(''),
  sourceText: z.string().max(12_000).default(''),
  count: z.number().int().min(1).max(5).default(3),
  segments: z.array(ScriptSegmentSchema).max(40).nullable().default(null),
});
export type AiDraftSave = z.infer<typeof AiDraftSaveSchema>;

export interface AiDraftDto extends AiDraftSave {
  savedAt: string;
}

/** GET /admin/ai/draft: null when nothing is saved. */
export interface AiDraftResponseDto {
  draft: AiDraftDto | null;
}

/* ------------------------------------------------------------------ */
/* HR dashboard                                                        */
/* ------------------------------------------------------------------ */

export interface DashboardSummaryDto {
  learners: number;
  byStatus: Record<EnrollmentStatus, number>;
  completionRate: number;
  firstAttemptAccuracy: number | null;
  averageRating: number | null;
  feedbackCount: number;
  completionsByModule: { moduleId: string; title: string; order: number; completed: number }[];
}

export const EmployeeQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  department: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  businessUnitId: z.string().max(64).optional(),
  status: EnrollmentStatusSchema.optional(),
  joinedFrom: isoDate.optional(),
  joinedTo: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(25),
});
export type EmployeeQuery = z.infer<typeof EmployeeQuerySchema>;

export interface EmployeeRowDto {
  id: string;
  employeeId: string | null;
  /** Questions answered, and how many were right or wrong on the first try. */
  questionsAnswered: number;
  correctAnswers: number;
  wrongAnswers: number;
  name: string;
  email: string;
  department: string;
  location: string;
  businessUnit: string | null;
  joiningDate: string;
  status: EnrollmentStatus;
  modulesCompleted: number;
  totalModules: number;
  firstAttemptAccuracy: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

/** One candidate's induction in detail. */
export interface EmployeeDetailDto {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  status: EnrollmentStatus;
  startedAt: string | null;
  completedAt: string | null;
  modules: {
    moduleId: string;
    title: string;
    order: number;
    status: EnrollmentStatus;
    completedAt: string | null;
    questionsAnswered: number;
    correctAnswers: number;
    wrongAnswers: number;
  }[];
  answers: {
    questionId: string;
    moduleTitle: string;
    question: string;
    /** RIGHT = correct first time, SECOND_TRY = correct after the hint, WRONG = both tries wrong, OPEN = not finished. */
    outcome: 'RIGHT' | 'SECOND_TRY' | 'WRONG' | 'OPEN';
    attempts: number;
    answeredAt: string;
  }[];
  acknowledgments: { moduleTitle: string; topic: string; acknowledgedAt: string }[];
}

export interface EmployeesDto {
  rows: EmployeeRowDto[];
  total: number;
  page: number;
  pageSize: number;
  filters: {
    departments: string[];
    locations: string[];
    businessUnits: { id: string; name: string }[];
  };
}

export interface QuizAnalyticsDto {
  modules: {
    moduleId: string;
    title: string;
    order: number;
    answered: number;
    firstAttemptCorrect: number;
    accuracy: number | null;
  }[];
  mostMissed: {
    questionId: string;
    text: string;
    moduleTitle: string;
    answered: number;
    missed: number;
    missRate: number;
  }[];
}

export interface AcknowledgmentRowDto {
  id: string;
  name: string;
  email: string;
  moduleTitle: string;
  topic: string;
  contentVersion: number;
  acknowledgedAt: string;
}

export interface FeedbackDto {
  average: number | null;
  distribution: { rating: number; count: number }[];
  items: { id: string; name: string; rating: number; comment: string; createdAt: string }[];
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

/**
 * Who sees what: the Super Admin sees every entry; an Admin sees their own and everything
 * done by HR, Legal and candidates; HR sees their own and what candidates did.
 */
export const AUDIT_CATEGORIES = [
  'SIGN_IN',
  'ACCOUNTS',
  'CANDIDATES',
  'CONTENT',
  'REVIEW',
  'AI',
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/** Whose actions: the viewer's own, or one level of people below them. */
export const AUDIT_ACTORS = ['ME', 'ADMIN', 'HR_ADMIN', 'LEGAL_REVIEWER', 'LEARNER'] as const;
export type AuditActorFilter = (typeof AUDIT_ACTORS)[number];

export const AuditQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(AUDIT_CATEGORIES).optional(),
  actor: z.enum(AUDIT_ACTORS).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(25),
});
export type AuditQuery = z.infer<typeof AuditQuerySchema>;

export interface AuditEntryDto {
  id: string;
  createdAt: string;
  action: string;
  category: AuditCategory;
  /** Plain-English description, e.g. "Reset the password of Jane Doe". */
  summary: string;
  actor: {
    /** Null when the entry has no actor (system) or the account no longer exists. */
    id: string | null;
    name: string;
    email: string | null;
    role: Role | null;
    isSuperAdmin: boolean;
  };
  target: { type: string; id: string; label: string | null };
  /** Extra facts about the change. Never passwords, tokens or other secrets. */
  details: Record<string, unknown>;
}

export interface AuditLogDto {
  total: number;
  rows: AuditEntryDto[];
  /** Which actor filters this viewer may use. */
  actorFilters: AuditActorFilter[];
  /** The viewer's place in the order, for the page's explanation. */
  scope: 'ALL' | 'ADMIN' | 'HR';
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  database: z.enum(['up', 'down']),
  counts: z.object({
    modules: z.number().int(),
    steps: z.number().int(),
    questions: z.number().int(),
    avatars: z.number().int(),
    users: z.number().int(),
  }),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

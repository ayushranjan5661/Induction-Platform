/**
 * Seeds the database with the induction content and SYNTHETIC users only.
 * Deterministic: running it twice produces the same data.
 *
 *   npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password';
import {
  avatarCreateInput,
  createRng,
  createShuffle,
  questionCreateInputs,
  stepCreateInputs,
} from '../src/content/default-content';
import { AVATARS, BUSINESS_UNITS, MODULES, type AvatarKey } from '../src/content/seed-content';

const prisma = new PrismaClient();

const rng = createRng(20261125);
const shuffle = createShuffle(rng);

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick() called with an empty list');
  return item;
}

const BASE_DATE = new Date('2026-11-25T09:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const daysBefore = (days: number): Date => new Date(BASE_DATE.getTime() - days * DAY_MS);

/* Synthetic people: invented names on the reserved example.com domain. */
const FIRST_NAMES = [
  'Aarav',
  'Diya',
  'Vihaan',
  'Ananya',
  'Reyansh',
  'Ishita',
  'Kavin',
  'Meera',
  'Rohan',
  'Sana',
  'Tarun',
  'Nisha',
  'Varun',
  'Pooja',
  'Yash',
  'Lavanya',
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Sophia',
  'Ethan',
  'Mia',
  'Lucas',
  'Farah',
  'Imran',
  'Grace',
  'Daniel',
] as const;
const LAST_NAMES = [
  'Sample',
  'Demo',
  'Testwell',
  'Placeholder',
  'Mockson',
  'Fixture',
  'Seedman',
] as const;
const DEPARTMENTS = [
  'Engineering',
  'Consulting',
  'Delivery',
  'Quality',
  'Sales',
  'Marketing',
] as const;
const LOCATIONS = ['Chennai', 'Hyderabad', 'Irvine', 'Remote'] as const;
const FEEDBACK_COMMENTS = [
  'Much more engaging than reading slides.',
  'The hints helped. I liked that it never felt like an exam.',
  'Clear and friendly. The compliance section was easy to follow.',
  'Good pace. Would like a little more on my own business unit.',
  '',
] as const;

async function clearDatabase(): Promise<void> {
  // Children first, so foreign keys are never violated.
  await prisma.auditLog.deleteMany();
  await prisma.contentReview.deleteMany();
  await prisma.avatarJob.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.acknowledgment.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.userQuestion.deleteMany();
  await prisma.moduleProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.step.deleteMany();
  await prisma.module.deleteMany();
  await prisma.avatarPraiseClip.deleteMany();
  await prisma.avatar.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.businessUnit.deleteMany();
}

async function seedAvatars(): Promise<Map<AvatarKey, string>> {
  const ids = new Map<AvatarKey, string>();
  for (const [index, def] of AVATARS.entries()) {
    const avatar = await prisma.avatar.create({ data: avatarCreateInput(def, index) });
    ids.set(def.key, avatar.id);
  }
  return ids;
}

async function seedContent(avatarIds: Map<AvatarKey, string>): Promise<void> {
  const avatarId = (key: AvatarKey): string => {
    const id = avatarIds.get(key);
    if (!id) throw new Error(`Unknown avatar key: ${key}`);
    return id;
  };

  for (const [index, def] of MODULES.entries()) {
    await prisma.module.create({
      data: {
        order: index + 1,
        slug: def.slug,
        title: def.title,
        description: def.description,
        requiresAcknowledgment: def.requiresAcknowledgment,
        status: 'PUBLISHED',
        avatar: { connect: { id: avatarId(def.avatar) } },
        steps: { create: stepCreateInputs(def, avatarId) },
        questions: { create: questionCreateInputs(def, shuffle) },
      },
    });
  }
}

async function seedUsers(): Promise<string[]> {
  const units = [];
  for (const [index, unit] of BUSINESS_UNITS.entries()) {
    units.push(await prisma.businessUnit.create({ data: { ...unit, order: index + 1 } }));
  }

  // Optional: give every seeded account this password. Without it the demo
  // accounts are reached through the dev sign-in buttons on the login page.
  const seedPassword = process.env.SEED_PASSWORD?.trim();
  const passwordHash = seedPassword ? hashPassword(seedPassword) : null;

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      employeeId: 'EMP0001',
      passwordHash,
      firstName: 'Avery',
      lastName: 'Admin',
      department: 'People Operations',
      location: 'Chennai',
      role: 'ADMIN',
      joiningDate: daysBefore(500),
    },
  });
  await prisma.user.create({
    data: {
      email: 'hr.admin@example.com',
      employeeId: 'EMP0002',
      passwordHash,
      firstName: 'Harper',
      lastName: 'Hale',
      department: 'Human Resources',
      location: 'Chennai',
      role: 'HR_ADMIN',
      joiningDate: daysBefore(400),
    },
  });
  await prisma.user.create({
    data: {
      email: 'legal.reviewer@example.com',
      employeeId: 'EMP0003',
      passwordHash,
      firstName: 'Logan',
      lastName: 'Reviewer',
      department: 'Legal',
      location: 'Irvine',
      role: 'LEGAL_REVIEWER',
      joiningDate: daysBefore(300),
    },
  });

  const learnerIds: string[] = [];
  for (const [i, firstName] of FIRST_NAMES.entries()) {
    const lastName = LAST_NAMES[i % LAST_NAMES.length] ?? 'Sample';
    const unit = units[i % units.length];
    const learner = await prisma.user.create({
      data: {
        email: `${firstName}.${lastName}`.toLowerCase() + '@example.com',
        employeeId: `EMP${1001 + i}`,
        passwordHash,
        firstName,
        lastName,
        department: DEPARTMENTS[i % DEPARTMENTS.length] ?? 'Engineering',
        location: LOCATIONS[i % LOCATIONS.length] ?? 'Remote',
        role: 'LEARNER',
        joiningDate: daysBefore(1 + (i % 28)),
        ...(unit ? { businessUnit: { connect: { id: unit.id } } } : {}),
      },
    });
    learnerIds.push(learner.id);
  }
  return learnerIds;
}

/**
 * Gives learners a spread of progress so the HR dashboard has something to show:
 * 10 not started, 10 part-way through, 8 completed.
 */
async function seedProgress(learnerIds: string[]): Promise<void> {
  const modules = await prisma.module.findMany({
    orderBy: { order: 'asc' },
    include: {
      steps: { orderBy: { order: 'asc' } },
      questions: { include: { options: true } },
    },
  });

  for (const [i, userId] of learnerIds.entries()) {
    const completedCount = i < 10 ? 0 : i < 20 ? 1 + (i % 5) : modules.length;
    const startedAt = daysBefore(Math.max(0, (i % 28) - 1));

    if (completedCount === 0) {
      await prisma.enrollment.create({ data: { userId } });
      continue;
    }

    for (const mod of modules.slice(0, completedCount)) {
      await prisma.moduleProgress.create({
        data: { userId, moduleId: mod.id, status: 'COMPLETED', completedAt: startedAt },
      });

      for (const step of mod.steps) {
        if (step.type === 'ACKNOWLEDGMENT') {
          await prisma.acknowledgment.create({
            data: {
              userId,
              moduleId: mod.id,
              topic: step.topic,
              contentVersion: mod.version,
              acknowledgedAt: startedAt,
            },
          });
        }
        if (step.type !== 'QUESTION') continue;

        const question = pick(mod.questions.filter((q) => q.topic === step.questionPoolTopic));
        const right = question.options.find((o) => o.isCorrect);
        const wrong = question.options.filter((o) => !o.isCorrect);
        const [firstWrong, secondWrong] = shuffle(wrong);
        if (!right || !firstWrong || !secondWrong) {
          throw new Error(`Question "${question.text}" needs one correct and two wrong options`);
        }

        await prisma.userQuestion.create({
          data: { userId, stepId: step.id, questionId: question.id },
        });

        // 65% right first time; of the rest, 60% get it on the second attempt.
        const firstCorrect = rng() < 0.65;
        const secondCorrect = rng() < 0.6;
        const answers = firstCorrect ? [right] : [firstWrong, secondCorrect ? right : secondWrong];
        for (const [n, option] of answers.entries()) {
          await prisma.attempt.create({
            data: {
              userId,
              questionId: question.id,
              optionId: option.id,
              attemptNo: n + 1,
              isCorrect: option.isCorrect,
              createdAt: startedAt,
            },
          });
        }
      }
    }

    const finished = completedCount === modules.length;
    const current = finished ? undefined : modules[completedCount];
    if (current) {
      await prisma.moduleProgress.create({
        data: { userId, moduleId: current.id, status: 'IN_PROGRESS' },
      });
    }
    await prisma.enrollment.create({
      data: {
        userId,
        status: finished ? 'COMPLETED' : 'IN_PROGRESS',
        startedAt,
        completedAt: finished ? startedAt : null,
        currentModuleId: current?.id ?? null,
        currentStepId: current?.steps[0]?.id ?? null,
      },
    });

    if (finished) {
      await prisma.feedback.create({
        data: {
          userId,
          rating: 3 + Math.floor(rng() * 3),
          comment: pick(FEEDBACK_COMMENTS),
          createdAt: startedAt,
        },
      });
    }
  }
}

async function main(): Promise<void> {
  await clearDatabase();
  const avatarIds = await seedAvatars();
  await seedContent(avatarIds);
  const learnerIds = await seedUsers();
  await seedProgress(learnerIds);

  const [modules, steps, questions, avatars, users, attempts] = await Promise.all([
    prisma.module.count(),
    prisma.step.count(),
    prisma.question.count(),
    prisma.avatar.count(),
    prisma.user.count(),
    prisma.attempt.count(),
  ]);
  console.log(
    `Seed complete: ${modules} modules, ${steps} steps, ${questions} questions, ` +
      `${avatars} avatars, ${users} users, ${attempts} attempts.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());

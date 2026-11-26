/**
 * Pure quiz rules (spec section 8). Answers are always evaluated here, on the
 * server; the client never learns which option is correct before a REVEAL.
 */
import { MAX_ATTEMPTS_PER_QUESTION, type AttemptResult } from '@induction/shared';

export interface PreviousAttempt {
  isCorrect: boolean;
}

export type AttemptDecision =
  | { ok: true; result: AttemptResult; attemptNo: number }
  | { ok: false; reason: 'ALREADY_CORRECT' | 'NO_ATTEMPTS_LEFT' };

/** A question is settled once answered correctly or after the last attempt. */
export function isResolved(previous: readonly PreviousAttempt[]): boolean {
  return previous.some((a) => a.isCorrect) || previous.length >= MAX_ATTEMPTS_PER_QUESTION;
}

/**
 * Attempt 1: correct -> CORRECT, wrong -> HINT.
 * Attempt 2: correct -> CORRECT, wrong -> REVEAL.
 * Anything after that is rejected.
 */
export function evaluateAttempt(
  previous: readonly PreviousAttempt[],
  chosenIsCorrect: boolean,
): AttemptDecision {
  if (previous.some((a) => a.isCorrect)) return { ok: false, reason: 'ALREADY_CORRECT' };
  if (previous.length >= MAX_ATTEMPTS_PER_QUESTION)
    return { ok: false, reason: 'NO_ATTEMPTS_LEFT' };

  const attemptNo = previous.length + 1;
  if (chosenIsCorrect) return { ok: true, result: 'CORRECT', attemptNo };
  return {
    ok: true,
    result: attemptNo >= MAX_ATTEMPTS_PER_QUESTION ? 'REVEAL' : 'HINT',
    attemptNo,
  };
}

/** Storage the question picker needs. Implemented with Prisma in the service. */
export interface QuestionAssignmentStore {
  findAssignment(userId: string, stepId: string): Promise<string | null>;
  listPublishedQuestionIds(moduleId: string, topic: string): Promise<string[]>;
  saveAssignment(userId: string, stepId: string, questionId: string): Promise<void>;
}

/**
 * Returns the question for this learner at this step. The first call picks one
 * published question at random and remembers it, so a resumed session shows
 * the same question. Returns null when the pool has no published questions.
 */
export async function assignQuestion(
  store: QuestionAssignmentStore,
  userId: string,
  step: { id: string; moduleId: string; questionPoolTopic: string | null },
  random: () => number = Math.random,
): Promise<string | null> {
  const existing = await store.findAssignment(userId, step.id);
  if (existing) return existing;
  if (!step.questionPoolTopic) return null;

  const pool = await store.listPublishedQuestionIds(step.moduleId, step.questionPoolTopic);
  if (pool.length === 0) return null;
  const chosen = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] as string;
  await store.saveAssignment(userId, step.id, chosen);
  // Two simultaneous requests may each pick one; whichever was stored first wins.
  return (await store.findAssignment(userId, step.id)) ?? chosen;
}

import { describe, expect, it } from 'vitest';
import {
  assignQuestion,
  evaluateAttempt,
  isResolved,
  type QuestionAssignmentStore,
} from './quiz.logic';

describe('evaluateAttempt (spec section 8 answer logic)', () => {
  it('attempt 1, correct -> CORRECT', () => {
    expect(evaluateAttempt([], true)).toEqual({ ok: true, result: 'CORRECT', attemptNo: 1 });
  });

  it('attempt 1, wrong -> HINT', () => {
    expect(evaluateAttempt([], false)).toEqual({ ok: true, result: 'HINT', attemptNo: 1 });
  });

  it('attempt 2, correct -> CORRECT', () => {
    expect(evaluateAttempt([{ isCorrect: false }], true)).toEqual({
      ok: true,
      result: 'CORRECT',
      attemptNo: 2,
    });
  });

  it('attempt 2, wrong -> REVEAL', () => {
    expect(evaluateAttempt([{ isCorrect: false }], false)).toEqual({
      ok: true,
      result: 'REVEAL',
      attemptNo: 2,
    });
  });

  it('rejects a third attempt', () => {
    const twoWrong = [{ isCorrect: false }, { isCorrect: false }];
    expect(evaluateAttempt(twoWrong, true)).toEqual({ ok: false, reason: 'NO_ATTEMPTS_LEFT' });
    expect(evaluateAttempt(twoWrong, false)).toEqual({ ok: false, reason: 'NO_ATTEMPTS_LEFT' });
  });

  it('rejects another attempt after a correct answer', () => {
    expect(evaluateAttempt([{ isCorrect: true }], false)).toEqual({
      ok: false,
      reason: 'ALREADY_CORRECT',
    });
  });
});

describe('isResolved', () => {
  it('is false before any attempt and after one wrong attempt', () => {
    expect(isResolved([])).toBe(false);
    expect(isResolved([{ isCorrect: false }])).toBe(false);
  });

  it('is true after a correct answer or two attempts', () => {
    expect(isResolved([{ isCorrect: true }])).toBe(true);
    expect(isResolved([{ isCorrect: false }, { isCorrect: false }])).toBe(true);
  });
});

function memoryStore(pool: string[]): QuestionAssignmentStore & { saves: number } {
  const assignments = new Map<string, string>();
  const store = {
    saves: 0,
    findAssignment: async (userId: string, stepId: string) =>
      assignments.get(`${userId}:${stepId}`) ?? null,
    listPublishedQuestionIds: async () => pool,
    saveAssignment: async (userId: string, stepId: string, questionId: string) => {
      store.saves++;
      assignments.set(`${userId}:${stepId}`, questionId);
    },
  };
  return store;
}

describe('assignQuestion', () => {
  const step = { id: 'step-1', moduleId: 'mod-1', questionPoolTopic: 'values' };

  it('returns the same question when a session is resumed', async () => {
    const store = memoryStore(['q1', 'q2', 'q3']);
    const first = await assignQuestion(store, 'user-1', step, () => 0.9);
    // A different random value must not change the stored choice.
    const resumed = await assignQuestion(store, 'user-1', step, () => 0.0);
    expect(first).toBe('q3');
    expect(resumed).toBe('q3');
    expect(store.saves).toBe(1);
  });

  it('picks independently for each learner', async () => {
    const store = memoryStore(['q1', 'q2']);
    expect(await assignQuestion(store, 'user-1', step, () => 0)).toBe('q1');
    expect(await assignQuestion(store, 'user-2', step, () => 0.99)).toBe('q2');
  });

  it('returns null when the pool has no published questions', async () => {
    expect(await assignQuestion(memoryStore([]), 'user-1', step)).toBeNull();
  });

  it('never picks outside the pool, even if random returns 1', async () => {
    expect(await assignQuestion(memoryStore(['q1', 'q2']), 'user-1', step, () => 1)).toBe('q2');
  });
});

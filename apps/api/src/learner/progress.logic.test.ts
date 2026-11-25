import { describe, expect, it } from 'vitest';
import { advance, orderStepsForUser, resolvePosition } from './progress.logic';

const step = (id: string, order: number, topic = 'general') => ({ id, order, topic });

const modules = [
  { id: 'm1', steps: [step('a', 1), step('b', 2)] },
  { id: 'm2', steps: [step('c', 1)] },
  { id: 'm3', steps: [step('d', 1), step('e', 2)] },
];

describe('orderStepsForUser', () => {
  const units = [
    step('intro', 1, 'overview'),
    step('cloud', 2, 'bu-cloud'),
    step('data', 3, 'bu-data'),
    step('ai', 4, 'bu-ai'),
    step('outro', 5, 'teams'),
  ];

  it('sorts by order when the learner has no business unit', () => {
    const shuffled = [units[3], units[0], units[4], units[1], units[2]].filter(
      (s) => s !== undefined,
    );
    expect(orderStepsForUser(shuffled, null).map((s) => s.id)).toEqual([
      'intro',
      'cloud',
      'data',
      'ai',
      'outro',
    ]);
  });

  it("moves the learner's own business unit to the front of the unit steps", () => {
    expect(orderStepsForUser(units, 'ai').map((s) => s.id)).toEqual([
      'intro',
      'ai',
      'cloud',
      'data',
      'outro',
    ]);
    expect(orderStepsForUser(units, 'data').map((s) => s.id)).toEqual([
      'intro',
      'data',
      'cloud',
      'ai',
      'outro',
    ]);
  });

  it('leaves the order alone when the unit is already first or unknown', () => {
    expect(orderStepsForUser(units, 'cloud').map((s) => s.id)).toEqual([
      'intro',
      'cloud',
      'data',
      'ai',
      'outro',
    ]);
    expect(orderStepsForUser(units, 'unknown').map((s) => s.id)).toEqual([
      'intro',
      'cloud',
      'data',
      'ai',
      'outro',
    ]);
  });
});

describe('resolvePosition', () => {
  it('starts a new learner at the first step', () => {
    expect(resolvePosition(modules, { moduleId: null, stepId: null }, new Set())).toEqual({
      moduleId: 'm1',
      stepId: 'a',
    });
  });

  it('resumes at the saved step', () => {
    expect(
      resolvePosition(modules, { moduleId: 'm3', stepId: 'e' }, new Set(['m1', 'm2'])),
    ).toEqual({
      moduleId: 'm3',
      stepId: 'e',
    });
  });

  it('falls back to the first unfinished module when the saved step no longer exists', () => {
    expect(resolvePosition(modules, { moduleId: 'gone', stepId: 'gone' }, new Set(['m1']))).toEqual(
      {
        moduleId: 'm2',
        stepId: 'c',
      },
    );
    expect(
      resolvePosition(modules, { moduleId: 'm3', stepId: 'gone' }, new Set(['m1', 'm2'])),
    ).toEqual({
      moduleId: 'm3',
      stepId: 'd',
    });
  });

  it('returns null when every module is complete', () => {
    expect(
      resolvePosition(modules, { moduleId: null, stepId: null }, new Set(['m1', 'm2', 'm3'])),
    ).toBeNull();
  });
});

describe('advance', () => {
  it('moves to the next step in the same module', () => {
    expect(advance(modules, { moduleId: 'm1', stepId: 'a' })).toEqual({
      kind: 'step',
      position: { moduleId: 'm1', stepId: 'b' },
      completedModuleId: null,
    });
  });

  it('completes the module and moves to the next one after its last step', () => {
    expect(advance(modules, { moduleId: 'm1', stepId: 'b' })).toEqual({
      kind: 'step',
      position: { moduleId: 'm2', stepId: 'c' },
      completedModuleId: 'm1',
    });
  });

  it('finishes the induction after the last step of the last module', () => {
    expect(advance(modules, { moduleId: 'm3', stepId: 'e' })).toEqual({
      kind: 'finished',
      completedModuleId: 'm3',
    });
  });

  it('rejects a step that is not in the module', () => {
    expect(() => advance(modules, { moduleId: 'm1', stepId: 'e' })).toThrow();
  });
});

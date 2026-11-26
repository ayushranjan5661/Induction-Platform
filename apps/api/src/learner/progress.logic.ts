/**
 * Pure progress rules: the order a learner sees steps in, and where they go
 * next. No database access, so these are easy to unit test.
 */

export interface StepLike {
  id: string;
  order: number;
  topic: string;
}

export interface ModuleLike<S extends StepLike = StepLike> {
  id: string;
  steps: S[];
}

export const BUSINESS_UNIT_TOPIC_PREFIX = 'bu-';

/**
 * Steps in playing order for one learner. Business-unit steps (topic
 * "bu-<slug>") are shown with the learner's own unit first.
 */
export function orderStepsForUser<S extends StepLike>(
  steps: readonly S[],
  businessUnitSlug: string | null,
): S[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  if (!businessUnitSlug) return sorted;

  const firstUnitIndex = sorted.findIndex((s) => s.topic.startsWith(BUSINESS_UNIT_TOPIC_PREFIX));
  const ownIndex = sorted.findIndex(
    (s) => s.topic === `${BUSINESS_UNIT_TOPIC_PREFIX}${businessUnitSlug}`,
  );
  if (ownIndex < 0 || firstUnitIndex < 0 || ownIndex === firstUnitIndex) return sorted;

  const own = sorted[ownIndex] as S;
  const rest = sorted.filter((_, i) => i !== ownIndex);
  rest.splice(firstUnitIndex, 0, own);
  return rest;
}

export interface Position {
  moduleId: string;
  stepId: string;
}

/**
 * Where the learner currently is. `modules` must be in playing order with
 * steps already ordered for the learner. Returns null when everything is done.
 */
export function resolvePosition(
  modules: readonly ModuleLike[],
  saved: { moduleId: string | null; stepId: string | null },
  completedModuleIds: ReadonlySet<string>,
): Position | null {
  const savedModule = modules.find((m) => m.id === saved.moduleId);
  if (savedModule && !completedModuleIds.has(savedModule.id)) {
    const step = savedModule.steps.find((s) => s.id === saved.stepId) ?? savedModule.steps[0];
    if (step) return { moduleId: savedModule.id, stepId: step.id };
  }
  // Saved position is missing or stale: start the first unfinished module.
  for (const mod of modules) {
    const first = mod.steps[0];
    if (!completedModuleIds.has(mod.id) && first) return { moduleId: mod.id, stepId: first.id };
  }
  return null;
}

export type Advance =
  | { kind: 'step'; position: Position; completedModuleId: string | null }
  | { kind: 'finished'; completedModuleId: string };

/** The position after completing `current`. */
export function advance(
  modules: readonly ModuleLike[],
  current: Position,
  completedModuleIds: ReadonlySet<string> = new Set(),
): Advance {
  const moduleIndex = modules.findIndex((m) => m.id === current.moduleId);
  const mod = modules[moduleIndex];
  if (!mod) throw new Error(`Unknown module ${current.moduleId}`);
  const stepIndex = mod.steps.findIndex((s) => s.id === current.stepId);
  if (stepIndex < 0) throw new Error(`Step ${current.stepId} is not in module ${mod.id}`);

  const nextStep = mod.steps[stepIndex + 1];
  if (nextStep) {
    return {
      kind: 'step',
      position: { moduleId: mod.id, stepId: nextStep.id },
      completedModuleId: null,
    };
  }
  for (const nextModule of modules.slice(moduleIndex + 1)) {
    const first = nextModule.steps[0];
    if (first) {
      return {
        kind: 'step',
        position: { moduleId: nextModule.id, stepId: first.id },
        completedModuleId: mod.id,
      };
    }
  }
  // Nothing left ahead. A module published (or re-published) behind the learner still has to be
  // played before the induction counts as finished.
  for (const earlier of modules.slice(0, moduleIndex)) {
    const first = earlier.steps[0];
    if (first && !completedModuleIds.has(earlier.id)) {
      return {
        kind: 'step',
        position: { moduleId: earlier.id, stepId: first.id },
        completedModuleId: mod.id,
      };
    }
  }
  return { kind: 'finished', completedModuleId: mod.id };
}

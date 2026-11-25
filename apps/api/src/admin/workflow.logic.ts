/**
 * Pure review-workflow rules:
 *   DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED   (reject: IN_REVIEW -> DRAFT)
 * Policies and Compliance content (needsLegal) must be approved or rejected
 * by a Legal reviewer; everything else by an admin.
 */
import type { ContentStatus, ReviewAction, Role } from '@induction/shared';

export type TransitionDecision = { ok: true; to: ContentStatus } | { ok: false; reason: string };

const FROM: Record<ReviewAction, ContentStatus> = {
  submit: 'DRAFT',
  approve: 'IN_REVIEW',
  reject: 'IN_REVIEW',
  publish: 'APPROVED',
};

const TO: Record<ReviewAction, ContentStatus> = {
  submit: 'IN_REVIEW',
  approve: 'APPROVED',
  reject: 'DRAFT',
  publish: 'PUBLISHED',
};

export function decideTransition(input: {
  action: ReviewAction;
  from: ContentStatus;
  role: Role;
  needsLegal: boolean;
}): TransitionDecision {
  const { action, from, role, needsLegal } = input;

  if (from !== FROM[action]) {
    return {
      ok: false,
      reason: `Only ${FROM[action]} content can be moved with "${action}" (this is ${from})`,
    };
  }

  const isReviewStep = action === 'approve' || action === 'reject';
  const requiredRole: Role = isReviewStep && needsLegal ? 'LEGAL_REVIEWER' : 'ADMIN';
  if (role !== requiredRole) {
    return {
      ok: false,
      reason:
        requiredRole === 'LEGAL_REVIEWER'
          ? 'Policies and Compliance content must be reviewed by a Legal reviewer'
          : 'Only admins can do this',
    };
  }
  return { ok: true, to: TO[action] };
}

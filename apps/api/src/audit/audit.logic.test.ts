import { AUDIT_CATEGORIES } from '@induction/shared';
import { describe, expect, it } from 'vitest';
import {
  actorFiltersFor,
  categoryOf,
  categoryWhere,
  dateWhere,
  publicDetails,
  scopeOf,
  summarize,
  visibleWhere,
} from './audit.logic';

describe('audit scope (Super Admin > Admin > HR)', () => {
  it('gives the super admin everything', () => {
    expect(scopeOf('ADMIN', true, true)).toBe('ALL');
    expect(visibleWhere('ALL', 'me')).toEqual({});
  });

  it('treats every admin as the top when no super admin is configured', () => {
    expect(scopeOf('ADMIN', false, false)).toBe('ALL');
  });

  it('lets an admin see their own actions and those below, not other admins', () => {
    expect(scopeOf('ADMIN', false, true)).toBe('ADMIN');
    expect(visibleWhere('ADMIN', 'me')).toEqual({
      OR: [{ actorId: 'me' }, { actorRole: { in: ['HR_ADMIN', 'LEGAL_REVIEWER', 'LEARNER'] } }],
    });
    expect(actorFiltersFor('ADMIN')).not.toContain('ADMIN');
  });

  it('lets HR see their own actions and candidates only', () => {
    expect(scopeOf('HR_ADMIN', false, true)).toBe('HR');
    expect(visibleWhere('HR', 'me')).toEqual({
      OR: [{ actorId: 'me' }, { actorRole: { in: ['LEARNER'] } }],
    });
    expect(actorFiltersFor('HR')).toEqual(['ME', 'LEARNER']);
  });

  it('gives Legal and candidates no audit log', () => {
    expect(scopeOf('LEGAL_REVIEWER', false, true)).toBeNull();
    expect(scopeOf('LEARNER', false, true)).toBeNull();
  });
});

describe('audit categories', () => {
  const cases: [string, string][] = [
    ['auth.sign-in', 'SIGN_IN'],
    ['user.change-password', 'SIGN_IN'],
    ['user.reset-password', 'ACCOUNTS'],
    ['candidate.invite', 'CANDIDATES'],
    ['module.publish', 'REVIEW'],
    ['question.approve', 'REVIEW'],
    ['question.ai-draft', 'AI'],
    ['step.move', 'CONTENT'],
    ['content.resetToDefault', 'CONTENT'],
  ];
  it.each(cases)('%s is %s', (action, category) => {
    expect(categoryOf(action)).toBe(category);
  });

  it('has a database filter for every category', () => {
    for (const c of AUDIT_CATEGORIES) expect(categoryWhere(c)).toBeTruthy();
  });
});

describe('audit helpers', () => {
  it('includes the whole last day in a date range', () => {
    expect(dateWhere({ from: '2026-11-01', to: '2026-11-02' })).toEqual({
      createdAt: { gte: new Date('2026-11-01T00:00:00Z'), lt: new Date('2026-11-03T00:00:00Z') },
    });
    expect(dateWhere({})).toEqual({});
  });

  it('never passes on secret-looking values', () => {
    expect(publicDetails({ password: true, token: 'abc', passwordHash: 'x', title: 'A' })).toEqual({
      password: true,
      title: 'A',
    });
  });

  it('writes plain English', () => {
    expect(summarize('candidate.set-active', 'Jane Doe', { isActive: false })).toBe(
      'Blocked Jane Doe',
    );
    expect(summarize('auth.sign-in', null, { method: 'invite' })).toBe(
      'Signed in with their invitation link',
    );
    expect(summarize('module.publish', 'Welcome', {})).toBe('Published the module “Welcome”');
    expect(summarize('step.create', 'Welcome', {})).toBe('Added a step in “Welcome”');
  });
});

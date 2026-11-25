import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';
import { decideTransition } from './workflow.logic';

describe('decideTransition', () => {
  it('walks ordinary content through the workflow with an admin only', () => {
    const hr = { role: 'ADMIN' as const, needsLegal: false };
    expect(decideTransition({ ...hr, action: 'submit', from: 'DRAFT' })).toEqual({
      ok: true,
      to: 'IN_REVIEW',
    });
    expect(decideTransition({ ...hr, action: 'approve', from: 'IN_REVIEW' })).toEqual({
      ok: true,
      to: 'APPROVED',
    });
    expect(decideTransition({ ...hr, action: 'publish', from: 'APPROVED' })).toEqual({
      ok: true,
      to: 'PUBLISHED',
    });
    expect(decideTransition({ ...hr, action: 'reject', from: 'IN_REVIEW' })).toEqual({
      ok: true,
      to: 'DRAFT',
    });
  });

  it('requires Legal to approve or reject Policies and Compliance content', () => {
    const base = { action: 'approve' as const, from: 'IN_REVIEW' as const, needsLegal: true };
    expect(decideTransition({ ...base, role: 'ADMIN' }).ok).toBe(false);
    expect(decideTransition({ ...base, role: 'LEGAL_REVIEWER' })).toEqual({
      ok: true,
      to: 'APPROVED',
    });
    expect(decideTransition({ ...base, action: 'reject', role: 'LEGAL_REVIEWER' })).toEqual({
      ok: true,
      to: 'DRAFT',
    });
  });

  it('does not let Legal submit, publish, or review ordinary content', () => {
    const legal = { role: 'LEGAL_REVIEWER' as const };
    expect(
      decideTransition({ ...legal, action: 'submit', from: 'DRAFT', needsLegal: true }).ok,
    ).toBe(false);
    expect(
      decideTransition({ ...legal, action: 'publish', from: 'APPROVED', needsLegal: true }).ok,
    ).toBe(false);
    expect(
      decideTransition({ ...legal, action: 'approve', from: 'IN_REVIEW', needsLegal: false }).ok,
    ).toBe(false);
  });

  it('never lets a learner move content', () => {
    expect(
      decideTransition({ role: 'LEARNER', action: 'submit', from: 'DRAFT', needsLegal: false }).ok,
    ).toBe(false);
  });

  it('rejects skipping a stage', () => {
    const hr = { role: 'ADMIN' as const, needsLegal: false };
    expect(decideTransition({ ...hr, action: 'publish', from: 'DRAFT' }).ok).toBe(false);
    expect(decideTransition({ ...hr, action: 'publish', from: 'IN_REVIEW' }).ok).toBe(false);
    expect(decideTransition({ ...hr, action: 'approve', from: 'DRAFT' }).ok).toBe(false);
    expect(decideTransition({ ...hr, action: 'submit', from: 'PUBLISHED' }).ok).toBe(false);
  });
});

describe('parseCsv', () => {
  it('parses plain rows and skips blank lines', () => {
    expect(parseCsv('a,b\r\n1,2\n\n3,4\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('handles quoted fields with commas, quotes and line breaks', () => {
    expect(parseCsv('name,note\n"Sample, Ada","said ""hi""\nthen left"')).toEqual([
      ['name', 'note'],
      ['Sample, Ada', 'said "hi"\nthen left'],
    ]);
  });

  it('strips a byte-order mark', () => {
    expect(parseCsv('\uFEFFemail\nx@example.com')).toEqual([['email'], ['x@example.com']]);
  });
});

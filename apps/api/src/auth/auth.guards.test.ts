import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@induction/shared';
import { describe, expect, it } from 'vitest';
import { AiController } from '../admin/ai.controller';
import { ContentController } from '../admin/content.controller';
import { UsersController } from '../admin/users.controller';
import { DashboardController } from '../dashboard/dashboard.controller';
import { HealthController } from '../health/health.controller';
import { CandidatesController } from '../hr/candidates.controller';
import { LearnerController } from '../learner/learner.controller';
import { AuthController } from './auth.controller';
import { RolesGuard } from './auth.guards';
import { nameFromEmail } from '../hr/candidates.controller';
import { isRoleAllowed } from './auth.types';
import {
  generatePassword,
  hashPassword,
  hashToken,
  newInviteToken,
  verifyPassword,
} from './password';

type Handler = (...args: never[]) => unknown;
type ControllerClass = { prototype: object; name: string };

/** Runs the real RolesGuard against a real controller method's metadata. */
function canReach(controller: ControllerClass, method: string, role: Role | undefined): boolean {
  const handler = (controller.prototype as Record<string, Handler>)[method];
  if (!handler) throw new Error(`${controller.name}.${method} does not exist`);
  const ctx = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
  try {
    return new RolesGuard(new Reflector()).canActivate(ctx);
  } catch (error) {
    if (error instanceof ForbiddenException) return false;
    throw error;
  }
}

const ALL: Role[] = ['LEARNER', 'ADMIN', 'HR_ADMIN', 'LEGAL_REVIEWER'];
const allowed = (controller: ControllerClass, method: string): Role[] =>
  ALL.filter((role) => canReach(controller, method, role));

describe('passwords and invite tokens', () => {
  it('verifies the right password and rejects a wrong or missing one', () => {
    const stored = hashPassword('Correct-Horse-9');
    expect(stored).not.toContain('Correct-Horse-9');
    expect(verifyPassword('Correct-Horse-9', stored)).toBe(true);
    expect(verifyPassword('correct-horse-9', stored)).toBe(false);
    expect(verifyPassword('anything', null)).toBe(false);
    expect(verifyPassword('anything', 'not-a-hash')).toBe(false);
  });

  it('generates default passwords that meet the password rules and differ each time', () => {
    const made = new Set(Array.from({ length: 50 }, () => generatePassword()));
    expect(made.size).toBe(50);
    for (const password of made) {
      expect(password).toHaveLength(12);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
    }
  });

  it('stores only a hash of an invite token', () => {
    const { token, hash } = newInviteToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
    expect(newInviteToken().token).not.toBe(token);
  });

  it('works a name out of an email address', () => {
    expect(nameFromEmail('priya.nair2@example.com')).toEqual({
      firstName: 'Priya',
      lastName: 'Nair',
    });
    expect(nameFromEmail('sam@example.com')).toEqual({ firstName: 'Sam', lastName: '' });
    expect(nameFromEmail('1234@example.com')).toEqual({ firstName: 'Candidate', lastName: '' });
  });
});

describe('isRoleAllowed', () => {
  it('lets any signed-in user through when no roles are required', () => {
    expect(isRoleAllowed(undefined, 'LEARNER')).toBe(true);
    expect(isRoleAllowed([], 'HR_ADMIN')).toBe(true);
    expect(isRoleAllowed(undefined, undefined)).toBe(false);
  });

  it('only lets listed roles through', () => {
    expect(isRoleAllowed(['HR_ADMIN'], 'HR_ADMIN')).toBe(true);
    expect(isRoleAllowed(['HR_ADMIN'], 'LEARNER')).toBe(false);
    expect(isRoleAllowed(['HR_ADMIN'], undefined)).toBe(false);
  });
});

describe('role guards on real routes', () => {
  it('learner routes are for learners only', () => {
    for (const method of [
      'induction',
      'steps',
      'progress',
      'question',
      'attempt',
      'acknowledge',
      'feedback',
      'summary',
    ]) {
      expect(allowed(LearnerController, method), method).toEqual(['LEARNER']);
    }
  });

  it('content writes, staff accounts and AI are for admins only', () => {
    for (const method of [
      'createModule',
      'updateModule',
      'deleteModule',
      'createStep',
      'updateStep',
      'moveStep',
      'deleteStep',
      'createQuestion',
      'updateQuestion',
      'deleteQuestion',
      'createAvatar',
      'updateAvatar',
      'deleteAvatar',
      'createBusinessUnit',
      'updateBusinessUnit',
      'deleteBusinessUnit',
    ]) {
      expect(allowed(ContentController, method), method).toEqual(['ADMIN']);
    }
    for (const method of ['list', 'create', 'update', 'resetPassword', 'importCsv']) {
      expect(allowed(UsersController, method), method).toEqual(['ADMIN']);
    }
    for (const method of ['status', 'generateScript', 'generateQuestions']) {
      expect(allowed(AiController, method), method).toEqual(['ADMIN']);
    }
  });

  it('the dashboard and candidate invitations are for HR and admins', () => {
    for (const method of [
      'summary',
      'employees',
      'employee',
      'quizAnalytics',
      'acknowledgments',
      'feedback',
    ]) {
      expect(allowed(DashboardController, method), method).toEqual(['ADMIN', 'HR_ADMIN']);
    }
    for (const method of ['list', 'create', 'invite', 'resetPassword', 'setActive']) {
      expect(allowed(CandidatesController, method), method).toEqual(['ADMIN', 'HR_ADMIN']);
    }
  });

  it('HR cannot edit content, presenters or staff accounts', () => {
    expect(canReach(ContentController, 'updateModule', 'HR_ADMIN')).toBe(false);
    expect(canReach(ContentController, 'updateAvatar', 'HR_ADMIN')).toBe(false);
    expect(canReach(UsersController, 'create', 'HR_ADMIN')).toBe(false);
  });

  it('Legal can read content and use the review workflow, nothing else in admin', () => {
    for (const method of [
      'listModules',
      'listAvatars',
      'listBusinessUnits',
      'reviewQueue',
      'transition',
    ]) {
      expect(allowed(ContentController, method), method).toEqual(['ADMIN', 'LEGAL_REVIEWER']);
    }
  });

  it('a request with no session is refused on protected routes', () => {
    expect(canReach(LearnerController, 'induction', undefined)).toBe(false);
    expect(canReach(DashboardController, 'summary', undefined)).toBe(false);
    expect(canReach(AuthController, 'me', undefined)).toBe(false);
  });

  it('public routes need no role, and /auth/me accepts any signed-in user', () => {
    expect(canReach(HealthController, 'check', undefined)).toBe(true);
    expect(canReach(AuthController, 'login', undefined)).toBe(true);
    expect(allowed(AuthController, 'me')).toEqual(ALL);
  });
});

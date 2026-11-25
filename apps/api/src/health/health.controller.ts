import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@induction/shared';
import { Public } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<HealthResponse> {
    const empty = { modules: 0, steps: 0, questions: 0, avatars: 0, users: 0 };
    try {
      const [modules, steps, questions, avatars, users] = await Promise.all([
        this.prisma.module.count(),
        this.prisma.step.count(),
        this.prisma.question.count(),
        this.prisma.avatar.count(),
        this.prisma.user.count(),
      ]);
      return {
        status: 'ok',
        database: 'up',
        counts: { modules, steps, questions, avatars, users },
      };
    } catch {
      return { status: 'ok', database: 'down', counts: empty };
    }
  }
}

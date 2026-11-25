import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AiController, AiService } from './admin/ai.controller';
import { ContentController } from './admin/content.controller';
import { ContentService } from './admin/content.service';
import { CredentialsService } from './admin/credentials.service';
import { UsersController } from './admin/users.controller';
import { AuthController } from './auth/auth.controller';
import { RolesGuard, SessionGuard } from './auth/auth.guards';
import { AuthService } from './auth/auth.service';
import { SecretBox } from './auth/secret-box';
import { SuperAdminService } from './auth/super-admin.service';
import { validateEnv } from './config/env';
import { DashboardController } from './dashboard/dashboard.controller';
import { CandidatesController } from './hr/candidates.controller';
import { HealthController } from './health/health.controller';
import { LearnerController } from './learner/learner.controller';
import { LearnerService } from './learner/learner.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Secrets live in the repo-root .env (git-ignored); scripts run from apps/api.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    LearnerController,
    ContentController,
    UsersController,
    AiController,
    DashboardController,
    CandidatesController,
  ],
  providers: [
    AuthService,
    SuperAdminService,
    SecretBox,
    LearnerService,
    ContentService,
    CredentialsService,
    AiService,
    // Order matters: the session is checked first, then the role.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

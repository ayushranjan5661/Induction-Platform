import { z } from 'zod';

/** Environment contract for the API. Validated once at startup. */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must start with postgresql:// (Prisma format)'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  AUTH_PROVIDER: z.enum(['dev']).default('dev'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  // Optional: encrypts staff default passwords shown to admins. Derived from JWT_SECRET when unset.
  CREDENTIALS_KEY: z.string().min(32, 'CREDENTIALS_KEY must be at least 32 characters').optional(),
  // Optional: the AI authoring assistant is switched off when these are missing.
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_API_KEY: z.string().min(1).optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().min(1).optional(),
  AZURE_OPENAI_API_VERSION: z.string().min(1).optional(),
  // Optional: when both are set, the API makes sure this Admin account exists at startup.
  SUPER_ADMIN_NAME: z.string().min(1).default('Super Admin'),
  SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be an email address').optional(),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'SUPER_ADMIN_PASSWORD must be at least 8 characters')
    .optional(),
});

export type Env = z.infer<typeof EnvSchema>;

const AZURE_KEYS = [
  'AZURE_OPENAI_ENDPOINT',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_DEPLOYMENT',
  'AZURE_OPENAI_API_VERSION',
] as const;

export function validateEnv(raw: Record<string, unknown>): Env {
  const input: Record<string, unknown> = { ...raw };
  for (const key of AZURE_KEYS) {
    // Accept the older VITE_-prefixed names so an existing .env keeps working.
    // The values are only ever read here, on the server.
    const value = input[key] ?? input[`VITE_${key}`];
    input[key] = typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
  }
  // Blank super-admin settings mean "not configured".
  for (const key of [
    'SUPER_ADMIN_NAME',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_PASSWORD',
    'CREDENTIALS_KEY',
  ]) {
    const value = input[key];
    input[key] = typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
  }

  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return parsed.data;
}

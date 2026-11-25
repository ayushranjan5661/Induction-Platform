import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

/** Validates a request body or query with a Zod schema and returns the parsed value. */
export class ZodPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      const first = issues[0];
      throw new BadRequestException({
        message: first
          ? `${first.path ? `${first.path}: ` : ''}${first.message}`
          : 'Invalid request',
        issues,
      });
    }
    return result.data;
  }
}

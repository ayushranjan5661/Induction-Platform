import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Turns the Prisma errors a user can cause (duplicates, unknown ids, records deleted mid-request)
 * into 409/400/404 responses instead of a 500. Everything else falls through to Nest's default.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  override catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const mapped = MAPPED[error.code];
    if (!mapped || host.getType() !== 'http') return super.catch(error, host);
    const res = host.switchToHttp().getResponse<Response>();
    res.status(mapped.status).json({ statusCode: mapped.status, message: mapped.message });
  }
}

const MAPPED: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'That already exists. Refresh and try again.' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'A linked record does not exist' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Not found' },
};

import { ArgumentsHost, Catch, type ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Translates Prisma database errors into clean HTTP responses instead of
 * leaking raw 500s (PRD §0.8 — predictable API). Without this, a unique-key
 * violation (e.g. duplicate employeeNo / code) surfaces as "Internal server
 * error" rather than a 409.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ');
        status = HttpStatus.CONFLICT;
        message = target ? `A record with this ${target} already exists` : 'Duplicate value violates a unique constraint';
        break;
      }
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) ?? 'Record not found';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'A referenced record does not exist (foreign key constraint)';
        break;
      case 'P2000':
        status = HttpStatus.BAD_REQUEST;
        message = 'A field value is too long';
        break;
      default:
        this.logger.error(`Unhandled Prisma error ${exception.code}: ${exception.message}`);
    }

    res.status(status).json({ statusCode: status, error: exception.code, message });
  }
}

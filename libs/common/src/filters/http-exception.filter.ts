import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorDto } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const uniqueViolation = !isHttpException ? this.extractUniqueViolation(exception) : undefined;

    let statusCode: number;
    let message: string;
    let errors: Record<string, string[]> | undefined;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      statusCode = exception.getStatus();
      message = this.extractMessage(exceptionResponse, exception);
      errors = this.extractValidationErrors(exceptionResponse);
    } else if (uniqueViolation) {
      statusCode = HttpStatus.CONFLICT;
      message = uniqueViolation;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = (exception as Error)?.message ?? 'Internal server error';
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        (exception as Error)?.stack,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}: ${message}`);
    }

    response.status(statusCode).json(new ApiErrorDto(statusCode, message, request.url, errors));
  }

  /** Postgres unique_violation (23505) — every service hits this the same way
   * (movie slugs, user emails, coupon codes, ...), so it's handled once here
   * instead of a try/catch at every call site that inserts/updates a unique
   * column. Falls back to a generic message if the driver ever doesn't give
   * us the usual "Key (col)=(val) already exists." detail string. */
  private extractUniqueViolation(exception: unknown): string | undefined {
    if (!(exception instanceof QueryFailedError)) return undefined;
    const driverError = exception.driverError as { code?: string; detail?: string };
    if (driverError?.code !== '23505') return undefined;

    const match = driverError.detail?.match(/^Key \(([^)]+)\)=\(([^)]+)\) already exists\.$/);
    if (match) {
      const [, column, value] = match;
      return `${column} "${value}" already exists`;
    }
    return 'Duplicate value violates a unique constraint';
  }

  private extractMessage(exceptionResponse: unknown, exception: unknown): string {
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: string | string[] }).message;
      return Array.isArray(msg) ? msg.join(', ') : msg;
    }
    return (exception as Error)?.message ?? 'Internal server error';
  }

  private extractValidationErrors(
    exceptionResponse: unknown,
  ): Record<string, string[]> | undefined {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      Array.isArray((exceptionResponse as { message: unknown }).message)
    ) {
      return { validation: (exceptionResponse as { message: string[] }).message };
    }
    return undefined;
  }
}

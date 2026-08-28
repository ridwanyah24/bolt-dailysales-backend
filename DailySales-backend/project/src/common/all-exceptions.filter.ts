import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let error: string;
    let message: string;
    let details: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        error = (res as any).error || (res as any).code || exception.name;
        message = (res as any).message || exception.message;
        details = (res as any).details;
      } else {
        error = exception.name;
        message = String(res);
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';
      this.logger.error(`Unhandled exception on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : exception);
    }

    const body: any = { statusCode: status, error, message };
    if (details !== undefined) body.details = details;

    response.status(status).json(body);
  }
}

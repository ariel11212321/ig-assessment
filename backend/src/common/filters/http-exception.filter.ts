import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'internal_server_error';
    let errorMessage = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        errorCode = (resp['error'] as string) || errorCode;
        errorMessage = (resp['error_message'] as string) || (resp['message'] as string) || errorMessage;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(`HTTP ${status}: ${errorCode} - ${errorMessage}`);

    response.status(status).json({
      success: false,
      error: errorCode,
      error_message: errorMessage,
    });
  }
}

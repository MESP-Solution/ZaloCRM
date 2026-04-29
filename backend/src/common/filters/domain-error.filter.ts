import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../errors/domain-error';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(exception.statusCode).json({
      error: exception.name,
      message: exception.message,
      statusCode: exception.statusCode,
    });
  }
}

@Catch(HttpException)
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = exception.getStatus();
    const errorResponse = exception.getResponse();

    if (typeof errorResponse === 'object' && errorResponse !== null) {
      response.status(statusCode).json({
        error: exception.name,
        ...errorResponse,
      });
      return;
    }

    response.status(statusCode).json({
      error: exception.name,
      message:
        typeof errorResponse === 'string' ? errorResponse : exception.message,
      statusCode,
    });
  }
}

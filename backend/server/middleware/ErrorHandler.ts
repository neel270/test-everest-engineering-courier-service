import { Request, Response, NextFunction } from 'express';
import {
  BaseError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  CalculationError
} from '../errors/CustomErrors';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    details?: any;
  };
}

export class ErrorHandler {
  static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response<ErrorResponse> {
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let isOperational = false;

    // Handle custom errors
    if (error instanceof BaseError) {
      statusCode = error.statusCode;
      message = error.message;
      errorCode = error.errorCode;
      isOperational = error.isOperational;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      message = error.message;
      errorCode = 'VALIDATION_ERROR';
      isOperational = true;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      errorCode = 'INVALID_ID';
      isOperational = true;
    } else if (error.name === 'MongoError' && (error as any).code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      errorCode = 'DUPLICATE_ENTRY';
      isOperational = true;
    } else if (error.message.includes('E11000')) {
      statusCode = 409;
      message = 'Resource already exists';
      errorCode = 'RESOURCE_EXISTS';
      isOperational = true;
    }

    // Log error for debugging
    console.error(`[${new Date().toISOString()}] ${errorCode}:`, {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message,
        code: errorCode,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(isDevelopment && {
          details: {
            stack: error.stack,
            originalMessage: error.message,
          }
        }),
      },
    };

    // Handle different error types with appropriate responses
    if (statusCode === 500 && !isOperational) {
      // Don't expose internal server errors to client
      errorResponse.error.message = 'Something went wrong. Please try again later.';
      errorResponse.error.code = 'INTERNAL_ERROR';
    }

    return res.status(statusCode).json(errorResponse);
  }

  static handle404(req: Request, res: Response, next: NextFunction): Response {
    const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);

    return res.status(404).json({
      success: false,
      error: {
        message: error.message,
        code: error.errorCode,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  static handleValidationError(error: any): ValidationError {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return new ValidationError(messages.join(', '));
    }
    return new ValidationError(error.message);
  }

  static async handleAsyncError(
    fn: Function,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.handle(error as Error, req, res, next);
    }
  }
}
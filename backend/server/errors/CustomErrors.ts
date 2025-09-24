export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, field?: string) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      true
    );
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', true);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, originalError?: any) {
    super(
      `Database operation failed: ${message}`,
      500,
      'DATABASE_ERROR',
      false
    );
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string) {
    super(
      `External service ${service} error: ${message}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true
    );
    this.name = 'ExternalServiceError';
  }
}

export class CalculationError extends BaseError {
  constructor(message: string, calculationType?: string) {
    super(
      `Calculation error${calculationType ? ` in ${calculationType}` : ''}: ${message}`,
      422,
      'CALCULATION_ERROR',
      true
    );
    this.name = 'CalculationError';
  }
}

export class PackageValidationError extends ValidationError {
  constructor(message: string, packageId?: string) {
    super(`Package validation failed${packageId ? ` for package ${packageId}` : ''}: ${message}`);
    this.name = 'PackageValidationError';
  }
}

export class VehicleValidationError extends ValidationError {
  constructor(message: string, vehicleId?: string) {
    super(`Vehicle validation failed${vehicleId ? ` for vehicle ${vehicleId}` : ''}: ${message}`);
    this.name = 'VehicleValidationError';
  }
}
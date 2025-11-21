/**
 * Frontend error handling utilities
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  message: string;
  code: string;
  severity: ErrorSeverity;
  timestamp: Date;
  details?: any;
}

class ErrorHandler {
  private errors: AppError[] = [];
  private maxErrors = 100;

  handle(error: unknown, severity: ErrorSeverity = 'error'): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      appError = {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        severity,
        timestamp: new Date(),
      };
    } else if (typeof error === 'string') {
      appError = {
        message: error,
        code: 'UNKNOWN_ERROR',
        severity,
        timestamp: new Date(),
      };
    } else if (error && typeof error === 'object' && 'message' in error) {
      appError = {
        message: (error as any).message,
        code: (error as any).code || 'UNKNOWN_ERROR',
        severity,
        timestamp: new Date(),
      };
    } else {
      appError = {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        severity,
        timestamp: new Date(),
        details: error,
      };
    }

    this.addError(appError);
    console.error(`[${appError.severity.toUpperCase()}]`, appError);

    return appError;
  }

  private addError(error: AppError): void {
    this.errors.push(error);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  getLastError(): AppError | null {
    return this.errors.length > 0 ? this.errors[this.errors.length - 1] : null;
  }

  getErrorsByCode(code: string): AppError[] {
    return this.errors.filter((e) => e.code === code);
  }
}

export const errorHandler = new ErrorHandler();

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return (error as any).message;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as any).status === 401;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  );
}

/**
 * Custom Error Classes and Error Handling Utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: unknown): { message: string; statusCode: number; code?: string; details?: any } {
  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any }
    
    if (prismaError.code === 'P2002') {
      return {
        message: 'Bu kayıt zaten mevcut (unique constraint violation)',
        statusCode: 409,
        code: 'DUPLICATE_ENTRY',
        details: prismaError.meta,
      }
    }
    
    if (prismaError.code === 'P2025') {
      return {
        message: 'Kayıt bulunamadı',
        statusCode: 404,
        code: 'RECORD_NOT_FOUND',
      }
    }
  }

  // Custom AppError
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    }
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> }
    return {
      message: 'Validation error',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: zodError.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      message: process.env.NODE_ENV === 'production' 
        ? 'Bir hata oluştu' 
        : error.message,
      statusCode: 500,
      code: 'INTERNAL_ERROR',
    }
  }

  // Unknown error
  return {
    message: 'Bilinmeyen bir hata oluştu',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  }
}


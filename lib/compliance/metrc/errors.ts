/**
 * Metrc Error Classes
 *
 * Custom error types for Metrc API integration
 */

/**
 * Base error class for all Metrc-related errors
 */
export class MetrcApiError extends Error {
  constructor(
    public statusCode: number,
    public metrcError: string,
    message?: string
  ) {
    super(message || `Metrc API Error (${statusCode}): ${metrcError}`)
    this.name = 'MetrcApiError'
    Object.setPrototypeOf(this, MetrcApiError.prototype)
  }

  /**
   * Check if the error is retryable
   */
  isRetryable(): boolean {
    // Retry on server errors and rate limiting
    return this.statusCode >= 500 || this.statusCode === 429
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.statusCode) {
      case 401:
        return 'Invalid Metrc API credentials. Please check your API keys in the admin settings.'
      case 403:
        return 'Insufficient permissions for this Metrc operation. Please verify your facility license.'
      case 404:
        return 'The requested resource was not found in Metrc.'
      case 422:
        return `Validation error: ${this.metrcError}`
      case 429:
        return 'Metrc rate limit exceeded. Please wait a moment and try again.'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Metrc service is temporarily unavailable. Please try again later.'
      default:
        return `Metrc API error: ${this.metrcError}`
    }
  }
}

/**
 * Validation error for data that fails Metrc requirements
 */
export class MetrcValidationError extends Error {
  constructor(
    public field: string,
    public reason: string,
    public code?: string
  ) {
    super(`Validation failed for ${field}: ${reason}`)
    this.name = 'MetrcValidationError'
    Object.setPrototypeOf(this, MetrcValidationError.prototype)
  }

  toJSON() {
    return {
      field: this.field,
      reason: this.reason,
      code: this.code,
    }
  }
}

/**
 * Authentication error for invalid or expired credentials
 */
export class MetrcAuthError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_VENDOR_KEY' | 'INVALID_USER_KEY' | 'EXPIRED_CREDENTIALS'
  ) {
    super(message)
    this.name = 'MetrcAuthError'
    Object.setPrototypeOf(this, MetrcAuthError.prototype)
  }

  getUserMessage(): string {
    switch (this.code) {
      case 'INVALID_VENDOR_KEY':
        return 'Invalid Metrc vendor API key. Please contact support.'
      case 'INVALID_USER_KEY':
        return 'Invalid facility API key. Please update your credentials in the admin settings.'
      case 'EXPIRED_CREDENTIALS':
        return 'Your Metrc API credentials have expired. Please renew them in the admin settings.'
      default:
        return this.message
    }
  }
}

/**
 * Network timeout error
 */
export class MetrcTimeoutError extends Error {
  constructor(
    public endpoint: string,
    public timeoutMs: number
  ) {
    super(`Request to ${endpoint} timed out after ${timeoutMs}ms`)
    this.name = 'MetrcTimeoutError'
    Object.setPrototypeOf(this, MetrcTimeoutError.prototype)
  }
}

/**
 * Metrc Error Tests
 *
 * Tests for Metrc error classes and error handling
 */

import {
  MetrcApiError,
  MetrcValidationError,
  MetrcAuthError,
  MetrcTimeoutError,
} from '../errors'

describe('Metrc Errors', () => {
  describe('MetrcApiError', () => {
    it('should create error with status code and message', () => {
      const error = new MetrcApiError(422, 'Validation failed')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(MetrcApiError)
      expect(error.statusCode).toBe(422)
      expect(error.metrcError).toBe('Validation failed')
      expect(error.message).toContain('422')
      expect(error.message).toContain('Validation failed')
    })

    it('should create error with custom message', () => {
      const error = new MetrcApiError(500, 'Server error', 'Custom message')

      expect(error.message).toBe('Custom message')
    })

    describe('isRetryable', () => {
      it('should mark 500 errors as retryable', () => {
        const error = new MetrcApiError(500, 'Server error')
        expect(error.isRetryable()).toBe(true)
      })

      it('should mark 502 errors as retryable', () => {
        const error = new MetrcApiError(502, 'Bad gateway')
        expect(error.isRetryable()).toBe(true)
      })

      it('should mark 503 errors as retryable', () => {
        const error = new MetrcApiError(503, 'Service unavailable')
        expect(error.isRetryable()).toBe(true)
      })

      it('should mark 429 errors as retryable', () => {
        const error = new MetrcApiError(429, 'Rate limit exceeded')
        expect(error.isRetryable()).toBe(true)
      })

      it('should not mark 400 errors as retryable', () => {
        const error = new MetrcApiError(400, 'Bad request')
        expect(error.isRetryable()).toBe(false)
      })

      it('should not mark 401 errors as retryable', () => {
        const error = new MetrcApiError(401, 'Unauthorized')
        expect(error.isRetryable()).toBe(false)
      })

      it('should not mark 422 errors as retryable', () => {
        const error = new MetrcApiError(422, 'Validation failed')
        expect(error.isRetryable()).toBe(false)
      })
    })

    describe('getUserMessage', () => {
      it('should return friendly message for 401 errors', () => {
        const error = new MetrcApiError(401, 'Unauthorized')
        expect(error.getUserMessage()).toContain('Invalid Metrc API credentials')
      })

      it('should return friendly message for 403 errors', () => {
        const error = new MetrcApiError(403, 'Forbidden')
        expect(error.getUserMessage()).toContain('Insufficient permissions')
      })

      it('should return friendly message for 404 errors', () => {
        const error = new MetrcApiError(404, 'Not found')
        expect(error.getUserMessage()).toContain('not found')
      })

      it('should return validation error for 422 errors', () => {
        const error = new MetrcApiError(422, 'Invalid data')
        expect(error.getUserMessage()).toContain('Validation error')
        expect(error.getUserMessage()).toContain('Invalid data')
      })

      it('should return friendly message for 429 errors', () => {
        const error = new MetrcApiError(429, 'Rate limit')
        expect(error.getUserMessage()).toContain('rate limit')
      })

      it('should return friendly message for 500 errors', () => {
        const error = new MetrcApiError(500, 'Server error')
        expect(error.getUserMessage()).toContain('temporarily unavailable')
      })

      it('should return default message for unknown status codes', () => {
        const error = new MetrcApiError(418, 'Teapot')
        expect(error.getUserMessage()).toContain('Metrc API error')
      })
    })
  })

  describe('MetrcValidationError', () => {
    it('should create validation error with field and reason', () => {
      const error = new MetrcValidationError('package_label', 'Invalid format')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(MetrcValidationError)
      expect(error.field).toBe('package_label')
      expect(error.reason).toBe('Invalid format')
      expect(error.message).toContain('package_label')
      expect(error.message).toContain('Invalid format')
    })

    it('should create validation error with code', () => {
      const error = new MetrcValidationError(
        'quantity',
        'Must be positive',
        'VAL_001'
      )

      expect(error.code).toBe('VAL_001')
    })

    it('should serialize to JSON', () => {
      const error = new MetrcValidationError(
        'field1',
        'Invalid',
        'CODE_123'
      )

      const json = error.toJSON()

      expect(json).toEqual({
        field: 'field1',
        reason: 'Invalid',
        code: 'CODE_123',
      })
    })
  })

  describe('MetrcAuthError', () => {
    it('should create auth error with code', () => {
      const error = new MetrcAuthError(
        'Invalid vendor key',
        'INVALID_VENDOR_KEY'
      )

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(MetrcAuthError)
      expect(error.message).toBe('Invalid vendor key')
      expect(error.code).toBe('INVALID_VENDOR_KEY')
    })

    describe('getUserMessage', () => {
      it('should return friendly message for invalid vendor key', () => {
        const error = new MetrcAuthError('Error', 'INVALID_VENDOR_KEY')
        expect(error.getUserMessage()).toContain('vendor API key')
      })

      it('should return friendly message for invalid user key', () => {
        const error = new MetrcAuthError('Error', 'INVALID_USER_KEY')
        expect(error.getUserMessage()).toContain('facility API key')
      })

      it('should return friendly message for expired credentials', () => {
        const error = new MetrcAuthError('Error', 'EXPIRED_CREDENTIALS')
        expect(error.getUserMessage()).toContain('expired')
      })
    })
  })

  describe('MetrcTimeoutError', () => {
    it('should create timeout error with endpoint and timeout', () => {
      const error = new MetrcTimeoutError('/facilities/v2/', 30000)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(MetrcTimeoutError)
      expect(error.endpoint).toBe('/facilities/v2/')
      expect(error.timeoutMs).toBe(30000)
      expect(error.message).toContain('/facilities/v2/')
      expect(error.message).toContain('30000')
    })
  })
})

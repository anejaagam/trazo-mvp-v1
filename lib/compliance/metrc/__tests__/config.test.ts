/**
 * Metrc Configuration Tests
 *
 * Tests for state-specific Metrc configuration and URL resolution
 */

import {
  getMetrcBaseUrl,
  isMetrcStateSupported,
  METRC_STATES,
} from '../config'

describe('Metrc Configuration', () => {
  describe('getMetrcBaseUrl', () => {
    it('should return production URL for Oregon', () => {
      const url = getMetrcBaseUrl('OR', false)
      expect(url).toBe('https://api-or.metrc.com')
    })

    it('should return sandbox URL for Oregon', () => {
      const url = getMetrcBaseUrl('OR', true)
      expect(url).toBe('https://sandbox-api-or.metrc.com')
    })

    it('should return production URL for Maryland', () => {
      const url = getMetrcBaseUrl('MD', false)
      expect(url).toBe('https://api-md.metrc.com')
    })

    it('should return sandbox URL for Maryland', () => {
      const url = getMetrcBaseUrl('MD', true)
      expect(url).toBe('https://sandbox-api-md.metrc.com')
    })

    it('should return production URL for California', () => {
      const url = getMetrcBaseUrl('CA', false)
      expect(url).toBe('https://api-ca.metrc.com')
    })

    it('should handle lowercase state codes', () => {
      const url = getMetrcBaseUrl('or', false)
      expect(url).toBe('https://api-or.metrc.com')
    })

    it('should use env var when useSandbox is undefined', () => {
      process.env.NEXT_PUBLIC_METRC_USE_SANDBOX = 'true'
      const url = getMetrcBaseUrl('OR')
      expect(url).toBe('https://sandbox-api-or.metrc.com')

      process.env.NEXT_PUBLIC_METRC_USE_SANDBOX = 'false'
      const url2 = getMetrcBaseUrl('OR')
      expect(url2).toBe('https://api-or.metrc.com')
    })

    it('should throw error for unsupported state', () => {
      expect(() => getMetrcBaseUrl('XX')).toThrow(
        'Unsupported Metrc state: XX'
      )
    })

    it('should support all defined states', () => {
      METRC_STATES.forEach((state) => {
        expect(() => getMetrcBaseUrl(state, false)).not.toThrow()
        expect(() => getMetrcBaseUrl(state, true)).not.toThrow()
      })
    })
  })

  describe('isMetrcStateSupported', () => {
    it('should return true for supported states', () => {
      expect(isMetrcStateSupported('OR')).toBe(true)
      expect(isMetrcStateSupported('MD')).toBe(true)
      expect(isMetrcStateSupported('CA')).toBe(true)
      expect(isMetrcStateSupported('CO')).toBe(true)
      expect(isMetrcStateSupported('MI')).toBe(true)
    })

    it('should return false for unsupported states', () => {
      expect(isMetrcStateSupported('XX')).toBe(false)
      expect(isMetrcStateSupported('NY')).toBe(false)
      expect(isMetrcStateSupported('TX')).toBe(false)
    })

    it('should handle lowercase state codes', () => {
      expect(isMetrcStateSupported('or')).toBe(true)
      expect(isMetrcStateSupported('md')).toBe(true)
      expect(isMetrcStateSupported('ca')).toBe(true)
    })
  })

  describe('METRC_STATES', () => {
    it('should contain expected states', () => {
      expect(METRC_STATES).toContain('OR')
      expect(METRC_STATES).toContain('MD')
      expect(METRC_STATES).toContain('CA')
      expect(METRC_STATES).toContain('CO')
      expect(METRC_STATES).toContain('MI')
      expect(METRC_STATES).toContain('NV')
      expect(METRC_STATES).toContain('AK')
      expect(METRC_STATES).toContain('MA')
      expect(METRC_STATES).toContain('OK')
    })

    it('should have at least 9 supported states', () => {
      expect(METRC_STATES.length).toBeGreaterThanOrEqual(9)
    })
  })
})

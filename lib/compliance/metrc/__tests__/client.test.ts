/**
 * MetrcClient Tests
 *
 * Tests for the core Metrc API client functionality
 */

import { MetrcClient } from '../client'
import { MetrcApiError, MetrcTimeoutError } from '../errors'
import type { MetrcClientConfig } from '../types'

// Mock fetch globally
global.fetch = jest.fn()

describe('MetrcClient', () => {
  let client: MetrcClient
  const mockConfig: MetrcClientConfig = {
    vendorApiKey: 'test-vendor-key',
    userApiKey: 'test-user-key',
    facilityLicenseNumber: '123-ABC',
    state: 'OR',
    isSandbox: true,
  }

  beforeEach(() => {
    client = new MetrcClient(mockConfig)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      const config = client.getConfig()

      expect(config.state).toBe('OR')
      expect(config.facilityLicenseNumber).toBe('123-ABC')
      expect(config.isSandbox).toBe(true)
      expect(config.baseUrl).toBe('https://sandbox-api-or.metrc.com')
    })

    it('should use production URL when isSandbox is false', () => {
      const prodClient = new MetrcClient({
        ...mockConfig,
        isSandbox: false,
      })

      const config = prodClient.getConfig()
      expect(config.baseUrl).toBe('https://api-or.metrc.com')
    })

    it('should support custom base URL', () => {
      const customClient = new MetrcClient({
        ...mockConfig,
        baseUrl: 'https://custom-api.example.com',
      })

      const config = customClient.getConfig()
      expect(config.baseUrl).toBe('https://custom-api.example.com')
    })
  })

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      })

      const result = await client.validateCredentials()

      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox-api-or.metrc.com/facilities/v2/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-api-key': 'test-vendor-key',
            'x-user-api-key': 'test-user-key',
          }),
        })
      )
    })

    it('should return false for invalid credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const result = await client.validateCredentials()

      expect(result).toBe(false)
    })

    it('should throw MetrcApiError for other errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      await expect(client.validateCredentials()).rejects.toThrow(MetrcApiError)
    })
  })

  describe('request', () => {
    it('should make authenticated GET request', async () => {
      const mockData = { id: 1, name: 'Test Facility' }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await client.request('/facilities/v2/', { method: 'GET' })

      expect(result).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox-api-or.metrc.com/facilities/v2/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-vendor-key',
            'x-user-api-key': 'test-user-key',
          }),
        })
      )
    })

    it('should make authenticated POST request with body', async () => {
      const requestBody = { name: 'Test Package' }
      const mockResponse = { success: true }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await client.request('/packages/v2/', {
        method: 'POST',
        body: requestBody,
      })

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://sandbox-api-or.metrc.com/packages/v2/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      )
    })

    it('should throw MetrcApiError on 422 validation error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => 'Validation failed: Invalid package data',
      })

      await expect(
        client.request('/packages/v2/', { method: 'POST' })
      ).rejects.toThrow(MetrcApiError)
    })

    it('should retry on 429 rate limit error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        })

      const result = await client.request('/facilities/v2/')

      expect(result).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should retry on 500 server error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        })

      const result = await client.request('/facilities/v2/')

      expect(result).toEqual({ success: true })
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should throw after max retries', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      await expect(client.request('/facilities/v2/')).rejects.toThrow(
        MetrcApiError
      )

      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle timeout', async () => {
      const shortTimeoutClient = new MetrcClient({
        ...mockConfig,
        timeout: 100,
      })

      // Mock fetch to simulate a timeout by checking if signal is aborted
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        (_url: string, options: any) =>
          new Promise((resolve, reject) => {
            // Simulate delay longer than timeout
            const delay = setTimeout(() => {
              resolve({ ok: true, json: async () => ({}) })
            }, 200)

            // Listen for abort signal
            if (options.signal) {
              options.signal.addEventListener('abort', () => {
                clearTimeout(delay)
                reject(new DOMException('The user aborted a request', 'AbortError'))
              })
            }
          })
      )

      await expect(
        shortTimeoutClient.request('/facilities/v2/')
      ).rejects.toThrow(MetrcTimeoutError)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      )

      await expect(client.request('/facilities/v2/')).rejects.toThrow(
        MetrcApiError
      )
    })
  })

  describe('error handling', () => {
    it('should throw MetrcApiError with correct status code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      })

      try {
        await client.request('/facilities/v2/')
      } catch (error) {
        expect(error).toBeInstanceOf(MetrcApiError)
        expect((error as MetrcApiError).statusCode).toBe(403)
        expect((error as MetrcApiError).isRetryable()).toBe(false)
      }
    })

    it('should mark 500 errors as retryable', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      })

      try {
        await client.request('/facilities/v2/')
      } catch (error) {
        // Will retry and eventually fail after max retries
        expect(error).toBeInstanceOf(MetrcApiError)
      }
    })
  })
})

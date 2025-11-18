/**
 * Packages Write Operations Tests
 *
 * Tests for Metrc packages POST/PUT endpoint operations
 */

import { MetrcClient } from '../client'
import { PackagesEndpoint } from '../endpoints/packages'
import type {
  MetrcClientConfig,
  MetrcPackageCreate,
  MetrcPackageAdjustment,
  MetrcPackageLocationChange,
  MetrcPackageFinish,
} from '../types'

// Mock fetch globally
global.fetch = jest.fn()

describe('Packages Write Operations', () => {
  let client: MetrcClient
  let packagesEndpoint: PackagesEndpoint
  const mockConfig: MetrcClientConfig = {
    vendorApiKey: 'test-vendor-key',
    userApiKey: 'test-user-key',
    facilityLicenseNumber: '123-ABC',
    state: 'OR',
    isSandbox: true,
  }

  beforeEach(() => {
    client = new MetrcClient(mockConfig)
    packagesEndpoint = new PackagesEndpoint(client)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('create', () => {
    const mockPackageCreate: MetrcPackageCreate = {
      Tag: '1A4FF0100000022000000123',
      Item: 'Blue Dream - Flower',
      Quantity: 100.5,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2024-11-01',
    }

    it('should create packages successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.create([mockPackageCreate])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/create?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-vendor-key',
            'x-user-api-key': 'test-user-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify([mockPackageCreate]),
        })
      )
    })

    it('should create multiple packages in batch', async () => {
      const packages = [
        mockPackageCreate,
        { ...mockPackageCreate, Tag: 'ABCDEFGH1234567890123456' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.create(packages)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody).toHaveLength(2)
      expect(sentBody[0].Tag).toBe(mockPackageCreate.Tag)
      expect(sentBody[1].Tag).toBe('ABCDEFGH1234567890123456')
    })

    it('should include ingredients when provided', async () => {
      const packageWithIngredients: MetrcPackageCreate = {
        ...mockPackageCreate,
        Ingredients: [
          {
            Package: '1A4FF0100000022000000111',
            Quantity: 50,
            UnitOfMeasure: 'Grams',
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.create([packageWithIngredients])

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody[0].Ingredients).toBeDefined()
      expect(sentBody[0].Ingredients).toHaveLength(1)
    })

    it('should throw error on API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ Message: 'Invalid package data' }),
      })

      await expect(packagesEndpoint.create([mockPackageCreate])).rejects.toThrow()
    })
  })

  describe('adjust', () => {
    const mockAdjustment: MetrcPackageAdjustment = {
      Label: '1A4FF0100000022000000123',
      Quantity: -10.5,
      UnitOfMeasure: 'Grams',
      AdjustmentReason: 'Drying',
      AdjustmentDate: '2024-11-01',
    }

    it('should adjust package quantity successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.adjust([mockAdjustment])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/adjust?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify([mockAdjustment]),
        })
      )
    })

    it('should allow negative quantity adjustments', async () => {
      const adjustment = { ...mockAdjustment, Quantity: -50 }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.adjust([adjustment])

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody[0].Quantity).toBe(-50)
    })

    it('should allow positive quantity adjustments', async () => {
      const adjustment = { ...mockAdjustment, Quantity: 50 }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.adjust([adjustment])

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody[0].Quantity).toBe(50)
    })

    it('should include ReasonNote when provided', async () => {
      const adjustment = { ...mockAdjustment, ReasonNote: 'Additional notes' }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.adjust([adjustment])

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody[0].ReasonNote).toBe('Additional notes')
    })
  })

  describe('changeLocation', () => {
    const mockLocationChange: MetrcPackageLocationChange = {
      Label: '1A4FF0100000022000000123',
      Location: 'Flowering Room A',
      MoveDate: '2024-11-01',
    }

    it('should change package location successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.changeLocation([mockLocationChange])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/change/locations?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify([mockLocationChange]),
        })
      )
    })

    it('should change location for multiple packages', async () => {
      const changes = [
        mockLocationChange,
        { ...mockLocationChange, Label: 'ABCDEFGH1234567890123456' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.changeLocation(changes)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody).toHaveLength(2)
    })
  })

  describe('finish', () => {
    const mockFinish: MetrcPackageFinish = {
      Label: '1A4FF0100000022000000123',
      ActualDate: '2024-11-01',
    }

    it('should finish packages successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.finish([mockFinish])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/finish?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify([mockFinish]),
        })
      )
    })

    it('should finish multiple packages', async () => {
      const finishes = [
        mockFinish,
        { ...mockFinish, Label: 'ABCDEFGH1234567890123456' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.finish(finishes)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody).toHaveLength(2)
    })
  })

  describe('unfinish', () => {
    it('should unfinish packages successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.unfinish(['1A4FF0100000022000000123'])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/unfinish?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify([{ Label: '1A4FF0100000022000000123' }]),
        })
      )
    })

    it('should unfinish multiple packages', async () => {
      const labels = ['1A4FF0100000022000000123', 'ABCDEFGH1234567890123456']

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await packagesEndpoint.unfinish(labels)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const sentBody = JSON.parse(fetchCall[1].body)
      expect(sentBody).toHaveLength(2)
      expect(sentBody[0].Label).toBe(labels[0])
      expect(sentBody[1].Label).toBe(labels[1])
    })
  })

  describe('error handling', () => {
    const mockPackageCreate: MetrcPackageCreate = {
      Tag: '1A4FF0100000022000000123',
      Item: 'Blue Dream - Flower',
      Quantity: 100.5,
      UnitOfMeasure: 'Grams',
      PackagedDate: '2024-11-01',
    }

    it('should handle 401 authentication errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ Message: 'Invalid API key' }),
      })

      await expect(packagesEndpoint.create([mockPackageCreate])).rejects.toThrow()
    })

    it('should handle 422 validation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ Message: 'Invalid package data' }),
      })

      await expect(packagesEndpoint.create([mockPackageCreate])).rejects.toThrow()
    })

    it('should handle 500 server errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ Message: 'Internal server error' }),
      })

      await expect(packagesEndpoint.create([mockPackageCreate])).rejects.toThrow()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(packagesEndpoint.create([mockPackageCreate])).rejects.toThrow('Network error')
    })
  })
})

/**
 * Packages Endpoint Tests
 *
 * Tests for the Metrc packages endpoint
 */

import { MetrcClient } from '../client'
import { PackagesEndpoint } from '../endpoints/packages'
import type { MetrcClientConfig, MetrcPackage } from '../types'

// Mock fetch globally
global.fetch = jest.fn()

describe('PackagesEndpoint', () => {
  let client: MetrcClient
  let packagesEndpoint: PackagesEndpoint
  const mockConfig: MetrcClientConfig = {
    vendorApiKey: 'test-vendor-key',
    userApiKey: 'test-user-key',
    facilityLicenseNumber: '123-ABC',
    state: 'OR',
    isSandbox: true,
  }

  const mockPackage: MetrcPackage = {
    Id: 12345,
    Label: '1A4FF0100000022000000123',
    PackageType: 'Product',
    ItemId: 67890,
    Item: 'Blue Dream - Flower',
    Quantity: 100.5,
    UnitOfMeasure: 'Grams',
    FacilityLicenseNumber: '123-ABC',
    FacilityName: 'Test Facility',
    PackagedDate: '2024-10-15',
    IsInTransit: false,
    IsOnHold: false,
  }

  beforeEach(() => {
    client = new MetrcClient(mockConfig)
    packagesEndpoint = new PackagesEndpoint(client)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('listActive', () => {
    it('should fetch active packages without date filters', async () => {
      const mockResponse = [mockPackage]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const packages = await packagesEndpoint.listActive()

      expect(packages).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/active?licenseNumber=123-ABC'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-api-key': 'test-vendor-key',
            'x-user-api-key': 'test-user-key',
          }),
        })
      )
    })

    it('should fetch active packages with date filters', async () => {
      const mockResponse = [mockPackage]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const packages = await packagesEndpoint.listActive('2024-01-01', '2024-12-31')

      expect(packages).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/packages/v2/active?licenseNumber=123-ABC&lastModifiedStart=2024-01-01&lastModifiedEnd=2024-12-31'
        ),
        expect.any(Object)
      )
    })
  })

  describe('listInactive', () => {
    it('should fetch inactive packages', async () => {
      const mockResponse = [{ ...mockPackage, ArchivedDate: '2024-11-01' }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const packages = await packagesEndpoint.listInactive()

      expect(packages).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/inactive?licenseNumber=123-ABC'),
        expect.any(Object)
      )
    })
  })

  describe('listOnHold', () => {
    it('should fetch packages on hold', async () => {
      const mockResponse = [{ ...mockPackage, IsOnHold: true }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const packages = await packagesEndpoint.listOnHold()

      expect(packages).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/onhold?licenseNumber=123-ABC'),
        expect.any(Object)
      )
    })
  })

  describe('listInTransit', () => {
    it('should fetch packages in transit', async () => {
      const mockResponse = [{ ...mockPackage, IsInTransit: true }]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const packages = await packagesEndpoint.listInTransit()

      expect(packages).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/intransit?licenseNumber=123-ABC'),
        expect.any(Object)
      )
    })
  })

  describe('getById', () => {
    it('should fetch a package by ID', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      })

      const pkg = await packagesEndpoint.getById(12345)

      expect(pkg).toEqual(mockPackage)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/12345'),
        expect.any(Object)
      )
    })
  })

  describe('getByLabel', () => {
    it('should fetch a package by label', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      })

      const pkg = await packagesEndpoint.getByLabel('1A4FF0100000022000000123')

      expect(pkg).toEqual(mockPackage)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/label/1A4FF0100000022000000123'),
        expect.any(Object)
      )
    })
  })

  describe('listTypes', () => {
    it('should fetch package types', async () => {
      const mockTypes = ['Product', 'Immature Plant', 'Waste']
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTypes,
      })

      const types = await packagesEndpoint.listTypes()

      expect(types).toEqual(mockTypes)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/types'),
        expect.any(Object)
      )
    })
  })

  describe('listAdjustReasons', () => {
    it('should fetch adjust reasons', async () => {
      const mockReasons = [
        { Name: 'Drying', RequiresNote: false },
        { Name: 'Spoilage', RequiresNote: true },
      ]
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReasons,
      })

      const reasons = await packagesEndpoint.listAdjustReasons()

      expect(reasons).toEqual(mockReasons)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/packages/v2/adjust/reasons?licenseNumber=123-ABC'),
        expect.any(Object)
      )
    })
  })
})

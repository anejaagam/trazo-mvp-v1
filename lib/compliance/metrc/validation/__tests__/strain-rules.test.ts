/**
 * Strain Validation Rules Tests
 *
 * Tests for strain validation logic used in Metrc compliance
 */

import {
  validateStrainCreate,
  validateStrainUpdate,
  validateCultivarForMetrcSync,
  validateStrainNameMatch,
  validateBatchStrainForMetrc,
  validateStrainCreateBatch,
} from '../strain-rules'

describe('Strain Validation Rules', () => {
  describe('validateStrainCreate', () => {
    it('should pass for valid strain creation', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when name is missing', () => {
      const strain = {
        Name: '',
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'Name')).toBe(true)
    })

    it('should fail when name exceeds 100 characters', () => {
      const strain = {
        Name: 'A'.repeat(101),
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'NAME_TOO_LONG')).toBe(true)
    })

    it('should fail when THC level is negative', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: -5,
        CbdLevel: 0,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'ThcLevel')).toBe(true)
    })

    it('should fail when CBD level exceeds 100', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 150,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'CbdLevel')).toBe(true)
    })

    it('should warn on unknown testing status', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'Unknown',
        ThcLevel: 0,
        CbdLevel: 0,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.field === 'TestingStatus')).toBe(true)
    })

    it('should warn when indica + sativa percentages do not equal 100', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
        IndicaPercentage: 60,
        SativaPercentage: 60,
      }

      const result = validateStrainCreate(strain)

      // Implementation warns but doesn't fail
      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'PERCENTAGE_SUM_MISMATCH')).toBe(true)
    })

    it('should pass with valid indica/sativa percentages', () => {
      const strain = {
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 20,
        CbdLevel: 1,
        IndicaPercentage: 40,
        SativaPercentage: 60,
      }

      const result = validateStrainCreate(strain)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateStrainUpdate', () => {
    it('should require Id for update', () => {
      const strain = {
        Id: 0,
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
      }

      const result = validateStrainUpdate(strain)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'Id')).toBe(true)
    })

    it('should pass with valid Id', () => {
      const strain = {
        Id: 123,
        Name: 'Blue Dream',
        TestingStatus: 'None',
        ThcLevel: 20,
        CbdLevel: 1,
      }

      const result = validateStrainUpdate(strain)

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateCultivarForMetrcSync', () => {
    it('should pass for cultivar with valid name', () => {
      const cultivar = {
        id: 'test-id',
        name: 'Purple Haze',
        organization_id: 'org-id',
      }

      const result = validateCultivarForMetrcSync(cultivar)

      expect(result.isValid).toBe(true)
    })

    it('should fail when name is missing', () => {
      const cultivar = {
        id: 'test-id',
        name: '',
        organization_id: 'org-id',
      }

      const result = validateCultivarForMetrcSync(cultivar)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'name')).toBe(true)
    })

    it('should warn when cultivar already has Metrc strain ID', () => {
      const cultivar = {
        id: 'test-id',
        name: 'Purple Haze',
        organization_id: 'org-id',
        metrc_strain_id: 12345,
      }

      const result = validateCultivarForMetrcSync(cultivar)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'ALREADY_SYNCED')).toBe(true)
    })
  })

  describe('validateStrainNameMatch', () => {
    it('should return exact match when found', () => {
      const metrcStrains = [
        { Id: 1, Name: 'Blue Dream' },
        { Id: 2, Name: 'Purple Haze' },
        { Id: 3, Name: 'OG Kush' },
      ]

      const result = validateStrainNameMatch('Blue Dream', metrcStrains)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should be case insensitive for exact matches', () => {
      const metrcStrains = [
        { Id: 1, Name: 'Blue Dream' },
      ]

      const result = validateStrainNameMatch('blue dream', metrcStrains)

      expect(result.isValid).toBe(true)
    })

    it('should warn on close matches', () => {
      const metrcStrains = [
        { Id: 1, Name: 'Blue Dream Haze' },
        { Id: 2, Name: 'Blue Dream OG' },
      ]

      const result = validateStrainNameMatch('Blue Dream', metrcStrains)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'CLOSE_MATCH_FOUND')).toBe(true)
    })

    it('should error when no match found', () => {
      const metrcStrains = [
        { Id: 1, Name: 'Purple Haze' },
        { Id: 2, Name: 'OG Kush' },
      ]

      const result = validateStrainNameMatch('Blue Dream', metrcStrains)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'STRAIN_NOT_FOUND')).toBe(true)
    })
  })

  describe('validateBatchStrainForMetrc', () => {
    it('should pass when cultivar has Metrc strain ID', () => {
      const batch = {
        batch_number: 'BATCH-001',
        cultivar_name: 'Blue Dream',
        cultivar: {
          name: 'Blue Dream',
          metrc_strain_id: 12345,
        },
      }

      const result = validateBatchStrainForMetrc(batch)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when cultivar name is missing', () => {
      const batch = {
        batch_number: 'BATCH-001',
        cultivar_name: '',
      }

      const result = validateBatchStrainForMetrc(batch)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'cultivar')).toBe(true)
      expect(result.errors.some((e) => e.code === 'MISSING_STRAIN')).toBe(true)
    })

    it('should warn when cultivar not linked to Metrc strain', () => {
      const batch = {
        batch_number: 'BATCH-001',
        cultivar_name: 'Blue Dream',
        cultivar: {
          name: 'Blue Dream',
          metrc_strain_id: null,
        },
      }

      const result = validateBatchStrainForMetrc(batch)

      expect(result.isValid).toBe(true)
      expect(result.warnings.some((w) => w.code === 'STRAIN_NOT_LINKED')).toBe(true)
    })

    it('should pass when cultivar has Metrc strain ID even with different name', () => {
      const batch = {
        batch_number: 'BATCH-001',
        cultivar_name: 'Blue Dream',
        cultivar: {
          name: 'Blue Dream Haze',
          metrc_strain_id: 12345,
        },
      }

      const result = validateBatchStrainForMetrc(batch)

      // Implementation passes as long as there's a strain name (from batch or cultivar)
      // and the cultivar has a Metrc strain ID
      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('validateStrainCreateBatch', () => {
    it('should pass for valid batch of strains', () => {
      const strains = [
        { Name: 'Blue Dream', TestingStatus: 'None', ThcLevel: 0, CbdLevel: 0 },
        { Name: 'Purple Haze', TestingStatus: 'None', ThcLevel: 0, CbdLevel: 0 },
      ]

      const result = validateStrainCreateBatch(strains)

      expect(result.isValid).toBe(true)
    })

    it('should fail for empty array', () => {
      const result = validateStrainCreateBatch([])

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'EMPTY_ARRAY')).toBe(true)
    })

    it('should fail when batch exceeds 100 strains', () => {
      const strains = Array.from({ length: 101 }, (_, i) => ({
        Name: `Strain ${i}`,
        TestingStatus: 'None',
        ThcLevel: 0,
        CbdLevel: 0,
      }))

      const result = validateStrainCreateBatch(strains)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'BATCH_SIZE_EXCEEDED')).toBe(true)
    })

    it('should fail for duplicate strain names', () => {
      const strains = [
        { Name: 'Blue Dream', TestingStatus: 'None', ThcLevel: 0, CbdLevel: 0 },
        { Name: 'Blue Dream', TestingStatus: 'None', ThcLevel: 0, CbdLevel: 0 },
      ]

      const result = validateStrainCreateBatch(strains)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NAMES')).toBe(true)
    })

    it('should aggregate errors from individual strains', () => {
      const strains = [
        { Name: '', TestingStatus: 'None', ThcLevel: 0, CbdLevel: 0 },
        { Name: 'Blue Dream', TestingStatus: 'None', ThcLevel: -5, CbdLevel: 0 },
      ]

      const result = validateStrainCreateBatch(strains)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })
})

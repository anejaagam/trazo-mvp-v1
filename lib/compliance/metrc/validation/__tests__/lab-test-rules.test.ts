/**
 * Lab Test Rules Validation Tests
 * Phase 3.5 Week 8 Implementation
 */

import {
  validateLabTestUpload,
  validateTestResults,
  validatePackageTestAssociation,
  validateTestStatusUpdate,
  type LabTestUploadData,
  type TestResultsData
} from '../lab-test-rules'

describe('validateLabTestUpload', () => {
  const validUploadData: LabTestUploadData = {
    labName: 'Green Scientific Labs',
    labLicenseNumber: 'LAB12345',
    testDate: '2024-11-15',
    coaFile: {
      name: 'test-results.pdf',
      size: 1024 * 1024, // 1MB
      type: 'application/pdf'
    },
    packages: ['pkg-001'],
    sampleQuantity: 10,
    sampleUnitOfMeasure: 'g',
    notes: 'Sample test'
  }

  it('should validate valid lab test upload', () => {
    const result = validateLabTestUpload(validUploadData)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require lab name', () => {
    const data = { ...validUploadData, labName: '' }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'REQUIRED', field: 'labName' })
    )
  })

  it('should require test date', () => {
    const data = { ...validUploadData, testDate: '' }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'REQUIRED', field: 'testDate' })
    )
  })

  it('should require COA file', () => {
    const data = { ...validUploadData, coaFile: null as any }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'REQUIRED', field: 'coaFile' })
    )
  })

  it('should validate file type', () => {
    const data = {
      ...validUploadData,
      coaFile: {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain'
      }
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_file_type' })
    )
  })

  it('should accept valid file types', () => {
    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ]

    validTypes.forEach(type => {
      const data = {
        ...validUploadData,
        coaFile: {
          name: 'test.file',
          size: 1024,
          type
        }
      }
      const result = validateLabTestUpload(data)
      expect(result.isValid).toBe(true)
    })
  })

  it('should validate file size limit', () => {
    const data = {
      ...validUploadData,
      coaFile: {
        name: 'test.pdf',
        size: 11 * 1024 * 1024, // 11MB
        type: 'application/pdf'
      }
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'file_too_large' })
    )
  })

  it('should warn about small files', () => {
    const data = {
      ...validUploadData,
      coaFile: {
        name: 'test.pdf',
        size: 500, // Less than 1KB
        type: 'application/pdf'
      }
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'file_too_small' })
    )
  })

  it('should not allow future test dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const data = {
      ...validUploadData,
      testDate: tomorrow.toISOString().split('T')[0]
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'DATE_IN_FUTURE' })
    )
  })

  it('should warn about old test dates', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 45)
    const data = {
      ...validUploadData,
      testDate: oldDate.toISOString().split('T')[0]
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'test_date_old' })
    )
  })

  it('should require at least one package or batch', () => {
    const data = {
      ...validUploadData,
      packages: [],
      batches: []
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'no_associations' })
    )
  })

  it('should detect duplicate packages', () => {
    const data = {
      ...validUploadData,
      packages: ['pkg-001', 'pkg-002', 'pkg-001']
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'duplicate_packages' })
    )
  })

  it('should warn about many packages', () => {
    const packages = Array.from({ length: 150 }, (_, i) => `pkg-${i}`)
    const data = {
      ...validUploadData,
      packages
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'many_packages' })
    )
  })

  it('should require sample unit when quantity provided', () => {
    const data = {
      ...validUploadData,
      sampleQuantity: 10,
      sampleUnitOfMeasure: undefined
    }
    const result = validateLabTestUpload(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'missing_unit' })
    )
  })
})

describe('validateTestResults', () => {
  const validTestResults: TestResultsData = {
    potency: {
      tested: true,
      passed: true,
      thc_percent: 22.5,
      cbd_percent: 0.5,
      total_cannabinoids: 25.0
    },
    pesticides: {
      tested: true,
      passed: true,
      detected: []
    }
  }

  it('should validate valid test results', () => {
    const result = validateTestResults(validTestResults)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require at least one test', () => {
    const data: TestResultsData = {}
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'no_tests' })
    )
  })

  it('should require pass/fail status for tested categories', () => {
    const data: TestResultsData = {
      potency: {
        tested: true
        // Missing passed field
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'potency_status_missing' })
    )
  })

  it('should validate THC percentage range', () => {
    const data: TestResultsData = {
      potency: {
        tested: true,
        passed: true,
        thc_percent: 150 // Invalid
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_thc_percent' })
    )
  })

  it('should warn about high THC for flower', () => {
    const data: TestResultsData = {
      potency: {
        tested: true,
        passed: true,
        thc_percent: 35
      }
    }
    const result = validateTestResults(data, 'flower')
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'thc_exceeds_limit' })
    )
  })

  it('should validate cannabinoid totals', () => {
    const data: TestResultsData = {
      potency: {
        tested: true,
        passed: true,
        thc_percent: 20,
        cbd_percent: 10,
        total_cannabinoids: 25 // Should be at least 30
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_cannabinoid_total' })
    )
  })

  it('should validate pathogen detection values', () => {
    const data: TestResultsData = {
      microbials: {
        tested: true,
        passed: false,
        e_coli: 'maybe' as any // Invalid value
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_e_coli_result' })
    )
  })

  it('should validate yeast/mold counts', () => {
    const data: TestResultsData = {
      microbials: {
        tested: true,
        passed: false,
        total_yeast_mold_cfu: -100 // Invalid negative value
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'negative_yeast_mold' })
    )
  })

  it('should warn about high moisture for flower', () => {
    const data: TestResultsData = {
      moisture: {
        tested: true,
        passed: true,
        percentage: 18
      }
    }
    const result = validateTestResults(data, 'flower')
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'high_moisture' })
    )
  })

  it('should validate water activity range', () => {
    const data: TestResultsData = {
      water_activity: {
        tested: true,
        passed: true,
        value: 1.5 // Invalid - must be 0-1
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_water_activity' })
    )
  })

  it('should warn about missing required tests for product type', () => {
    const data: TestResultsData = {
      potency: {
        tested: true,
        passed: true
      }
      // Missing other required tests for flower
    }
    const result = validateTestResults(data, 'flower')
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'missing_required_tests' })
    )
  })

  it('should warn about failed tests', () => {
    const data: TestResultsData = {
      potency: {
        tested: true,
        passed: true
      },
      pesticides: {
        tested: true,
        passed: false,
        detected: ['Bifenthrin']
      }
    }
    const result = validateTestResults(data)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'has_failed_tests' })
    )
  })
})

describe('validatePackageTestAssociation', () => {
  it('should validate valid association', () => {
    const result = validatePackageTestAssociation(
      'pkg-123',
      'test-456',
      true,
      5
    )
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should require package ID', () => {
    const result = validatePackageTestAssociation('', 'test-456')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'packageId', code: 'REQUIRED' })
    )
  })

  it('should require test ID', () => {
    const result = validatePackageTestAssociation('pkg-123', '')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'testId', code: 'REQUIRED' })
    )
  })

  it('should warn about missing sample quantity when sample taken', () => {
    const result = validatePackageTestAssociation(
      'pkg-123',
      'test-456',
      true,
      undefined
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'missing_sample_quantity' })
    )
  })

  it('should validate positive sample quantity', () => {
    const result = validatePackageTestAssociation(
      'pkg-123',
      'test-456',
      true,
      -5
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'sampleQuantity', code: 'NOT_POSITIVE' })
    )
  })
})

describe('validateTestStatusUpdate', () => {
  it('should validate valid status update', () => {
    const result = validateTestStatusUpdate('pending', 'in_progress')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject invalid status', () => {
    const result = validateTestStatusUpdate('pending', 'invalid_status')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_status' })
    )
  })

  it('should prevent invalid status transitions', () => {
    const result = validateTestStatusUpdate('passed', 'pending')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'invalid_transition' })
    )
  })

  it('should allow retesting from failed', () => {
    const result = validateTestStatusUpdate('failed', 'retesting')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn about missing results when setting to passed', () => {
    const result = validateTestStatusUpdate('in_progress', 'passed')
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ code: 'missing_results' })
    )
  })

  it('should prevent passed status with failed test results', () => {
    const testResults: TestResultsData = {
      potency: {
        tested: true,
        passed: false
      }
    }
    const result = validateTestStatusUpdate('in_progress', 'passed', testResults)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'status_mismatch' })
    )
  })

  it('should allow passed status with passing test results', () => {
    const testResults: TestResultsData = {
      potency: {
        tested: true,
        passed: true
      },
      pesticides: {
        tested: true,
        passed: true
      }
    }
    const result = validateTestStatusUpdate('in_progress', 'passed', testResults)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })
})
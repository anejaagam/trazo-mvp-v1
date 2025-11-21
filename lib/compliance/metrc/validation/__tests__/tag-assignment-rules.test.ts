/**
 * Tag Assignment Validation Rules Tests
 */

import {
  validateMetrcTagFormat,
  validateTagAssignment,
} from '../tag-assignment-rules'

describe('validateMetrcTagFormat', () => {
  it('should validate valid Metrc tag', () => {
    const result = validateMetrcTagFormat('1A4FF01000000220000001')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should validate another valid Metrc tag format', () => {
    const result = validateMetrcTagFormat('1AAAA01000000100009999')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for invalid format', () => {
    const result = validateMetrcTagFormat('INVALID-TAG')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for empty tag', () => {
    const result = validateMetrcTagFormat('')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_TAG')
  })

  it('should fail for too short tag', () => {
    const result = validateMetrcTagFormat('1A4FF01')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for wrong prefix', () => {
    const result = validateMetrcTagFormat('2B4FF01000000220000001')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for tag with special characters', () => {
    const result = validateMetrcTagFormat('1A4FF01-00000220000001')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should fail for tag that is too long', () => {
    const result = validateMetrcTagFormat('1A4FF010000002200000011111')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('INVALID_TAG_FORMAT')
  })

  it('should handle whitespace-only tag', () => {
    const result = validateMetrcTagFormat('   ')
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_TAG')
  })
})

describe('validateTagAssignment', () => {
  it('should validate valid assignment', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: ['1A4FF01000000220000001', '1A4FF01000000220000002'],
      currentPlantCount: 2,
    })
    expect(result.isValid).toBe(true)
  })

  it('should fail for missing batch ID', () => {
    const result = validateTagAssignment({
      batchId: '',
      tags: ['1A4FF01000000220000001'],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'batchId')).toBe(true)
  })

  it('should fail for empty tags', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('EMPTY_TAGS')
  })

  it('should fail for duplicate tags', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [
        '1A4FF01000000220000001',
        '1A4FF01000000220000001', // Duplicate
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors[0].code).toBe('DUPLICATE_TAGS')
  })

  it('should warn for count mismatch', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: ['1A4FF01000000220000001'],
      currentPlantCount: 5,
    })
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'TAG_COUNT_MISMATCH')).toBe(true)
  })

  it('should warn for large batches', () => {
    const tags = Array.from({ length: 150 }, (_, i) =>
      `1A4FF010000002200${String(i).padStart(6, '0')}`
    )
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags,
    })
    expect(result.warnings.some((w) => w.code === 'LARGE_BATCH')).toBe(true)
  })

  it('should fail when tags contain invalid formats', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [
        '1A4FF01000000220000001', // Valid
        'INVALID-TAG', // Invalid
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.field === 'tags[1]')).toBe(true)
  })

  it('should identify all invalid tags in batch', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [
        'INVALID-1',
        '1A4FF01000000220000001', // Valid
        'INVALID-2',
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBe(2)
  })

  it('should pass with exact plant count match', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: [
        '1A4FF01000000220000001',
        '1A4FF01000000220000002',
        '1A4FF01000000220000003',
      ],
      currentPlantCount: 3,
    })
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should handle tags with no plant count provided', () => {
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags: ['1A4FF01000000220000001'],
    })
    expect(result.isValid).toBe(true)
  })

  it('should warn at exactly 101 plants', () => {
    const tags = Array.from({ length: 101 }, (_, i) =>
      `1A4FF010000002200${String(i).padStart(6, '0')}`
    )
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags,
    })
    expect(result.warnings.some((w) => w.code === 'LARGE_BATCH')).toBe(true)
  })

  it('should not warn at exactly 100 plants', () => {
    const tags = Array.from({ length: 100 }, (_, i) =>
      `1A4FF010000002200${String(i).padStart(6, '0')}`
    )
    const result = validateTagAssignment({
      batchId: 'batch-123',
      tags,
    })
    expect(result.warnings.some((w) => w.code === 'LARGE_BATCH')).toBe(false)
  })
})

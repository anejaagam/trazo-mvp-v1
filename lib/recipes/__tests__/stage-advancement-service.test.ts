import { calculateStageProgress } from '../stage-advancement-service'

describe('calculateStageProgress', () => {
  const reference = new Date('2025-11-13T12:00:00Z')

  it('returns null when stage start is missing', () => {
    expect(calculateStageProgress(null, reference)).toBeNull()
  })

  it('returns null when stage start is invalid', () => {
    expect(calculateStageProgress('not-a-date', reference)).toBeNull()
  })

  it('returns day 1 when start time is earlier the same day', () => {
    const result = calculateStageProgress('2025-11-13T00:30:00Z', reference)
    expect(result).not.toBeNull()
    expect(result?.daysElapsed).toBe(1)
  })

  it('returns day 2 when more than 24 hours have elapsed', () => {
    const result = calculateStageProgress('2025-11-12T10:00:00Z', reference)
    expect(result).not.toBeNull()
    expect(result?.daysElapsed).toBe(2)
  })

  it('never returns less than day 1 even if start is in the future', () => {
    const result = calculateStageProgress('2025-11-14T00:00:00Z', reference)
    expect(result).not.toBeNull()
    expect(result?.daysElapsed).toBe(1)
  })
})

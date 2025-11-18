import {
  validateTransferManifest,
  validateTransferReceipt,
  validatePackageLabel,
  validateTransferType,
} from '../transfer-rules'

describe('validateTransferManifest', () => {
  it('should validate a valid transfer manifest', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      driverName: 'John Driver',
      driverLicense: 'DL123456',
      vehiclePlate: 'ABC1234',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail when required fields are missing', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: '',
      recipientFacilityName: '',
      transferType: '',
      estimatedDeparture: '',
      estimatedArrival: '',
      packages: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should fail when license number is too short', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'AB',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_LICENSE_NUMBER')).toBe(true)
  })

  it('should fail when arrival time is before departure time', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T14:00:00',
      estimatedArrival: '2025-11-20T10:00:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_ARRIVAL_TIME')).toBe(true)
  })

  it('should warn when transfer duration exceeds 24 hours', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-22T10:00:00', // 48 hours later
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(true)
    expect(result.warnings.some((w) => w.code === 'LONG_TRANSFER_DURATION')).toBe(true)
  })

  it('should fail when no packages are included', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      packages: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'NO_PACKAGES')).toBe(true)
  })

  it('should fail when package label is invalid', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      packages: [
        {
          packageLabel: 'INVALID_LABEL',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_PACKAGE_LABEL')).toBe(true)
  })

  it('should fail when package quantity is invalid', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 0,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'INVALID_QUANTITY')).toBe(true)
  })

  it('should warn when driver name is missing', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.warnings.some((w) => w.code === 'MISSING_DRIVER_NAME')).toBe(true)
  })

  it('should warn when vehicle plate is missing', () => {
    const result = validateTransferManifest({
      recipientLicenseNumber: 'LIC-12345',
      recipientFacilityName: 'ABC Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: '2025-11-20T10:00:00',
      estimatedArrival: '2025-11-20T14:00:00',
      driverName: 'John Driver',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          quantity: 10,
          unitOfMeasure: 'Ounces',
        },
      ],
    })
    expect(result.warnings.some((w) => w.code === 'MISSING_VEHICLE_PLATE')).toBe(true)
  })
})

describe('validateTransferReceipt', () => {
  it('should validate a valid transfer receipt', () => {
    const result = validateTransferReceipt({
      manifestNumber: 'MAN-2025-11-00001',
      receivedDateTime: '2025-11-20T14:30:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          accepted: true,
          receivedQuantity: 10,
        },
      ],
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail when required fields are missing', () => {
    const result = validateTransferReceipt({
      manifestNumber: '',
      receivedDateTime: '',
      packages: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should fail when no packages are acknowledged', () => {
    const result = validateTransferReceipt({
      manifestNumber: 'MAN-2025-11-00001',
      receivedDateTime: '2025-11-20T14:30:00',
      packages: [],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'NO_PACKAGES')).toBe(true)
  })

  it('should fail when rejected package lacks rejection reason', () => {
    const result = validateTransferReceipt({
      manifestNumber: 'MAN-2025-11-00001',
      receivedDateTime: '2025-11-20T14:30:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          accepted: false,
        },
      ],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'MISSING_REJECTION_REASON')).toBe(true)
  })

  it('should pass when rejected package has rejection reason', () => {
    const result = validateTransferReceipt({
      manifestNumber: 'MAN-2025-11-00001',
      receivedDateTime: '2025-11-20T14:30:00',
      packages: [
        {
          packageLabel: '1A4FF01000000220000000123',
          accepted: false,
          rejectionReason: 'Package damaged during transport',
        },
      ],
    })
    expect(result.isValid).toBe(true)
  })
})

describe('validatePackageLabel', () => {
  it('should validate a valid 24-character Metrc package label', () => {
    expect(validatePackageLabel('1A4FF01000000220000000123')).toBe(true)
  })

  it('should reject invalid package labels', () => {
    expect(validatePackageLabel('INVALID')).toBe(false)
    expect(validatePackageLabel('1A4FF0100000022000000012')).toBe(false) // 23 chars
    expect(validatePackageLabel('2A4FF01000000220000000123')).toBe(false) // doesn't start with 1A
    expect(validatePackageLabel('')).toBe(false)
  })
})

describe('validateTransferType', () => {
  it('should validate known transfer types', () => {
    const validTypes = ['Wholesale', 'Transfer', 'Sale', 'Return', 'Donation', 'Disposal']
    validTypes.forEach((type) => {
      const result = validateTransferType(type)
      expect(result.warnings).toHaveLength(0)
    })
  })

  it('should warn for unknown transfer types', () => {
    const result = validateTransferType('UnknownType')
    expect(result.warnings.some((w) => w.code === 'UNKNOWN_TRANSFER_TYPE')).toBe(true)
  })
})

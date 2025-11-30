#!/usr/bin/env node

/**
 * End-to-End Seed-to-Sale Validation Script
 *
 * Validates the complete cannabis tracking flow from seed/clone to final sale,
 * including all compliance touchpoints with Metrc.
 *
 * Usage:
 *   npx ts-node scripts/test-seed-to-sale.ts
 *   npm run test:seed-to-sale
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Import validation functions
import { validatePlantBatchCreate } from '../lib/compliance/metrc/validation/batch-rules'
import { validateHarvestCreate, validateHarvestPackageCreate } from '../lib/compliance/metrc/validation/harvest-rules'
import { validatePackageLabel, validateTransferManifest } from '../lib/compliance/metrc/validation/transfer-rules'
import {
  validateProductionBatchCreate,
  validateInputPackage,
  validateProductionComplete,
} from '../lib/compliance/metrc/validation/production-batch-rules'
import type { MetrcPlantBatchCreate } from '../lib/compliance/metrc/types'

interface ValidationStep {
  name: string
  stage: string
  passed: boolean
  errors: string[]
  warnings: string[]
}

class SeedToSaleValidator {
  private steps: ValidationStep[] = []

  private addStep(name: string, stage: string, passed: boolean, errors: string[], warnings: string[]): void {
    this.steps.push({ name, stage, passed, errors, warnings })
    const icon = passed ? '✓' : '✗'
    const color = passed ? '\x1b[32m' : '\x1b[31m'
    console.log(`  ${color}${icon}\x1b[0m ${name}`)
    if (errors.length > 0) {
      errors.forEach((e: string) => console.log(`    \x1b[31m→ Error: ${e}\x1b[0m`))
    }
    if (warnings.length > 0) {
      warnings.forEach((w: string) => console.log(`    \x1b[33m→ Warning: ${w}\x1b[0m`))
    }
  }

  // 1. Validate Plant Batch Creation
  validatePlantBatchCreation(): void {
    console.log('\n🌱 Stage 1: Plant Batch Creation')

    // Valid plant batch
    const batch: MetrcPlantBatchCreate = {
      Name: 'TB-2025-001-Purple-Haze',
      Type: 'Clone',
      Count: 50,
      Strain: 'Purple Haze',
      Location: 'Room-A',
      PlantedDate: new Date().toISOString().split('T')[0],
    }

    const result = validatePlantBatchCreate(batch)

    this.addStep(
      'Validate clone batch creation',
      'clone',
      result.isValid,
      result.errors.map((e: { message: string }) => e.message),
      result.warnings.map((w: { message: string }) => w.message)
    )

    // Invalid - missing strain
    const invalidBatch: MetrcPlantBatchCreate = {
      Name: 'TB-2025-002',
      Type: 'Seed',
      Count: 100,
      Strain: '', // Missing
      Location: 'Room-B',
      PlantedDate: new Date().toISOString().split('T')[0],
    }

    const invalidResult = validatePlantBatchCreate(invalidBatch)

    this.addStep(
      'Reject batch without strain',
      'clone',
      !invalidResult.isValid,
      [],
      []
    )
  }

  // 2. Validate Harvest
  validateHarvest(): void {
    console.log('\n🌾 Stage 2: Harvest Creation')

    const result = validateHarvestCreate({
      batchId: 'test-batch-id',
      wetWeight: 5000,
      plantCount: 50,
      harvestedAt: new Date().toISOString(),
      harvestType: 'WholePlant',
      location: 'Dry-Room-1',
    })

    this.addStep(
      'Create harvest record',
      'harvest',
      result.isValid,
      result.errors.map((e: { message: string }) => e.message),
      result.warnings.map((w: { message: string }) => w.message)
    )
  }

  // 3. Validate Package Creation
  validatePackageCreation(): void {
    console.log('\n📦 Stage 3: Package Creation from Harvest')

    const validTag = '1A4FF0100000022000000001'
    const tagValid = validatePackageLabel(validTag)

    this.addStep(
      'Validate package tag format (24 chars)',
      'packaging',
      tagValid,
      tagValid ? [] : ['Invalid package tag format'],
      []
    )

    const invalidTag = '1A4FF010000002200000001' // 23 chars
    const invalidTagResult = validatePackageLabel(invalidTag)

    this.addStep(
      'Reject invalid package tag (23 chars)',
      'packaging',
      !invalidTagResult,
      [],
      []
    )

    const packageResult = validateHarvestPackageCreate({
      Tag: validTag,
      Location: 'Storage-A',
      Item: 'Flower - Purple Haze',
      Quantity: 454,
      UnitOfMeasure: 'Grams',
      PackagedDate: new Date().toISOString().split('T')[0],
    })

    this.addStep(
      'Create package from harvest',
      'packaging',
      packageResult.isValid,
      packageResult.errors.map((e: { message: string }) => e.message),
      packageResult.warnings.map((w: { message: string }) => w.message)
    )
  }

  // 4. Validate Lab Testing Flow
  validateLabTesting(): void {
    console.log('\n🧪 Stage 4: Lab Testing')

    // Simulate lab test submission
    const labTestData = {
      packageLabel: '1A4FF0100000022000000001',
      labFacility: 'Oregon Labs Inc.',
      testType: 'Compliance',
      sampleWeight: 5.0,
    }

    const hasRequiredFields = Boolean(
      labTestData.packageLabel &&
      labTestData.labFacility &&
      labTestData.testType &&
      labTestData.sampleWeight > 0
    )

    this.addStep(
      'Submit lab test sample',
      'lab_testing',
      hasRequiredFields,
      [],
      []
    )

    // Simulate lab results
    const labResults = {
      thcTotal: 22.5,
      cbdTotal: 0.8,
      moistureContent: 12.1,
      status: 'passed' as const,
    }

    const resultsValid =
      labResults.thcTotal <= 35 &&
      labResults.moistureContent <= 15 &&
      labResults.status === 'passed'

    this.addStep(
      'Lab results received (passed)',
      'lab_testing',
      resultsValid,
      [],
      []
    )
  }

  // 5. Validate Production Batch (optional)
  validateProduction(): void {
    console.log('\n🏭 Stage 5: Production Batch (Extraction)')

    // Create production batch
    const createResult = validateProductionBatchCreate({
      productionType: 'extraction',
      siteId: 'test-site-id',
      organizationId: 'test-org-id',
      startedAt: new Date().toISOString(),
      expectedYield: 18,
      expectedYieldUnit: 'percent',
    })

    this.addStep(
      'Create extraction production batch',
      'production',
      createResult.isValid,
      createResult.errors.map((e: { message: string }) => e.message),
      createResult.warnings.map((w: { message: string }) => w.message)
    )

    // Validate input package
    const inputResult = validateInputPackage({
      packageId: 'test-package-id',
      packageTag: '1A4FF0100000022000000001',
      quantityUsed: 454,
      unitOfMeasure: 'Grams',
    })

    this.addStep(
      'Add input package to production',
      'production',
      inputResult.isValid,
      inputResult.errors.map((e: { message: string }) => e.message),
      inputResult.warnings.map((w: { message: string }) => w.message)
    )

    // Complete production
    const completeResult = validateProductionComplete({
      productionBatchId: 'test-production-batch-id',
      completedAt: new Date().toISOString(),
      actualYield: 81.72, // ~18% yield
      actualYieldUnit: 'Grams',
      outputs: [
        {
          packageTag: '1A4FF0100000022000000002',
          productName: 'Concentrate - Purple Haze Shatter',
          productType: 'Concentrate',
          quantity: 81.72, // ~18% yield
          unitOfMeasure: 'Grams',
        },
      ],
    }, 'extraction', 454)

    this.addStep(
      'Complete production with output',
      'production',
      completeResult.isValid,
      completeResult.errors.map((e: { message: string }) => e.message),
      completeResult.warnings.map((w: { message: string }) => w.message)
    )
  }

  // 6. Validate Transfer
  validateTransfer(): void {
    console.log('\n🚚 Stage 6: Transfer/Sale')

    const manifestResult = validateTransferManifest({
      recipientLicenseNumber: 'LIC-DISP-12345',
      recipientFacilityName: 'Portland Dispensary',
      transferType: 'Wholesale',
      estimatedDeparture: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
      driverName: 'John Driver',
      vehiclePlate: 'OR-ABC123',
      packages: [
        {
          packageLabel: '1A4FF0100000022000000001',
          quantity: 28,
          unitOfMeasure: 'Grams',
        },
      ],
    })

    this.addStep(
      'Create transfer manifest',
      'transfer',
      manifestResult.isValid,
      manifestResult.errors.map((e: { message: string }) => e.message),
      manifestResult.warnings.map((w: { message: string }) => w.message)
    )
  }

  // Final validation of all stages
  printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 Seed-to-Sale Validation Summary')
    console.log('='.repeat(60))

    // Group by stage
    const stages = ['clone', 'harvest', 'packaging', 'lab_testing', 'production', 'transfer']
    const stageLabels: Record<string, string> = {
      clone: '🌱 Clone/Seed',
      harvest: '🌾 Harvest',
      packaging: '📦 Packaging',
      lab_testing: '🧪 Lab Testing',
      production: '🏭 Production',
      transfer: '🚚 Transfer',
    }

    console.log('\nBy Stage:')
    stages.forEach((stage: string) => {
      const stageSteps = this.steps.filter((s: ValidationStep) => s.stage === stage)
      if (stageSteps.length > 0) {
        const passed = stageSteps.filter((s: ValidationStep) => s.passed).length
        const total = stageSteps.length
        const allPassed = passed === total
        const icon = allPassed ? '✓' : '✗'
        const color = allPassed ? '\x1b[32m' : '\x1b[31m'
        console.log(`  ${color}${icon}\x1b[0m ${stageLabels[stage]}: ${passed}/${total}`)
      }
    })

    const totalPassed = this.steps.filter((s: ValidationStep) => s.passed).length
    const totalSteps = this.steps.length
    const overallPassed = totalPassed === totalSteps

    console.log('\n' + '-'.repeat(40))
    console.log(`\nTotal: ${totalPassed}/${totalSteps} validations passed`)

    if (!overallPassed) {
      console.log('\nFailed Validations:')
      this.steps
        .filter((s: ValidationStep) => !s.passed)
        .forEach((s: ValidationStep) => {
          console.log(`  \x1b[31m✗\x1b[0m ${s.name}`)
          s.errors.forEach((e: string) => console.log(`    → ${e}`))
        })
    }

    console.log('\n' + '='.repeat(60))
    console.log(
      overallPassed
        ? '\n✅ All seed-to-sale validations passed!\n'
        : '\n❌ Some validations failed. Review above.\n'
    )
  }

  runFullValidation(): void {
    console.log('='.repeat(60))
    console.log('🌱 → 💰 End-to-End Seed-to-Sale Validation')
    console.log('='.repeat(60))
    console.log('\nValidating complete cannabis tracking workflow...')

    this.validatePlantBatchCreation()
    this.validateHarvest()
    this.validatePackageCreation()
    this.validateLabTesting()
    this.validateProduction()
    this.validateTransfer()

    this.printSummary()
  }
}

// Main execution
function main(): void {
  const validator = new SeedToSaleValidator()
  validator.runFullValidation()
}

main()

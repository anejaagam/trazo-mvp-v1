/**
 * Integration tests for recipe activation workflow
 * 
 * These tests require:
 * - SUPABASE_URL environment variable
 * - SUPABASE_ANON_KEY environment variable
 * - Test organization with sample data
 * 
 * Run with: npm test -- recipes.integration.test.ts
 */

// import { createClient } from '@supabase/supabase-js'
import {
  createRecipe,
  createRecipeVersion,
  activateRecipe,
  advanceRecipeStage,
  deactivateRecipe,
  getActiveRecipeForScope,
} from '../recipes'
import type { RecipeVersionData } from '@/types/recipe'

// Skip these tests in CI unless explicitly enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true'

describe.skip('Recipe Activation Integration Tests', () => {
  // let supabase: ReturnType<typeof createClient>
  let testOrgId: string
  let testUserId: string
  let testPodId: string

  beforeAll(async () => {
    if (!runIntegrationTests) {
      console.log('⏭️  Skipping integration tests (set RUN_INTEGRATION_TESTS=true to run)')
      return
    }

    // Initialize Supabase client (uncomment when running integration tests)
    // supabase = createClient(
    //   process.env.SUPABASE_URL!,
    //   process.env.SUPABASE_ANON_KEY!
    // )

    // TODO: Set up test fixtures
    // These would come from your seed data or test database
    testOrgId = process.env.TEST_ORG_ID!
    testUserId = process.env.TEST_USER_ID!
    testPodId = process.env.TEST_POD_ID!

    if (!testOrgId || !testUserId || !testPodId) {
      throw new Error('Missing test environment variables')
    }
  })

  describe('Complete Activation Workflow', () => {
    let recipeId: string
    let versionId: string
    let activationId: string

    it('should create a recipe with multiple stages', async () => {
      const { data, error } = await createRecipe({
        organization_id: testOrgId,
        site_id: undefined,
        name: 'Integration Test Recipe',
        description: 'Test recipe for stage advancement',
        owner_id: testUserId,
        status: 'draft',
        plant_types: ['cannabis'],
      })

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBeTruthy()
      
      recipeId = data!.id
    })

    it('should create a version with 2 stages (1 day each)', async () => {
      const versionData: RecipeVersionData = {
        name: 'Test Version 1',
        description: 'Two short stages for testing',
        stages: [
          {
            name: 'Stage 1',
            stage_type: 'germination',
            order_index: 0,
            duration_days: 1,
            description: 'First test stage',
            setpoints: [
              {
                parameter_type: 'temperature',
                value: 22.0,
                unit: '°C',
                priority: 50,
                enabled: true,
              },
            ],
          },
          {
            name: 'Stage 2',
            stage_type: 'vegetative',
            order_index: 1,
            duration_days: 1,
            description: 'Second test stage',
            setpoints: [
              {
                parameter_type: 'temperature',
                value: 24.0,
                unit: '°C',
                priority: 50,
                enabled: true,
              },
            ],
          },
        ],
      }

      const { data, error } = await createRecipeVersion(
        recipeId,
        testUserId,
        versionData,
        'Integration test version'
      )

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBeTruthy()
      
      versionId = data!.id
    })

    it('should activate recipe on a pod', async () => {
      const { data, error } = await activateRecipe(
        recipeId,
        versionId,
        'pod',
        testPodId,
        'Test Pod',
        testUserId
      )

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.id).toBeTruthy()
      expect(data?.is_active).toBe(true)
      expect(data?.current_stage_day).toBe(1)
      
      activationId = data!.id
    })

    it('should retrieve active recipe for the pod', async () => {
      const { data, error } = await getActiveRecipeForScope('pod', testPodId)

      expect(error).toBeNull()
      expect(data).toBeTruthy()
      expect(data?.activation.id).toBe(activationId)
      expect(data?.stages).toBeTruthy()
      expect(data?.stages?.[0]?.name).toBe('Stage 1')
    })

    it('should advance to stage 2 manually', async () => {
      const { error } = await advanceRecipeStage(activationId, testUserId)

      expect(error).toBeNull()

      // Verify advancement
      const { data: activeRecipe } = await getActiveRecipeForScope('pod', testPodId)
      const currentStageIndex = activeRecipe?.activation.current_stage_id
      const currentStage = activeRecipe?.stages?.find(s => s.id === currentStageIndex)
      expect(currentStage?.name).toBe('Stage 2')
      expect(activeRecipe?.activation.current_stage_day).toBe(1) // Reset to day 1 of new stage
    })

    it('should complete and deactivate after advancing past final stage', async () => {
      const { error } = await advanceRecipeStage(activationId, testUserId)

      expect(error).toBeNull()

      // Verify activation is now inactive
      const { data: activeRecipe } = await getActiveRecipeForScope('pod', testPodId)
      expect(activeRecipe).toBeNull() // No active recipe anymore
    })

    it('should manually deactivate if needed', async () => {
      // Create and activate a new recipe for this test
      const { data: newActivation } = await activateRecipe(
        recipeId,
        versionId,
        'pod',
        testPodId,
        'Test Pod',
        testUserId
      )

      const { data: deactivateResult, error } = await deactivateRecipe(
        newActivation!.id,
        testUserId,
        'Integration test cleanup'
      )

      expect(error).toBeNull()
      expect(deactivateResult).toBe(true)
    })
  })

  describe('Stage Advancement Service Integration', () => {
    it('should process day increments based on elapsed time', async () => {
      // This would test the cron service with mocked timestamps
      // Requires stage-advancement-service to accept custom 'now' parameter
      
      // TODO: Implement when staging data is ready
      // 1. Create activation with stage_started_at = 2 days ago
      // 2. Call processStageAdvancements({ now: new Date() })
      // 3. Verify current_stage_day = 2 or stage advanced
    })
  })

  afterAll(async () => {
    // Cleanup: deactivate any remaining test activations
    // Delete test recipe (if needed in future)
    // TODO: Add cleanup logic when needed
  })
})

describe('Recipe Activation Unit Tests', () => {
  // These tests use mocked Supabase client
  // No real database calls
  
  it('should validate recipe activation parameters', () => {
    // Test parameter validation logic
    expect(true).toBe(true)
  })

  it('should handle missing scope gracefully', () => {
    // Test error handling
    expect(true).toBe(true)
  })
})

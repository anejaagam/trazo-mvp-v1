import { syncPodAndBatchRecipes, advanceRecipeStageForBatch, type AnySupabaseClient } from '../recipe-sync'

describe('recipe-sync helpers', () => {
  class ChainableBuilder {
    constructor(private readonly result: unknown) {}
    select() {
      return this
    }
    eq() {
      return this
    }
    is() {
      return this
    }
    neq() {
      return this
    }
    maybeSingle() {
      return this
    }
    insert() {
      return this
    }
    async then(resolve: (value: { data: unknown; error: null }) => unknown) {
      return resolve({ data: this.result, error: null })
    }
  }

  const createSupabaseMock = (overrides: Partial<AnySupabaseClient>) => ({
    from: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  }) as unknown as AnySupabaseClient

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('activates pod recipe when batch already has recipe', async () => {
    const batchRecipe = {
      id: 'act-batch',
      recipe_id: 'recipe-1',
      recipe_version_id: 'version-1',
      recipe: { id: 'recipe-1', name: 'Bloom Boost' },
    }

    const fromMock = jest.fn((table: string) => {
      switch (table) {
        case 'recipe_activations':
          fromMock.recipeCall = (fromMock.recipeCall || 0) + 1
          return fromMock.recipeCall === 1
            ? new ChainableBuilder(batchRecipe)
            : new ChainableBuilder(null)
        case 'pods':
          return new ChainableBuilder({ name: 'Pod A' })
        case 'batch_events':
          return new ChainableBuilder({})
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    }) as jest.Mock & { recipeCall?: number }

    const rpcMock = jest.fn().mockResolvedValue({ data: 'activation-id', error: null })

    const supabase = createSupabaseMock({ from: fromMock, rpc: rpcMock })

    await syncPodAndBatchRecipes({
      supabase,
      batchId: 'batch-1',
      podId: 'pod-1',
      userId: 'user-1',
    })

    expect(rpcMock).toHaveBeenCalledWith(
      'activate_recipe',
      expect.objectContaining({
        p_scope_type: 'pod',
        p_scope_id: 'pod-1',
        p_recipe_id: 'recipe-1',
        p_recipe_version_id: 'version-1',
      })
    )
    expect(fromMock).toHaveBeenCalledWith('batch_events')
  })

  it('activates batch recipe when pod has recipe and batch lacks one', async () => {
    const podRecipe = {
      id: 'act-pod',
      recipe_id: 'recipe-9',
      recipe_version_id: 'version-9',
      recipe: { id: 'recipe-9', name: 'Veg Prime' },
    }

    const fromMock = jest.fn((table: string) => {
      switch (table) {
        case 'recipe_activations':
          fromMock.recipeCall = (fromMock.recipeCall || 0) + 1
          return fromMock.recipeCall === 1
            ? new ChainableBuilder(null)
            : new ChainableBuilder(podRecipe)
        case 'batches':
          return new ChainableBuilder({ batch_number: 'B-77' })
        case 'batch_events':
          return new ChainableBuilder({})
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    }) as jest.Mock & { recipeCall?: number }

    const rpcMock = jest.fn().mockResolvedValue({ data: 'activation-id', error: null })

    const supabase = createSupabaseMock({ from: fromMock, rpc: rpcMock })

    await syncPodAndBatchRecipes({
      supabase,
      batchId: 'batch-2',
      podId: 'pod-2',
      userId: 'user-9',
    })

    expect(rpcMock).toHaveBeenCalledWith(
      'activate_recipe',
      expect.objectContaining({
        p_scope_type: 'batch',
        p_scope_id: 'batch-2',
        p_recipe_id: 'recipe-9',
        p_recipe_version_id: 'version-9',
      })
    )
  })

  it('advances recipe stage when activation exists', async () => {
    const fromMock = jest.fn((table: string) => {
      if (table === 'recipe_activations') {
        return new ChainableBuilder({ id: 'activation-1' })
      }
      throw new Error(`Unexpected table: ${table}`)
    })

    const rpcMock = jest.fn().mockResolvedValue({ data: null, error: null })

    const supabase = createSupabaseMock({ from: fromMock, rpc: rpcMock })

    const result = await advanceRecipeStageForBatch({
      supabase,
      batchId: 'batch-123',
      userId: 'user-123',
    })

    expect(result.advanced).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith(
      'advance_recipe_stage',
      expect.objectContaining({
        p_activation_id: 'activation-1',
        p_user_id: 'user-123',
      })
    )
  })
})

/**
 * Metrc Plant Batches Endpoint
 *
 * GET and POST/PUT operations for plant batch tracking
 */

import type { MetrcClient } from '../client'
import type {
  MetrcPlantBatch,
  MetrcPlantBatchCreate,
  MetrcPlantBatchAdjustment,
  MetrcPlantBatchSplit,
  MetrcPackagePlantingsCreate,
  MetrcPlantPlantingsCreate,
  MetrcPlantBatchPackage,
  MetrcPlantBatchGrowthPhaseChange,
} from '../types'

export class PlantBatchesEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get active plant batches
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of active plant batches
   */
  async listActive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlantBatch[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plantbatches/v2/active?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPlantBatch>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get inactive plant batches
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive plant batches
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlantBatch[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plantbatches/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    // Use requestList to handle v2 paginated response { Data: [...], Total, ... }
    const result = await this.client.requestList<MetrcPlantBatch>(endpoint, {
      method: 'GET',
    })
    return result.data
  }

  /**
   * Get a specific plant batch by ID
   *
   * @param batchId - The Metrc plant batch ID
   * @returns Plant batch details
   */
  async getById(batchId: number): Promise<MetrcPlantBatch> {
    return this.client.request<MetrcPlantBatch>(`/plantbatches/v2/${batchId}`, {
      method: 'GET',
    })
  }

  /**
   * Get plant batch types
   *
   * @returns Array of batch type names (e.g., "Seed", "Clone")
   */
  async listTypes(): Promise<string[]> {
    return this.client.request<string[]>('/plantbatches/v2/types', {
      method: 'GET',
    })
  }

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create new plant batches (Open Loop - from thin air)
   *
   * Uses /plantbatches/v2/plantings - only works in Open Loop states
   * where CanCreateOpeningBalancePlantBatches is true
   *
   * @param batches - Array of plant batches to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async create(batches: MetrcPlantBatchCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/plantings?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: batches,
      }
    )
  }

  /**
   * Create plant batches from a package (Closed Loop)
   *
   * Uses POST /packages/v2/plantings - required for Closed Loop states
   * when creating plant batches from seed/clone packages
   *
   * @param plantings - Array of plantings to create from packages
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createFromPackage(plantings: MetrcPackagePlantingsCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/packages/v2/plantings?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: plantings,
      }
    )
  }

  /**
   * Create plant batches from mother plants (Closed Loop)
   *
   * Uses POST /plants/v2/plantings - required for Closed Loop states
   * when creating plant batches by cloning from mother plants
   *
   * @param plantings - Array of plantings to create from mother plants
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createFromPlantings(plantings: MetrcPlantPlantingsCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/plantings?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: plantings,
      }
    )
  }

  /**
   * Split a plant batch into multiple smaller batches
   *
   * @param splits - Array of batch split operations
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async split(splits: MetrcPlantBatchSplit[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/split?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: splits,
      }
    )
  }

  /**
   * Adjust plant batch count
   *
   * @param adjustments - Array of batch adjustments
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async adjust(adjustments: MetrcPlantBatchAdjustment[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/adjust?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: adjustments,
      }
    )
  }

  /**
   * Destroy plant batches (waste)
   *
   * @param destroys - Array of plant batches to destroy
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async destroy(
    destroys: Array<{
      PlantBatch: string
      Count: number
      ReasonNote: string
      ActualDate: string
    }>
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/destroy?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: destroys,
      }
    )
  }

  // ===== METRC EVALUATION STEPS 2-4 =====

  /**
   * Create packages from plant batch (reduces batch count) - Metrc Step 3
   *
   * Uses POST /plantbatches/v2/packages
   * This REDUCES the plant count in the source batch
   *
   * @param packages - Array of packages to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createPackages(packages: MetrcPlantBatchPackage[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/packages?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: packages,
      }
    )
  }

  /**
   * Create packages from plant batch WITHOUT reducing count - Metrc Step 2
   *
   * Uses POST /plantbatches/v2/packages/frommotherplant
   * This does NOT reduce the plant count (mother plant cloning scenario)
   *
   * @param packages - Array of packages to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createPackagesFromMother(packages: MetrcPlantBatchPackage[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/packages/frommotherplant?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: packages,
      }
    )
  }

  /**
   * Change growth phase for plants in batch - Metrc Step 4
   *
   * Uses POST /plantbatches/v2/growthphase
   * This converts batch-level tracking to individual plant tracking
   * by assigning individual tags starting from the specified StartingTag
   *
   * Important: Metrc will assign tags sequentially from StartingTag,
   * potentially skipping unavailable tags.
   *
   * @param changes - Array of growth phase changes
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async changeGrowthPhase(changes: MetrcPlantBatchGrowthPhaseChange[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plantbatches/v2/growthphase?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: changes,
      }
    )
  }
}

/**
 * Metrc Plants Endpoint
 *
 * GET and POST/PUT operations for individual plant tracking
 */

import type { MetrcClient } from '../client'
import type {
  MetrcPlant,
  MetrcPlantingCreate,
  MetrcPlantGrowthPhaseChange,
  MetrcPlantMove,
  MetrcPlantDestroy,
  MetrcHarvestCreate,
} from '../types'

export class PlantsEndpoint {
  constructor(private client: MetrcClient) {}

  /**
   * Get vegetative plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of vegetative plants
   */
  async listVegetative(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/vegetative?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get flowering plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of flowering plants
   */
  async listFlowering(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/flowering?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get on-hold plants
   *
   * @returns Array of plants on hold
   */
  async listOnHold(): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<MetrcPlant[]>(
      `/plants/v2/onhold?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Get inactive plants
   *
   * @param lastModifiedStart - Filter by last modified date (YYYY-MM-DD format)
   * @param lastModifiedEnd - Filter by last modified date (YYYY-MM-DD format)
   * @returns Array of inactive plants
   */
  async listInactive(
    lastModifiedStart?: string,
    lastModifiedEnd?: string
  ): Promise<MetrcPlant[]> {
    const { facilityLicenseNumber } = this.client.getConfig()
    let endpoint = `/plants/v2/inactive?licenseNumber=${facilityLicenseNumber}`

    if (lastModifiedStart) {
      endpoint += `&lastModifiedStart=${lastModifiedStart}`
    }
    if (lastModifiedEnd) {
      endpoint += `&lastModifiedEnd=${lastModifiedEnd}`
    }

    return this.client.request<MetrcPlant[]>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * Get a specific plant by ID
   *
   * @param plantId - The Metrc plant ID
   * @returns Plant details
   */
  async getById(plantId: number): Promise<MetrcPlant> {
    return this.client.request<MetrcPlant>(`/plants/v2/${plantId}`, {
      method: 'GET',
    })
  }

  /**
   * Get a specific plant by label
   *
   * @param label - The Metrc plant label
   * @returns Plant details
   */
  async getByLabel(label: string): Promise<MetrcPlant> {
    return this.client.request<MetrcPlant>(`/plants/v2/label/${label}`, {
      method: 'GET',
    })
  }

  /**
   * Get available growth phases
   *
   * @returns Array of growth phase names
   */
  async listGrowthPhases(): Promise<string[]> {
    return this.client.request<string[]>('/plants/v2/growthphases', {
      method: 'GET',
    })
  }

  /**
   * Get available waste reasons
   *
   * @returns Array of waste reason objects
   */
  async listWasteReasons(): Promise<Array<{ Name: string }>> {
    const { facilityLicenseNumber } = this.client.getConfig()
    return this.client.request<Array<{ Name: string }>>(
      `/plants/v2/waste/reasons?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'GET',
      }
    )
  }

  // ===== WRITE OPERATIONS (POST/PUT) =====

  /**
   * Create plantings (individual plants from plant batch)
   *
   * @param plantings - Array of plantings to create
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async createPlantings(plantings: MetrcPlantingCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/create/plantings?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: plantings,
      }
    )
  }

  /**
   * Change growth phase (e.g., vegetative to flowering)
   *
   * @param phaseChanges - Array of growth phase changes
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async changeGrowthPhase(phaseChanges: MetrcPlantGrowthPhaseChange[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/changegrowthphase?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: phaseChanges,
      }
    )
  }

  /**
   * Move plants to new location
   *
   * @param moves - Array of plant moves
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async movePlants(moves: MetrcPlantMove[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/move?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'PUT',
        body: moves,
      }
    )
  }

  /**
   * Destroy plants (waste)
   *
   * @param destroys - Array of plants to destroy
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async destroyPlants(destroys: MetrcPlantDestroy[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/destroy?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: destroys,
      }
    )
  }

  /**
   * Harvest plants (create harvest from plants)
   *
   * @param harvests - Array of harvest operations
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async harvestPlants(harvests: MetrcHarvestCreate[]): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/harvest?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: harvests,
      }
    )
  }

  /**
   * Manicure plants (trim/prune with waste tracking)
   *
   * @param manicures - Array of manicure operations
   * @returns Void on success
   * @throws MetrcApiError on validation or API failure
   */
  async manicurePlants(
    manicures: Array<{
      Label: string
      WasteWeight: number
      UnitOfWeight: string
      ActualDate: string
    }>
  ): Promise<void> {
    const { facilityLicenseNumber } = this.client.getConfig()
    await this.client.request<void>(
      `/plants/v2/manicure?licenseNumber=${facilityLicenseNumber}`,
      {
        method: 'POST',
        body: manicures,
      }
    )
  }
}

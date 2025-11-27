/**
 * Strains Sync Service
 *
 * Manages synchronization between TRAZO cultivars and Metrc strains.
 * Provides functions to sync strains from Metrc to local cache and
 * validate cultivars against approved Metrc strains.
 */

import { createClient } from '@/lib/supabase/server'
import { MetrcClient } from '../client'
import type { MetrcStrain, MetrcStrainCreate } from '../types'

// =====================================================
// TYPES
// =====================================================

export interface SyncStrainsResult {
  success: boolean
  synced: number
  created: number
  updated: number
  cultivarsCreated: number
  cultivarsLinked: number
  errors: string[]
  warnings: string[]
}

export interface ValidateCultivarResult {
  isValid: boolean
  metrcStrainId: number | null
  metrcStrainName: string | null
  error: string | null
}

export interface CultivarSyncResult {
  cultivarId: string
  cultivarName: string
  success: boolean
  metrcStrainId: number | null
  action: 'matched' | 'created' | 'failed'
  error: string | null
}

interface CachedStrain {
  id: string
  organization_id: string
  site_id: string
  metrc_strain_id: number
  name: string
  testing_status: string | null
  thc_level: number | null
  cbd_level: number | null
  indica_percentage: number | null
  sativa_percentage: number | null
  is_used: boolean
  last_synced_at: string
}

interface Cultivar {
  id: string
  name: string
  organization_id: string
  metrc_strain_id: number | null
  metrc_sync_status: string | null
}

// =====================================================
// SYNC STRAINS FROM METRC
// =====================================================

/**
 * Derive strain type from indica/sativa percentages
 * Based on Metrc strain genetics data
 */
function deriveStrainType(indicaPercentage?: number, sativaPercentage?: number): string {
  const indica = indicaPercentage || 0
  const sativa = sativaPercentage || 0

  if (indica === 0 && sativa === 0) return 'unknown'
  if (indica >= 80) return 'indica'
  if (sativa >= 80) return 'sativa'
  if (indica > sativa) return 'indica_dominant'
  if (sativa > indica) return 'sativa_dominant'
  return 'hybrid'
}

/**
 * Sync strains from Metrc to local cache AND create/link cultivars
 * Fetches all active and inactive strains from Metrc and:
 * 1. Updates the local strains cache
 * 2. Creates new cultivars for strains that don't have a matching cultivar
 * 3. Links existing cultivars to their Metrc strain IDs
 *
 * This is Metrc-specific - CLTS and Produce have different requirements
 */
export async function syncStrainsFromMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string,
  userId?: string
): Promise<SyncStrainsResult> {
  const result: SyncStrainsResult = {
    success: false,
    synced: 0,
    created: 0,
    updated: 0,
    cultivarsCreated: 0,
    cultivarsLinked: 0,
    errors: [],
    warnings: [],
  }

  const supabase = await createClient()

  try {
    // Fetch active and inactive strains from Metrc
    const [activeStrainsRaw, inactiveStrainsRaw] = await Promise.all([
      client.strains.listActive(),
      client.strains.listInactive(),
    ])

    // Metrc API returns null/undefined when no strains exist, not an empty array
    const activeStrains = Array.isArray(activeStrainsRaw) ? activeStrainsRaw : []
    const inactiveStrains = Array.isArray(inactiveStrainsRaw) ? inactiveStrainsRaw : []

    const allStrains = [...activeStrains, ...inactiveStrains]
    result.synced = allStrains.length

    // Get existing cached strains
    const { data: existingCache } = await supabase
      .from('metrc_strains_cache')
      .select('metrc_strain_id')
      .eq('site_id', siteId)

    const existingCacheIds = new Set(existingCache?.map((c) => c.metrc_strain_id) || [])

    // Get existing cultivars for linking
    const { data: existingCultivars } = await supabase
      .from('cultivars')
      .select('id, name, metrc_strain_id')
      .eq('organization_id', organizationId)

    // Build lookup maps for cultivars
    const cultivarByName = new Map<string, { id: string; metrc_strain_id: number | null }>()
    const cultivarByMetrcId = new Map<number, string>()

    existingCultivars?.forEach((c) => {
      cultivarByName.set(c.name.trim().toLowerCase(), { id: c.id, metrc_strain_id: c.metrc_strain_id })
      if (c.metrc_strain_id) {
        cultivarByMetrcId.set(c.metrc_strain_id, c.id)
      }
    })

    // Process each strain
    for (const strain of allStrains) {
      // 1. Upsert to cache with all Metrc properties
      const cacheData = {
        organization_id: organizationId,
        site_id: siteId,
        metrc_strain_id: strain.Id,
        name: strain.Name,
        testing_status: strain.TestingStatus,
        thc_level: strain.ThcLevel,
        cbd_level: strain.CbdLevel,
        indica_percentage: strain.IndicaPercentage || null,
        sativa_percentage: strain.SativaPercentage || null,
        is_used: strain.IsUsed,
        last_synced_at: new Date().toISOString(),
      }

      const { error: cacheError } = await supabase
        .from('metrc_strains_cache')
        .upsert(cacheData, {
          onConflict: 'site_id,metrc_strain_id',
        })

      if (cacheError) {
        result.errors.push(`Failed to cache strain ${strain.Name}: ${cacheError.message}`)
        continue
      }

      if (existingCacheIds.has(strain.Id)) {
        result.updated++
      } else {
        result.created++
      }

      // 2. Create or link cultivar
      const normalizedName = strain.Name.trim().toLowerCase()
      const existingCultivar = cultivarByName.get(normalizedName)

      if (existingCultivar) {
        // Cultivar exists - link it if not already linked
        if (!existingCultivar.metrc_strain_id) {
          const { error: linkError } = await supabase
            .from('cultivars')
            .update({
              metrc_strain_id: strain.Id,
              metrc_sync_status: 'synced',
              metrc_last_synced_at: new Date().toISOString(),
              // Update with Metrc data
              thc_range_min: strain.ThcLevel,
              thc_range_max: strain.ThcLevel,
              cbd_range_min: strain.CbdLevel,
              cbd_range_max: strain.CbdLevel,
              strain_type: deriveStrainType(strain.IndicaPercentage, strain.SativaPercentage),
            })
            .eq('id', existingCultivar.id)

          if (linkError) {
            result.warnings.push(`Failed to link cultivar ${strain.Name}: ${linkError.message}`)
          } else {
            result.cultivarsLinked++
          }
        }
      } else if (userId) {
        // No matching cultivar - create one from Metrc strain
        const { error: createError } = await supabase
          .from('cultivars')
          .insert({
            organization_id: organizationId,
            name: strain.Name,
            strain_type: deriveStrainType(strain.IndicaPercentage, strain.SativaPercentage),
            thc_range_min: strain.ThcLevel,
            thc_range_max: strain.ThcLevel,
            cbd_range_min: strain.CbdLevel,
            cbd_range_max: strain.CbdLevel,
            metrc_strain_id: strain.Id,
            metrc_sync_status: 'synced',
            metrc_last_synced_at: new Date().toISOString(),
            is_active: true,
            created_by: userId,
          })

        if (createError) {
          result.warnings.push(`Failed to create cultivar ${strain.Name}: ${createError.message}`)
        } else {
          result.cultivarsCreated++
          // Update lookup map for subsequent iterations
          cultivarByName.set(normalizedName, { id: '', metrc_strain_id: strain.Id })
        }
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// =====================================================
// VALIDATE CULTIVAR AGAINST METRC
// =====================================================

/**
 * Validate a cultivar name against Metrc approved strains
 * Returns the matching Metrc strain ID if found
 */
export async function validateCultivarAgainstMetrc(
  client: MetrcClient,
  cultivarName: string,
  siteId: string
): Promise<ValidateCultivarResult> {
  const supabase = await createClient()

  // First check local cache
  const { data: cachedStrain } = await supabase
    .from('metrc_strains_cache')
    .select('metrc_strain_id, name')
    .eq('site_id', siteId)
    .ilike('name', cultivarName)
    .single()

  if (cachedStrain) {
    return {
      isValid: true,
      metrcStrainId: cachedStrain.metrc_strain_id,
      metrcStrainName: cachedStrain.name,
      error: null,
    }
  }

  // If not in cache, check Metrc directly
  try {
    const strain = await client.strains.findByName(cultivarName)
    if (strain) {
      return {
        isValid: true,
        metrcStrainId: strain.Id,
        metrcStrainName: strain.Name,
        error: null,
      }
    }
  } catch (error) {
    return {
      isValid: false,
      metrcStrainId: null,
      metrcStrainName: null,
      error: `Metrc lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }

  return {
    isValid: false,
    metrcStrainId: null,
    metrcStrainName: null,
    error: `Strain "${cultivarName}" not found in Metrc approved strains`,
  }
}

// =====================================================
// SYNC CULTIVARS TO METRC
// =====================================================

/**
 * Sync a single cultivar to Metrc
 * Creates the strain in Metrc if it doesn't exist
 */
export async function syncCultivarToMetrc(
  client: MetrcClient,
  cultivar: Cultivar,
  siteId: string
): Promise<CultivarSyncResult> {
  const supabase = await createClient()

  const result: CultivarSyncResult = {
    cultivarId: cultivar.id,
    cultivarName: cultivar.name,
    success: false,
    metrcStrainId: null,
    action: 'failed',
    error: null,
  }

  try {
    // First try to find existing strain
    const existingStrain = await client.strains.findByName(cultivar.name)

    if (existingStrain) {
      result.success = true
      result.metrcStrainId = existingStrain.Id
      result.action = 'matched'

      // Update cultivar with Metrc strain ID
      await supabase
        .from('cultivars')
        .update({
          metrc_strain_id: existingStrain.Id,
          metrc_sync_status: 'synced',
          metrc_last_synced_at: new Date().toISOString(),
        })
        .eq('id', cultivar.id)

      return result
    }

    // Create new strain in Metrc
    const createPayload: MetrcStrainCreate = {
      Name: cultivar.name,
      TestingStatus: 'None',
      ThcLevel: 0,
      CbdLevel: 0,
    }

    await client.strains.create(createPayload)

    // Fetch the created strain to get its ID
    const createdStrain = await client.strains.findByName(cultivar.name)

    if (createdStrain) {
      result.success = true
      result.metrcStrainId = createdStrain.Id
      result.action = 'created'

      // Update cultivar with Metrc strain ID
      await supabase
        .from('cultivars')
        .update({
          metrc_strain_id: createdStrain.Id,
          metrc_sync_status: 'synced',
          metrc_last_synced_at: new Date().toISOString(),
        })
        .eq('id', cultivar.id)

      // Add to cache
      await supabase.from('metrc_strains_cache').upsert({
        organization_id: cultivar.organization_id,
        site_id: siteId,
        metrc_strain_id: createdStrain.Id,
        name: createdStrain.Name,
        testing_status: createdStrain.TestingStatus,
        thc_level: createdStrain.ThcLevel,
        cbd_level: createdStrain.CbdLevel,
        indica_percentage: createdStrain.IndicaPercentage || null,
        sativa_percentage: createdStrain.SativaPercentage || null,
        is_used: createdStrain.IsUsed,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'site_id,metrc_strain_id',
      })
    } else {
      result.error = 'Strain created but could not be retrieved'
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'

    // Update sync status to failed
    await supabase
      .from('cultivars')
      .update({
        metrc_sync_status: 'sync_failed',
      })
      .eq('id', cultivar.id)
  }

  return result
}

/**
 * Sync all cultivars for an organization to Metrc
 */
export async function syncAllCultivarsToMetrc(
  client: MetrcClient,
  organizationId: string,
  siteId: string
): Promise<CultivarSyncResult[]> {
  const supabase = await createClient()

  // Get all cultivars that need syncing
  const { data: cultivars, error } = await supabase
    .from('cultivars')
    .select('id, name, organization_id, metrc_strain_id, metrc_sync_status')
    .eq('organization_id', organizationId)
    .or('metrc_strain_id.is.null,metrc_sync_status.eq.sync_failed')

  if (error || !cultivars) {
    return []
  }

  const results: CultivarSyncResult[] = []

  for (const cultivar of cultivars) {
    const result = await syncCultivarToMetrc(client, cultivar, siteId)
    results.push(result)
  }

  return results
}

// =====================================================
// GET CACHED STRAINS
// =====================================================

/**
 * Get all cached strains for a site
 */
export async function getCachedStrains(siteId: string): Promise<CachedStrain[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_strains_cache')
    .select('*')
    .eq('site_id', siteId)
    .order('name')

  if (error) {
    console.error('Error fetching cached strains:', error)
    return []
  }

  return data || []
}

/**
 * Get a cached strain by name
 */
export async function getCachedStrainByName(
  siteId: string,
  name: string
): Promise<CachedStrain | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metrc_strains_cache')
    .select('*')
    .eq('site_id', siteId)
    .ilike('name', name)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Get cultivars that need Metrc sync
 */
export async function getCultivarsNeedingSync(organizationId: string): Promise<Cultivar[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cultivars')
    .select('id, name, organization_id, metrc_strain_id, metrc_sync_status')
    .eq('organization_id', organizationId)
    .or('metrc_strain_id.is.null,metrc_sync_status.eq.sync_failed')

  if (error) {
    console.error('Error fetching cultivars needing sync:', error)
    return []
  }

  return data || []
}

// =====================================================
// NON-COMPLIANCE ALERTS (METRC-SPECIFIC)
// =====================================================

export interface NonCompliantCultivar {
  id: string
  name: string
  metrc_sync_status: string | null
  created_at: string
  is_active: boolean
}

export interface ComplianceCheckResult {
  isCompliant: boolean
  totalCultivars: number
  linkedCultivars: number
  unlinkedCultivars: NonCompliantCultivar[]
  syncFailedCultivars: NonCompliantCultivar[]
}

/**
 * Check cultivar compliance status for Metrc
 * Returns unlinked cultivars that need to be synced to Metrc
 *
 * This is Metrc-specific - CLTS and Produce have different compliance requirements
 */
export async function checkCultivarCompliance(organizationId: string): Promise<ComplianceCheckResult> {
  const supabase = await createClient()

  // Get all active cultivars
  const { data: allCultivars, error } = await supabase
    .from('cultivars')
    .select('id, name, metrc_strain_id, metrc_sync_status, created_at, is_active')
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  if (error || !allCultivars) {
    return {
      isCompliant: false,
      totalCultivars: 0,
      linkedCultivars: 0,
      unlinkedCultivars: [],
      syncFailedCultivars: [],
    }
  }

  const linkedCultivars = allCultivars.filter((c) => c.metrc_strain_id !== null)
  const unlinkedCultivars = allCultivars
    .filter((c) => c.metrc_strain_id === null && c.metrc_sync_status !== 'sync_failed')
    .map((c) => ({
      id: c.id,
      name: c.name,
      metrc_sync_status: c.metrc_sync_status,
      created_at: c.created_at,
      is_active: c.is_active,
    }))

  const syncFailedCultivars = allCultivars
    .filter((c) => c.metrc_sync_status === 'sync_failed')
    .map((c) => ({
      id: c.id,
      name: c.name,
      metrc_sync_status: c.metrc_sync_status,
      created_at: c.created_at,
      is_active: c.is_active,
    }))

  return {
    isCompliant: unlinkedCultivars.length === 0 && syncFailedCultivars.length === 0,
    totalCultivars: allCultivars.length,
    linkedCultivars: linkedCultivars.length,
    unlinkedCultivars,
    syncFailedCultivars,
  }
}

/**
 * Get compliance alert message for unlinked cultivars
 */
export function getComplianceAlertMessage(result: ComplianceCheckResult): string | null {
  if (result.isCompliant) {
    return null
  }

  const messages: string[] = []

  if (result.unlinkedCultivars.length > 0) {
    const names = result.unlinkedCultivars.slice(0, 3).map((c) => c.name).join(', ')
    const more = result.unlinkedCultivars.length > 3 ? ` and ${result.unlinkedCultivars.length - 3} more` : ''
    messages.push(`${result.unlinkedCultivars.length} cultivar(s) not linked to Metrc: ${names}${more}`)
  }

  if (result.syncFailedCultivars.length > 0) {
    const names = result.syncFailedCultivars.slice(0, 3).map((c) => c.name).join(', ')
    const more = result.syncFailedCultivars.length > 3 ? ` and ${result.syncFailedCultivars.length - 3} more` : ''
    messages.push(`${result.syncFailedCultivars.length} cultivar(s) failed to sync: ${names}${more}`)
  }

  return messages.join('. ')
}

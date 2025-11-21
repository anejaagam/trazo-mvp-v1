/**
 * Per-Plant Harvest Tracking Queries
 *
 * Handles individual plant harvest records, package-to-plant traceability,
 * and tag inventory management
 */

import { createClient } from '@/lib/supabase/server'

// =====================================================
// TYPES
// =====================================================

export interface HarvestPlantRecord {
  id: string
  harvest_id: string
  batch_id: string
  organization_id: string
  plant_tag: string
  plant_index?: number
  wet_weight_g: number
  dry_weight_g?: number
  waste_weight_g: number
  quality_grade?: 'A' | 'B' | 'C' | 'Waste'
  flower_weight_g: number
  trim_weight_g: number
  shake_weight_g: number
  harvested_at: string
  harvested_by?: string
  notes?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateHarvestPlantParams {
  harvest_id: string
  batch_id: string
  organization_id: string
  plant_tag: string
  plant_index?: number
  wet_weight_g: number
  quality_grade?: 'A' | 'B' | 'C' | 'Waste'
  notes?: string
  harvested_by?: string
}

export interface PackagePlantSource {
  id: string
  package_id: string
  plant_tag: string
  weight_contributed_g: number
  source_type: 'flower' | 'trim' | 'shake' | 'waste'
  created_at: string
}

export interface TagInventoryItem {
  id: string
  organization_id: string
  site_id: string
  tag_number: string
  tag_type: 'Plant' | 'Package' | 'Location'
  status: 'available' | 'assigned' | 'used' | 'destroyed' | 'lost' | 'returned'
  assigned_to_type?: 'batch' | 'plant' | 'package' | 'location'
  assigned_to_id?: string
  assigned_at?: string
  assigned_by?: string
  used_at?: string
  used_by?: string
  order_batch_number?: string
  received_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// =====================================================
// HARVEST PLANT RECORDS
// =====================================================

/**
 * Create individual plant harvest record
 */
export async function createHarvestPlantRecord(
  params: CreateHarvestPlantParams,
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_plant_records')
      .insert({
        harvest_id: params.harvest_id,
        batch_id: params.batch_id,
        organization_id: params.organization_id,
        plant_tag: params.plant_tag,
        plant_index: params.plant_index,
        wet_weight_g: params.wet_weight_g,
        quality_grade: params.quality_grade,
        harvested_by: params.harvested_by || userId,
        notes: params.notes,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating harvest plant record:', error)
    return { data: null, error }
  }
}

/**
 * Create multiple plant harvest records in batch
 */
export async function createHarvestPlantRecordsBatch(
  records: CreateHarvestPlantParams[],
  userId: string
) {
  try {
    const supabase = await createClient()

    const insertData = records.map((r) => ({
      harvest_id: r.harvest_id,
      batch_id: r.batch_id,
      organization_id: r.organization_id,
      plant_tag: r.plant_tag,
      plant_index: r.plant_index,
      wet_weight_g: r.wet_weight_g,
      quality_grade: r.quality_grade,
      harvested_by: r.harvested_by || userId,
      notes: r.notes,
    }))

    const { data, error } = await supabase
      .from('harvest_plant_records')
      .insert(insertData)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating harvest plant records batch:', error)
    return { data: null, error }
  }
}

/**
 * Get plant records for a harvest
 */
export async function getHarvestPlantRecords(harvestId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_plant_records')
      .select(`
        *,
        harvested_by_user:users!harvested_by(id, full_name)
      `)
      .eq('harvest_id', harvestId)
      .order('plant_index', { ascending: true, nullsFirst: false })
      .order('plant_tag', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting harvest plant records:', error)
    return { data: null, error }
  }
}

/**
 * Update plant harvest record (typically for dry weight)
 */
export async function updateHarvestPlantRecord(
  recordId: string,
  updates: {
    dry_weight_g?: number
    waste_weight_g?: number
    flower_weight_g?: number
    trim_weight_g?: number
    shake_weight_g?: number
    quality_grade?: 'A' | 'B' | 'C' | 'Waste'
    notes?: string
  }
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_plant_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating harvest plant record:', error)
    return { data: null, error }
  }
}

/**
 * Get harvest statistics by plant
 */
export async function getHarvestPlantStatistics(harvestId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('harvest_plant_records')
      .select('wet_weight_g, dry_weight_g, waste_weight_g, quality_grade, flower_weight_g, trim_weight_g, shake_weight_g')
      .eq('harvest_id', harvestId)

    if (error) throw error

    const stats = {
      total_plants: data?.length || 0,
      total_wet_weight: data?.reduce((sum, p) => sum + (p.wet_weight_g || 0), 0) || 0,
      total_dry_weight: data?.reduce((sum, p) => sum + (p.dry_weight_g || 0), 0) || 0,
      total_waste_weight: data?.reduce((sum, p) => sum + (p.waste_weight_g || 0), 0) || 0,
      total_flower_weight: data?.reduce((sum, p) => sum + (p.flower_weight_g || 0), 0) || 0,
      total_trim_weight: data?.reduce((sum, p) => sum + (p.trim_weight_g || 0), 0) || 0,
      total_shake_weight: data?.reduce((sum, p) => sum + (p.shake_weight_g || 0), 0) || 0,
      avg_wet_weight_per_plant: 0,
      avg_dry_weight_per_plant: 0,
      quality_breakdown: {} as Record<string, number>,
    }

    if (stats.total_plants > 0) {
      stats.avg_wet_weight_per_plant = stats.total_wet_weight / stats.total_plants
      stats.avg_dry_weight_per_plant = stats.total_dry_weight / stats.total_plants
    }

    // Quality breakdown
    data?.forEach((p) => {
      const grade = p.quality_grade || 'Ungraded'
      stats.quality_breakdown[grade] = (stats.quality_breakdown[grade] || 0) + 1
    })

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error getting harvest plant statistics:', error)
    return { data: null, error }
  }
}

// =====================================================
// PACKAGE PLANT SOURCES (Traceability)
// =====================================================

/**
 * Link package to source plant tags
 */
export async function linkPackageToPlants(
  packageId: string,
  plantSources: Array<{
    plant_tag: string
    weight_contributed_g: number
    source_type: 'flower' | 'trim' | 'shake' | 'waste'
  }>
) {
  try {
    const supabase = await createClient()

    const insertData = plantSources.map((ps) => ({
      package_id: packageId,
      plant_tag: ps.plant_tag,
      weight_contributed_g: ps.weight_contributed_g,
      source_type: ps.source_type,
    }))

    const { data, error } = await supabase
      .from('package_plant_sources')
      .insert(insertData)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error linking package to plants:', error)
    return { data: null, error }
  }
}

/**
 * Get source plants for a package
 */
export async function getPackagePlantSources(packageId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('package_plant_sources')
      .select('*')
      .eq('package_id', packageId)
      .order('weight_contributed_g', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting package plant sources:', error)
    return { data: null, error }
  }
}

/**
 * Get all packages that contain material from a specific plant
 */
export async function getPackagesContainingPlant(plantTag: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('package_plant_sources')
      .select(`
        *,
        package:harvest_packages(
          id,
          package_tag,
          product_name,
          quantity,
          status,
          packaged_at
        )
      `)
      .eq('plant_tag', plantTag)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting packages containing plant:', error)
    return { data: null, error }
  }
}

// =====================================================
// TAG INVENTORY MANAGEMENT
// =====================================================

/**
 * Get available tags for a site
 */
export async function getAvailableTags(
  siteId: string,
  tagType: 'Plant' | 'Package' | 'Location'
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metrc_tag_inventory')
      .select('*')
      .eq('site_id', siteId)
      .eq('tag_type', tagType)
      .eq('status', 'available')
      .order('received_at', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting available tags:', error)
    return { data: null, error }
  }
}

/**
 * Get tag inventory summary for a site
 */
export async function getTagInventorySummary(siteId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tag_usage_summary')
      .select('*')
      .eq('site_id', siteId)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting tag inventory summary:', error)
    return { data: null, error }
  }
}

/**
 * Receive new tags (bulk import)
 */
export async function receiveTagsBatch(
  tags: Array<{
    organization_id: string
    site_id: string
    tag_number: string
    tag_type: 'Plant' | 'Package' | 'Location'
    order_batch_number?: string
  }>,
  userId: string
) {
  try {
    const supabase = await createClient()

    const insertData = tags.map((t) => ({
      organization_id: t.organization_id,
      site_id: t.site_id,
      tag_number: t.tag_number,
      tag_type: t.tag_type,
      status: 'available' as const,
      order_batch_number: t.order_batch_number,
      received_at: new Date().toISOString(),
      received_by: userId,
    }))

    const { data, error } = await supabase
      .from('metrc_tag_inventory')
      .insert(insertData)
      .select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error receiving tags batch:', error)
    return { data: null, error }
  }
}

/**
 * Assign tag to entity (batch, plant, package, location)
 */
export async function assignTag(
  tagId: string,
  assignedToType: 'batch' | 'plant' | 'package' | 'location',
  assignedToId: string,
  userId: string
) {
  try {
    const supabase = await createClient()

    // Use the database function for atomic assignment
    const { data, error } = await supabase.rpc('assign_tag_to_entity', {
      p_tag_id: tagId,
      p_assigned_to_type: assignedToType,
      p_assigned_to_id: assignedToId,
      p_assigned_by: userId,
    })

    if (error) throw error
    return { success: data, error: null }
  } catch (error) {
    console.error('Error assigning tag:', error)
    return { success: false, error }
  }
}

/**
 * Mark tag as used/active
 */
export async function markTagAsUsed(tagId: string, userId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('mark_tag_as_used', {
      p_tag_id: tagId,
      p_used_by: userId,
    })

    if (error) throw error
    return { success: data, error: null }
  } catch (error) {
    console.error('Error marking tag as used:', error)
    return { success: false, error }
  }
}

/**
 * Deactivate/destroy tag
 */
export async function deactivateTag(
  tagId: string,
  reason: string,
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('deactivate_tag', {
      p_tag_id: tagId,
      p_reason: reason,
      p_deactivated_by: userId,
    })

    if (error) throw error
    return { success: data, error: null }
  } catch (error) {
    console.error('Error deactivating tag:', error)
    return { success: false, error }
  }
}

/**
 * Get tag assignment history
 */
export async function getTagAssignmentHistory(tagId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tag_assignment_events')
      .select(`
        *,
        performed_by_user:users!performed_by(id, full_name)
      `)
      .eq('tag_id', tagId)
      .order('performed_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting tag assignment history:', error)
    return { data: null, error }
  }
}

/**
 * Get tags assigned to an entity
 */
export async function getTagsForEntity(
  assignedToType: 'batch' | 'plant' | 'package' | 'location',
  assignedToId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metrc_tag_inventory')
      .select('*')
      .eq('assigned_to_type', assignedToType)
      .eq('assigned_to_id', assignedToId)
      .in('status', ['assigned', 'used'])

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting tags for entity:', error)
    return { data: null, error }
  }
}

/**
 * Report lost tag
 */
export async function reportLostTag(
  tagId: string,
  notes: string,
  userId: string
) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metrc_tag_inventory')
      .update({
        status: 'lost',
        notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tagId)
      .select()
      .single()

    if (error) throw error

    // Create event
    await supabase.from('tag_assignment_events').insert({
      tag_id: tagId,
      organization_id: data.organization_id,
      event_type: 'lost',
      performed_by: userId,
      notes: notes,
    })

    return { data, error: null }
  } catch (error) {
    console.error('Error reporting lost tag:', error)
    return { data: null, error }
  }
}

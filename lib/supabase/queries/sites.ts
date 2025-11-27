/**
 * Sites Database Queries
 * 
 * Functions for managing sites within organizations
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Get or create a default site for an organization
 * This ensures users always have a valid site to work with
 */
export async function getOrCreateDefaultSite(organizationId: string) {
  try {
    const supabase = await createClient()
    
    // First, try to get an existing site (ordered by created_at for consistency)
    const { data: existingSites, error: fetchError } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
    
    if (fetchError) throw fetchError
    
    // If a site exists, return it
    if (existingSites && existingSites.length > 0) {
      return { data: existingSites[0].id, error: null }
    }
    
    // No site exists, create a default one
    const { data: newSite, error: createError } = await supabase
      .from('sites')
      .insert({
        organization_id: organizationId,
        name: 'Main Site',
        is_active: true,
      })
      .select('id')
      .single()
    
    if (createError) throw createError
    
    return { data: newSite.id, error: null }
  } catch (error) {
    console.error('Error in getOrCreateDefaultSite:', error)
    return { data: null, error }
  }
}

/**
 * Get all sites for an organization
 */
export async function getSitesByOrganization(organizationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error in getSitesByOrganization:', error)
    return { data: null, error }
  }
}

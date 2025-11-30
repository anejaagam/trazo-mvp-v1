import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import { SiteManagementClient } from './site-management-client'
import type { RoleKey } from '@/lib/rbac/types'

export default async function OrganizationPage() {
  const supabase = await createClient()
  
  let userRole: RoleKey
  let organizationId: string
  let organizationData: { id: string; name: string; jurisdiction: string; created_at: string } | null = null

  // DEV MODE: Use mock data for user/org info
  if (isDevModeActive()) {
    logDevMode('Organization Page')
    userRole = DEV_MOCK_USER.role as RoleKey
    organizationId = DEV_MOCK_USER.organization_id
    organizationData = {
      id: DEV_MOCK_USER.organization.id,
      name: DEV_MOCK_USER.organization.name,
      jurisdiction: DEV_MOCK_USER.organization.jurisdiction,
      created_at: new Date().toISOString()
    }
  } else {
    // PRODUCTION MODE: Get actual user data
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/auth/login')
    }

    console.log('[OrganizationPage] Auth user ID:', user.id)
    console.log('[OrganizationPage] Auth user email:', user.email)

    // Get user data with organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        role,
        organization_id,
        organizations!users_organization_id_fkey (
          id,
          name,
          jurisdiction,
          created_at
        )
      `)
      .eq('id', user.id)
      .single()

    console.log('[OrganizationPage] userData:', userData)
    console.log('[OrganizationPage] userError:', userError)

    if (!userData) {
      console.log('[OrganizationPage] No userData found, redirecting to dashboard')
      redirect('/dashboard')
    }

    userRole = userData.role as RoleKey
    organizationId = userData.organization_id
    
    console.log('[OrganizationPage] User role:', userRole)
    console.log('[OrganizationPage] Organization ID:', organizationId)
    
    const org = Array.isArray(userData.organizations) 
      ? userData.organizations[0] 
      : userData.organizations
    organizationData = org as typeof organizationData
  }

  // Check permission - org_admin has '*' wildcard which grants all permissions
  const permissionResult = canPerformAction(userRole, 'org:settings')
  console.log('[OrganizationPage] Permission check result:', permissionResult)
  
  if (!permissionResult.allowed) {
    console.log('[OrganizationPage] Permission denied, redirecting to dashboard')
    redirect('/dashboard')
  }

  // Fetch initial sites data
  const { data: sites } = await supabase
    .from('sites')
    .select(`
      id,
      name,
      address,
      city,
      state_province,
      postal_code,
      country,
      timezone,
      max_pods,
      site_license_number,
      is_active,
      created_at,
      updated_at,
      metrc_license_number,
      metrc_facility_id,
      metrc_credential_id,
      compliance_status,
      metrc_locations_synced_at
    `)
    .eq('organization_id', organizationId)
    .order('name', { ascending: true })

  // Count rooms and pods for each site
  const sitesWithCounts = await Promise.all(
    (sites || []).map(async (site) => {
      // Get rooms for this site
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id')
        .eq('site_id', site.id)
      
      const roomIds = rooms?.map(r => r.id) || []
      const roomCount = rooms?.length || 0
      
      // Count pods in these rooms
      let podCount = 0
      if (roomIds.length > 0) {
        const { count } = await supabase
          .from('pods')
          .select('*', { count: 'exact', head: true })
          .in('room_id', roomIds)
        
        podCount = count || 0
      }

      // Count users assigned to this site
      const { count: userCount } = await supabase
        .from('user_site_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', site.id)
        .eq('is_active', true)

      return {
        ...site,
        room_count: roomCount,
        pod_count: podCount,
        user_count: userCount || 0
      }
    })
  )

  return (
    <SiteManagementClient
      organization={organizationData}
      initialSites={sitesWithCounts}
    />
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { SiteManagementClient } from './site-management-client'

export default async function OrganizationPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user data with organization
  const { data: userData } = await supabase
    .from('users')
    .select(`
      id,
      role,
      organization_id,
      organizations (
        id,
        name,
        jurisdiction,
        created_at
      )
    `)
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/dashboard')
  }

  // Check permission
  if (!canPerformAction(userData.role, 'org:settings')) {
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
      updated_at
    `)
    .eq('organization_id', userData.organization_id)
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

  const organization = Array.isArray(userData.organizations) 
    ? userData.organizations[0] 
    : userData.organizations

  return (
    <SiteManagementClient
      organization={organization}
      initialSites={sitesWithCounts}
    />
  )
}

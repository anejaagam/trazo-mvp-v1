import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CultivarList } from '@/components/features/cultivars/cultivar-list'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import type { Cultivar } from '@/types/batch'

// Mock cultivars for development mode
const MOCK_CULTIVARS: Cultivar[] = [
  {
    id: 'cultivar-001',
    organization_id: DEV_MOCK_USER.organization_id,
    name: 'Cherry Tomato',
    common_name: 'Cherry Tomato',
    description: 'Small, sweet tomatoes',
    growing_days: 60,
    expected_yield: 150,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    category: 'fruit',
    flavor_profile: 'Sweet, tangy',
    storage_life_days: 7,
  },
  {
    id: 'cultivar-002',
    organization_id: DEV_MOCK_USER.organization_id,
    name: 'Romaine Lettuce',
    common_name: 'Romaine',
    description: 'Crisp lettuce variety',
    growing_days: 45,
    expected_yield: 80,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    category: 'leafy_green',
    flavor_profile: 'Mild, crisp',
    storage_life_days: 5,
  },
  {
    id: 'cultivar-003',
    organization_id: DEV_MOCK_USER.organization_id,
    name: 'Basil',
    common_name: 'Sweet Basil',
    description: 'Aromatic herb',
    growing_days: 30,
    expected_yield: 50,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    category: 'herb',
    flavor_profile: 'Sweet, peppery',
    storage_life_days: 3,
  },
]

export default async function CultivarsPage() {
  let userRole: string
  let cultivars: Cultivar[]

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Cultivars Page')
    userRole = DEV_MOCK_USER.role
    cultivars = MOCK_CULTIVARS
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'cultivar:view')) {
      redirect('/dashboard')
    }

    // Fetch cultivars
    const { data: cultivarsData, error: cultivarsError } = await supabase
      .from('cultivars')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('name', { ascending: true })

    userRole = userData.role
    cultivars = (cultivarsData || []) as Cultivar[]
  }

  return (
    <div className="space-y-6">
      <CultivarList
        cultivars={cultivars}
        onCreateClick={() => {
          // TODO: Implement create modal
          alert('Create cultivar modal not yet implemented')
        }}
        onEditClick={(cultivar) => {
          // TODO: Implement edit modal
          alert(`Edit cultivar ${cultivar.name} not yet implemented`)
        }}
        userRole={userRole}
      />
    </div>
  )
}

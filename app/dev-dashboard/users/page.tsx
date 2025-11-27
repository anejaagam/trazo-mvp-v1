import { createClient } from '@/lib/supabase/server'
import { logDevAction, DEV_AUDIT_ACTIONS, TARGET_TYPES } from '@/lib/dev-audit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Building2, ShieldCheck, UserCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Users | Dev Dashboard',
  description: 'View all platform users across organizations',
}

interface UserWithOrg {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
  organization: {
    id: string
    name: string
    approval_status: string
  } | null
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  administrator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  compliance_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cultivation_manager: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  cultivation_technician: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  inventory_specialist: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  developer: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; org?: string }>
}) {
  const { search, role, org } = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Log page view
  if (user) {
    await logDevAction({
      developerId: user.id,
      action: DEV_AUDIT_ACTIONS.USER_VIEWED,
      targetType: TARGET_TYPES.USER,
      metadata: { page: 'users_list', filters: { search, role, org } },
    })
  }

  // Fetch all users with organization info
  let query = supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      last_sign_in_at,
      organization:organizations(id, name, approval_status)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  const { data: users, error } = await query

  if (error) {
    console.error('Failed to fetch users:', error)
  }

  // Get unique organizations for filter
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .order('name')

  // Filter by organization if specified (client-side since it's a join)
  let filteredUsers = (users as unknown as UserWithOrg[]) || []
  if (org && org !== 'all') {
    filteredUsers = filteredUsers.filter(u => u.organization?.id === org)
  }

  // Get stats
  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.is_active).length,
    developers: filteredUsers.filter(u => u.role === 'developer').length,
    admins: filteredUsers.filter(u => ['owner', 'administrator'].includes(u.role)).length,
  }

  const formatRole = (roleStr: string) => {
    return roleStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Platform Users
        </h1>
        <p className="text-muted-foreground">
          View all users across all organizations on the TRAZO platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins/Owners</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-fuchsia-200 dark:border-fuchsia-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developers</CardTitle>
            <Building2 className="h-4 w-4 text-fuchsia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.developers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form className="flex flex-1 gap-4">
          <Input
            name="search"
            placeholder="Search by email or name..."
            defaultValue={search}
            className="max-w-xs"
          />
          <Select name="role" defaultValue={role || 'all'}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="administrator">Administrator</SelectItem>
              <SelectItem value="compliance_manager">Compliance Manager</SelectItem>
              <SelectItem value="cultivation_manager">Cultivation Manager</SelectItem>
              <SelectItem value="cultivation_technician">Cultivation Technician</SelectItem>
              <SelectItem value="inventory_specialist">Inventory Specialist</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
            </SelectContent>
          </Select>
          <Select name="org" defaultValue={org || 'all'}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {orgs?.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="submit"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-purple-200 dark:border-purple-800">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Sign In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.organization ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{u.organization.name}</span>
                        {u.organization.approval_status === 'pending' && (
                          <Badge variant="outline" className="text-xs text-yellow-600">
                            Pending
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[u.role] || ROLE_COLORS.viewer}>
                      {formatRole(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? formatDistanceToNow(new Date(u.last_sign_in_at), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No users found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

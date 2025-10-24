/**
 * Low Stock Alerts Page
 * 
 * Displays items that are below minimum stock levels or out of stock
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canPerformAction } from '@/lib/rbac/guards'
import { isDevModeActive, DEV_MOCK_USER, logDevMode } from '@/lib/dev-mode'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Package } from 'lucide-react'

export default async function LowStockAlertsPage() {
  let siteId: string

  // DEV MODE: Use mock data
  if (isDevModeActive()) {
    logDevMode('Low Stock Alerts Page')
    siteId = DEV_MOCK_USER.site_assignments[0].site_id
  } else {
    // PRODUCTION MODE: Get actual user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/auth/login')
    }

    // First, get the basic user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!userData || userError) {
      redirect('/auth/login')
    }

    // Check permission
    if (!canPerformAction(userData.role, 'inventory:view')) {
      redirect('/dashboard')
    }

    // Then get site assignments separately
    const { data: siteAssignments } = await supabase
      .from('user_site_assignments')
      .select('site_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)

    // Get site_id from user_site_assignments or fall back to organization_id
    siteId = siteAssignments?.[0]?.site_id || userData.organization_id
  }

  // Fetch low stock items from the database (skip in dev mode)
  let lowStockItems: Array<{
    item_id: string
    item_name: string
    sku?: string
    stock_status: string
    on_hand: number
    available: number
    par_level?: number
    reorder_point?: number
    unit_of_measure: string
    storage_location?: string
  }> = []
  
  if (!isDevModeActive()) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('inventory_stock_balances')
      .select('*')
      .eq('site_id', siteId)
      .in('stock_status', ['below_par', 'reorder', 'out_of_stock'])
      .order('stock_status', { ascending: false }) // Out of stock first
      .order('item_name', { ascending: true })
    
    lowStockItems = data || []
  }

  // Categorize by severity
  const outOfStock = lowStockItems?.filter(item => item.stock_status === 'out_of_stock') || []
  const reorderPoint = lowStockItems?.filter(item => item.stock_status === 'reorder') || []
  const belowPar = lowStockItems?.filter(item => item.stock_status === 'below_par') || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>
      case 'reorder':
        return <Badge variant="default" className="bg-orange-500">Reorder</Badge>
      case 'below_par':
        return <Badge variant="secondary">Below Par</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Monitor items that need attention or reordering
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock.length}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Reorder Point</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reorderPoint.length}</div>
            <p className="text-xs text-muted-foreground">
              Should be reordered soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Below Par Level</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{belowPar.length}</div>
            <p className="text-xs text-muted-foreground">
              Below optimal stock levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            Items that are out of stock, at reorder point, or below par level
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!lowStockItems || lowStockItems.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No low stock alerts. All items are at healthy stock levels.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Par Level</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.sku || '-'}</TableCell>
                    <TableCell>{getStatusBadge(item.stock_status)}</TableCell>
                    <TableCell className="text-right">
                      {item.on_hand} {item.unit_of_measure}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.available} {item.unit_of_measure}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.par_level || '-'} {item.par_level ? item.unit_of_measure : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.reorder_point || '-'} {item.reorder_point ? item.unit_of_measure : ''}
                    </TableCell>
                    <TableCell>{item.storage_location || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

/**
 * Inventory Dashboard Component
 * 
 * Main dashboard showing inventory overview, alerts, and recent activity
 * Includes summary cards, low stock alerts, expiring items, and recent movements
 */

import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  Package,
  TrendingDown,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { RoleKey } from '@/lib/rbac/types'
import type { InventoryMovement } from '@/types/inventory'
import { isDevModeActive } from '@/lib/dev-mode'
import { ItemFormDialog } from './item-form-dialog'
import { ReceiveInventoryDialog } from './receive-inventory-dialog'
import { IssueInventoryDialog } from './issue-inventory-dialog'
import { AdjustInventoryDialog } from './adjust-inventory-dialog'

interface InventoryDashboardProps {
  siteId: string
  userRole: string
  organizationId: string
  userId: string
}

// Types based on database views
interface StockBalanceView {
  item_id: string
  organization_id: string
  site_id: string
  item_name: string
  sku: string | null
  item_type: string
  category_id: string | null
  unit_of_measure: string
  on_hand: number
  reserved_quantity: number
  available: number
  par_level: number | null
  reorder_point: number | null
  stock_status: 'below_par' | 'reorder' | 'out_of_stock' | 'ok'
  storage_location: string | null
  last_updated: string
}

interface ActiveLotView {
  lot_id: string
  item_id: string
  item_name: string
  organization_id: string
  site_id: string
  lot_code: string
  quantity_received: number
  quantity_remaining: number
  unit_of_measure: string
  received_date: string
  expiry_date: string | null
  manufacture_date: string | null
  supplier_name: string | null
  compliance_package_uid: string | null
  storage_location: string | null
  expiry_status: 'expired' | 'expiring_soon' | 'ok' | null
  days_until_expiry: number | null
}

export function InventoryDashboard({ siteId, userRole, organizationId, userId }: InventoryDashboardProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dashboard data
  const [totalItems, setTotalItems] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [expiringCount, setExpiringCount] = useState(0)
  const [recentMovementsCount, setRecentMovementsCount] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<StockBalanceView[]>([])
  const [expiringLots, setExpiringLots] = useState<ActiveLotView[]>([])
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])

  // Dialog states
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)

  useEffect(() => {
    // Check permission before loading
    if (!can('inventory:view')) {
      return
    }

    async function loadDashboardData() {
      try {
        setIsLoading(true)
        setError(null)

        // In dev mode, fetch via dev API which uses service role
        if (isDevModeActive()) {
          const [itemsRes, movementsRes] = await Promise.all([
            fetch(`/api/dev/inventory?siteId=${siteId}`),
            fetch(`/api/dev/inventory/movements?siteId=${siteId}&limit=10`)
          ])
          
          if (!itemsRes.ok || !movementsRes.ok) {
            throw new Error('Failed to fetch dashboard data')
          }
          
          const { data: items } = await itemsRes.json()
          const { data: movements } = await movementsRes.json()
          
          // Calculate low stock items (items with current_quantity < minimum_quantity)
          const lowStock = items?.filter((item: any) => 
            item.minimum_quantity && item.current_quantity < item.minimum_quantity
          ) || []
          
          // Calculate expiring items (items with expiry_date within 30 days)
          const now = new Date()
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          const expiring = items?.filter((item: any) => {
            if (!item.expiry_date) return false
            const expiryDate = new Date(item.expiry_date)
            return expiryDate >= now && expiryDate <= thirtyDaysFromNow
          }) || []
          
          setTotalItems(items?.length || 0)
          setLowStockCount(lowStock.length)
          setExpiringCount(expiring.length)
          setRecentMovementsCount(movements?.length || 0)
          setLowStockItems([]) // Views not available in dev mode
          setExpiringLots([]) // Views not available in dev mode
          setRecentMovements(movements || [])
          setIsLoading(false)
          return
        }

        // PRODUCTION MODE: Load all dashboard data in parallel using client-side Supabase
        const supabase = createClient()
        
        const [
          items,
          stockBalances,
          belowMinimum,
          expiring,
          movements,
        ] = await Promise.all([
          // Get all inventory items
          supabase
            .from('inventory_items')
            .select('*')
            .eq('site_id', siteId)
            .eq('is_active', true),
          // Get stock balances view
          supabase
            .from('inventory_stock_balances')
            .select('*')
            .eq('site_id', siteId),
          // Get items below minimum
          supabase
            .from('inventory_stock_balances')
            .select('*')
            .eq('site_id', siteId)
            .in('stock_status', ['below_par', 'reorder', 'out_of_stock']),
          // Get expiring lots (next 30 days)
          supabase
            .from('inventory_active_lots')
            .select('*')
            .eq('site_id', siteId)
            .in('expiry_status', ['expired', 'expiring_soon'])
            .order('expiry_date', { ascending: true })
            .limit(10),
          // Get recent movements (join through items to get site_id)
          supabase
            .from('inventory_movements')
            .select(`
              *,
              inventory_items!inner(site_id)
            `)
            .eq('inventory_items.site_id', siteId)
            .order('timestamp', { ascending: false })
            .limit(10),
        ])

        // Set summary counts
        // Use inventory_items count as fallback if views don't work
        setTotalItems(items.data?.length || stockBalances.data?.length || 0)
        setLowStockCount(belowMinimum.data?.length || 0)
        setExpiringCount(expiring.data?.length || 0)
        setRecentMovementsCount(movements.data?.length || 0)
        
        // Set detailed data
        setLowStockItems(belowMinimum.data || [])
        setExpiringLots(expiring.data || [])
        setRecentMovements(movements.data || [])

      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  // Refresh dashboard after successful operations
  const handleDialogSuccess = () => {
    // Reload dashboard data
    if (!can('inventory:view')) return

    async function reloadData() {
      try {
        setError(null)

        // In dev mode, fetch via dev API which uses service role
        if (isDevModeActive()) {
          const [itemsRes, movementsRes] = await Promise.all([
            fetch(`/api/dev/inventory?siteId=${siteId}`),
            fetch(`/api/dev/inventory/movements?siteId=${siteId}&limit=10`)
          ])
          
          if (!itemsRes.ok || !movementsRes.ok) {
            throw new Error('Failed to fetch dashboard data')
          }
          
          const { data: items } = await itemsRes.json()
          const { data: movements } = await movementsRes.json()
          
          // Calculate low stock items
          const lowStock = items?.filter((item: any) => 
            item.minimum_quantity && item.current_quantity < item.minimum_quantity
          ) || []
          
          // Calculate expiring items
          const now = new Date()
          const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          const expiring = items?.filter((item: any) => {
            if (!item.expiry_date) return false
            const expiryDate = new Date(item.expiry_date)
            return expiryDate >= now && expiryDate <= thirtyDaysFromNow
          }) || []
          
          setTotalItems(items?.length || 0)
          setLowStockCount(lowStock.length)
          setExpiringCount(expiring.length)
          setRecentMovementsCount(movements?.length || 0)
          setLowStockItems([])
          setExpiringLots([])
          setRecentMovements(movements || [])
          return
        }

        // PRODUCTION MODE: Load data using Supabase client
        const supabase = createClient()
        
        const [
          items,
          stockBalances,
          belowMinimum,
          expiring,
          movements,
        ] = await Promise.all([
          supabase
            .from('inventory_items')
            .select('*')
            .eq('site_id', siteId)
            .eq('is_active', true),
          supabase
            .from('inventory_stock_balances')
            .select('*')
            .eq('site_id', siteId),
          supabase
            .from('inventory_stock_balances')
            .select('*')
            .eq('site_id', siteId)
            .in('stock_status', ['below_par', 'reorder', 'out_of_stock']),
          supabase
            .from('inventory_active_lots')
            .select('*')
            .eq('site_id', siteId)
            .in('expiry_status', ['expired', 'expiring_soon'])
            .order('expiry_date', { ascending: true })
            .limit(10),
          supabase
            .from('inventory_movements')
            .select(`
              *,
              inventory_items!inner(site_id)
            `)
            .eq('inventory_items.site_id', siteId)
            .order('timestamp', { ascending: false })
            .limit(10),
        ])

        setTotalItems(items.data?.length || stockBalances.data?.length || 0)
        setLowStockCount(belowMinimum.data?.length || 0)
        setExpiringCount(expiring.data?.length || 0)
        setRecentMovementsCount(movements.data?.length || 0)
        setLowStockItems(belowMinimum.data || [])
        setExpiringLots(expiring.data || [])
        setRecentMovements(movements.data || [])
      } catch (err) {
        console.error('Error reloading dashboard data:', err)
      }
    }

    reloadData()
  }

  if (!can('inventory:view')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to view inventory.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const formatMovementType = (type: string) => {
    // Normalize internal codes to user-facing labels
    const normalized = (type || '').toLowerCase()
    if (normalized === 'consume' || normalized === 'issue') return 'Issue'
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items below minimum
            </p>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {expiringCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lots expiring in 30 days
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMovementsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Movements today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Tabs */}
      <Tabs defaultValue="low-stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="low-stock">
            Low Stock
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expiring">
            Expiring
            {expiringCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {expiringCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Low Stock Tab */}
        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Items Below Minimum</CardTitle>
              <CardDescription>
                Items that need reordering or restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All items are adequately stocked
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.item_name}</h4>
                          <Badge variant="outline">{item.stock_status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.sku && `SKU: ${item.sku} • `}
                          On hand: {item.on_hand} {item.unit_of_measure}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Par Level: {item.par_level}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available: {item.available}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Tab */}
        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Lots</CardTitle>
              <CardDescription>
                Lots expiring within the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiringLots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No lots expiring soon
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringLots.map((lot) => (
                    <div
                      key={lot.lot_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{lot.item_name}</h4>
                          <Badge
                            variant={
                              lot.expiry_status === 'expired'
                                ? 'destructive'
                                : lot.expiry_status === 'expiring_soon'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {lot.expiry_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Lot: {lot.lot_code} • Remaining: {lot.quantity_remaining}{' '}
                          {lot.unit_of_measure}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {lot.days_until_expiry !== null
                            ? `${lot.days_until_expiry} days`
                            : 'Expired'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lot.expiry_date &&
                            new Date(lot.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>Latest inventory transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent movements
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {movement.movement_type === 'receive' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : movement.movement_type === 'consume' ? (
                            <TrendingDown className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Activity className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {formatMovementType(movement.movement_type)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {movement.quantity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Item ID: {movement.item_id}
                            {movement.notes && ` • ${movement.notes}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDate(movement.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {can('inventory:create') && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => setIsAddItemDialogOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Receive Inventory
            </Button>
            {can('inventory:consume') && (
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(true)}>
                <TrendingDown className="h-4 w-4 mr-2" />
                Issue to Batch
              </Button>
            )}
            {can('inventory:update') && (
              <Button variant="outline" onClick={() => setIsAdjustDialogOpen(true)}>
                <Activity className="h-4 w-4 mr-2" />
                Adjust Inventory
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ItemFormDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        onSuccess={handleDialogSuccess}
      />

      <ReceiveInventoryDialog
        open={isReceiveDialogOpen}
        onOpenChange={setIsReceiveDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        onSuccess={handleDialogSuccess}
      />

      <IssueInventoryDialog
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        onSuccess={handleDialogSuccess}
      />

      <AdjustInventoryDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        organizationId={organizationId}
        siteId={siteId}
        userId={userId}
        userRole={userRole}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}

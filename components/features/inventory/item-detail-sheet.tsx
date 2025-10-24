'use client'

/**
 * Item Detail Sheet Component
 * 
 * Displays comprehensive information about an inventory item in a slide-out panel
 * Shows stock levels, lot information, recent movements, and metadata
 */

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Edit,
  AlertCircle,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Truck,
  Phone,
  BarChart3,
  Activity,
  Tag,
  ExternalLink,
  Box,
  Clock,
} from 'lucide-react'
import type { InventoryItemWithStock } from '@/types/inventory'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import { createClient } from '@/lib/supabase/client'
import { isDevModeActive } from '@/lib/dev-mode'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ItemDetailSheetProps {
  item: InventoryItemWithStock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: string
  onEdit?: (item: InventoryItemWithStock) => void
  onReceive?: (item: InventoryItemWithStock) => void
  onIssue?: (item: InventoryItemWithStock) => void
}

interface RecentMovement {
  id: string
  movement_type: string
  quantity: number
  timestamp: string
  performed_by: string
  notes?: string
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  userRole,
  onEdit,
  onReceive,
  onIssue,
}: ItemDetailSheetProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([])
  const [isLoadingMovements, setIsLoadingMovements] = useState(false)

  useEffect(() => {
    if (item && open) {
      loadRecentMovements()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open])

  const loadRecentMovements = async () => {
    if (!item) return

    try {
      setIsLoadingMovements(true)

      if (isDevModeActive()) {
        const response = await fetch(`/api/dev/inventory/movements?item_id=${item.id}&limit=10`)
        if (response.ok) {
          const { data } = await response.json()
          setRecentMovements(data || [])
        }
      } else {
        const supabase = createClient()
        const { data } = await supabase
          .from('inventory_movements')
          .select('id, movement_type, quantity, timestamp, performed_by, notes')
          .eq('item_id', item.id)
          .order('timestamp', { ascending: false })
          .limit(10)

        setRecentMovements(data || [])
      }
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setIsLoadingMovements(false)
    }
  }

  if (!item) return null

  const getStockStatus = () => {
    if (item.current_quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, icon: AlertCircle }
    } else if (
      item.minimum_quantity !== undefined &&
      item.minimum_quantity !== null &&
      item.current_quantity < item.minimum_quantity
    ) {
      return { label: 'Low Stock', variant: 'secondary' as const, icon: TrendingDown }
    } else {
      return { label: 'In Stock', variant: 'default' as const, icon: Package }
    }
  }

  const formatItemType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMovementType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return TrendingUp
      case 'consume':
      case 'issue':
        return TrendingDown
      case 'adjust':
        return Activity
      case 'dispose':
        return AlertCircle
      default:
        return Box
    }
  }

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon
  const availableQuantity = item.current_quantity - item.reserved_quantity

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl font-bold tracking-tight mb-2">
                  {item.name}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.sku && (
                    <Badge variant="outline" className="font-mono text-xs">
                      SKU: {item.sku}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {formatItemType(item.item_type)}
                  </Badge>
                </div>
              </div>
              <Badge variant={stockStatus.variant} className="shrink-0 px-3 py-1.5">
                <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                {stockStatus.label}
              </Badge>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          {(can('inventory:update') || can('inventory:create') || can('inventory:consume')) && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {can('inventory:update') && onEdit && (
                <Button onClick={() => onEdit(item)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {can('inventory:create') && onReceive && (
                <Button onClick={() => onReceive(item)} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Receive
                </Button>
              )}
              {can('inventory:consume') && onIssue && (
                <Button onClick={() => onIssue(item)} variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Issue
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Stock Overview - Hero Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">On Hand</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold tracking-tight">
                  {item.current_quantity}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{item.unit_of_measure}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold tracking-tight text-primary">
                  {availableQuantity}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{item.unit_of_measure}</p>
              </CardContent>
            </Card>

            {item.reserved_quantity > 0 && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reserved</p>
                    <Box className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {item.reserved_quantity}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.unit_of_measure}</p>
                </CardContent>
              </Card>
            )}

            {item.minimum_quantity !== undefined && item.minimum_quantity !== null && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Level</p>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {item.minimum_quantity}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.unit_of_measure}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Item Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Item Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.storage_location && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Storage Location
                      </p>
                      <p className="text-sm font-medium">{item.storage_location}</p>
                    </div>
                  </div>
                )}

                {item.cost_per_unit && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <DollarSign className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Cost Per Unit
                      </p>
                      <p className="text-sm font-semibold">
                        ${item.cost_per_unit.toFixed(2)} / {item.unit_of_measure}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Total: ${(item.current_quantity * item.cost_per_unit).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="flex gap-3 p-4 rounded-lg bg-muted/30 border-l-4 border-primary">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Notes
                    </p>
                    <p className="text-sm leading-relaxed">{item.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {(item.supplier_name || item.supplier_contact) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.supplier_name && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Supplier Name
                      </p>
                      <p className="text-sm font-medium">{item.supplier_name}</p>
                    </div>
                  </div>
                )}
                {item.supplier_contact && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Contact Information
                      </p>
                      <p className="text-sm font-medium">{item.supplier_contact}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(item.certificate_of_analysis_url || item.material_safety_data_sheet_url) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.certificate_of_analysis_url && (
                  <a
                    href={item.certificate_of_analysis_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        Certificate of Analysis
                      </p>
                      <p className="text-xs text-muted-foreground">View document</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}
                {item.material_safety_data_sheet_url && (
                  <a
                    href={item.material_safety_data_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border hover:bg-muted transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        Material Safety Data Sheet
                      </p>
                      <p className="text-xs text-muted-foreground">View MSDS</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Movements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 10 inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">Loading activity...</p>
                  </div>
                </div>
              ) : recentMovements.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">Transactions will appear here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentMovements.map((movement) => {
                    const MovementIcon = getMovementIcon(movement.movement_type)
                    const isIncrease = ['receive', 'return'].includes(movement.movement_type)
                    
                    return (
                      <div
                        key={movement.id}
                        className="group flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-accent transition-all"
                      >
                        <div className={`shrink-0 p-2.5 rounded-lg ${
                          isIncrease 
                            ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500/20' 
                            : 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500/20'
                        }`}>
                          <MovementIcon className={`h-5 w-5 ${
                            isIncrease 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-orange-700 dark:text-orange-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold mb-0.5">
                                {formatMovementType(movement.movement_type)}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(movement.timestamp)}
                              </div>
                            </div>
                            <div className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold ${
                              isIncrease 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            }`}>
                              {isIncrease ? '+' : '-'}{movement.quantity}
                            </div>
                          </div>
                          {movement.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 group-hover:text-foreground/70 transition-colors">
                              {movement.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-[10px]">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <div>
                    <p className="font-medium">Updated</p>
                    <p className="text-[10px]">{formatDate(item.updated_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  <div>
                    <p className="font-medium">Item ID</p>
                    <p className="text-[10px] font-mono">{item.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}

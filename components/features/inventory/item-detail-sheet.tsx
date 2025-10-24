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
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-2xl">{item.name}</SheetTitle>
              <SheetDescription>
                {item.sku && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {item.sku}
                  </code>
                )}
              </SheetDescription>
            </div>
            <Badge variant={stockStatus.variant} className="ml-2">
              <StatusIcon className="h-3 w-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          {(can('inventory:update') || can('inventory:create') || can('inventory:consume')) && (
            <div className="flex flex-wrap gap-2">
              {can('inventory:update') && onEdit && (
                <Button onClick={() => onEdit(item)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
              )}
              {can('inventory:create') && onReceive && (
                <Button onClick={() => onReceive(item)} variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Receive
                </Button>
              )}
              {can('inventory:consume') && onIssue && (
                <Button onClick={() => onIssue(item)} variant="outline" size="sm">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Issue
                </Button>
              )}
            </div>
          )}

          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Stock Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">On Hand</p>
                <p className="text-2xl font-bold">
                  {item.current_quantity} <span className="text-sm font-normal text-muted-foreground">{item.unit_of_measure}</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">
                  {availableQuantity} <span className="text-sm font-normal text-muted-foreground">{item.unit_of_measure}</span>
                </p>
              </div>
              {item.reserved_quantity > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-xl font-semibold">
                    {item.reserved_quantity} <span className="text-sm font-normal">{item.unit_of_measure}</span>
                  </p>
                </div>
              )}
              {item.minimum_quantity !== undefined && item.minimum_quantity !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Level</p>
                  <p className="text-xl font-semibold">
                    {item.minimum_quantity} <span className="text-sm font-normal">{item.unit_of_measure}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Type
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {formatItemType(item.item_type)}
                  </Badge>
                </div>
                {item.storage_location && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="text-sm font-medium mt-1">{item.storage_location}</p>
                  </div>
                )}
              </div>

              {item.cost_per_unit && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Cost Per Unit
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ${item.cost_per_unit.toFixed(2)} / {item.unit_of_measure}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Value: ${(item.current_quantity * item.cost_per_unit).toFixed(2)}
                  </p>
                </div>
              )}

              {item.notes && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Notes
                  </p>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {(item.supplier_name || item.supplier_contact) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.supplier_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier Name</p>
                    <p className="text-sm font-medium">{item.supplier_name}</p>
                  </div>
                )}
                {item.supplier_contact && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Contact
                    </p>
                    <p className="text-sm font-medium">{item.supplier_contact}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(item.certificate_of_analysis_url || item.material_safety_data_sheet_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.certificate_of_analysis_url && (
                  <a
                    href={item.certificate_of_analysis_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Certificate of Analysis
                  </a>
                )}
                {item.material_safety_data_sheet_url && (
                  <a
                    href={item.material_safety_data_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Material Safety Data Sheet (MSDS)
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 10 inventory movements</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading activity...
                </div>
              ) : recentMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMovements.map((movement) => {
                    const MovementIcon = getMovementIcon(movement.movement_type)
                    const isIncrease = ['receive', 'return'].includes(movement.movement_type)
                    
                    return (
                      <div
                        key={movement.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${isIncrease ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20'}`}>
                          <MovementIcon className={`h-4 w-4 ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {formatMovementType(movement.movement_type)}
                            </p>
                            <p className={`text-sm font-semibold ${isIncrease ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {isIncrease ? '+' : '-'}{movement.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(movement.timestamp)}
                          </div>
                          {movement.notes && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
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
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Created: {formatDate(item.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Last Updated: {formatDate(item.updated_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              <span>ID: {item.id}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

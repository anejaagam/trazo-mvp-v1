'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, 
  Download, 
  Filter,
  ArrowUpDown,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { getMovements } from '@/lib/supabase/queries/inventory-movements-client'
import { getInventoryItems } from '@/lib/supabase/queries/inventory-client'
import type { InventoryMovementWithDetails, MovementType } from '@/types/inventory'
import type { RoleKey } from '@/lib/rbac/types'
import { isDevModeActive } from '@/lib/dev-mode'

interface MovementsLogProps {
  organizationId: string
  siteId: string
  userRole: string
}

type SortField = 'created_at' | 'quantity' | 'movement_type'
type SortDirection = 'asc' | 'desc'

export function MovementsLog({
  organizationId,
  siteId,
  userRole,
}: MovementsLogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isLoading, setIsLoading] = useState(true)
  const [movements, setMovements] = useState<InventoryMovementWithDetails[]>([])
  const [filteredMovements, setFilteredMovements] = useState<InventoryMovementWithDetails[]>([])
  const [items, setItems] = useState<{ id: string; name: string }[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [itemFilter, setItemFilter] = useState<string>('all')
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, searchTerm, itemFilter, movementTypeFilter, startDate, endDate, sortField, sortDirection])

  // Check permission
  if (!can('inventory:view')) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            You don&apos;t have permission to view inventory movements.
          </p>
        </CardContent>
      </Card>
    )
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // DEV MODE: Fetch via dev API which uses service role
      if (isDevModeActive()) {
        const [movementsRes, itemsRes] = await Promise.all([
          fetch(`/api/dev/inventory/movements?siteId=${siteId}&limit=100`),
          fetch(`/api/dev/inventory?siteId=${siteId}`)
        ])
        
        if (!movementsRes.ok || !itemsRes.ok) {
          throw new Error('Failed to fetch data')
        }
        
        const { data: movementsData } = await movementsRes.json()
        const { data: itemsData } = await itemsRes.json()
        
        setMovements(movementsData || [])
        const itemsList = itemsData?.map((item: any) => ({ id: item.id, name: item.name })) || []
        setItems(itemsList)
        return
      }

      // PRODUCTION MODE: Load from database
      // Load movements
      const { data: movementsData } = await getMovements(siteId, {
        organization_id: organizationId,
      })
      setMovements(movementsData || [])

      // Load items for filter
      const { data: itemsData } = await getInventoryItems(siteId, {
        organization_id: organizationId,
        is_active: true,
      })
      const itemsList = (itemsData || []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))
      setItems(itemsList)
    } catch (err) {
      console.error('Error loading movements:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...movements]

    // Search by notes or lot code
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.lot?.lot_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.item?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by item
    if (itemFilter && itemFilter !== 'all') {
      filtered = filtered.filter(m => m.item_id === itemFilter)
    }

    // Filter by movement type
    if (movementTypeFilter && movementTypeFilter !== 'all') {
      filtered = filtered.filter(m => m.movement_type === movementTypeFilter)
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= new Date(startDate))
    }
    if (endDate) {
      filtered = filtered.filter(m => new Date(m.timestamp) <= new Date(endDate + 'T23:59:59'))
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'created_at') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity
      } else if (sortField === 'movement_type') {
        comparison = a.movement_type.localeCompare(b.movement_type)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    setFilteredMovements(filtered)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getMovementTypeIcon = (type: MovementType) => {
    switch (type) {
      case 'receive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'consume':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />
      case 'adjust':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementTypeBadge = (type: MovementType) => {
    const variants: Record<MovementType, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      receive: 'default',
      consume: 'destructive',
      transfer: 'outline',
      adjust: 'secondary',
      dispose: 'destructive',
      return: 'default',
      reserve: 'outline',
      unreserve: 'secondary',
    }
    return variants[type] || 'outline'
  }

  const getMovementTypeLabel = (type: MovementType): string => {
    const labels: Record<MovementType, string> = {
      receive: 'Receive',
      consume: 'Issue',
      transfer: 'Transfer',
      adjust: 'Adjust',
      dispose: 'Dispose',
      return: 'Return',
      reserve: 'Reserve',
      unreserve: 'Unreserve',
    }
    return labels[type] || type
  }

  const formatQuantity = (quantity: number, type: MovementType): string => {
    const sign = type === 'receive' || (type === 'adjust' && quantity > 0) ? '+' : ''
    return `${sign}${quantity}`
  }

  const exportToCSV = () => {
    // Generate CSV content
    const headers = ['Date', 'Type', 'Item', 'Lot', 'Quantity', 'From', 'To', 'Batch', 'Task', 'Notes', 'Performed By']
    const rows = filteredMovements.map(m => [
      new Date(m.timestamp).toLocaleString(),
      getMovementTypeLabel(m.movement_type),
      m.item?.name || 'Unknown',
      m.lot?.lot_code || 'N/A',
      formatQuantity(m.quantity, m.movement_type),
      m.from_location || '',
      m.to_location || '',
      m.batch_id || '',
      m.task_id || '',
      m.notes || '',
      m.performed_by,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-movements-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setItemFilter('all')
    setMovementTypeFilter('all')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = searchTerm || (itemFilter !== 'all') || (movementTypeFilter !== 'all') || startDate || endDate

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Movements
            </CardTitle>
            <CardDescription>
              Complete history of all inventory transactions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredMovements.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <Input
              placeholder="Search notes, lot code, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-1"
            />

            {/* Item Filter */}
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All items</SelectItem>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Movement Type Filter */}
            <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
                <SelectItem value="consume">Issue</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="adjust">Adjust</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            {/* End Date */}
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredMovements.length} of {movements.length} movements
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {hasActiveFilters ? 'No movements match your filters' : 'No inventory movements yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none w-[140px]"
                    onClick={() => toggleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Date & Time
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none w-[120px]"
                    onClick={() => toggleSort('movement_type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px]">Item</TableHead>
                  <TableHead className="w-[120px]">Lot</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none text-right w-[120px] pr-8"
                    onClick={() => toggleSort('quantity')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Quantity
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px] pl-8">From → To</TableHead>
                  <TableHead className="w-[140px]">Batch/Task</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium w-[140px]">
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(movement.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(movement.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <Badge 
                        variant={getMovementTypeBadge(movement.movement_type)}
                        className="flex items-center gap-1 w-fit"
                      >
                        {getMovementTypeIcon(movement.movement_type)}
                        {getMovementTypeLabel(movement.movement_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <div className="space-y-1">
                        <div className="font-medium">{movement.item?.name || 'Unknown'}</div>
                        {movement.item?.sku && (
                          <div className="text-xs text-muted-foreground">
                            SKU: {movement.item.sku}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      {movement.lot?.lot_code ? (
                        <span className="text-sm font-mono">{movement.lot.lot_code}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right w-[120px] pr-8">
                      <span className={`font-medium ${
                        movement.movement_type === 'receive' || 
                        (movement.movement_type === 'adjust' && movement.quantity > 0)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatQuantity(movement.quantity, movement.movement_type)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {movement.item?.unit_of_measure || ''}
                      </span>
                    </TableCell>
                    <TableCell className="w-[180px] pl-8">
                      <div className="text-sm space-y-1">
                        {movement.from_location && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">From:</span>
                            <span>{movement.from_location}</span>
                          </div>
                        )}
                        {movement.to_location && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">To:</span>
                            <span>{movement.to_location}</span>
                          </div>
                        )}
                        {!movement.from_location && !movement.to_location && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[140px]">
                      <div className="text-sm space-y-1">
                        {movement.batch_id && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Batch:</span>
                            <span className="font-mono text-xs">{movement.batch_id}</span>
                          </div>
                        )}
                        {movement.task_id && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Task:</span>
                            <span className="font-mono text-xs">{movement.task_id}</span>
                          </div>
                        )}
                        {!movement.batch_id && !movement.task_id && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      {movement.notes ? (
                        <div className="text-sm max-w-xs truncate" title={movement.notes}>
                          {movement.notes}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

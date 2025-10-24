'use client'

/**
 * Item Catalog Component
 * 
 * Searchable and filterable table of all inventory items
 * Supports sorting, filtering by type/category/status, and bulk actions
 */

import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Filter,
  MoreVertical,
  Package,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpDown,
  Plus,
  Trash2,
  Archive,
  CheckSquare,
  Square,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { RoleKey } from '@/lib/rbac/types'
import type { InventoryItemWithStock, ItemType } from '@/types/inventory'
import { isDevModeActive } from '@/lib/dev-mode'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ItemCatalogProps {
  organizationId: string
  siteId: string
  userRole: string
  onItemSelect?: (item: InventoryItemWithStock) => void
  onCreateItem?: () => void
  onEditItem?: (item: InventoryItemWithStock) => void
  onReceiveInventory?: (item: InventoryItemWithStock) => void
  onIssueInventory?: (item: InventoryItemWithStock) => void
}

type SortField = 'name' | 'sku' | 'current_quantity' | 'item_type' | 'updated_at'
type SortOrder = 'asc' | 'desc'

export function ItemCatalog({
  organizationId,
  siteId,
  userRole,
  onItemSelect,
  onCreateItem,
  onEditItem,
  onReceiveInventory,
  onIssueInventory,
}: ItemCatalogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryItemWithStock[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItemWithStock[]>([])
  
  // Batch selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Separate backend filters (trigger DB query) from client-side filters
  const [itemType, setItemType] = useState<ItemType | 'all'>('all')
  const [isActive, setIsActive] = useState(true)
  
  // Client-side filters (applied after fetching)
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState<'all' | 'ok' | 'low' | 'out'>('all')
  
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Load items from database (only when backend filters change)
  useEffect(() => {
    // Check permission before loading
    if (!can('inventory:view')) {
      return
    }

    async function loadItems() {
      try {
        setIsLoading(true)
        setError(null)

        // DEV MODE: Fetch via dev API which uses service role
        if (isDevModeActive()) {
          const response = await fetch(`/api/dev/inventory?siteId=${siteId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch inventory items')
          }
          const { data } = await response.json()
          setItems(data || [])
          setIsLoading(false)
          return
        }

        // PRODUCTION MODE: Build query with client-side Supabase
        const supabase = createClient()
        let query = supabase
          .from('inventory_items')
          .select('*')
          .eq('site_id', siteId)
          .eq('is_active', isActive)
          .order('name', { ascending: true })

        // Apply item type filter
        if (itemType !== 'all') {
          query = query.eq('item_type', itemType)
        }

        const { data, error: queryError } = await query

        if (queryError) throw queryError
        setItems(data || [])
      } catch (err) {
        console.error('Error loading items:', err)
        setError('Failed to load inventory items')
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, siteId, isActive, itemType])

  // Apply client-side filters and sorting
  useEffect(() => {
    let result = [...items]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower)
      )
    }

    // Stock status filter
    if (stockStatus !== 'all') {
      result = result.filter((item) => {
        if (stockStatus === 'out') {
          return item.current_quantity === 0
        } else if (stockStatus === 'low') {
          return (
            item.current_quantity > 0 &&
            item.minimum_quantity !== undefined &&
            item.minimum_quantity !== null &&
            item.current_quantity < item.minimum_quantity
          )
        } else {
          // 'ok'
          return (
            item.current_quantity > 0 &&
            (item.minimum_quantity === undefined ||
              item.minimum_quantity === null ||
              item.current_quantity >= item.minimum_quantity)
          )
        }
      })
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'sku':
          aVal = a.sku || ''
          bVal = b.sku || ''
          break
        case 'current_quantity':
          aVal = a.current_quantity
          bVal = b.current_quantity
          break
        case 'item_type':
          aVal = a.item_type
          bVal = b.item_type
          break
        case 'updated_at':
          aVal = a.updated_at
          bVal = b.updated_at
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
      }
    })

    setFilteredItems(result)
  }, [items, search, stockStatus, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getStockStatus = (item: InventoryItemWithStock) => {
    if (item.current_quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const }
    } else if (
      item.minimum_quantity !== undefined &&
      item.minimum_quantity !== null &&
      item.current_quantity < item.minimum_quantity
    ) {
      return { label: 'Low Stock', variant: 'secondary' as const }
    } else {
      return { label: 'In Stock', variant: 'default' as const }
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
    })
  }

  // Batch selection handlers
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  // Delete handlers
  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId)
    setShowDeleteDialog(true)
  }

  const handleBulkDeleteClick = () => {
    if (selectedItems.size === 0) return
    setItemToDelete('bulk')
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      setIsDeleting(true)
      const itemsToDelete = itemToDelete === 'bulk' 
        ? Array.from(selectedItems) 
        : [itemToDelete]

      // In dev mode, use dev API
      if (isDevModeActive()) {
        for (const id of itemsToDelete) {
          const response = await fetch('/api/dev/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: false })
          })
          if (!response.ok) throw new Error('Failed to delete item')
        }
      } else {
        // Production mode
        const supabase = createClient()
        const { error } = await supabase
          .from('inventory_items')
          .update({ is_active: false })
          .in('id', itemsToDelete)

        if (error) throw error
      }

      // Reload items
      setItems(items.filter(item => !itemsToDelete.includes(item.id)))
      setSelectedItems(new Set())
      setShowDeleteDialog(false)
      setItemToDelete(null)
    } catch (err) {
      console.error('Error deleting items:', err)
      setError('Failed to delete items')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkArchive = async () => {
    if (selectedItems.size === 0) return

    try {
      const itemsToArchive = Array.from(selectedItems)

      if (isDevModeActive()) {
        for (const id of itemsToArchive) {
          await fetch('/api/dev/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: false })
          })
        }
      } else {
        const supabase = createClient()
        await supabase
          .from('inventory_items')
          .update({ is_active: false })
          .in('id', itemsToArchive)
      }

      setItems(items.filter(item => !itemsToArchive.includes(item.id)))
      setSelectedItems(new Set())
    } catch (err) {
      console.error('Error archiving items:', err)
      setError('Failed to archive items')
    }
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Inventory Catalog</CardTitle>
            <CardDescription>
              Browse and manage all inventory items
            </CardDescription>
          </div>
          {can('inventory:create') && onCreateItem && (
            <Button onClick={onCreateItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Bulk Actions */}
        <div className="space-y-4 mb-6">
          {/* Bulk Actions Bar */}
          {selectedItems.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                {can('inventory:delete') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteClick}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Item Type Filter */}
          <Select
            value={itemType}
            onValueChange={(value) => setItemType(value as ItemType | 'all')}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Item Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="raw_material">Raw Material</SelectItem>
              <SelectItem value="ingredient">Ingredient</SelectItem>
              <SelectItem value="packaging">Packaging</SelectItem>
              <SelectItem value="supply">Supply</SelectItem>
              <SelectItem value="finished_good">Finished Good</SelectItem>
              <SelectItem value="plant">Plant</SelectItem>
              <SelectItem value="seed">Seed</SelectItem>
              <SelectItem value="clone">Clone</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Stock Status Filter */}
          <Select
            value={stockStatus}
            onValueChange={(value) => setStockStatus(value as 'all' | 'ok' | 'low' | 'out')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          {/* Active/Inactive Toggle */}
          <Button
            variant={isActive ? 'default' : 'outline'}
            onClick={() => setIsActive(!isActive)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {isActive ? 'Active' : 'All Items'}
          </Button>
        </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No items found</h3>
            <p className="text-muted-foreground mb-4">
              {items.length === 0
                ? 'Get started by adding your first inventory item'
                : 'Try adjusting your filters'}
            </p>
            {can('inventory:create') && items.length === 0 && onCreateItem && (
              <Button onClick={onCreateItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="hover:bg-transparent"
                    >
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('sku')}
                      className="hover:bg-transparent"
                    >
                      SKU
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('item_type')}
                      className="hover:bg-transparent"
                    >
                      Type
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('current_quantity')}
                      className="hover:bg-transparent"
                    >
                      Quantity
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('updated_at')}
                      className="hover:bg-transparent"
                    >
                      Last Updated
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const isSelected = selectedItems.has(item.id)
                  return (
                    <TableRow
                      key={item.id}
                      className={`group cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary' 
                          : 'hover:bg-accent/50 hover:shadow-sm'
                      }`}
                      onClick={() => onItemSelect?.(item)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold group-hover:text-primary transition-colors">
                            {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.sku ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {item.sku}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatItemType(item.item_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          {item.current_quantity} {item.unit_of_measure}
                        </div>
                        {item.reserved_quantity > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({item.reserved_quantity} reserved)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {can('inventory:update') && onEditItem && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditItem(item)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Item
                              </DropdownMenuItem>
                            )}
                            {can('inventory:create') && onReceiveInventory && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onReceiveInventory(item)
                                }}
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Receive
                              </DropdownMenuItem>
                            )}
                            {can('inventory:consume') && onIssueInventory && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onIssueInventory(item)
                                }}
                              >
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Issue
                              </DropdownMenuItem>
                            )}
                            {can('inventory:delete') && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(item.id)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Item
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete === 'bulk' 
                ? `This will permanently delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}. This action cannot be undone.`
                : 'This will permanently delete this item. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  BottomSheetDialog as Dialog,
  BottomSheetDialogContent as DialogContent,
  BottomSheetDialogDescription as DialogDescription,
  BottomSheetDialogFooter as DialogFooter,
  BottomSheetDialogHeader as DialogHeader,
  BottomSheetDialogTitle as DialogTitle,
} from './bottom-sheet-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Package, AlertCircle, CheckCircle2 } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { getInventoryItems } from '@/lib/supabase/queries/inventory-client'
import {
  getLotsByItem,
  getAvailableLots,
} from '@/lib/supabase/queries/inventory-lots-client'
import type { InventoryItemWithStock } from '@/types/inventory'
import { isDevModeActive } from '@/lib/dev-mode'
import type { RoleKey } from '@/lib/rbac/types'

interface InventoryLot {
  id: string
  lot_code: string
  quantity_remaining: number
  unit_of_measure: string
  expiry_date: string | null
  received_date: string | null
  storage_location: string | null
  cost_per_unit: number | null
}

type LotSelectionStrategy = 'FIFO' | 'LIFO' | 'FEFO' | 'MANUAL'

interface IssueInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  siteId: string
  userId: string
  userRole: string
  preSelectedItem?: InventoryItemWithStock
  onSuccess?: () => void
}

interface IssueFormData {
  item_id: string
  from_location?: string
  quantity: string
  destination_type: 'batch' | 'task' | 'location'
  batch_id?: string
  task_id?: string
  to_location?: string
  lot_selection_strategy: LotSelectionStrategy
  manual_lot_id?: string
  notes?: string
}

interface LotConsumption {
  lot_id: string
  lot_code: string
  quantity: number
  available: number
}

export function IssueInventoryDialog({
  open,
  onOpenChange,
  organizationId,
  siteId,
  userRole,
  preSelectedItem,
  onSuccess,
}: IssueInventoryDialogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isLoadingLots, setIsLoadingLots] = useState(false)
  const [items, setItems] = useState<InventoryItemWithStock[]>([])
  const [availableLots, setAvailableLots] = useState<InventoryLot[]>([])
  const [filteredLots, setFilteredLots] = useState<InventoryLot[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null)
  const [plannedConsumptions, setPlannedConsumptions] = useState<LotConsumption[]>([])
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const form = useForm<IssueFormData>({
    defaultValues: {
      item_id: preSelectedItem?.id || '',
      from_location: '',
      quantity: '',
      destination_type: 'batch',
      batch_id: '',
      task_id: '',
      to_location: '',
      lot_selection_strategy: 'FIFO',
      manual_lot_id: '',
      notes: '',
    },
  })

  // Load items on mount
  useEffect(() => {
    if (open) {
      loadItems()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, siteId])

  // Set pre-selected item
  useEffect(() => {
    if (preSelectedItem) {
      form.setValue('item_id', preSelectedItem.id)
      setSelectedItem(preSelectedItem)
      loadLotsForItem(preSelectedItem.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedItem])

  // Load lots when item changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'item_id' && value.item_id) {
        const item = items.find(i => i.id === value.item_id)
        setSelectedItem(item || null)
        loadLotsForItem(value.item_id)
        setPlannedConsumptions([])
        // Reset location filter
        form.setValue('from_location', '')
      }
      if (name === 'from_location') {
        // Filter lots by selected location
        if (value.from_location && value.from_location !== '__ALL__') {
          const filtered = availableLots.filter(lot => lot.storage_location === value.from_location)
          setFilteredLots(filtered)
        } else {
          // No filter - show all lots
          setFilteredLots(availableLots)
        }
        // Recalculate consumptions with filtered lots
        if (value.item_id && value.quantity && value.lot_selection_strategy !== 'MANUAL') {
          calculateLotConsumptions(
            value.item_id,
            parseFloat(value.quantity),
            value.lot_selection_strategy as LotSelectionStrategy,
            value.from_location && value.from_location !== '__ALL__' ? value.from_location : undefined
          )
        }
      }
      if (name === 'quantity' || name === 'lot_selection_strategy') {
        // Recalculate planned consumptions when quantity or strategy changes
        if (value.item_id && value.quantity && value.lot_selection_strategy !== 'MANUAL') {
          calculateLotConsumptions(
            value.item_id,
            parseFloat(value.quantity),
            value.lot_selection_strategy as LotSelectionStrategy,
            value.from_location && value.from_location !== '__ALL__' ? value.from_location : undefined
          )
        } else {
          setPlannedConsumptions([])
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, items, availableLots])

  // Check permission
  if (!can('inventory:consume')) {
    return null
  }

  const loadItems = async () => {
    setIsLoadingItems(true)
    setError(null)
    try {
      // DEV MODE: Fetch via dev API which uses service role
      if (isDevModeActive()) {
        const response = await fetch(`/api/dev/inventory?siteId=${siteId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch inventory items')
        }
        const { data } = await response.json()
        // Compute available quantity consistently in dev for display
        const withAvailable = (data || []).map((item: InventoryItemWithStock) => ({
          ...item,
          available_quantity: item.available_quantity ?? Math.max(0, (item.current_quantity || 0) - (item.reserved_quantity || 0)),
        })) as InventoryItemWithStock[]
        // Filter to items with available quantity > 0
        const itemsWithStock = withAvailable.filter((item) => (item.available_quantity || 0) > 0)
        setItems(itemsWithStock)
        return
      }

      // PRODUCTION MODE: Load from database
      const { data, error: fetchError } = await getInventoryItems(siteId, {
        organization_id: organizationId,
        is_active: true,
      })

      if (fetchError) throw fetchError

      // Compute available quantity if not provided by query response
      const withAvailable = (data || []).map((item: InventoryItemWithStock) => ({
        ...item,
        available_quantity: item.available_quantity ?? Math.max(0, (item.current_quantity || 0) - (item.reserved_quantity || 0)),
      })) as InventoryItemWithStock[]

      // Filter to items with available > 0
      const itemsWithStock = withAvailable.filter((item) => (item.available_quantity || 0) > 0)
      setItems(itemsWithStock)
    } catch (err) {
      console.error('Error loading inventory items:', err)
      setError('Failed to load inventory items')
    } finally {
      setIsLoadingItems(false)
    }
  }

  const loadLotsForItem = async (itemId: string) => {
    setIsLoadingLots(true)
    setError(null)
    try {
      const { data, error: fetchError } = await getLotsByItem(itemId)

      if (fetchError) throw fetchError
      
      // Filter to lots with remaining quantity > 0
      const lotsWithStock = data?.filter(lot => lot.quantity_remaining > 0) || []
      setAvailableLots(lotsWithStock as InventoryLot[])
      
      // Extract unique storage locations
      const locations = Array.from(
        new Set(
          lotsWithStock
            .map(lot => lot.storage_location)
            .filter(loc => loc && loc.trim() !== '')
        )
      ).sort() as string[]
      setAvailableLocations(locations)
      
      // Initially show all lots (no filter)
      setFilteredLots(lotsWithStock as InventoryLot[])
    } catch (err) {
      console.error('Error loading lots:', err)
      setError('Failed to load lot information')
    } finally {
      setIsLoadingLots(false)
    }
  }

  const calculateLotConsumptions = async (
    itemId: string,
    quantity: number,
    strategy: LotSelectionStrategy,
    fromLocation?: string
  ) => {
    if (quantity <= 0) {
      setPlannedConsumptions([])
      return
    }

    try {
      const consumptions: LotConsumption[] = []
      let remainingQuantity = quantity

      // Get lots based on strategy
      let lots: InventoryLot[] = []
      const allocMethod: 'FIFO' | 'LIFO' | 'FEFO' = strategy as 'FIFO' | 'LIFO' | 'FEFO'
      const { data: available, error } = await getAvailableLots(itemId, allocMethod)
      if (error) throw error
      if (Array.isArray(available)) {
        // Filter to only necessary fields and types
        lots = (available as InventoryLot[]).map(l => {
          const lotWithId = l as InventoryLot & { lot_id?: string }
          return {
            id: l.id ?? lotWithId.lot_id ?? '', // inventory_active_lots exposes lot_id
            lot_code: l.lot_code,
            quantity_remaining: l.quantity_remaining,
            unit_of_measure: l.unit_of_measure,
            expiry_date: l.expiry_date ?? null,
            received_date: l.received_date ?? null,
            storage_location: l.storage_location ?? null,
            cost_per_unit: l.cost_per_unit ?? null,
          }
        }) as InventoryLot[]
      } else if (available) {
        // In case a single object is returned accidentally
        const l = available as InventoryLot & { lot_id?: string }
        lots = [{
          id: l.id ?? l.lot_id ?? '',
          lot_code: l.lot_code,
          quantity_remaining: l.quantity_remaining,
          unit_of_measure: l.unit_of_measure,
          expiry_date: l.expiry_date ?? null,
          received_date: l.received_date ?? null,
          storage_location: l.storage_location ?? null,
          cost_per_unit: l.cost_per_unit ?? null,
        }]
      }

      // Filter by location if specified
      if (fromLocation) {
        lots = lots.filter(lot => lot.storage_location === fromLocation)
      }

      // Calculate consumption from each lot
      for (const lot of lots) {
        if (remainingQuantity <= 0) break

        const quantityFromThisLot = Math.min(remainingQuantity, lot.quantity_remaining)
        consumptions.push({
          lot_id: lot.id,
          lot_code: lot.lot_code,
          quantity: quantityFromThisLot,
          available: lot.quantity_remaining,
        })
        remainingQuantity -= quantityFromThisLot
      }

      // Check if we have enough stock
      if (remainingQuantity > 0) {
        setError(`Insufficient stock${fromLocation ? ` in ${fromLocation}` : ''}. Only ${quantity - remainingQuantity} units available.`)
      } else {
        setError(null)
      }

      setPlannedConsumptions(consumptions)
    } catch (err) {
      console.error('Error calculating lot consumptions:', err)
      setError('Failed to calculate lot consumptions')
    }
  }

  const onSubmit = async (data: IssueFormData) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const quantity = parseFloat(data.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid quantity')
      }

      if (!selectedItem) {
        throw new Error('Please select an item')
      }

      // Validate destination
      if (data.destination_type === 'batch' && !data.batch_id) {
        throw new Error('Please enter a batch ID')
      }
      if (data.destination_type === 'task' && !data.task_id) {
        throw new Error('Please enter a task ID')
      }
      if (data.destination_type === 'location' && !data.to_location) {
        throw new Error('Please enter a destination location')
      }

      // Determine lots to consume from
      let consumptions: LotConsumption[] = []
      
      if (data.lot_selection_strategy === 'MANUAL') {
        // Manual lot selection
        if (!data.manual_lot_id) {
          throw new Error('Please select a lot')
        }
        const selectedLot = filteredLots.find(lot => lot.id === data.manual_lot_id)
        if (!selectedLot) {
          throw new Error('Selected lot not found')
        }
        if (selectedLot.quantity_remaining < quantity) {
          throw new Error(`Insufficient quantity in selected lot. Only ${selectedLot.quantity_remaining} available.`)
        }
        consumptions = [{
          lot_id: selectedLot.id,
          lot_code: selectedLot.lot_code,
          quantity: quantity,
          available: selectedLot.quantity_remaining,
        }]
      } else {
        // Use planned consumptions from strategy
        consumptions = plannedConsumptions
        if (consumptions.length === 0) {
          throw new Error('No lots available for consumption')
        }
        // Verify total quantity matches
        const totalPlanned = consumptions.reduce((sum, c) => sum + c.quantity, 0)
        if (totalPlanned < quantity) {
          throw new Error(`Insufficient stock. Only ${totalPlanned} units available.`)
        }
      }

      // Use server API to perform atomic lot updates + movement creation
      // Build payload
      const allocation_method = data.lot_selection_strategy === 'MANUAL'
        ? 'manual'
        : data.lot_selection_strategy
      const selectedFromLocation = form.getValues('from_location')
      const normalizedFromLocation = selectedFromLocation && selectedFromLocation !== '__ALL__'
        ? selectedFromLocation
        : undefined

      const body: {
        item_id: string
        quantity: number
        allocation_method: string
        from_location?: string
        to_location?: string
        batch_id?: string
        task_id?: string
        notes?: string
        organization_id: string
        site_id: string
        manual_lot_id?: string
        lot_allocations?: Array<{ lot_id: string; quantity: number }>
      } = {
        item_id: selectedItem.id,
        quantity,
        allocation_method,
        from_location: normalizedFromLocation,
        to_location: data.destination_type === 'location' ? data.to_location : undefined,
        batch_id: data.destination_type === 'batch' ? data.batch_id : undefined,
        task_id: data.destination_type === 'task' ? data.task_id : undefined,
        notes: data.notes || undefined,
        organization_id: organizationId,
        site_id: siteId,
      }

      if (allocation_method === 'manual') {
        // Send single-lot allocation
        body.lot_allocations = consumptions.map(c => ({ lot_id: c.lot_id, quantity: c.quantity }))
      }

      const res = await fetch('/api/inventory/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to issue inventory')
      }

      // Success
      form.reset()
      setSelectedItem(null)
      setAvailableLots([])
      setPlannedConsumptions([])
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Error issuing inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to issue inventory')
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableOutsideClose disableEscapeClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Issue Inventory
          </DialogTitle>
          <DialogDescription>
            Issue inventory to a batch or task (consumes stock), or transfer to another location (preserves stock). 
            System will automatically select lots based on your chosen strategy.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Selection */}
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item *</FormLabel>
                  <Select
                    disabled={isLoadingItems || !!preSelectedItem}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} {item.sku && `(${item.sku})`} - {item.available_quantity} {item.unit_of_measure}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only showing items with available stock
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Storage Location Filter (only show if item has multiple locations) */}
            {selectedItem && availableLocations.length > 1 && (
              <FormField
                control={form.control}
                name="from_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue From Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All locations" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__ALL__">All Locations</SelectItem>
                        {availableLocations.map((location) => {
                          const lotsInLocation = availableLots.filter(lot => lot.storage_location === location)
                          const totalInLocation = lotsInLocation.reduce((sum, lot) => sum + lot.quantity_remaining, 0)
                          return (
                            <SelectItem key={location} value={location}>
                              {location} ({totalInLocation} {selectedItem.unit_of_measure})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which storage location to issue from (optional - leave blank to use all locations)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Current Stock Display */}
            {selectedItem && (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Stock:</span>
                  <span className="font-medium">
                    {selectedItem.available_quantity} {selectedItem.unit_of_measure}
                  </span>
                </div>
                {selectedItem.storage_location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage Location:</span>
                    <span>{selectedItem.storage_location}</span>
                  </div>
                )}
                {isLoadingLots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading lot information...
                  </div>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Lots:</span>
                    <span>{availableLots.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Issue *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity..."
                      {...field}
                    />
                  </FormControl>
                  {selectedItem && (
                    <FormDescription>
                      Unit: {selectedItem.unit_of_measure}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lot Selection Strategy */}
            <FormField
              control={form.control}
              name="lot_selection_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lot Selection Strategy *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                      <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                      <SelectItem value="FEFO">FEFO (First Expired, First Out)</SelectItem>
                      <SelectItem value="MANUAL">Manual Selection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how the system should select which lots to consume from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manual Lot Selection */}
            {form.watch('lot_selection_strategy') === 'MANUAL' && (
              <FormField
                control={form.control}
                name="manual_lot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Lot *</FormLabel>
                    <Select
                      disabled={filteredLots.length === 0}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lot..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredLots.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.lot_code} - {lot.quantity_remaining} {lot.unit_of_measure}
                            {lot.storage_location && ` [${lot.storage_location}]`}
                            {lot.expiry_date && ` (Expires: ${new Date(lot.expiry_date).toLocaleDateString()})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Manually choose which lot to consume from
                      {form.watch('from_location') && form.watch('from_location') !== '__ALL__' && ` (filtered to ${form.watch('from_location')})`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Planned Consumptions Display */}
            {plannedConsumptions.length > 0 && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Planned Lot Consumptions
                </div>
                <div className="space-y-2">
                  {plannedConsumptions.map((consumption) => (
                    <div
                      key={consumption.lot_id}
                      className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{consumption.lot_code}</div>
                        <div className="text-xs text-muted-foreground">
                          Available: {consumption.available} {selectedItem?.unit_of_measure}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {consumption.quantity} {selectedItem?.unit_of_measure}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Destination */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="destination_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="batch">Batch</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="location">Location/Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Where is this inventory being issued to? (Batch/Task = consumption, Location = transfer)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('destination_type') === 'batch' && (
                <FormField
                  control={form.control}
                  name="batch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter batch ID..." {...field} />
                      </FormControl>
                      <FormDescription>
                        The cultivation batch receiving this inventory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('destination_type') === 'task' && (
                <FormField
                  control={form.control}
                  name="task_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task ID..." {...field} />
                      </FormControl>
                      <FormDescription>
                        The task consuming this inventory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('destination_type') === 'location' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Location Transfer:</strong> This will move inventory to a new storage location without reducing stock quantities. 
                    The item will remain in your active lots.
                  </AlertDescription>
                </Alert>
              )}

              {form.watch('destination_type') === 'location' && (
                <FormField
                  control={form.control}
                  name="to_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Room B, Storage Area 2..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Where is this inventory being transferred to?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {/* The button is also protected by submittingRef in onSubmit */}
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing...
                  </>
                ) : (
                  'Issue Inventory'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

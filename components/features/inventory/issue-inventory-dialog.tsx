'use client'

import { useState, useEffect } from 'react'
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
  getNextLotFIFO,
  getNextLotLIFO,
  getNextLotFEFO,
  consumeFromLot,
} from '@/lib/supabase/queries/inventory-lots-client'
import { createMovement } from '@/lib/supabase/queries/inventory-movements-client'
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
  userId,
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
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null)
  const [plannedConsumptions, setPlannedConsumptions] = useState<LotConsumption[]>([])
  const [error, setError] = useState<string | null>(null)

  const form = useForm<IssueFormData>({
    defaultValues: {
      item_id: preSelectedItem?.id || '',
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
      }
      if (name === 'quantity' || name === 'lot_selection_strategy') {
        // Recalculate planned consumptions when quantity or strategy changes
        if (value.item_id && value.quantity && value.lot_selection_strategy !== 'MANUAL') {
          calculateLotConsumptions(
            value.item_id,
            parseFloat(value.quantity),
            value.lot_selection_strategy as LotSelectionStrategy
          )
        } else {
          setPlannedConsumptions([])
        }
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Filter to items with available quantity > 0
        const itemsWithStock = (data || []).filter((item: InventoryItemWithStock) => (item.current_quantity || 0) > 0)
        setItems(itemsWithStock)
        return
      }

      // PRODUCTION MODE: Load from database
      const { data, error: fetchError } = await getInventoryItems(siteId, {
        organization_id: organizationId,
        is_active: true,
      })

      if (fetchError) throw fetchError
      
      // Filter to items with available_quantity > 0
      const itemsWithStock = (data || []).filter((item: InventoryItemWithStock) => (item.available_quantity || 0) > 0)
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
    strategy: LotSelectionStrategy
  ) => {
    if (strategy === 'MANUAL' || quantity <= 0) {
      setPlannedConsumptions([])
      return
    }

    try {
      const consumptions: LotConsumption[] = []
      let remainingQuantity = quantity

      // Get lots based on strategy
      let lots: InventoryLot[] = []
      if (strategy === 'FIFO') {
        const { data } = await getNextLotFIFO(itemId)
        lots = data as InventoryLot[] || []
      } else if (strategy === 'LIFO') {
        const { data } = await getNextLotLIFO(itemId)
        lots = data as InventoryLot[] || []
      } else if (strategy === 'FEFO') {
        const { data } = await getNextLotFEFO(itemId)
        lots = data as InventoryLot[] || []
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
        setError(`Insufficient stock. Only ${quantity - remainingQuantity} units available.`)
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
        const selectedLot = availableLots.find(lot => lot.id === data.manual_lot_id)
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

      // Process each consumption
      for (const consumption of consumptions) {
        // Update lot quantity
        const { error: lotError } = await consumeFromLot(consumption.lot_id, consumption.quantity)
        if (lotError) throw lotError

        // Create movement record
        const { error: movementError } = await createMovement({
          item_id: selectedItem.id,
          lot_id: consumption.lot_id,
          movement_type: 'consume',
          quantity: consumption.quantity,
          from_location: selectedItem.storage_location || undefined,
          to_location: data.destination_type === 'location' ? data.to_location : undefined,
          batch_id: data.destination_type === 'batch' ? data.batch_id : undefined,
          task_id: data.destination_type === 'task' ? data.task_id : undefined,
          notes: data.notes || undefined,
          performed_by: userId,
        })

        if (movementError) throw movementError
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Issue Inventory
          </DialogTitle>
          <DialogDescription>
            Issue inventory to a batch, task, or location. System will automatically select lots based on your chosen strategy.
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
                      disabled={availableLots.length === 0}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lot..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLots.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.lot_code} - {lot.quantity_remaining} {lot.unit_of_measure}
                            {lot.expiry_date && ` (Expires: ${new Date(lot.expiry_date).toLocaleDateString()})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Manually choose which lot to consume from
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
                      Where is this inventory being issued to?
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

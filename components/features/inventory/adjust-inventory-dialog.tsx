'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { createClient } from '@/lib/supabase/client'
import { getInventoryItems } from '@/lib/supabase/queries/inventory-client'
import { getLotsByItem } from '@/lib/supabase/queries/inventory-lots-client'
import { createMovement } from '@/lib/supabase/queries/inventory-movements-client'
import type { InventoryItemWithStock } from '@/types/inventory'
import type { RoleKey } from '@/lib/rbac/types'
import { isDevModeActive } from '@/lib/dev-mode'

interface InventoryLot {
  id: string
  lot_code: string
  quantity_remaining: number
  unit_of_measure: string
  expiry_date: string | null
  storage_location: string | null
}

type AdjustmentReason = 
  | 'damaged'
  | 'spoiled'
  | 'count_correction'
  | 'found'
  | 'theft'
  | 'other'

interface AdjustInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  siteId: string
  userId: string
  userRole: string
  preSelectedItem?: InventoryItemWithStock
  onSuccess?: () => void
}

interface AdjustFormData {
  item_id: string
  lot_id?: string
  adjustment_type: 'increase' | 'decrease'
  quantity: string
  reason: AdjustmentReason
  notes?: string
}

export function AdjustInventoryDialog({
  open,
  onOpenChange,
  organizationId,
  siteId,
  userId,
  userRole,
  preSelectedItem,
  onSuccess,
}: AdjustInventoryDialogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [isLoadingLots, setIsLoadingLots] = useState(false)
  const [items, setItems] = useState<InventoryItemWithStock[]>([])
  const [availableLots, setAvailableLots] = useState<InventoryLot[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStock | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AdjustFormData>({
    defaultValues: {
      item_id: preSelectedItem?.id || '',
      lot_id: 'none',
      adjustment_type: 'increase',
      quantity: '',
      reason: 'count_correction',
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
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, items])

  // Check permission
  if (!can('inventory:update')) {
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
        setItems(data || [])
        return
      }

      // PRODUCTION MODE: Load from database
      const { data, error: fetchError } = await getInventoryItems(siteId, {
        organization_id: organizationId,
        is_active: true,
      })

      if (fetchError) throw fetchError
      setItems(data || [])
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
      // DEV MODE: Lots not supported yet in dev mode
      if (isDevModeActive()) {
        setAvailableLots([])
        setIsLoadingLots(false)
        return
      }

      // PRODUCTION MODE: Load from database
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

  const getReasonLabel = (reason: AdjustmentReason): string => {
    const labels: Record<AdjustmentReason, string> = {
      damaged: 'Damaged',
      spoiled: 'Spoiled/Expired',
      count_correction: 'Count Correction',
      found: 'Found/Recovered',
      theft: 'Theft/Loss',
      other: 'Other',
    }
    return labels[reason]
  }

  const onSubmit = async (data: AdjustFormData) => {
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

      // Validate notes are required for negative adjustments
      if (data.adjustment_type === 'decrease' && !data.notes?.trim()) {
        throw new Error('Notes are required for decreasing adjustments')
      }

      // Calculate the actual adjustment amount (positive or negative)
      const adjustmentAmount = data.adjustment_type === 'increase' ? quantity : -quantity

      // If a specific lot is selected, adjust that lot
      if (data.lot_id && data.lot_id !== 'none') {
        const selectedLot = availableLots.find(lot => lot.id === data.lot_id)
        if (!selectedLot) {
          throw new Error('Selected lot not found')
        }

        // For decreases, validate sufficient quantity
        if (data.adjustment_type === 'decrease' && selectedLot.quantity_remaining < quantity) {
          throw new Error(`Insufficient quantity in lot. Only ${selectedLot.quantity_remaining} available.`)
        }

        // Calculate new quantity
        const newQuantity = selectedLot.quantity_remaining + adjustmentAmount
        if (newQuantity < 0) {
          throw new Error('Cannot adjust to negative quantity')
        }

        // Update lot quantity directly (quantity_remaining not in UpdateInventoryLot type)
        const supabase = await createClient()
        const { error: updateError } = await supabase
          .from('inventory_lots')
          .update({
            quantity_remaining: newQuantity,
            is_active: newQuantity > 0,
          })
          .eq('id', data.lot_id)

        if (updateError) throw updateError

        // Create movement record
        const { error: movementError } = await createMovement({
          item_id: selectedItem.id,
          lot_id: data.lot_id,
          movement_type: 'adjust',
          quantity: adjustmentAmount,
          from_location: selectedItem.storage_location || undefined,
          notes: `${getReasonLabel(data.reason)}${data.notes ? `: ${data.notes}` : ''}`,
          performed_by: userId,
        })

        if (movementError) throw movementError
      } else {
        // No specific lot - create a general adjustment movement
        // Note: This should ideally update the item's current_quantity in the inventory_items table
        // For now, we'll create a movement record without a lot_id
        const { error: movementError } = await createMovement({
          item_id: selectedItem.id,
          movement_type: 'adjust',
          quantity: adjustmentAmount,
          from_location: selectedItem.storage_location || undefined,
          notes: `${getReasonLabel(data.reason)}${data.notes ? `: ${data.notes}` : ''}`,
          performed_by: userId,
        })

        if (movementError) throw movementError
      }

      // Success
      form.reset()
      setSelectedItem(null)
      setAvailableLots([])
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Error adjusting inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to adjust inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const currentQuantity = form.watch('quantity')
  const adjustmentType = form.watch('adjustment_type')
  const parsedQuantity = parseFloat(currentQuantity || '0')
  const showQuantityPreview = !isNaN(parsedQuantity) && parsedQuantity > 0 && selectedItem

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Adjust Inventory
          </DialogTitle>
          <DialogDescription>
            Make manual adjustments to inventory quantities. Use for cycle counts, damaged goods, or other corrections.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
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
                          {item.name} {item.sku && `(${item.sku})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Stock Display */}
            {selectedItem && (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">
                    {selectedItem.current_quantity} {selectedItem.unit_of_measure}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {selectedItem.available_quantity} {selectedItem.unit_of_measure}
                  </span>
                </div>
                {selectedItem.storage_location && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{selectedItem.storage_location}</span>
                  </div>
                )}
                {isLoadingLots ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading lot information...
                  </div>
                ) : availableLots.length > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Lots:</span>
                    <span>{availableLots.length}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Lot Selection (Optional) */}
            {availableLots.length > 0 && (
              <FormField
                control={form.control}
                name="lot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Lot (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All lots (general adjustment)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">All lots (general adjustment)</SelectItem>
                        {availableLots.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.lot_code} - {lot.quantity_remaining} {lot.unit_of_measure}
                            {lot.expiry_date && ` (Expires: ${new Date(lot.expiry_date).toLocaleDateString()})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Leave blank for a general adjustment, or select a specific lot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Adjustment Type */}
            <FormField
              control={form.control}
              name="adjustment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type *</FormLabel>
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
                      <SelectItem value="increase">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Increase Quantity</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="decrease">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span>Decrease Quantity</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity to adjust..."
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

            {/* Quantity Preview */}
            {showQuantityPreview && (
              <div className={`rounded-md border p-4 ${
                adjustmentType === 'increase' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {adjustmentType === 'increase' ? 'New Quantity:' : 'New Quantity:'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedItem.current_quantity}
                    </span>
                    {adjustmentType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-lg font-semibold">
                      {adjustmentType === 'increase' 
                        ? selectedItem.current_quantity + parsedQuantity
                        : selectedItem.current_quantity - parsedQuantity
                      } {selectedItem.unit_of_measure}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <Badge variant={adjustmentType === 'increase' ? 'default' : 'destructive'}>
                    {adjustmentType === 'increase' ? '+' : '-'}{parsedQuantity} {selectedItem.unit_of_measure}
                  </Badge>
                </div>
              </div>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
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
                      <SelectItem value="count_correction">Count Correction (Cycle Count)</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="spoiled">Spoiled/Expired</SelectItem>
                      <SelectItem value="found">Found/Recovered</SelectItem>
                      <SelectItem value="theft">Theft/Loss</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Why is this adjustment being made?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes {adjustmentType === 'decrease' && '*'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add detailed notes about this adjustment..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {adjustmentType === 'decrease' 
                      ? 'Required for decreasing adjustments. Explain what happened.'
                      : 'Provide additional context for this adjustment'
                    }
                  </FormDescription>
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
                    Adjusting...
                  </>
                ) : (
                  'Adjust Inventory'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

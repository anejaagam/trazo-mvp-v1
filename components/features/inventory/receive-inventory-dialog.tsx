'use client'

/**
 * Receive Inventory Dialog Component
 * 
 * Dialog form for receiving inventory shipments and creating lot records
 * Updates item quantity and creates movement + lot records
 */

import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
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
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Loader2, TrendingUp, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { getInventoryItems } from '@/lib/supabase/queries/inventory-client'
import { createLot } from '@/lib/supabase/queries/inventory-lots-client'
import { createMovement } from '@/lib/supabase/queries/inventory-movements-client'
import { createClient } from '@/lib/supabase/client'
import type { RoleKey } from '@/lib/rbac/types'
import type { InventoryItem } from '@/types/inventory'
import { isDevModeActive } from '@/lib/dev-mode'

// Form data type
interface ReceiveFormData {
  item_id: string
  quantity: string | number
  lot_code: string
  received_date: string
  expiry_date: string
  manufacture_date: string
  supplier_name: string
  supplier_lot_number: string
  compliance_package_uid: string
  storage_location: string
  cost_per_unit: string | number
  certificate_of_analysis_url: string
  notes: string
  create_lot: boolean
}

interface ReceiveInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  siteId: string
  userId: string
  userRole: string
  preSelectedItem?: InventoryItem // Optional: pre-select an item
  onSuccess?: () => void
}

export function ReceiveInventoryDialog({
  open,
  onOpenChange,
  organizationId,
  siteId,
  userId,
  userRole,
  preSelectedItem,
  onSuccess,
}: ReceiveInventoryDialogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const hasPermission = can('inventory:create')

  const form = useForm<ReceiveFormData>({
    defaultValues: {
      item_id: '',
      quantity: '',
      lot_code: '',
      received_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      manufacture_date: '',
      supplier_name: '',
      supplier_lot_number: '',
      compliance_package_uid: '',
      storage_location: '',
      cost_per_unit: '',
      certificate_of_analysis_url: '',
      notes: '',
      create_lot: true,
    },
  })

  // Load items when dialog opens
  useEffect(() => {
    async function loadItems() {
      if (!open) return

      // DEV MODE: Fetch via dev API which uses service role
      if (isDevModeActive()) {
        try {
          const response = await fetch(`/api/dev/inventory?siteId=${siteId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch inventory items')
          }
          const { data } = await response.json()
          setItems(data || [])
        } catch (err) {
          console.error('Error loading items in dev mode:', err)
          setError('Failed to load inventory items')
        }
        return
      }

      // PRODUCTION MODE: Load from database
      try {
        const { data, error: queryError } = await getInventoryItems(siteId, {
          organization_id: organizationId,
          site_id: siteId,
          is_active: true,
        })

        if (queryError) throw queryError
        setItems(data || [])
      } catch (err) {
        console.error('Error loading items:', err)
        setError('Failed to load inventory items')
      }
    }

    if (hasPermission) {
      loadItems()
    }
  }, [open, siteId, organizationId, hasPermission])

  // Pre-select item if provided
  useEffect(() => {
    if (preSelectedItem && open) {
      form.setValue('item_id', preSelectedItem.id)
      setSelectedItem(preSelectedItem)
      
      // Pre-fill storage location from item
      if (preSelectedItem.storage_location) {
        form.setValue('storage_location', preSelectedItem.storage_location)
      }
      // Pre-fill supplier info from item
      if (preSelectedItem.supplier_name) {
        form.setValue('supplier_name', preSelectedItem.supplier_name)
      }
    }
  }, [preSelectedItem, open, form])

  // Update selected item when item_id changes
  const watchItemId = form.watch('item_id')
  useEffect(() => {
    const item = items.find((i) => i.id === watchItemId)
    setSelectedItem(item || null)
    
    // Pre-fill from item data
    if (item) {
      if (item.storage_location && !form.getValues('storage_location')) {
        form.setValue('storage_location', item.storage_location)
      }
      if (item.supplier_name && !form.getValues('supplier_name')) {
        form.setValue('supplier_name', item.supplier_name)
      }
    }
  }, [watchItemId, items, form])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSelectedItem(null)
      setError(null)
    }
  }, [open, form])

  const onSubmit = async (data: ReceiveFormData) => {
    if (!hasPermission) {
      setError('You do not have permission to receive inventory')
      return
    }

    // Validate required fields
    if (!data.item_id) {
      setError('Please select an item')
      return
    }
    if (!data.quantity || Number(data.quantity) <= 0) {
      setError('Quantity must be greater than 0')
      return
    }
    if (data.create_lot && !data.lot_code.trim()) {
      setError('Lot code is required when creating a lot')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const quantity = Number(data.quantity)
      const costPerUnit = data.cost_per_unit ? Number(data.cost_per_unit) : undefined

      // Create lot if requested
      let lotId: string | undefined
      if (data.create_lot) {
        const { data: newLot, error: lotError } = await createLot({
          item_id: data.item_id,
          lot_code: data.lot_code.trim(),
          quantity_received: quantity,
          quantity_remaining: quantity,
          unit_of_measure: selectedItem?.unit_of_measure || 'units',
          received_date: data.received_date,
          expiry_date: data.expiry_date || undefined,
          manufacture_date: data.manufacture_date || undefined,
          supplier_name: data.supplier_name.trim() || undefined,
          compliance_package_uid: data.compliance_package_uid.trim() || undefined,
          storage_location: data.storage_location.trim() || undefined,
          cost_per_unit: costPerUnit,
          certificate_of_analysis_url: data.certificate_of_analysis_url.trim() || undefined,
          created_by: userId,
        })

        if (lotError) throw lotError
        lotId = newLot?.id
      } else {
        // Receiving without lot - update item's storage_location if provided
        if (data.storage_location.trim()) {
          const supabase = createClient()
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ storage_location: data.storage_location.trim() })
            .eq('id', data.item_id)
          
          if (updateError) throw updateError
        }
      }

      // Create movement record
      const { error: movementError } = await createMovement({
        item_id: data.item_id,
        lot_id: lotId,
        movement_type: 'receive',
        quantity,
        unit_cost: costPerUnit,
        from_location: data.supplier_name.trim() || 'Supplier',
        to_location: data.storage_location.trim() || selectedItem?.storage_location || undefined,
        notes: data.notes.trim() || undefined,
        performed_by: userId,
      })

      if (movementError) throw movementError

      // Success
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Error receiving inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to receive inventory')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasPermission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent disableOutsideClose disableEscapeClose>
          <DialogHeader>
            <DialogTitle>Receive Inventory</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to receive inventory.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableOutsideClose disableEscapeClose>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Receive Inventory
            </div>
          </DialogTitle>
          <DialogDescription>
            Record incoming inventory shipment and create lot tracking
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Item Selection */}
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Item *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!preSelectedItem}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{item.name}</span>
                            {item.sku && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {item.sku}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedItem && (
                    <FormDescription>
                      Current quantity: {selectedItem.current_quantity}{' '}
                      {selectedItem.unit_of_measure}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity & Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Received *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    {selectedItem && (
                      <FormDescription>{selectedItem.unit_of_measure}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="received_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Create Lot Checkbox */}
            <FormField
              control={form.control}
              name="create_lot"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Create Lot Record</FormLabel>
                    <FormDescription>
                      Enable lot tracking for this shipment (recommended for expiring items)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Lot Details (conditional) */}
            {form.watch('create_lot') && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Package className="h-4 w-4" />
                  Lot Details
                </div>

                <FormField
                  control={form.control}
                  name="lot_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., LOT-2024-001" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this batch/lot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacture_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacture Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplier_lot_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Lot Number</FormLabel>
                        <FormControl>
                          <Input placeholder="From supplier label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compliance_package_uid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compliance Package UID</FormLabel>
                        <FormControl>
                          <Input placeholder="Metrc/CTLS package ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="certificate_of_analysis_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificate of Analysis URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/coa.pdf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Supplier & Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Supplies Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Warehouse A, Shelf 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cost */}
            <FormField
              control={form.control}
              name="cost_per_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Per Unit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Cost for this specific shipment (for inventory valuation)
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional information about this receipt..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Footer */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Receive Inventory
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

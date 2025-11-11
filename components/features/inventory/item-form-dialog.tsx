'use client'

/**
 * Item Form Dialog Component
 * 
 * Dialog form for creating and editing inventory items
 * Supports all item properties including par levels, costs, and supplier info
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Loader2, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createInventoryItemAction, updateInventoryItemAction } from '@/app/actions/inventory'
import type { RoleKey } from '@/lib/rbac/types'
import type { InventoryItem } from '@/types/inventory'
import { UNITS_OF_MEASURE } from '@/lib/constants/inventory'

// Form data type
interface ItemFormData {
  name: string
  sku: string
  item_type: 'co2_tank' | 'filter' | 'nutrient' | 'chemical' | 'packaging' | 'sanitation' | 'equipment' | 'seeds' | 'clones' | 'growing_medium' | 'other'
  unit_of_measure: string
  category_id: string
  minimum_quantity: string | number
  maximum_quantity: string | number
  reorder_point: string | number
  storage_location: string
  cost_per_unit: string | number
  supplier_name: string
  supplier_contact: string
  notes: string
}

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  siteId: string
  userId: string
  userRole: string
  item?: InventoryItem // If provided, edit mode
  onSuccess?: (item: InventoryItem) => void
}

export function ItemFormDialog({
  open,
  onOpenChange,
  organizationId,
  siteId,
  userId,
  userRole,
  item,
  onSuccess,
}: ItemFormDialogProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const isEditMode = !!item
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check permissions
  const canCreate = can('inventory:create')
  const canUpdate = can('inventory:update')
  const hasPermission = isEditMode ? canUpdate : canCreate

  const form = useForm<ItemFormData>({
    defaultValues: {
      name: '',
      sku: '',
      item_type: 'other',
      unit_of_measure: '',
      category_id: '',
      minimum_quantity: '',
      maximum_quantity: '',
      reorder_point: '',
      storage_location: '',
      cost_per_unit: '',
      supplier_name: '',
      supplier_contact: '',
      notes: '',
    },
  })

  // Load item data when editing
  useEffect(() => {
    if (item && open) {
      form.reset({
        name: item.name,
        sku: item.sku || '',
        item_type: item.item_type as ItemFormData['item_type'],
        unit_of_measure: item.unit_of_measure,
        category_id: item.category_id || '',
        minimum_quantity: item.minimum_quantity?.toString() || '',
        maximum_quantity: item.maximum_quantity?.toString() || '',
        reorder_point: item.reorder_point?.toString() || '',
        storage_location: item.storage_location || '',
        cost_per_unit: item.cost_per_unit?.toString() || '',
        supplier_name: item.supplier_name || '',
        supplier_contact: item.supplier_contact || '',
        notes: item.notes || '',
      })
    } else if (!item && open) {
      form.reset()
    }
  }, [item, open, form])

  const onSubmit = async (data: ItemFormData) => {
    if (!hasPermission) {
      setError('You do not have permission to perform this action')
      return
    }

    // Validate required fields
    if (!data.name.trim()) {
      setError('Name is required')
      return
    }
    if (!data.unit_of_measure.trim()) {
      setError('Unit of measure is required')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Convert empty strings to undefined for optional fields and parse numbers
      const cleanData = {
        name: data.name.trim(),
        sku: data.sku.trim() || undefined,
        item_type: data.item_type,
        unit_of_measure: data.unit_of_measure.trim(),
        category_id: data.category_id.trim() || undefined,
        minimum_quantity: data.minimum_quantity ? Number(data.minimum_quantity) : undefined,
        maximum_quantity: data.maximum_quantity ? Number(data.maximum_quantity) : undefined,
        reorder_point: data.reorder_point ? Number(data.reorder_point) : undefined,
        storage_location: data.storage_location.trim() || undefined,
        cost_per_unit: data.cost_per_unit ? Number(data.cost_per_unit) : undefined,
        supplier_name: data.supplier_name.trim() || undefined,
        supplier_contact: data.supplier_contact.trim() || undefined,
        notes: data.notes.trim() || undefined,
      }

      if (isEditMode && item) {
        // Update existing item
        const { data: updatedItem, error: updateError } = await updateInventoryItemAction(
          item.id,
          cleanData
        )

        if (updateError) {
          throw new Error(updateError.message || 'Failed to update item')
        }
        if (updatedItem) {
          onSuccess?.(updatedItem)
          onOpenChange(false)
        }
      } else {
        // Create new item - use server action to avoid RLS issues
        const { data: newItem, error: createError } = await createInventoryItemAction({
          organization_id: organizationId,
          site_id: siteId,
          created_by: userId,
          ...cleanData,
        })
        
        if (createError) {
          console.error('Create error details:', createError)
          throw new Error(
            createError.message || 
            'Failed to create item'
          )
        }
        if (newItem) {
          onSuccess?.(newItem)
          onOpenChange(false)
        }
      }
    } catch (err) {
      console.error('Error saving item:', err)
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasPermission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Create'} Item</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to {isEditMode ? 'edit' : 'create'} inventory items.
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
              <Package className="h-5 w-5" />
              {isEditMode ? 'Edit Inventory Item' : 'Create Inventory Item'}
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this inventory item'
              : 'Add a new item to your inventory catalog'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="stock">Stock Levels</TabsTrigger>
                <TabsTrigger value="supplier">Supplier</TabsTrigger>
              </TabsList>

              <div className="min-h-[450px]">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                {/* Name - Full Width */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., pH Down Solution" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SKU and Item Type - 2 Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CHEM-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="item_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="co2_tank">CO2 Tank</SelectItem>
                            <SelectItem value="filter">Filter</SelectItem>
                            <SelectItem value="nutrient">Nutrient</SelectItem>
                            <SelectItem value="chemical">Chemical</SelectItem>
                            <SelectItem value="packaging">Packaging</SelectItem>
                            <SelectItem value="sanitation">Sanitation</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="seeds">Seeds</SelectItem>
                            <SelectItem value="clones">Clones</SelectItem>
                            <SelectItem value="growing_medium">Growing Medium</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Unit of Measure and Storage Location - 2 Columns */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit_of_measure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS_OF_MEASURE.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                {/* Notes - Full Width */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional information about this item..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Stock Levels Tab */}
              <TabsContent value="stock" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="minimum_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Quantity (Par Level)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="any" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Alert when stock falls below this level
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reorder_point"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Point</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="any" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Trigger automatic reorder at this quantity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maximum_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="any" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum stock level for this item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Per Unit</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Average cost per unit for inventory valuation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Supplier Tab */}
              <TabsContent value="supplier" className="space-y-4 mt-4">
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
                  name="supplier_contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., sales@abcsupplies.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email, phone, or other contact information
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Note:</strong> Material Safety Data Sheets (MSDS) and Certificates of
                    Analysis (COA) can be uploaded after creating the item.
                  </p>
                </div>
              </TabsContent>
              </div>
            </Tabs>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Footer */}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Item' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

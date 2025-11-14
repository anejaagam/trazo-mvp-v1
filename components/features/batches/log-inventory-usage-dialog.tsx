import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { InventoryItemWithStock } from '@/types/inventory'
import { getInventoryItems } from '@/lib/supabase/queries/inventory-client'
import { getLotsByItem } from '@/lib/supabase/queries/inventory-lots-client'
import { issueInventoryForBatch, type AllocationMethod } from '@/lib/inventory/batch-integrations'

const ALLOWED_ITEM_TYPES = ['seeds', 'clones', 'nutrient', 'chemical', 'growing_medium', 'other']

const logInventorySchema = z.object({
  itemId: z.string().min(1, 'Select an inventory item'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  allocationMethod: z.enum(['FIFO', 'LIFO', 'FEFO']),
  lotId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type LogInventoryFormValues = z.infer<typeof logInventorySchema>

interface LogInventoryUsageDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  batchNumber: string
  organizationId: string
  siteId: string
  onLogged: () => void
}

export function LogInventoryUsageDialog({
  isOpen,
  onOpenChange,
  batchId,
  batchNumber,
  organizationId,
  siteId,
  onLogged,
}: LogInventoryUsageDialogProps) {
  const form = useForm<LogInventoryFormValues>({
    resolver: zodResolver(logInventorySchema),
    defaultValues: {
      allocationMethod: 'FIFO',
      quantity: 0,
      lotId: null,
      reason: `Batch ${batchNumber}`,
    },
  })

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<InventoryItemWithStock[]>([])
  const [lotOptions, setLotOptions] = useState<Array<{ id: string; label: string }>>([])
  const selectedItem = useMemo(
    () => items.find((item) => item.id === form.watch('itemId')),
    [items, form.watch('itemId')]
  )

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    const loadItems = async () => {
      try {
        const { data } = await getInventoryItems(siteId, {})
        if (!isMounted) return
        setItems(
          (data || []).filter((item) => ALLOWED_ITEM_TYPES.includes(item.item_type || 'other'))
        )
      } catch (error) {
        console.error('Failed to load inventory items', error)
        if (isMounted) {
          setItems([])
        }
      }
    }
    loadItems()
    return () => {
      isMounted = false
    }
  }, [isOpen, siteId])

  useEffect(() => {
    const itemId = form.watch('itemId')
    if (!itemId) {
      setLotOptions([])
      form.setValue('lotId', null)
      return
    }

    let isMounted = true
    const loadLots = async () => {
      try {
        const { data } = await getLotsByItem(itemId)
        if (!isMounted) return
        setLotOptions(
          (data || []).map((lot) => ({
            id: lot.id,
            label: `${lot.lot_code} • ${lot.quantity_remaining ?? 0} ${lot.unit_of_measure}`,
          }))
        )
      } catch (error) {
        console.error('Failed to load lot data', error)
        if (isMounted) setLotOptions([])
      }
    }
    loadLots()
    return () => {
      isMounted = false
    }
  }, [form.watch('itemId')])

  const handleSubmit = async (values: LogInventoryFormValues) => {
    if (!selectedItem) {
      form.setError('itemId', { message: 'Select an inventory item' })
      return
    }

    try {
      setLoading(true)
      await issueInventoryForBatch({
        itemId: selectedItem.id,
        organizationId,
        siteId,
        batchId,
        quantity: values.quantity,
        allocationMethod: (values.allocationMethod as AllocationMethod) ?? 'FIFO',
        lotId: values.lotId || undefined,
        reason: values.reason || `Batch ${batchNumber}`,
        notes: values.notes || undefined,
      })
      toast.success('Inventory usage recorded')
      onLogged()
      onOpenChange(false)
      form.reset({
        itemId: '',
        quantity: 0,
        allocationMethod: 'FIFO',
        lotId: null,
        reason: `Batch ${batchNumber}`,
        notes: '',
      })
    } catch (error) {
      console.error('Failed to record inventory usage', error)
      toast.error(error instanceof Error ? error.message : 'Unable to log inventory usage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log inventory usage</DialogTitle>
          <DialogDescription>Attribute seeds, clones, or nutrient usage to this batch.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory item</FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inventory item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex flex-col text-left">
                            <span>{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.item_type} • {item.unit_of_measure}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allocationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation method</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIFO">FIFO (oldest lot first)</SelectItem>
                        <SelectItem value="LIFO">LIFO (latest lot first)</SelectItem>
                        <SelectItem value="FEFO">FEFO (earliest expiry)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {lotOptions.length > 0 && (
              <FormField
                control={form.control}
                name="lotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot (optional)</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Let system auto-select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Auto select</SelectItem>
                        {lotOptions.map((lot) => (
                          <SelectItem key={lot.id} value={lot.id}>
                            {lot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Propagation or recipe step" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log usage
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'
import { recordHarvest } from '@/lib/supabase/queries/batches-client'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getInventoryItems as getInventoryItemsClient } from '@/lib/supabase/queries/inventory-client'
import type { InventoryItemWithStock } from '@/types/inventory'
import { getDefaultLotCode, receiveInventoryForBatch } from '@/lib/inventory/batch-integrations'
import { PerPlantHarvestDialog } from '@/components/features/harvests/per-plant-harvest-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Scale, Sprout } from 'lucide-react'

const harvestSchema = z.object({
  wetWeight: z.coerce.number().positive('Wet weight required'),
  dryWeight: z.coerce.number().optional().nullable(),
  wasteWeight: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  logInventory: z.boolean().optional(),
  inventoryItemId: z.string().optional().nullable(),
  inventoryQuantity: z
    .coerce.number()
    .positive('Quantity must be greater than 0')
    .optional()
    .nullable(),
  inventoryLotCode: z.string().optional().nullable(),
  inventoryStorageLocation: z.string().optional().nullable(),
})

type HarvestFormValues = z.infer<typeof harvestSchema>

interface HarvestWorkflowProps {
  batch: BatchListItem
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userId: string
}

export function HarvestWorkflow({ batch, isOpen, onClose, onComplete, userId }: HarvestWorkflowProps) {
  const [showPerPlantHarvest, setShowPerPlantHarvest] = useState(false)
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema) as Resolver<HarvestFormValues>,
    defaultValues: {
      wetWeight: 0,
      dryWeight: undefined,
      wasteWeight: undefined,
      notes: '',
      logInventory: false,
      inventoryLotCode: getDefaultLotCode(batch.batch_number),
    },
  })

  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithStock[]>([])
  const inventoryItemId = form.watch('inventoryItemId')
  const logInventory = form.watch('logInventory')

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((item) => item.id === inventoryItemId) || null,
    [inventoryItems, inventoryItemId]
  )

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const loadItems = async () => {
      try {
        const { data } = await getInventoryItemsClient(batch.site_id)
        if (isMounted) {
          setInventoryItems(data || [])
        }
      } catch (error) {
        console.error('Failed to load inventory items', error)
        if (isMounted) setInventoryItems([])
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [isOpen, batch.site_id])

  const handleSubmit = async (values: HarvestFormValues) => {
    try {
      const payload = {
        wet_weight_g: values.wetWeight,
        dry_weight_g: values.dryWeight || undefined,
        waste_weight_g: values.wasteWeight || undefined,
        notes: values.notes || undefined,
      }
      const { error } = await recordHarvest(batch.id, payload, userId)
      if (error) throw error

      if (values.logInventory && values.inventoryItemId) {
        const quantityToReceive = values.inventoryQuantity ?? values.dryWeight ?? values.wetWeight
        if (quantityToReceive && quantityToReceive > 0) {
          try {
            await receiveInventoryForBatch({
              itemId: values.inventoryItemId,
              organizationId: batch.organization_id,
              siteId: batch.site_id,
              batchId: batch.id,
              quantity: quantityToReceive,
              unitOfMeasure: selectedInventoryItem?.unit_of_measure || 'g',
              lotCode: values.inventoryLotCode || getDefaultLotCode(batch.batch_number),
              storageLocation: values.inventoryStorageLocation || undefined,
              notes: values.notes || undefined,
            })
          } catch (inventoryError) {
            console.error('Failed to add harvested product to inventory', inventoryError)
            toast.error('Harvest recorded but inventory receive failed')
          }
        }
      }

      toast.success('Harvest recorded')
      onComplete()
      onClose()
      form.reset()
    } catch (error) {
      console.error('Failed to record harvest', error)
      toast.error('Unable to record harvest')
    }
  }

  return (
    <>
      {/* Per-Plant Harvest Dialog */}
      {showPerPlantHarvest && (
        <PerPlantHarvestDialog
          harvestId="" // Will be created after batch-level harvest
          batchId={batch.id}
          organizationId={batch.organization_id}
          batchNumber={batch.batch_number}
          expectedPlantCount={batch.plant_count || 0}
          availablePlantTags={batch.metrc_plant_labels || []}
          onCreated={() => {
            setShowPerPlantHarvest(false)
            onComplete()
          }}
          trigger={<></>}
        />
      )}

      <Dialog open={isOpen && !showPerPlantHarvest} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record harvest for {batch.batch_number}</DialogTitle>
          </DialogHeader>

          {/* Harvest Method Selection */}
          <Alert>
            <Sprout className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium mb-1">Choose Harvest Method</p>
                  <p className="text-sm text-muted-foreground">
                    Record batch-level totals or track individual plants
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Continue with batch-level harvest (current form)
                    }}
                  >
                    <Scale className="h-4 w-4 mr-2" />
                    Batch Total
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setShowPerPlantHarvest(true)
                    }}
                  >
                    <Sprout className="h-4 w-4 mr-2" />
                    Per-Plant Entry
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
              control={form.control}
              name="wetWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wet weight (g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dryWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dry weight (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wasteWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waste (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Add harvest to inventory</p>
                  <p className="text-xs text-muted-foreground">
                    Optional. Creates an inventory lot for finished product.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="logInventory"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {logInventory && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="inventoryItemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select finished-good inventory</FormLabel>
                        <Select value={field.value ?? ''} onValueChange={(value) => field.onChange(value || null)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select inventory item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(inventoryItems || []).map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} • {item.unit_of_measure}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="inventoryQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity to receive</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(event) =>
                                field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                              }
                            />
                          </FormControl>
                          {selectedInventoryItem?.unit_of_measure && (
                            <FormDescription>{selectedInventoryItem.unit_of_measure}</FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="inventoryLotCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lot code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="inventoryStorageLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage location</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Record harvest</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  )
}

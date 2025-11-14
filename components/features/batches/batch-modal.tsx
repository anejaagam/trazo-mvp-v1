'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, type UseFormReturn, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { DomainBatch, DomainType, CannabisBatch, ProduceBatch, BatchStatus } from '@/types/batch'
import {
  createBatch,
  updateBatch,
  assignBatchToPod,
  BatchListItem,
} from '@/lib/supabase/queries/batches-client'
import { getCultivarsClient } from '@/lib/supabase/queries/cultivars-client'
import { getPodsBySiteClient } from '@/lib/supabase/queries/pods-client'
import type { Cultivar } from '@/types/batch'
import type { InventoryItemWithStock } from '@/types/inventory'
import { getInventoryItems as getInventoryItemsClient } from '@/lib/supabase/queries/inventory-client'
import { getLotsByItem } from '@/lib/supabase/queries/inventory-lots-client'
import { issueInventoryForBatch, type AllocationMethod } from '@/lib/inventory/batch-integrations'
import { toast } from 'sonner'

const batchSchema = z.object({
  domainType: z.enum(['cannabis', 'produce']),
  batchNumber: z.string().min(3, 'Batch number is required'),
  cultivarId: z.string().min(1, 'Select a cultivar'),
  plantCount: z.coerce.number().int().min(0, 'Plant count must be positive'),
  stage: z.string().min(1, 'Select a stage'),
  startDate: z.string().min(1, 'Start date is required'),
  expectedHarvestDate: z.string().optional().nullable(),
  podId: z.string().optional().nullable(),
  lightingSchedule: z.string().optional().nullable(),
  thcContent: z.string().optional().nullable(),
  cbdContent: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  ripeness: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sourceType: z.enum(['seed', 'clone', 'tissue_culture']).optional().nullable(),
  sourceInventoryItemId: z.string().optional().nullable(),
  sourceInventoryQuantity: z.coerce.number().positive('Quantity must be greater than 0').optional().nullable(),
  sourceAllocationMethod: z.enum(['FIFO', 'LIFO', 'FEFO']).optional().nullable(),
  sourceLotId: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof batchSchema>

type EditableBatch = BatchListItem | DomainBatch | null | undefined
type PodAssignment = NonNullable<BatchListItem['pod_assignments']>[number]

const isBatchListItem = (batch: EditableBatch): batch is BatchListItem => {
  return Boolean(batch && typeof batch === 'object' && 'pod_assignments' in batch)
}

const getActivePodId = (batch: EditableBatch): string => {
  if (isBatchListItem(batch) && Array.isArray(batch.pod_assignments)) {
    const activeAssignment = batch.pod_assignments.find(
      (assignment): assignment is PodAssignment => Boolean(assignment && !assignment.removed_at)
    )
    return activeAssignment?.pod_id ?? ''
  }
  return ''
}

const asCannabisBatch = (batch: EditableBatch): CannabisBatch | undefined => {
  if (batch && typeof batch === 'object' && batch.domain_type === 'cannabis') {
    return batch as CannabisBatch
  }
  return undefined
}

const asProduceBatch = (batch: EditableBatch): ProduceBatch | undefined => {
  if (batch && typeof batch === 'object' && batch.domain_type === 'produce') {
    return batch as ProduceBatch
  }
  return undefined
}

const NO_POD_VALUE = '__no_pod__'
const NOT_TRACKED_VALUE = '__not_tracked__'
const AUTO_LOT_VALUE = '__auto_lot__'
const NO_GRADE_VALUE = '__no_grade__'

interface BatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (batch?: DomainBatch) => void
  siteId: string
  organizationId: string
  userId: string
  batch?: BatchListItem | DomainBatch | null
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchModal(props: BatchModalProps) {
  const { isOpen, onClose, ...formProps } = props

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{props.batch ? 'Edit batch' : 'Create new batch'}</DialogTitle>
          <DialogDescription>
            Configure domain-specific information, assign pods, and respect jurisdiction limits.
          </DialogDescription>
        </DialogHeader>
        <BatchForm {...formProps} onCancel={onClose} externalClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

interface BatchFormProps extends Omit<BatchModalProps, 'isOpen' | 'onClose'> {
  onCancel?: () => void
  externalClose?: () => void
}

export function BatchForm({
  organizationId,
  siteId,
  userId,
  batch,
  jurisdictionId,
  onSuccess,
  onCancel,
  externalClose,
  plantType,
}: BatchFormProps) {
  const { jurisdiction, requiresMetrc, supports } = useJurisdiction(jurisdictionId)
  const [cultivars, setCultivars] = useState<Cultivar[]>([])
  const [podOptions, setPodOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [propagationItems, setPropagationItems] = useState<InventoryItemWithStock[]>([])
  const [propagationLots, setPropagationLots] = useState<Array<{ id: string; label: string }>>([])

  const cannabisBatch = asCannabisBatch(batch)
  const produceBatch = asProduceBatch(batch)

  const domainDefault = (batch?.domain_type as DomainType) || plantType
  const activePodId = getActivePodId(batch)

  const form = useForm<FormValues>({
    resolver: zodResolver(batchSchema) as Resolver<FormValues>,
    defaultValues: {
      domainType: domainDefault,
      batchNumber: batch?.batch_number ?? '',
      cultivarId: batch?.cultivar_id ?? '',
      plantCount: batch?.plant_count ?? 0,
      stage: batch?.stage ?? 'planning',
      startDate: batch?.start_date ?? new Date().toISOString().slice(0, 10),
      expectedHarvestDate: batch?.expected_harvest_date ?? undefined,
      podId: activePodId,
      lightingSchedule: cannabisBatch?.lighting_schedule ?? '',
      thcContent: cannabisBatch?.thc_content != null ? String(cannabisBatch.thc_content) : '',
      cbdContent: cannabisBatch?.cbd_content != null ? String(cannabisBatch.cbd_content) : '',
      grade: produceBatch?.grade ?? '',
      ripeness: produceBatch?.ripeness ?? '',
      notes: batch?.notes ?? '',
      sourceType: batch?.source_type ?? null,
      sourceInventoryItemId: null,
      sourceInventoryQuantity: undefined,
      sourceAllocationMethod: 'FIFO',
      sourceLotId: null,
    },
  })

  useEffect(() => {
    form.setValue('domainType', plantType, { shouldDirty: false })
  }, [form, plantType])

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [{ data: cultivarData }, { data: podsData }] = await Promise.all([
          getCultivarsClient(organizationId, {
            domain_type: plantType,
            is_active: true,
          }),
          getPodsBySiteClient(siteId),
        ])
        setCultivars(cultivarData || [])
        setPodOptions(
          (podsData || []).map((pod) => ({
            value: pod.id,
            label: pod.room ? `${pod.name} · ${pod.room.name}` : pod.name,
          }))
        )
      } catch (error) {
        console.error('Failed to load cultivars/pods', error)
      }
    }
    loadLookups()
  }, [organizationId, siteId, plantType])

  useEffect(() => {
    const loadPropagationInventory = async () => {
      try {
        const { data } = await getInventoryItemsClient(siteId)
        setPropagationItems(
          (data || []).filter((item) => item.item_type === 'seeds' || item.item_type === 'clones')
        )
      } catch (error) {
        console.error('Failed to load propagation inventory', error)
        setPropagationItems([])
      }
    }
    loadPropagationInventory()
  }, [siteId])

  const selectedPropagationItemId = form.watch('sourceInventoryItemId')
  const sourceTypeValue = form.watch('sourceType')
  const showPropagationFields = sourceTypeValue === 'seed' || sourceTypeValue === 'clone'
  const selectedPropagationItem = useMemo(
    () => propagationItems.find((item) => item.id === selectedPropagationItemId) || null,
    [propagationItems, selectedPropagationItemId]
  )

  useEffect(() => {
    if (!selectedPropagationItemId) {
      setPropagationLots([])
      form.setValue('sourceLotId', null)
      return
    }

    let isMounted = true
    const loadLots = async () => {
      try {
        const { data } = await getLotsByItem(selectedPropagationItemId)
        if (!isMounted) {
          return
        }
        setPropagationLots(
          (data || []).map((lot) => ({
            id: lot.id,
            label: `${lot.lot_code} • ${lot.quantity_remaining ?? 0} ${lot.unit_of_measure}`,
          }))
        )
      } catch (error) {
        console.error('Failed to load lot data', error)
        if (isMounted) setPropagationLots([])
      }
    }

    loadLots()
    return () => {
      isMounted = false
    }
  }, [selectedPropagationItemId, form])

  const minPlantCount = jurisdiction?.rules.batch.min_plant_count ?? 0

  const onSubmit = async (values: FormValues) => {
    if (minPlantCount && values.plantCount < minPlantCount) {
      form.setError('plantCount', {
        message: `Jurisdiction requires at least ${minPlantCount} plants`,
      })
      return
    }

    const domainType = plantType

    const payload: any = {
      organization_id: organizationId,
      site_id: siteId,
      domain_type: domainType,
      batch_number: values.batchNumber.trim(),
      cultivar_id: values.cultivarId,
      stage: values.stage,
      plant_count: values.plantCount,
      status: (batch?.status as BatchStatus) || 'active',
      start_date: values.startDate,
      expected_harvest_date: values.expectedHarvestDate || null,
      notes: values.notes || null,
      source_type: values.sourceType || null,
    }

    if (domainType === 'cannabis') {
      payload.lighting_schedule = values.lightingSchedule || null
      payload.thc_content = values.thcContent ? Number(values.thcContent) : null
      payload.cbd_content = values.cbdContent ? Number(values.cbdContent) : null
    } else {
      payload.grade = values.grade || null
      payload.ripeness = values.ripeness || null
    }

    try {
      setLoading(true)
      let response
      if (batch) {
        response = await updateBatch(batch.id, payload)
      } else {
        payload.created_by = userId
        response = await createBatch(payload)
      }

      if (response.error) throw response.error

      const createdBatch = response.data
      const nextPodId = values.podId ?? null
      const currentPodId = activePodId || null
      const shouldAssignPod = createdBatch && nextPodId && (!batch || nextPodId !== currentPodId)
      if (shouldAssignPod && createdBatch) {
        await assignBatchToPod(createdBatch.id, nextPodId, values.plantCount, userId)
      }

      const isPropagationSource = values.sourceType === 'seed' || values.sourceType === 'clone'
      const shouldLogPropagationUsage =
        !batch &&
        createdBatch &&
        isPropagationSource &&
        values.sourceInventoryItemId &&
        values.sourceInventoryQuantity

      if (shouldLogPropagationUsage && createdBatch) {
        try {
          await issueInventoryForBatch({
            itemId: values.sourceInventoryItemId,
            organizationId,
            siteId,
            batchId: createdBatch.id,
            quantity: values.sourceInventoryQuantity,
            allocationMethod: (values.sourceAllocationMethod as AllocationMethod) ?? 'FIFO',
            lotId: values.sourceLotId || undefined,
            reason: `Propagation for ${values.batchNumber}`,
          })
        } catch (error) {
          console.error('Failed to log initial inventory usage', error)
          toast.error('Batch created but inventory usage logging failed. Please log manually.')
        }
      }

      toast.success(batch ? 'Batch updated' : 'Batch created')
      onSuccess(createdBatch || undefined)
      form.reset()
      externalClose?.()
    } catch (error) {
      console.error('Failed to save batch', error)
      toast.error(error instanceof Error ? error.message : 'Unable to save batch')
    } finally {
      setLoading(false)
    }
  }

  const cultivarOptions = useMemo(
    () =>
      cultivars.map((cultivar) => ({
        value: cultivar.id,
        label: cultivar.name,
      })),
    [cultivars]
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="batchNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. BTH-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cultivarId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cultivar</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cultivar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cultivarOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="plantCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plant / unit count</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                {minPlantCount > 0 && (
                  <FormDescription>Jurisdiction minimum: {minPlantCount}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current stage</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="vegetative" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="podId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign pod</FormLabel>
                <Select
                  value={field.value ?? NO_POD_VALUE}
                  onValueChange={(value) => field.onChange(value === NO_POD_VALUE ? null : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_POD_VALUE}>No pod</SelectItem>
                    {podOptions.map((pod) => (
                      <SelectItem key={pod.value} value={pod.value}>
                        {pod.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">Propagation source</p>
            <p className="text-xs text-muted-foreground">
              Track whether this batch originated from seeds, clones, or tissue culture.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="sourceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source type</FormLabel>
                <Select
                  value={field.value ?? NOT_TRACKED_VALUE}
                  onValueChange={(value) => field.onChange(value === NOT_TRACKED_VALUE ? null : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Not tracked" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NOT_TRACKED_VALUE}>Not tracked</SelectItem>
                    <SelectItem value="seed">Seeds</SelectItem>
                    <SelectItem value="clone">Clones</SelectItem>
                    <SelectItem value="tissue_culture">Tissue culture</SelectItem>
                  </SelectContent>
                </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showPropagationFields && (
              <FormField
                control={form.control}
                name="sourceInventoryItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed / clone inventory</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select inventory item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(propagationItems || []).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} • {item.item_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional. Logs initial inventory consumption for this batch.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {showPropagationFields && selectedPropagationItemId && (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceInventoryQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity used</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    {selectedPropagationItem?.unit_of_measure && (
                      <FormDescription>
                        {selectedPropagationItem.unit_of_measure}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sourceAllocationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation method</FormLabel>
                    <Select value={field.value ?? 'FIFO'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIFO">FIFO</SelectItem>
                        <SelectItem value="LIFO">LIFO</SelectItem>
                        <SelectItem value="FEFO">FEFO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Used when no specific lot is selected.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {showPropagationFields && selectedPropagationItemId && propagationLots.length > 0 && (
            <FormField
              control={form.control}
              name="sourceLotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lot (optional)</FormLabel>
                <Select
                  value={field.value ?? AUTO_LOT_VALUE}
                  onValueChange={(value) => field.onChange(value === AUTO_LOT_VALUE ? null : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-select lot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AUTO_LOT_VALUE}>Auto-select lot</SelectItem>
                    {propagationLots.map((lot) => (
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expectedHarvestDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected harvest</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DomainFieldRenderer plantType={plantType} form={form} requiresMetrc={requiresMetrc} supportsTesting={supports('lab_testing')} />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Observations, compliance notes, etc."
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : batch ? 'Save changes' : 'Create batch'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

interface DomainFieldRendererProps {
  plantType: PlantType
  form: UseFormReturn<FormValues>
  requiresMetrc: boolean
  supportsTesting: boolean
}

function DomainFieldRenderer({ plantType, form, requiresMetrc, supportsTesting }: DomainFieldRendererProps) {
  if (plantType === 'produce') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade</FormLabel>
              <Select
                value={field.value ?? NO_GRADE_VALUE}
                onValueChange={(value) => field.onChange(value === NO_GRADE_VALUE ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_GRADE_VALUE}>No grade</SelectItem>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                  <SelectItem value="C">Grade C</SelectItem>
                  <SelectItem value="culled">Culled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ripeness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ripeness</FormLabel>
              <FormControl>
                <Input
                  placeholder="ripe"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="lightingSchedule"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lighting schedule</FormLabel>
            <FormControl>
              <Input
                placeholder="18/6"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="thcContent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>THC %</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="cbdContent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CBD %</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.1"
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value ? event.target.value : null)}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {requiresMetrc && (
        <FormDescription className="md:col-span-2">
          Jurisdiction requires METRC IDs. Ensure batches are synced after creation.
        </FormDescription>
      )}
      {supportsTesting && (
        <FormDescription className="md:col-span-2">
          Laboratory testing enabled: THC/CBD fields feed the QA workflow.
        </FormDescription>
      )}
    </div>
  )
}

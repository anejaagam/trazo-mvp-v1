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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertTriangle, Info, Layers, Tags } from 'lucide-react'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { useCurrentSite } from '@/hooks/use-site'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import {
  getStatePlantBatchConfig,
  getDefaultTrackingMode,
  stateRequiresImmediateTagging,
  checkTaggingRequirement,
  supportsBatchTagging,
  isOpenLoopState,
} from '@/lib/jurisdiction/plant-batch-config'
import { BatchSourceSelector, type SourceType } from './batch-source-selector'
import { BatchTagSelector } from './available-tag-selector'
import type {
  DomainBatch,
  DomainType,
  CannabisBatch,
  ProduceBatch,
  BatchStatus,
  InsertBatch,
  UpdateBatch,
  BatchStage,
  ProduceGrade,
  ProduceRipeness,
} from '@/types/batch'
import {
  createBatch,
  updateBatch,
  assignBatchToPod,
  removeBatchFromPods,
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
  // Metrc source traceability fields
  metrcSourceType: z.enum(['from_package', 'from_mother', 'no_source']).optional().nullable(),
  sourcePackageTag: z.string().optional().nullable(),
  sourceMotherPlantTag: z.string().optional().nullable(),
  // Batch tag assignment (for states that support batch-level tagging)
  batchTag: z.string().optional().nullable(),
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

const buildDomainSpecificFields = (domain: DomainType, values: FormValues): Partial<UpdateBatch> => {
  if (domain === 'cannabis') {
    return {
      lighting_schedule: values.lightingSchedule || undefined,
      thc_content: values.thcContent ? Number(values.thcContent) : undefined,
      cbd_content: values.cbdContent ? Number(values.cbdContent) : undefined,
    }
  }

  return {
    grade: toProduceGrade(values.grade),
    ripeness: toProduceRipeness(values.ripeness),
  }
}

const NO_POD_VALUE = '__no_pod__'
const NOT_TRACKED_VALUE = '__not_tracked__'
const AUTO_LOT_VALUE = '__auto_lot__'
const NO_GRADE_VALUE = '__no_grade__'

const PRODUCE_GRADES: readonly ProduceGrade[] = ['A', 'B', 'C', 'culled']
const PRODUCE_RIPENESS_LEVELS: readonly ProduceRipeness[] = ['unripe', 'turning', 'ripe', 'overripe']

const toProduceGrade = (value?: string | null): ProduceGrade | undefined => {
  if (!value) return undefined
  return PRODUCE_GRADES.includes(value as ProduceGrade) ? (value as ProduceGrade) : undefined
}

const toProduceRipeness = (value?: string | null): ProduceRipeness | undefined => {
  if (!value) return undefined
  return PRODUCE_RIPENESS_LEVELS.includes(value as ProduceRipeness)
    ? (value as ProduceRipeness)
    : undefined
}

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
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
  const currentSite = useCurrentSite()
  const [cultivars, setCultivars] = useState<Cultivar[]>([])
  const [podOptions, setPodOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [propagationItems, setPropagationItems] = useState<InventoryItemWithStock[]>([])
  const [propagationLots, setPropagationLots] = useState<Array<{ id: string; label: string }>>([])

  // State-specific compliance configuration
  const stateCode = currentSite?.state_province || 'OR'
  const stateConfig = getStatePlantBatchConfig(stateCode)
  const defaultTrackingMode = getDefaultTrackingMode(stateCode)
  const requiresImmediateTagging = stateRequiresImmediateTagging(stateCode)
  const canUseBatchTagging = supportsBatchTagging(stateCode)
  const isClosedLoop = !isOpenLoopState(stateCode)

  const cannabisBatch = asCannabisBatch(batch)
  const produceBatch = asProduceBatch(batch)

  const domainDefault = (batch?.domain_type as DomainType) || plantType
  const activePodId = getActivePodId(batch)
  
  // Calculate total plant count from active assignments
  const totalPlantCount = useMemo(() => {
    if (!isBatchListItem(batch)) return batch?.plant_count ?? 0
    return (batch.pod_assignments || [])
      .filter((assignment) => !assignment.removed_at)
      .reduce((sum, assignment) => sum + (assignment.plant_count || 0), 0) || batch?.plant_count || 0
  }, [batch])

  const form = useForm<FormValues>({
    resolver: zodResolver(batchSchema) as Resolver<FormValues>,
    defaultValues: {
      domainType: domainDefault,
      batchNumber: batch?.batch_number ?? '',
      cultivarId: batch?.cultivar_id ?? '',
      plantCount: totalPlantCount,
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
      // Metrc source traceability defaults
      metrcSourceType: (batch as any)?.source_package_tag ? 'from_package' : (batch as any)?.source_mother_plant_tag ? 'from_mother' : 'no_source',
      sourcePackageTag: (batch as any)?.source_package_tag ?? null,
      sourceMotherPlantTag: (batch as any)?.source_mother_plant_tag ?? null,
      // Batch tag (for states that support batch-level tagging)
      batchTag: null,
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

  const minPlantCount = jurisdiction?.rules?.batch?.min_plant_count ?? 0

  const onSubmit = async (values: FormValues) => {
    if (minPlantCount && values.plantCount < minPlantCount) {
      form.setError('plantCount', {
        message: `Jurisdiction requires at least ${minPlantCount} plants`,
      })
      return
    }

    const domainType = plantType

    try {
      setLoading(true)
      let response
      const domainSpecificFields = buildDomainSpecificFields(domainType, values)
      if (batch) {
          const updatePayload: UpdateBatch = {
            cultivar_id: values.cultivarId,
            stage: values.stage as BatchStage,
            plant_count: values.plantCount,
            expected_harvest_date: values.expectedHarvestDate || undefined,
            status: (batch.status as BatchStatus) || 'active',
            notes: values.notes || undefined,
            source_type: values.sourceType || undefined,
            // Metrc source traceability
            source_package_tag: values.metrcSourceType === 'from_package' ? values.sourcePackageTag || undefined : undefined,
            source_mother_plant_tag: values.metrcSourceType === 'from_mother' ? values.sourceMotherPlantTag || undefined : undefined,
            ...domainSpecificFields,
          }
        response = await updateBatch(batch.id, updatePayload)
      } else {
        // Determine tracking mode based on state rules
        // For states that don't require immediate tagging (OR, CA), start in open_loop
        // For states that require immediate tagging (MD), start in closed_loop
        const trackingMode = domainType === 'cannabis' ? defaultTrackingMode : undefined

        const insertPayload: InsertBatch & Partial<UpdateBatch> = {
          organization_id: organizationId,
          site_id: siteId,
          domain_type: domainType,
          batch_number: values.batchNumber.trim(),
          cultivar_id: values.cultivarId,
          stage: values.stage as BatchStage,
          plant_count: values.plantCount,
          start_date: values.startDate,
          expected_harvest_date: values.expectedHarvestDate || undefined,
          notes: values.notes || undefined,
          source_type: values.sourceType || undefined,
          created_by: userId,
          // Metrc compliance fields
          tracking_mode: trackingMode,
          source_package_tag: values.metrcSourceType === 'from_package' ? values.sourcePackageTag || undefined : undefined,
          source_mother_plant_tag: values.metrcSourceType === 'from_mother' ? values.sourceMotherPlantTag || undefined : undefined,
          // Batch tag (for states that support batch-level tagging like Oregon)
          batch_tag_label: values.batchTag || undefined,
          uses_batch_tagging: !!values.batchTag,
          ...domainSpecificFields,
        }
        response = await createBatch(insertPayload)
      }

      if (response.error) throw response.error

      const createdBatch = response.data
      const nextPodId = values.podId ?? null
      const currentPodId = activePodId || null
      
      // Handle pod assignment changes
      if (createdBatch) {
        const podChanged = batch && nextPodId !== currentPodId
        
        if (!nextPodId && currentPodId && batch) {
          // User selected "No pod" - remove all assignments
          await removeBatchFromPods(createdBatch.id, userId)
        } else if (nextPodId && (!batch || podChanged)) {
          // User selected a pod (new batch or changed pod)
          await assignBatchToPod(createdBatch.id, nextPodId, values.plantCount, userId)
        }
      }

      const isPropagationSource = values.sourceType === 'seed' || values.sourceType === 'clone'

      if (
        !batch &&
        createdBatch &&
        isPropagationSource &&
        typeof values.sourceInventoryItemId === 'string' &&
        typeof values.sourceInventoryQuantity === 'number'
      ) {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-2 flex-1 flex flex-col">
        <div className="flex-1 space-y-6">
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {plantType === 'cannabis' ? (
                      <>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="germination">Germination</SelectItem>
                        <SelectItem value="clone">Clone</SelectItem>
                        <SelectItem value="vegetative">Vegetative</SelectItem>
                        <SelectItem value="flowering">Flowering</SelectItem>
                        <SelectItem value="harvest">Harvest</SelectItem>
                        <SelectItem value="drying">Drying</SelectItem>
                        <SelectItem value="curing">Curing</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="germination">Germination</SelectItem>
                        <SelectItem value="transplant">Transplant</SelectItem>
                        <SelectItem value="growing">Growing</SelectItem>
                        <SelectItem value="harvest_ready">Harvest Ready</SelectItem>
                        <SelectItem value="harvesting">Harvesting</SelectItem>
                        <SelectItem value="washing">Washing</SelectItem>
                        <SelectItem value="grading">Grading</SelectItem>
                        <SelectItem value="packing">Packing</SelectItem>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
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

        {/* Propagation source - only show for non-cannabis or cannabis without Metrc/state config */}
        {/* For cannabis with Metrc, the BatchSourceSelector handles source tracking */}
        {!(plantType === 'cannabis' && (requiresMetrc || stateConfig)) && (
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
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={field.value ?? ''}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          if (nextValue === '') {
                            field.onChange(null)
                            return
                          }
                          field.onChange(Number(nextValue))
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
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
        )}

        {/* Metrc Source Traceability - Cannabis only */}
        {/* Show compliance section if: it's cannabis AND (jurisdiction requires metrc OR site is in a Metrc state) */}
        {plantType === 'cannabis' && (requiresMetrc || stateConfig) && (
          <div className="space-y-4">
            {/* Closed Loop State Warning - shown prominently when source is required */}
            {isClosedLoop && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {stateCode} is a CLOSED LOOP state in Metrc
                    </p>
                    <p className="text-xs">
                      Plant batches cannot be created in Metrc without a source package or mother plant.
                      You must select a source below to push this batch to Metrc.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* State-specific compliance info */}
            <Alert variant={requiresImmediateTagging ? 'destructive' : 'default'}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    {stateCode} Tagging Mode: {defaultTrackingMode === 'open_loop' ? 'Batch' : 'Individual'}
                    {!isClosedLoop && ' (Open Loop State)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {defaultTrackingMode === 'open_loop' ? (
                      <>
                        <Layers className="h-3 w-3 inline mr-1" />
                        Plants tracked by batch count until{' '}
                        {(() => {
                          const triggers = stateConfig?.taggingTriggers || []
                          const heightTrigger = triggers.find(t => t.type === 'height')
                          const hasFlowering = triggers.some(t => t.type === 'flowering')

                          if (heightTrigger && hasFlowering) {
                            return `flowering stage or ${heightTrigger.threshold}" height`
                          } else if (hasFlowering) {
                            return 'flowering stage'
                          } else if (heightTrigger) {
                            return `${heightTrigger.threshold}" height`
                          }
                          return 'individual tagging is required'
                        })()}
                        . Then individual tags required.
                      </>
                    ) : (
                      <>
                        <Tags className="h-3 w-3 inline mr-1" />
                        All plants must be individually tagged from creation.
                      </>
                    )}
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <BatchSourceSelector
              siteId={siteId}
              organizationId={organizationId}
              stateCode={stateCode}
              sourceType={(form.watch('metrcSourceType') as SourceType) || 'no_source'}
              sourcePackageTag={form.watch('sourcePackageTag') || undefined}
              sourceMotherPlantTag={form.watch('sourceMotherPlantTag') || undefined}
              onSourceTypeChange={(type) => {
                form.setValue('metrcSourceType', type)
                if (type !== 'from_package') form.setValue('sourcePackageTag', null)
                if (type !== 'from_mother') form.setValue('sourceMotherPlantTag', null)
              }}
              onSourcePackageChange={(tag) => form.setValue('sourcePackageTag', tag || null)}
              onSourceMotherPlantChange={(tag) => form.setValue('sourceMotherPlantTag', tag || null)}
              disabled={loading}
            />

            {/* Batch Tag Assignment - for states that support batch-level tagging */}
            {canUseBatchTagging && defaultTrackingMode === 'open_loop' && (
              <div className="space-y-2 rounded-md border p-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Batch Tag Assignment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stateCode} allows assigning a single tag to track this batch until individual tagging is required.
                  </p>
                </div>
                <BatchTagSelector
                  siteId={siteId}
                  selectedTag={form.watch('batchTag') || null}
                  onTagChange={(tag) => form.setValue('batchTag', tag)}
                  disabled={loading}
                />
              </div>
            )}
          </div>
        )}

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
        </div>

        <div className="flex justify-end gap-2 flex-shrink-0 pt-4 border-t">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={loading}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            >
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

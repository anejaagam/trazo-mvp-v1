'use client'

import { useMemo, useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle, ArrowRight, Tags } from 'lucide-react'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import { useCurrentSite } from '@/hooks/use-site'
import type { JurisdictionId } from '@/lib/jurisdiction/types'
import type { BatchStage, TrackingMode } from '@/types/batch'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'
import { transitionBatchStage } from '@/lib/supabase/queries/batches-client'
import { toast } from 'sonner'
import { isDevModeActive } from '@/lib/dev-mode'
import {
  mapStageToMetrcPhase,
  requiresMetrcPhaseChange
} from '@/lib/compliance/metrc/validation/phase-transition-rules'
import {
  getStatePlantBatchConfig,
  checkTaggingRequirement,
} from '@/lib/jurisdiction/plant-batch-config'

interface RecipeStage {
  stage_type?: string | null | undefined
}

const schema = z.object({
  newStage: z.string().min(1, 'Select a stage'),
  notes: z.string().optional().nullable(),
})

interface StageTransitionDialogProps {
  batch: BatchDetail
  isOpen: boolean
  onClose: () => void
  onTransition: () => void
  userId: string
  jurisdictionId?: JurisdictionId | null
}

const CANNABIS_STAGES: BatchStage[] = [
  'planning',
  'germination',
  'clone',
  'vegetative',
  'flowering',
  'harvest',
  'drying',
  'curing',
  'packaging',
  'completed',
]

const PRODUCE_STAGES: BatchStage[] = [
  'planning',
  'germination',
  'transplant',
  'growing',
  'harvest_ready',
  'harvesting',
  'washing',
  'grading',
  'packing',
  'storage',
  'completed',
]

export function StageTransitionDialog({
  batch,
  isOpen,
  onClose,
  onTransition,
  userId,
  jurisdictionId,
}: StageTransitionDialogProps) {
  const { getAllowedBatchStages, isStageTransitionAllowed } = useJurisdiction(jurisdictionId)
  const currentSite = useCurrentSite()
  const [loading, setLoading] = useState(false)
  const [isSyncedToMetrc, setIsSyncedToMetrc] = useState(false)
  const [willTriggerMetrcSync, setWillTriggerMetrcSync] = useState(false)
  const [taggingWarning, setTaggingWarning] = useState<{ required: boolean; reason?: string } | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newStage: '', notes: '' },
  })

  // Get state-specific configuration
  const stateCode = currentSite?.state_province || 'OR'
  const stateConfig = getStatePlantBatchConfig(stateCode)
  const batchTrackingMode = (batch as any)?.tracking_mode as TrackingMode | undefined

  // Check if batch is synced to Metrc
  useEffect(() => {
    async function checkMetrcSync() {
      if (batch.domain_type !== 'cannabis') {
        setIsSyncedToMetrc(false)
        return
      }

      try {
        const response = await fetch(`/api/compliance/batch-sync-status?batchId=${batch.id}`)
        if (response.ok) {
          const data = await response.json()
          setIsSyncedToMetrc(data.isSynced || false)
        }
      } catch (error) {
        console.error('Failed to check Metrc sync status:', error)
      }
    }

    if (isOpen) {
      checkMetrcSync()
    }
  }, [batch.id, batch.domain_type, isOpen])

  // Check if selected stage will trigger Metrc phase sync
  useEffect(() => {
    const newStage = form.watch('newStage')
    if (newStage && isSyncedToMetrc && batch.domain_type === 'cannabis') {
      const willSync = requiresMetrcPhaseChange(batch.stage, newStage as BatchStage)
      setWillTriggerMetrcSync(willSync)
    } else {
      setWillTriggerMetrcSync(false)
    }
  }, [form.watch('newStage'), batch.stage, batch.domain_type, isSyncedToMetrc])

  // Check if transitioning to selected stage will require individual tagging
  useEffect(() => {
    const newStage = form.watch('newStage')
    if (!newStage || batch.domain_type !== 'cannabis') {
      setTaggingWarning(null)
      return
    }

    // Only check if batch is currently in open loop (batch-level tracking)
    if (batchTrackingMode !== 'open_loop') {
      setTaggingWarning(null)
      return
    }

    // Check if the new stage triggers tagging requirement
    const requirement = checkTaggingRequirement(stateCode, {
      stage: newStage,
      max_plant_height_inches: (batch as any)?.max_plant_height_inches,
      canopy_area_sq_ft: (batch as any)?.canopy_area_sq_ft,
    })

    if (requirement.requiresTags) {
      setTaggingWarning({
        required: true,
        reason: requirement.reason,
      })
    } else {
      setTaggingWarning(null)
    }
  }, [form.watch('newStage'), batch.domain_type, batchTrackingMode, stateCode])

  const stageOptions = useMemo(() => {
    // If batch has an active recipe, show next stages from the recipe
    if (batch.active_recipe && batch.active_recipe_detail?.stages) {
      const stages: RecipeStage[] = batch.active_recipe_detail.stages
      const currentStageIndex = stages.findIndex(
        (s: RecipeStage) => s.stage_type === batch.stage
      )
      
      // If current stage found in recipe, show subsequent stages
      if (currentStageIndex !== -1 && currentStageIndex < stages.length - 1) {
        return stages
          .slice(currentStageIndex + 1)
          .map((s: RecipeStage) => s.stage_type)
          .filter((stage): stage is string => stage !== null && stage !== undefined)
      }
      
      // If current stage not in recipe or is last stage, show all recipe stages except current
      return stages
        .map((s: RecipeStage) => s.stage_type)
        .filter((stage): stage is string => 
          stage !== null && stage !== undefined && stage !== batch.stage
        )
    }
    
    // No active recipe - use jurisdiction or default stages
    let allowed = getAllowedBatchStages()
    
    // Fallback to default stages if jurisdiction doesn't specify
    if (allowed.length === 0) {
      allowed = batch.domain_type === 'produce' ? PRODUCE_STAGES : CANNABIS_STAGES
    }
    
    // Filter out current stage
    return allowed.filter((stage) => stage !== batch.stage)
  }, [batch.stage, batch.domain_type, batch.active_recipe, batch.active_recipe_detail, getAllowedBatchStages])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    // Bypass compliance check in dev mode
    if (!isDevModeActive() && !isStageTransitionAllowed(batch.stage, values.newStage)) {
      form.setError('newStage', { message: 'Transition not allowed in this jurisdiction' })
      return
    }

    try {
      setLoading(true)
      const { error } = await transitionBatchStage(batch.id, values.newStage as BatchStage, userId, values.notes || undefined)
      if (error) throw error

      toast.success(isDevModeActive() ? 'Stage updated (dev mode - compliance bypassed)' : 'Stage transitioned successfully')

      // Show Metrc sync notification if applicable
      if (willTriggerMetrcSync && isSyncedToMetrc) {
        const currentPhase = mapStageToMetrcPhase(batch.stage)
        const newPhase = mapStageToMetrcPhase(values.newStage as BatchStage)
        toast.info(
          `Growth phase change (${currentPhase} → ${newPhase}) will be synced to Metrc automatically`,
          { duration: 5000 }
        )
      }

      onTransition()
      onClose()
    } catch (error) {
      console.error('Stage transition failed', error)
      toast.error(error instanceof Error ? error.message : 'Unable to update stage')
    } finally {
      setLoading(false)
    }
  }

  const getMetrcPhaseLabel = (stage: string): string | null => {
    const phase = mapStageToMetrcPhase(stage as BatchStage)
    return phase ? `Metrc: ${phase}` : null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transition stage for {batch.batch_number}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Metrc Sync Info Alert */}
            {isSyncedToMetrc && batch.domain_type === 'cannabis' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This batch is synced to Metrc. Stage changes may automatically sync growth phase
                  changes to Metrc.
                </AlertDescription>
              </Alert>
            )}

            {/* Current Stage with Metrc Phase */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Current Stage</div>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <span className="font-medium capitalize">{batch.stage.replace('_', ' ')}</span>
                {isSyncedToMetrc && getMetrcPhaseLabel(batch.stage) && (
                  <span className="text-xs text-muted-foreground">
                    ({getMetrcPhaseLabel(batch.stage)})
                  </span>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="newStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Stage *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stageOptions.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{stage.replace('_', ' ')}</span>
                            {isSyncedToMetrc && getMetrcPhaseLabel(stage) && (
                              <span className="text-xs text-muted-foreground">
                                ({getMetrcPhaseLabel(stage)})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transition Arrow */}
            {form.watch('newStage') && (
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            {/* Metrc Phase Change Warning */}
            {willTriggerMetrcSync && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Metrc Sync:</strong> This stage transition will automatically sync a
                  growth phase change to Metrc (
                  {mapStageToMetrcPhase(batch.stage)} → {mapStageToMetrcPhase(form.watch('newStage') as BatchStage)}).
                  This action is irreversible in Metrc.
                </AlertDescription>
              </Alert>
            )}

            {/* Tagging Requirement Warning */}
            {taggingWarning?.required && (
              <Alert variant="destructive">
                <Tags className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Individual Plant Tags Required</p>
                    <p className="text-sm">
                      {taggingWarning.reason || 'This stage requires individual plant tagging.'}
                    </p>
                    <p className="text-sm">
                      This batch has <strong>{batch.plant_count} plants</strong> that will need
                      individual Metrc plant tags before or upon entering this stage.
                    </p>
                    {stateConfig && (
                      <p className="text-xs text-muted-foreground">
                        {stateCode} compliance: {stateConfig.complianceNotes}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Reason, inspection reference, etc."
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Transition stage'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

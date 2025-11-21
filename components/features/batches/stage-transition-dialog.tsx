'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import type { JurisdictionId } from '@/lib/jurisdiction/types'
import type { BatchStage } from '@/types/batch'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'
import { transitionBatchStage } from '@/lib/supabase/queries/batches-client'
import { toast } from 'sonner'
import { isDevModeActive } from '@/lib/dev-mode'

const schema = z.object({
  newStage: z.string().min(1, 'Select a stage'),
  notes: z.string().optional().nullable(),
})

interface StageTransitionDialogProps {
  batch: BatchListItem
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
  const [loading, setLoading] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { newStage: '', notes: '' },
  })

  const stageOptions = useMemo(() => {
    // If batch has an active recipe, show next stages from the recipe
    if (batch.active_recipe && batch.active_recipe_detail?.stages) {
      const stages = batch.active_recipe_detail.stages
      const currentStageIndex = stages.findIndex(
        (s) => s.stage_type === batch.stage
      )
      
      // If current stage found in recipe, show subsequent stages
      if (currentStageIndex !== -1 && currentStageIndex < stages.length - 1) {
        return stages
          .slice(currentStageIndex + 1)
          .map((s) => s.stage_type)
          .filter((stage): stage is string => stage !== null && stage !== undefined)
      }
      
      // If current stage not in recipe or is last stage, show all recipe stages except current
      return stages
        .map((s) => s.stage_type)
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
      toast.success(isDevModeActive() ? 'Stage updated (dev mode - compliance bypassed)' : 'Stage updated')
      onTransition()
      onClose()
    } catch (error) {
      console.error('Stage transition failed', error)
      toast.error(error instanceof Error ? error.message : 'Unable to update stage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transition stage for {batch.batch_number}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next stage</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stageOptions.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage.replace('_', ' ')}
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

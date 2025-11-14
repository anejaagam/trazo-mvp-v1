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
    const allowed = getAllowedBatchStages()
    if (allowed.length === 0) return allowed
    return allowed.filter((stage) => stage !== batch.stage)
  }, [batch.stage, getAllowedBatchStages])

  const onSubmit = async (values: z.infer<typeof schema>) => {
    if (!isStageTransitionAllowed(batch.stage, values.newStage)) {
      form.setError('newStage', { message: 'Transition not allowed in this jurisdiction' })
      return
    }

    try {
      setLoading(true)
      const { error } = await transitionBatchStage(batch.id, values.newStage as BatchStage, userId, values.notes || undefined)
      if (error) throw error
      toast.success('Stage updated')
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
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
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

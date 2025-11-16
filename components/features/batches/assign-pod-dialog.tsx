'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
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
import { createClient } from '@/lib/supabase/client'
import { assignBatchToPod } from '@/lib/supabase/queries/batches-client'
import { toast } from 'sonner'

interface Pod {
  id: string
  name: string
  max_plant_count: number | null
  status: string | null
  current_plant_count?: number
  room?: {
    id: string
    name: string
  } | null
}

interface AssignPodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  batchNumber: string
  siteId: string
  currentPlantCount: number
  userId: string
  onAssigned: () => void
}

const formSchema = z.object({
  podId: z.string().min(1, 'Please select a pod'),
  plantCount: z.number().min(1, 'Plant count must be at least 1'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AssignPodDialog({
  open,
  onOpenChange,
  batchId,
  batchNumber,
  siteId,
  currentPlantCount,
  userId,
  onAssigned,
}: AssignPodDialogProps) {
  const [pods, setPods] = useState<Pod[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      podId: '',
      plantCount: currentPlantCount > 0 ? currentPlantCount : 1,
      notes: '',
    },
  })

  // Load available pods
  useEffect(() => {
    if (!open) return
    
    const loadPods = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        
        // Get pods for this site with current assignments
        const { data: podsData, error: podsError } = await supabase
          .from('pods')
          .select(`
            id,
            name,
            max_plant_count,
            status,
            room_id,
            room:rooms!inner(id, name, site_id)
          `)
          .eq('room.site_id', siteId)
          .eq('status', 'active')
          .eq('is_active', true)
          .order('name')

        if (podsError) {
          console.error('Supabase error loading pods:', podsError)
          throw podsError
        }

        // Transform the data to match our Pod interface
        const transformedPods = (podsData || []).map((pod: any) => ({
          id: pod.id,
          name: pod.name,
          max_plant_count: pod.max_plant_count,
          status: pod.status,
          room: pod.room && typeof pod.room === 'object' && !Array.isArray(pod.room)
            ? { id: pod.room.id, name: pod.room.name }
            : null,
        }))

        // Get current plant counts for each pod
        const podIds = transformedPods.map((p: Pod) => p.id)
        
        if (podIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('batch_pod_assignments')
            .select('pod_id, plant_count')
            .in('pod_id', podIds)
            .is('removed_at', null)

          // Calculate current plant counts
          const plantCountsByPod = (assignmentsData || []).reduce((acc, assignment) => {
            acc[assignment.pod_id] = (acc[assignment.pod_id] || 0) + (assignment.plant_count || 0)
            return acc
          }, {} as Record<string, number>)

          // Add current counts to pods
          const podsWithCounts = transformedPods.map((pod: Pod) => ({
            ...pod,
            current_plant_count: plantCountsByPod[pod.id] || 0,
          }))

          setPods(podsWithCounts)
        } else {
          setPods(transformedPods)
        }
      } catch (error) {
        console.error('Error loading pods:', error)
        toast.error('Failed to load pods')
      } finally {
        setLoading(false)
      }
    }

    loadPods()
  }, [open, siteId])

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const { error } = await assignBatchToPod(
        batchId,
        values.podId,
        values.plantCount,
        userId,
        values.notes
      )

      if (error) throw error

      toast.success('Pod assigned successfully')
      onAssigned()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error assigning pod:', error)
      toast.error('Failed to assign pod')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPod = pods.find(p => p.id === form.watch('podId'))
  const plantCount = form.watch('plantCount')
  const remainingCapacity = selectedPod 
    ? (selectedPod.max_plant_count || 0) - (selectedPod.current_plant_count || 0)
    : 0
  const hasCapacity = selectedPod ? plantCount <= remainingCapacity : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Pod to Batch</DialogTitle>
          <DialogDescription>
            Add a pod assignment to batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="podId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pod</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pod" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pods.map((pod) => {
                        const available = (pod.max_plant_count || 0) - (pod.current_plant_count || 0)
                        return (
                          <SelectItem key={pod.id} value={pod.id}>
                            {pod.name}
                            {pod.room && ` (${pod.room.name})`}
                            {pod.max_plant_count !== null && 
                              ` - ${available}/${pod.max_plant_count} available`
                            }
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {loading && <FormDescription>Loading pods...</FormDescription>}
                  {!loading && pods.length === 0 && (
                    <FormDescription className="text-destructive">
                      No active pods available at this site
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plantCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plant Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Number of plants"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  {selectedPod && (
                    <FormDescription>
                      {hasCapacity ? (
                        <span className="text-green-600">
                          {remainingCapacity} plants available in this pod
                        </span>
                      ) : (
                        <span className="text-destructive">
                          Not enough capacity! Only {remainingCapacity} plants available
                        </span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this assignment..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loading || pods.length === 0 || !hasCapacity}
              >
                {submitting ? 'Assigning...' : 'Assign Pod'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

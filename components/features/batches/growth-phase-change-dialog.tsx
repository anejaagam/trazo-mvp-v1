'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Sprout, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'

const schema = z.object({
  growthPhase: z.enum(['Vegetative', 'Flowering']),
  plantCount: z.number().min(1, 'At least 1 plant required'),
  startingTag: z.string().min(1, 'Starting plant tag is required'),
  newLocation: z.string().min(1, 'Location is required'),
  newSubLocation: z.string().optional(),
  growthDate: z.string().min(1, 'Growth date is required'),
})

type FormData = z.infer<typeof schema>

interface GrowthPhaseChangeDialogProps {
  batch: BatchDetail
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

type MetrcGrowthPhase = 'Clone' | 'Vegetative' | 'Flowering'

export function GrowthPhaseChangeDialog({
  batch,
  isOpen,
  onClose,
  onSuccess,
  userId,
}: GrowthPhaseChangeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isSyncedToMetrc, setIsSyncedToMetrc] = useState(false)
  const [currentMetrcPhase, setCurrentMetrcPhase] = useState<MetrcGrowthPhase | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      growthPhase: 'Vegetative',
      plantCount: batch.plant_count || 1,
      startingTag: '',
      newLocation: '',
      newSubLocation: '',
      growthDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedPhase = form.watch('growthPhase')
  const plantCount = form.watch('plantCount')

  // Get allowed phase transitions
  const getAllowedPhases = (currentPhase: MetrcGrowthPhase | null): ('Vegetative' | 'Flowering')[] => {
    switch (currentPhase) {
      case 'Clone':
        return ['Vegetative'] // Clone can only go to Vegetative
      case 'Vegetative':
        return ['Flowering'] // Vegetative can only go to Flowering
      case 'Flowering':
        return [] // Flowering is terminal - no further phase changes
      default:
        return ['Vegetative', 'Flowering']
    }
  }

  const allowedPhases = getAllowedPhases(currentMetrcPhase)

  // Check if batch is synced to Metrc and get current phase
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
          setCurrentMetrcPhase(data.metrcGrowthPhase || null)
        }
      } catch (error) {
        console.error('Failed to check Metrc sync status:', error)
      }
    }

    if (isOpen) {
      checkMetrcSync()
    }
  }, [batch.id, batch.domain_type, isOpen])

  // Load available plant tags
  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch(`/api/compliance/metrc/tags/available?siteId=${batch.site_id}&tagType=Plant`)
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to load plant tags:', error)
      }
    }

    if (isOpen && isSyncedToMetrc) {
      loadTags()
    }
  }, [isOpen, isSyncedToMetrc, batch.site_id])

  // Load Metrc locations
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch(`/api/compliance/metrc/locations?siteId=${batch.site_id}`)
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations?.map((l: { Name: string }) => l.Name) || [])
        }
      } catch (error) {
        console.error('Failed to load locations:', error)
      }
    }

    if (isOpen && isSyncedToMetrc) {
      loadLocations()
    }
  }, [isOpen, isSyncedToMetrc, batch.site_id])

  const handleSubmit = async (data: FormData) => {
    if (!isSyncedToMetrc) {
      toast.error('Batch must be synced to Metrc before changing growth phase')
      return
    }

    if (data.plantCount > (batch.plant_count || 0)) {
      toast.error(`Cannot transition ${data.plantCount} plants - batch only has ${batch.plant_count}`)
      return
    }

    if (availableTags.length < data.plantCount) {
      toast.error(`Not enough plant tags available. Need ${data.plantCount}, have ${availableTags.length}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/plant-batches/change-growth-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          plantCount: data.plantCount,
          startingTag: data.startingTag,
          growthPhase: data.growthPhase,
          newLocation: data.newLocation,
          newSubLocation: data.newSubLocation || null,
          growthDate: data.growthDate,
          userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change growth phase')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(
          `Growth phase changed to ${data.growthPhase}. ${data.plantCount} individual plants created with tags starting from ${data.startingTag}`
        )
        onSuccess()
        onClose()
        form.reset()
      } else {
        throw new Error(result.errors?.[0] || 'Failed to change growth phase')
      }
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const isFloweringDisabled = currentMetrcPhase === 'Clone'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Change Growth Phase
          </DialogTitle>
          <DialogDescription>
            Transition plants in batch {batch.batch_number} to a new growth phase.
            This creates individual tracked plants in Metrc.
          </DialogDescription>
        </DialogHeader>

        {!isSyncedToMetrc && batch.domain_type === 'cannabis' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This batch is not synced to Metrc. Push the batch to Metrc before changing growth phases.
            </AlertDescription>
          </Alert>
        )}

        {currentMetrcPhase === 'Flowering' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Plants in Flowering phase cannot transition to another phase. They must be harvested.
            </AlertDescription>
          </Alert>
        )}

        {allowedPhases.length > 0 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {currentMetrcPhase && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Current Metrc Phase: <strong>{currentMetrcPhase}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="growthPhase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Growth Phase</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={allowedPhases.length === 1}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allowedPhases.includes('Vegetative') && (
                          <SelectItem value="Vegetative">
                            Vegetative
                          </SelectItem>
                        )}
                        {allowedPhases.includes('Flowering') && (
                          <SelectItem value="Flowering" disabled={isFloweringDisabled}>
                            Flowering
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedPhase === 'Vegetative'
                        ? 'Plants enter vegetative growth stage'
                        : 'Plants enter flowering/budding stage'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          max={batch.plant_count || 100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Max: {batch.plant_count || 0}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="growthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Growth Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="startingTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Plant Tag</FormLabel>
                    {availableTags.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select starting tag" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTags.slice(0, 50).map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="Enter first plant tag" {...field} />
                      </FormControl>
                    )}
                    <FormDescription>
                      Metrc assigns tags sequentially from this starting tag.
                      {plantCount > 1 && ` ${plantCount} tags will be assigned.`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Location</FormLabel>
                    {locations.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="Enter Metrc location" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newSubLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Row 1, Table A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This operation creates {plantCount} individual tracked plants in Metrc.
                  Each plant will receive a unique tag starting from the selected tag.
                  {currentMetrcPhase === 'Clone' && selectedPhase === 'Vegetative' && (
                    <> This transitions clones to vegetative plants.</>
                  )}
                  {currentMetrcPhase === 'Vegetative' && selectedPhase === 'Flowering' && (
                    <> This transitions vegetative plants to flowering.</>
                  )}
                </AlertDescription>
              </Alert>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isSyncedToMetrc || allowedPhases.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Change Growth Phase'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

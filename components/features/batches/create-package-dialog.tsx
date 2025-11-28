'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Info, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'

const schema = z.object({
  packageType: z.enum(['standard', 'from_mother']),
  packageTag: z.string().min(1, 'Package tag is required'),
  plantCount: z.number().min(1, 'At least 1 plant required'),
  itemName: z.string().min(1, 'Item name is required'),
  location: z.string().optional(),
  sublocation: z.string().optional(),
  packageDate: z.string().min(1, 'Package date is required'),
  isTradeSample: z.boolean(),
  isDonation: z.boolean(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreatePackageDialogProps {
  batch: BatchDetail
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export function CreatePackageDialog({
  batch,
  isOpen,
  onClose,
  onSuccess,
  userId,
}: CreatePackageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isSyncedToMetrc, setIsSyncedToMetrc] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageType: 'standard',
      packageTag: '',
      plantCount: 1,
      itemName: `Clone - ${batch.cultivar?.name || 'Unknown'}`,
      location: '',
      sublocation: '',
      packageDate: new Date().toISOString().split('T')[0],
      isTradeSample: false,
      isDonation: false,
      note: '',
    },
  })

  const packageType = form.watch('packageType')
  const plantCount = form.watch('plantCount')

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

  // Load available package tags
  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch(`/api/compliance/metrc/tags/available?siteId=${batch.site_id}&tagType=Package`)
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data.tags || [])
        }
      } catch (error) {
        console.error('Failed to load package tags:', error)
      }
    }

    if (isOpen && isSyncedToMetrc) {
      loadTags()
    }
  }, [isOpen, isSyncedToMetrc, batch.site_id])

  const handleSubmit = async (data: FormData) => {
    if (!isSyncedToMetrc) {
      toast.error('Batch must be synced to Metrc before creating packages')
      return
    }

    if (data.packageType === 'standard' && data.plantCount > (batch.plant_count || 0)) {
      toast.error(`Cannot package ${data.plantCount} plants - batch only has ${batch.plant_count}`)
      return
    }

    setLoading(true)

    try {
      const endpoint = data.packageType === 'from_mother'
        ? '/api/plant-batches/create-package-mother'
        : '/api/plant-batches/create-package'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          packageTag: data.packageTag,
          plantCount: data.plantCount,
          itemName: data.itemName,
          location: data.location || null,
          sublocation: data.sublocation || null,
          packageDate: data.packageDate,
          isTradeSample: data.isTradeSample,
          isDonation: data.isDonation,
          note: data.note || null,
          userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create package')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(
          data.packageType === 'from_mother'
            ? 'Clone package created (batch count unchanged)'
            : `Clone package created (${data.plantCount} plants removed from batch)`
        )
        onSuccess()
        onClose()
        form.reset()
      } else {
        throw new Error(result.errors?.[0] || 'Failed to create package')
      }
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Clone Package
          </DialogTitle>
          <DialogDescription>
            Create a package of clones from batch {batch.batch_number}
          </DialogDescription>
        </DialogHeader>

        {!isSyncedToMetrc && batch.domain_type === 'cannabis' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This batch is not synced to Metrc. Push the batch to Metrc before creating packages.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">
                        Standard (reduces batch count)
                      </SelectItem>
                      <SelectItem value="from_mother">
                        From Mother (keeps batch count)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {packageType === 'from_mother'
                      ? 'Mother plant cloning - batch count stays the same'
                      : 'Standard packaging - removes plants from batch'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="packageTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Tag</FormLabel>
                  {availableTags.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="Enter Metrc package tag" {...field} />
                    </FormControl>
                  )}
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
                        max={packageType === 'standard' ? batch.plant_count || 100 : 1000}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    {packageType === 'standard' && (
                      <FormDescription>
                        Max: {batch.plant_count || 0} available
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="packageDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Date</FormLabel>
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
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Clone - Blue Dream" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Metrc location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sublocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sublocation (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sublocation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="isTradeSample"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Trade Sample</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDonation"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Donation</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {packageType === 'standard' && plantCount > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will remove {plantCount} plants from batch {batch.batch_number}.
                  Remaining: {(batch.plant_count || 0) - plantCount} plants.
                </AlertDescription>
              </Alert>
            )}

            {packageType === 'from_mother' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This will create a clone package without reducing the mother batch count.
                  Batch {batch.batch_number} will still have {batch.plant_count} plants.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isSyncedToMetrc}>
                {loading ? 'Creating...' : 'Create Package'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

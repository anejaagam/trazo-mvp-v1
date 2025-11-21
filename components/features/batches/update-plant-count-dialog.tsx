'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'
import { toast } from 'sonner'

interface UpdatePlantCountDialogProps {
  batchId: string
  batchNumber: string
  currentCount: number
  isSyncedToMetrc: boolean
  domainType: 'cannabis' | 'produce'
  onUpdate: () => void
  trigger?: React.ReactNode
}

const ADJUSTMENT_REASONS = [
  { value: 'died', label: 'Plants Died' },
  { value: 'destroyed_voluntary', label: 'Voluntary Destruction' },
  { value: 'destroyed_mandatory', label: 'Mandatory State Destruction' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'pest_infestation', label: 'Pest/Disease Infestation' },
  { value: 'unhealthy', label: 'Unhealthy or Infirm Plants' },
  { value: 'data_error', label: 'Data Entry Error' },
  { value: 'other', label: 'Other' },
]

export function UpdatePlantCountDialog({
  batchId,
  batchNumber,
  currentCount,
  isSyncedToMetrc,
  domainType,
  onUpdate,
  trigger,
}: UpdatePlantCountDialogProps) {
  const [open, setOpen] = useState(false)
  const [newCount, setNewCount] = useState(currentCount)
  const [reason, setReason] = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    // Validate that reason is provided for synced batches
    if (isSyncedToMetrc && !reason) {
      toast.error('Adjustment reason is required for synced batches')
      return
    }

    // Validate count is valid
    if (newCount < 0) {
      toast.error('Plant count cannot be negative')
      return
    }

    try {
      setIsUpdating(true)

      const response = await fetch('/api/batches/update-plant-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          newCount,
          reason,
          reasonNote,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Update failed')
      }

      toast.success('Plant count updated successfully')

      if (isSyncedToMetrc && domainType === 'cannabis') {
        toast.info('Adjustment will be synced to Metrc automatically')
      }

      setOpen(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to update plant count:', error)
      toast.error((error as Error).message || 'Failed to update plant count')
    } finally {
      setIsUpdating(false)
    }
  }

  const countDifference = newCount - currentCount

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Update Plant Count</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Plant Count</DialogTitle>
          <DialogDescription>
            Update the plant count for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isSyncedToMetrc && domainType === 'cannabis' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This batch is synced to Metrc. Changes will be automatically pushed to Metrc.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label>Current Count</Label>
            <Input value={currentCount} disabled />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newCount">New Count *</Label>
            <Input
              id="newCount"
              type="number"
              value={newCount}
              onChange={(e) => setNewCount(parseInt(e.target.value) || 0)}
              min={0}
            />
            {countDifference !== 0 && (
              <p className="text-sm text-muted-foreground">
                {countDifference > 0 ? '+' : ''}
                {countDifference} plants
              </p>
            )}
          </div>

          {(isSyncedToMetrc || domainType === 'cannabis') && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="reason">
                  Adjustment Reason {isSyncedToMetrc && '*'}
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADJUSTMENT_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reasonNote">Additional Notes (Optional)</Label>
                <Textarea
                  id="reasonNote"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder="Provide additional details..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Plant Count'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

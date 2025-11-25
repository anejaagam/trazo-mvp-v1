'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import type { JurisdictionId } from '@/lib/jurisdiction/types'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'

interface DeleteBatchDialogProps {
  batch: BatchListItem
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, createWasteLog?: boolean) => Promise<void>
  jurisdictionId?: JurisdictionId | null
}

export function DeleteBatchDialog({
  batch,
  isOpen,
  onClose,
  onConfirm,
  jurisdictionId,
}: DeleteBatchDialogProps) {
  const [reason, setReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [createWasteLog, setCreateWasteLog] = useState(false)
  const jurisdictionState = useJurisdiction(jurisdictionId)

  const hasActivePlants = (batch.plant_count || 0) > 0 || 
    (batch.pod_assignments || []).some(assignment => 
      !assignment.removed_at && (assignment.plant_count || 0) > 0
    )

  const requiresMetrcReporting = jurisdictionState.requiresMetrc && hasActivePlants
  const isQuarantined = batch.status === 'quarantined'

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for deletion')
      return
    }

    if (requiresMetrcReporting && !reason.toLowerCase().includes('waste')) {
      const confirmed = window.confirm(
        'This batch has active plants and requires METRC waste reporting. ' +
        'Have you completed the required waste manifest? Click OK to proceed.'
      )
      if (!confirmed) return
    }

    try {
      setIsDeleting(true)
      await onConfirm(reason.trim(), createWasteLog)
      onClose()
    } catch (error) {
      console.error('Error deleting batch:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Batch
          </DialogTitle>
          <DialogDescription>
            This will permanently mark batch <span className="font-semibold">{batch.batch_number}</span> as destroyed.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Compliance Warnings */}
          {requiresMetrcReporting && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>METRC Compliance Required</AlertTitle>
              <AlertDescription>
                This batch has {hasActivePlants ? 'active plants' : 'inventory'} and requires waste reporting
                in {jurisdictionState.jurisdiction?.name}. You must complete a waste manifest in METRC
                before deleting this batch.
              </AlertDescription>
            </Alert>
          )}

          {isQuarantined && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Quarantined Batch</AlertTitle>
              <AlertDescription>
                This batch is currently quarantined. Ensure all QA procedures are complete before deletion.
              </AlertDescription>
            </Alert>
          )}

          {batch.active_recipe && (
            <Alert>
              <AlertDescription>
                This batch has an active recipe: <span className="font-semibold">{batch.active_recipe.name}</span>.
                The recipe will be unlinked.
              </AlertDescription>
            </Alert>
          )}

          {/* Batch Details Summary */}
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batch Number:</span>
              <span className="font-medium">{batch.batch_number}</span>
            </div>
            {batch.cultivar?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cultivar:</span>
                <span className="font-medium">{batch.cultivar.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stage:</span>
              <span className="font-medium capitalize">{batch.stage.replace('_', ' ')}</span>
            </div>
            {hasActivePlants && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plant Count:</span>
                <span className="font-medium">{batch.plant_count || 0} plants</span>
              </div>
            )}
          </div>

          {/* Waste Log Checkbox */}
          {hasActivePlants && (
            <div className="flex items-start space-x-3 rounded-md border p-4">
              <Checkbox
                id="create-waste-log"
                checked={createWasteLog}
                onCheckedChange={(checked) => setCreateWasteLog(checked === true)}
              />
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor="create-waste-log"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Create waste disposal record
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically log this batch destruction ({batch.plant_count || 0} plants) in waste management for compliance tracking.
                  {requiresMetrcReporting && ' This will help with your METRC reporting requirements.'}
                </p>
              </div>
            </div>
          )}

          {/* Reason Field */}
          <div className="space-y-2">
            <Label htmlFor="deletion-reason" className="text-sm font-medium">
              Reason for Deletion <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deletion-reason"
              placeholder={
                requiresMetrcReporting
                  ? 'Example: Completed waste manifest #W123456 in METRC. Plants destroyed due to pest infestation.'
                  : 'Provide detailed reason for deletion (e.g., test batch, data entry error, crop failure, etc.)'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged for audit and compliance purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !reason.trim()}
          >
            {isDeleting ? 'Deleting...' : 'Delete Batch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

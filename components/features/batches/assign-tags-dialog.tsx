'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Info, Tag, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface AssignTagsDialogProps {
  batchId: string
  batchNumber: string
  plantCount: number
  currentTags: string[]
  onAssigned: () => void
  trigger?: React.ReactNode
}

export function AssignTagsDialog({
  batchId,
  batchNumber,
  plantCount,
  currentTags,
  onAssigned,
  trigger,
}: AssignTagsDialogProps) {
  const [open, setOpen] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const parseTags = (input: string): string[] => {
    return input
      .split(/[\n,]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  const tags = parseTags(tagsInput)
  const newTags = tags.filter((tag) => !currentTags.includes(tag))
  const duplicateTags = tags.filter((tag) => currentTags.includes(tag))

  const handleAssign = async () => {
    if (newTags.length === 0) {
      toast.error('No new tags to assign')
      return
    }

    try {
      setIsAssigning(true)

      const response = await fetch('/api/batches/assign-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          tags: newTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign tags')
      }

      const result = await response.json()

      toast.success(`${result.tagsAssigned} tags assigned successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      setTagsInput('')
      onAssigned()
    } catch (error) {
      console.error('Error assigning tags:', error)
      toast.error((error as Error).message || 'Failed to assign tags')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Assign Tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Metrc Plant Tags</DialogTitle>
          <DialogDescription>
            Assign individual Metrc tags to plants in batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Batch Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Plant Count</div>
              <div className="text-lg font-semibold">{plantCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tags Assigned</div>
              <div className="text-lg font-semibold">
                {currentTags.length} / {plantCount}
              </div>
            </div>
          </div>

          {/* Current Tags */}
          {currentTags.length > 0 && (
            <div>
              <Label className="mb-2">Current Tags ({currentTags.length})</Label>
              <div className="max-h-20 overflow-y-auto border rounded-md p-2">
                <div className="flex flex-wrap gap-1">
                  {currentTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tag Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              New Tags * (one per line or comma-separated)
            </Label>
            <Textarea
              id="tags"
              placeholder="1A4FF01000000220000001&#10;1A4FF01000000220000002&#10;1A4FF01000000220000003"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <div className="text-sm text-muted-foreground">
              {tags.length} tags parsed
              {newTags.length !== tags.length && (
                <span className="text-orange-500 ml-2">
                  ({duplicateTags.length} already assigned)
                </span>
              )}
            </div>
          </div>

          {/* Tag Format Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Metrc Tag Format:</strong> 1A[StateCode][License][Sequence]
              <br />
              Example: 1A4FF01000000220000001 (24 characters)
            </AlertDescription>
          </Alert>

          {/* Count Mismatch Warning */}
          {newTags.length > 0 && newTags.length + currentTags.length !== plantCount && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> Total tags ({newTags.length + currentTags.length}) will not match plant count ({plantCount}).
                Ensure all plants receive tags for full Metrc tracking.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {duplicateTags.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Notice:</strong> {duplicateTags.length} tags are already assigned and will be skipped.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || newTags.length === 0}
          >
            {isAssigning ? 'Assigning...' : `Assign ${newTags.length} Tags`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

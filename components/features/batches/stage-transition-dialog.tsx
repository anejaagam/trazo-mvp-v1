'use client'

/**
 * Stage Transition Dialog Component
 * Dialog for transitioning batches between lifecycle stages
 * Supports both cannabis and produce workflows
 */

import { useState } from 'react'
import { ArrowRight, CheckCircle } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BatchStage, CannabisStage, ProduceStage, DomainType } from '@/types/batch'

interface StageTransitionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string
  batchName: string
  currentStage: BatchStage
  domainType: DomainType
  onTransition: (batchId: string, newStage: BatchStage, notes: string) => Promise<void>
}

const cannabisStages: CannabisStage[] = [
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

const produceStages: ProduceStage[] = [
  'planning',
  'seeding',
  'germination',
  'seedling',
  'transplant',
  'growing',
  'harvest_ready',
  'harvesting',
  'washing',
  'grading',
  'packing',
  'storage',
  'shipped',
  'completed',
]

const stageDescriptions: Record<string, string> = {
  // Cannabis
  planning: 'Initial planning and preparation',
  germination: 'Seed germination phase',
  clone: 'Cloning and propagation',
  vegetative: 'Vegetative growth phase',
  flowering: 'Flowering and bud development',
  harvest: 'Harvesting phase',
  drying: 'Drying the harvested material',
  curing: 'Curing for quality improvement',
  packaging: 'Final packaging and labeling',
  completed: 'Batch is complete',
  
  // Produce
  seeding: 'Seed sowing phase',
  seedling: 'Early seedling development',
  transplant: 'Transplanting to final location',
  growing: 'Main growing phase',
  harvest_ready: 'Ready for harvest',
  harvesting: 'Active harvesting',
  washing: 'Cleaning and washing',
  grading: 'Quality grading and sorting',
  packing: 'Packing for distribution',
  storage: 'Storage and holding',
  shipped: 'Shipped to destination',
}

export function StageTransitionDialog({
  open,
  onOpenChange,
  batchId,
  batchName,
  currentStage,
  domainType,
  onTransition,
}: StageTransitionDialogProps) {
  const [selectedStage, setSelectedStage] = useState<BatchStage>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableStages = domainType === 'cannabis' ? cannabisStages : produceStages

  const handleSubmit = async () => {
    if (!selectedStage) {
      setError('Please select a new stage')
      return
    }

    if (selectedStage === currentStage) {
      setError('Please select a different stage than the current one')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await onTransition(batchId, selectedStage, notes)
      
      // Reset form
      setSelectedStage('')
      setNotes('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition stage')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedStage('')
    setNotes('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transition Batch Stage</DialogTitle>
          <DialogDescription>
            Change the lifecycle stage for batch {batchName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stage */}
          <div>
            <Label>Current Stage</Label>
            <div className="flex items-center gap-2 mt-2 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium capitalize">{currentStage.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  {stageDescriptions[currentStage] || 'No description available'}
                </p>
              </div>
            </div>
          </div>

          {/* New Stage Selection */}
          <div>
            <Label htmlFor="new-stage">New Stage</Label>
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger id="new-stage" className="mt-2">
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                {availableStages
                  .filter((stage) => stage !== currentStage)
                  .map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      <div>
                        <p className="font-medium capitalize">{stage.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {stageDescriptions[stage]}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transition Preview */}
          {selectedStage && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{currentStage.replace('_', ' ')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{selectedStage.replace('_', ' ')}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="transition-notes">Notes (Optional)</Label>
            <Textarea
              id="transition-notes"
              placeholder="Add any notes about this stage transition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warning for critical stages */}
          {(selectedStage === 'completed' || selectedStage === 'destroyed') && (
            <Alert>
              <AlertDescription>
                Warning: This is a terminal stage. The batch cannot be transitioned further after
                this.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedStage}>
            {isSubmitting ? 'Transitioning...' : 'Confirm Transition'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

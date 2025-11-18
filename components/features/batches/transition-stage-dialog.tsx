'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { Info, AlertTriangle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { BatchStage, CannabisStage, ProduceStage } from '@/types/batch'

interface TransitionStageDialogProps {
  batchId: string
  batchNumber: string
  currentStage: BatchStage
  domainType: 'cannabis' | 'produce'
  isSyncedToMetrc: boolean
  onTransition: () => void
  trigger?: React.ReactNode
}

// Stage definitions with allowed transitions
const CANNABIS_STAGES: Record<
  CannabisStage,
  { label: string; nextStages: CannabisStage[] }
> = {
  planning: { label: 'Planning', nextStages: ['germination', 'clone'] },
  germination: { label: 'Germination', nextStages: ['vegetative'] },
  clone: { label: 'Clone', nextStages: ['vegetative'] },
  vegetative: { label: 'Vegetative', nextStages: ['flowering'] },
  flowering: { label: 'Flowering', nextStages: ['harvest'] },
  harvest: { label: 'Harvest', nextStages: ['drying'] },
  drying: { label: 'Drying', nextStages: ['curing', 'packaging'] },
  curing: { label: 'Curing', nextStages: ['packaging'] },
  packaging: { label: 'Packaging', nextStages: ['completed'] },
  completed: { label: 'Completed', nextStages: [] },
  destroyed: { label: 'Destroyed', nextStages: [] },
}

const PRODUCE_STAGES: Record<
  ProduceStage,
  { label: string; nextStages: ProduceStage[] }
> = {
  planning: { label: 'Planning', nextStages: ['seeding', 'germination'] },
  seeding: { label: 'Seeding', nextStages: ['germination'] },
  germination: { label: 'Germination', nextStages: ['seedling'] },
  seedling: { label: 'Seedling', nextStages: ['transplant', 'growing'] },
  transplant: { label: 'Transplant', nextStages: ['growing'] },
  growing: { label: 'Growing', nextStages: ['harvest_ready'] },
  harvest_ready: { label: 'Harvest Ready', nextStages: ['harvesting'] },
  harvesting: { label: 'Harvesting', nextStages: ['washing', 'grading'] },
  washing: { label: 'Washing', nextStages: ['grading'] },
  grading: { label: 'Grading', nextStages: ['packing'] },
  packing: { label: 'Packing', nextStages: ['storage', 'shipped'] },
  storage: { label: 'Storage', nextStages: ['shipped'] },
  shipped: { label: 'Shipped', nextStages: ['completed'] },
  completed: { label: 'Completed', nextStages: [] },
  destroyed: { label: 'Destroyed', nextStages: [] },
}

// Stages that trigger Metrc phase changes
const METRC_PHASE_CHANGE_STAGES: Record<string, string> = {
  germination: 'Clone',
  clone: 'Clone',
  vegetative: 'Vegetative',
  flowering: 'Flowering',
}

export function TransitionStageDialog({
  batchId,
  batchNumber,
  currentStage,
  domainType,
  isSyncedToMetrc,
  onTransition,
  trigger,
}: TransitionStageDialogProps) {
  const [open, setOpen] = useState(false)
  const [newStage, setNewStage] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [willTriggerMetrcSync, setWillTriggerMetrcSync] = useState(false)

  const stages = domainType === 'cannabis' ? CANNABIS_STAGES : PRODUCE_STAGES
  const currentStageInfo = stages[currentStage as keyof typeof stages]
  const allowedNextStages = currentStageInfo?.nextStages || []

  // Check if selected stage will trigger Metrc sync
  useEffect(() => {
    if (newStage && isSyncedToMetrc && domainType === 'cannabis') {
      const currentMetrcPhase = METRC_PHASE_CHANGE_STAGES[currentStage]
      const newMetrcPhase = METRC_PHASE_CHANGE_STAGES[newStage]

      // Triggers sync if both stages map to Metrc phases and they're different
      const willSync =
        !!currentMetrcPhase &&
        !!newMetrcPhase &&
        currentMetrcPhase !== newMetrcPhase

      setWillTriggerMetrcSync(willSync)
    } else {
      setWillTriggerMetrcSync(false)
    }
  }, [newStage, currentStage, isSyncedToMetrc, domainType])

  const handleTransition = async () => {
    if (!newStage) {
      toast.error('Please select a new stage')
      return
    }

    // Validate transition is allowed
    if (!allowedNextStages.includes(newStage as any)) {
      toast.error('Invalid stage transition')
      return
    }

    try {
      setIsTransitioning(true)

      const response = await fetch('/api/batches/transition-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          newStage,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Transition failed')
      }

      const result = await response.json()

      toast.success('Stage transitioned successfully')

      if (result.metrcSyncTriggered && domainType === 'cannabis') {
        toast.info('Growth phase change will be synced to Metrc automatically', {
          duration: 5000,
        })
      }

      setOpen(false)
      setNewStage('')
      setNotes('')
      onTransition()
    } catch (error) {
      console.error('Error transitioning stage:', error)
      toast.error((error as Error).message || 'Failed to transition stage')
    } finally {
      setIsTransitioning(false)
    }
  }

  const getMetrcPhaseChangeInfo = (stage: string) => {
    return METRC_PHASE_CHANGE_STAGES[stage]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Transition Stage</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transition Batch Stage</DialogTitle>
          <DialogDescription>
            Change the growth stage for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Stage */}
          <div className="space-y-2">
            <Label>Current Stage</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <span className="font-medium">
                {currentStageInfo?.label || currentStage}
              </span>
              {isSyncedToMetrc && getMetrcPhaseChangeInfo(currentStage) && (
                <span className="text-xs text-muted-foreground">
                  (Metrc: {getMetrcPhaseChangeInfo(currentStage)})
                </span>
              )}
            </div>
          </div>

          {/* New Stage Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-stage">New Stage *</Label>
            <Select value={newStage} onValueChange={setNewStage}>
              <SelectTrigger id="new-stage">
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                {allowedNextStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                      <span>{stages[stage as keyof typeof stages]?.label || stage}</span>
                      {isSyncedToMetrc && getMetrcPhaseChangeInfo(stage) && (
                        <span className="text-xs text-muted-foreground">
                          (Metrc: {getMetrcPhaseChangeInfo(stage)})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transition Arrow */}
          {newStage && (
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {/* Metrc Sync Warning */}
          {willTriggerMetrcSync && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Metrc Sync:</strong> This stage transition will automatically sync a
                growth phase change to Metrc (
                {getMetrcPhaseChangeInfo(currentStage)} → {getMetrcPhaseChangeInfo(newStage)}).
                This action is irreversible in Metrc.
              </AlertDescription>
            </Alert>
          )}

          {/* No next stages warning */}
          {allowedNextStages.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This batch is in a terminal stage. No further stage transitions are available.
              </AlertDescription>
            </Alert>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Transition Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this stage transition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Stage transitions are logged in the batch history and may trigger automated tasks
              and recipe progression.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isTransitioning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransition}
            disabled={!newStage || isTransitioning || allowedNextStages.length === 0}
          >
            {isTransitioning ? 'Transitioning...' : 'Transition Stage'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

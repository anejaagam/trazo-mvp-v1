'use client'

/**
 * Destroy Plant Batch Dialog Component
 *
 * Dialog for recording plant batch destruction with:
 * - 50:50 rendering method compliance
 * - Real-time ratio calculator
 * - Plant count validation
 * - Witness recording
 * - Photo evidence (placeholder)
 * - Metrc sync integration
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertTriangle, Camera, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface DestroyPlantBatchDialogProps {
  batchId: string
  batchNumber: string
  currentPlantCount: number
  plantTags?: string[]
  onDestroyed: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DestroyPlantBatchDialog({
  batchId,
  batchNumber,
  currentPlantCount,
  plantTags = [],
  onDestroyed,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: DestroyPlantBatchDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen! : uncontrolledOpen

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }
  const [plantsDestroyed, setPlantsDestroyed] = useState('')
  const [wasteWeight, setWasteWeight] = useState('')
  const [wasteUnit, setWasteUnit] = useState('Kilograms')
  const [wasteReason, setWasteReason] = useState('')
  const [renderingMethod, setRenderingMethod] = useState('50_50_sawdust')
  const [inertWeight, setInertWeight] = useState('')
  const [destructionDate, setDestructionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [isDestroying, setIsDestroying] = useState(false)

  const handleDestroy = async () => {
    const plantsCount = Number(plantsDestroyed)
    const weight = Number(wasteWeight)

    if (!plantsCount || plantsCount <= 0 || plantsCount > currentPlantCount) {
      toast.error('Invalid number of plants to destroy')
      return
    }

    if (!weight || weight <= 0) {
      toast.error('Please enter a valid waste weight')
      return
    }

    if (!wasteReason) {
      toast.error('Please select a waste reason')
      return
    }

    // Validate 50:50 mix
    if (renderingMethod.startsWith('50_50')) {
      const inertWeightNum = Number(inertWeight)
      if (!inertWeightNum || inertWeightNum < weight * 0.9) {
        toast.error('50:50 rendering requires equal or greater inert material weight')
        return
      }
    }

    try {
      setIsDestroying(true)

      const response = await fetch('/api/waste/destroy-plant-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          plantsDestroyed: plantsCount,
          plantTags: plantTags.slice(0, plantsCount), // Use available tags
          wasteWeight: weight,
          wasteUnit,
          wasteReason,
          renderingMethod,
          inertMaterialWeight: renderingMethod.startsWith('50_50')
            ? Number(inertWeight)
            : undefined,
          inertMaterialUnit: wasteUnit,
          destructionDate,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to destroy plant batch')
      }

      const result = await response.json()

      toast.success(`Waste log ${result.wasteNumber} created successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      handleOpenChange(false)
      onDestroyed()
    } catch (error) {
      console.error('Error destroying plant batch:', error)
      toast.error((error as Error).message || 'Failed to destroy plant batch')
    } finally {
      setIsDestroying(false)
    }
  }

  // Calculate ratio for display
  const ratio =
    wasteWeight && inertWeight
      ? (Number(inertWeight) / Number(wasteWeight)).toFixed(2)
      : '0.00'
  const isRatioCompliant =
    renderingMethod.startsWith('50_50') && Number(ratio) >= 0.9 && Number(ratio) <= 1.1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {(trigger !== null) && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Destroy Plants
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Destroy Plant Batch Waste</DialogTitle>
          <DialogDescription>
            Record waste destruction for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Warning:</strong> This action will reduce the batch plant count and
              cannot be undone. Ensure proper 50:50 rendering for compliance.
            </AlertDescription>
          </Alert>

          {/* Batch Info */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Batch:</strong> {batchNumber}
              <br />
              <strong>Current Plant Count:</strong> {currentPlantCount}
              <br />
              <strong>Plant Tags Available:</strong> {plantTags.length}
            </AlertDescription>
          </Alert>

          {/* Plants Destroyed */}
          <div className="space-y-2">
            <Label htmlFor="plantsDestroyed">Plants Destroyed *</Label>
            <Input
              id="plantsDestroyed"
              type="number"
              min="1"
              max={currentPlantCount}
              value={plantsDestroyed}
              onChange={(e) => setPlantsDestroyed(e.target.value)}
              placeholder="Number of plants"
            />
          </div>

          {/* Waste Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wasteWeight">Waste Weight *</Label>
              <Input
                id="wasteWeight"
                type="number"
                step="0.01"
                min="0"
                value={wasteWeight}
                onChange={(e) => setWasteWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wasteUnit">Unit *</Label>
              <Select value={wasteUnit} onValueChange={setWasteUnit}>
                <SelectTrigger id="wasteUnit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grams">Grams</SelectItem>
                  <SelectItem value="Kilograms">Kilograms</SelectItem>
                  <SelectItem value="Ounces">Ounces</SelectItem>
                  <SelectItem value="Pounds">Pounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Waste Reason */}
          <div className="space-y-2">
            <Label htmlFor="wasteReason">Waste Reason *</Label>
            <Select value={wasteReason} onValueChange={setWasteReason}>
              <SelectTrigger id="wasteReason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male Plants">Male Plants</SelectItem>
                <SelectItem value="Unhealthy or contaminated plants">
                  Pests/Disease
                </SelectItem>
                <SelectItem value="Quality control failure">Quality Issues</SelectItem>
                <SelectItem value="Regulatory requirement">Facility Closure</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rendering Method */}
          <div className="space-y-2">
            <Label htmlFor="renderingMethod">Rendering Method * (50:50 required)</Label>
            <Select value={renderingMethod} onValueChange={setRenderingMethod}>
              <SelectTrigger id="renderingMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50_50_sawdust">50:50 Mix with Sawdust</SelectItem>
                <SelectItem value="50_50_kitty_litter">
                  50:50 Mix with Kitty Litter
                </SelectItem>
                <SelectItem value="50_50_soil">50:50 Mix with Soil</SelectItem>
                <SelectItem value="50_50_other_inert">50:50 Mix with Other Inert</SelectItem>
                <SelectItem value="composting">Composting</SelectItem>
                <SelectItem value="grinding">Grinding</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inert Material Weight (for 50:50) */}
          {renderingMethod.startsWith('50_50') && (
            <div className="space-y-2">
              <Label htmlFor="inertWeight">
                Inert Material Weight * (50:50 requires ≥ waste weight)
              </Label>
              <Input
                id="inertWeight"
                type="number"
                step="0.01"
                min="0"
                value={inertWeight}
                onChange={(e) => setInertWeight(e.target.value)}
                placeholder="Equal or greater than waste weight"
              />
              {wasteWeight && inertWeight && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Ratio: {ratio}:1
                  </span>
                  {isRatioCompliant ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Destruction Date */}
          <div className="space-y-2">
            <Label htmlFor="destructionDate">Destruction Date *</Label>
            <Input
              id="destructionDate"
              type="date"
              value={destructionDate}
              onChange={(e) => setDestructionDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Destruction observations, witness information, etc."
              rows={3}
            />
          </div>

          {/* Photo Evidence Placeholder */}
          <Alert>
            <Camera className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Photo Evidence:</strong> Upload photos of destruction process and
              50:50 mix for compliance documentation (feature coming soon).
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDestroying}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDestroy} disabled={isDestroying}>
            {isDestroying ? 'Destroying...' : 'Destroy & Log Waste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

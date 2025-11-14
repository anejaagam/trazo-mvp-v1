'use client'

/**
 * Harvest Workflow Component
 * Simple harvest recording component for batches
 * More complex workflows can be added in Phase 4
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface HarvestWorkflowProps {
  batchId: string
  batchName: string
  currentPlantCount: number
  onRecordHarvest: (data: HarvestData) => Promise<void>
  onCancel: () => void
}

export interface HarvestData {
  batchId: string
  wetWeight: number
  dryWeight?: number
  finalWeight: number
  yieldUnits: number
  wasteWeight: number
  wasteReason?: string
  notes?: string
}

export function HarvestWorkflow({
  batchId,
  batchName,
  currentPlantCount,
  onRecordHarvest,
  onCancel,
}: HarvestWorkflowProps) {
  const [wetWeight, setWetWeight] = useState('')
  const [dryWeight, setDryWeight] = useState('')
  const [finalWeight, setFinalWeight] = useState('')
  const [yieldUnits, setYieldUnits] = useState('')
  const [wasteWeight, setWasteWeight] = useState('')
  const [wasteReason, setWasteReason] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!finalWeight || parseFloat(finalWeight) <= 0) {
      setError('Please enter a valid final weight')
      return
    }

    if (!yieldUnits || parseInt(yieldUnits) <= 0) {
      setError('Please enter a valid number of yield units')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const harvestData: HarvestData = {
        batchId,
        wetWeight: wetWeight ? parseFloat(wetWeight) : 0,
        dryWeight: dryWeight ? parseFloat(dryWeight) : undefined,
        finalWeight: parseFloat(finalWeight),
        yieldUnits: parseInt(yieldUnits),
        wasteWeight: wasteWeight ? parseFloat(wasteWeight) : 0,
        wasteReason: wasteReason || undefined,
        notes: notes || undefined,
      }

      await onRecordHarvest(harvestData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record harvest')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Harvest</CardTitle>
        <CardDescription>
          Recording harvest for batch {batchName} ({currentPlantCount} plants)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wet Weight (Cannabis) */}
          <div>
            <Label htmlFor="wet-weight">Wet Weight (g) - Optional</Label>
            <Input
              id="wet-weight"
              type="number"
              step="0.01"
              min="0"
              value={wetWeight}
              onChange={(e) => setWetWeight(e.target.value)}
              placeholder="Enter wet weight after harvest"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For cannabis: weight immediately after cutting
            </p>
          </div>

          {/* Dry Weight (Cannabis) */}
          <div>
            <Label htmlFor="dry-weight">Dry Weight (g) - Optional</Label>
            <Input
              id="dry-weight"
              type="number"
              step="0.01"
              min="0"
              value={dryWeight}
              onChange={(e) => setDryWeight(e.target.value)}
              placeholder="Enter dry weight after drying"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For cannabis: weight after drying phase
            </p>
          </div>

          {/* Final Weight (Required) */}
          <div>
            <Label htmlFor="final-weight">Final Weight (g) *</Label>
            <Input
              id="final-weight"
              type="number"
              step="0.01"
              min="0"
              value={finalWeight}
              onChange={(e) => setFinalWeight(e.target.value)}
              placeholder="Enter final packaged weight"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Final usable weight ready for distribution
            </p>
          </div>

          {/* Yield Units */}
          <div>
            <Label htmlFor="yield-units">Yield Units *</Label>
            <Input
              id="yield-units"
              type="number"
              min="0"
              value={yieldUnits}
              onChange={(e) => setYieldUnits(e.target.value)}
              placeholder="Number of packages/units"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Number of packages or units produced
            </p>
          </div>

          {/* Waste Weight */}
          <div>
            <Label htmlFor="waste-weight">Waste Weight (g)</Label>
            <Input
              id="waste-weight"
              type="number"
              step="0.01"
              min="0"
              value={wasteWeight}
              onChange={(e) => setWasteWeight(e.target.value)}
              placeholder="Enter waste weight"
            />
          </div>

          {/* Waste Reason */}
          {parseFloat(wasteWeight) > 0 && (
            <div>
              <Label htmlFor="waste-reason">Waste Reason</Label>
              <Input
                id="waste-reason"
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                placeholder="e.g., trim, defects, damage"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="harvest-notes">Notes (Optional)</Label>
            <Textarea
              id="harvest-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about the harvest..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          {finalWeight && yieldUnits && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Harvest Summary</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Final Weight: {finalWeight}g</p>
                <p>Yield Units: {yieldUnits}</p>
                <p>Waste: {wasteWeight || 0}g</p>
                <p>Yield per Unit: {(parseFloat(finalWeight) / parseInt(yieldUnits)).toFixed(2)}g</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Harvest'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

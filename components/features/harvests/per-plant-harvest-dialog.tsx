'use client'

import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Info, Plus, Trash2, Scale } from 'lucide-react'
import { toast } from 'sonner'

interface PlantHarvestEntry {
  plant_tag: string
  plant_index?: number
  wet_weight_g: number
  quality_grade?: 'A' | 'B' | 'C' | 'Waste'
  notes?: string
}

interface PerPlantHarvestDialogProps {
  harvestId: string
  batchId: string
  organizationId: string
  batchNumber: string
  expectedPlantCount: number
  availablePlantTags?: string[]
  onCreated: () => void
  trigger?: React.ReactNode
}

export function PerPlantHarvestDialog({
  harvestId,
  batchId,
  organizationId,
  batchNumber,
  expectedPlantCount,
  availablePlantTags = [],
  onCreated,
  trigger,
}: PerPlantHarvestDialogProps) {
  const [open, setOpen] = useState(false)
  const [plants, setPlants] = useState<PlantHarvestEntry[]>([])
  const [currentPlant, setCurrentPlant] = useState<PlantHarvestEntry>({
    plant_tag: '',
    wet_weight_g: 0,
    quality_grade: 'A',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize with empty plant entries
  useEffect(() => {
    if (open && plants.length === 0 && availablePlantTags.length > 0) {
      // Auto-populate with available tags
      const initialPlants = availablePlantTags.slice(0, expectedPlantCount).map((tag, index) => ({
        plant_tag: tag,
        plant_index: index + 1,
        wet_weight_g: 0,
        quality_grade: 'A' as const,
      }))
      setPlants(initialPlants)
    }
  }, [open, availablePlantTags, expectedPlantCount, plants.length])

  const handleAddPlant = () => {
    if (!currentPlant.plant_tag || currentPlant.wet_weight_g <= 0) {
      toast.error('Please enter plant tag and valid weight')
      return
    }

    // Check for duplicate tags
    if (plants.some((p) => p.plant_tag === currentPlant.plant_tag)) {
      toast.error('Plant tag already added')
      return
    }

    setPlants([
      ...plants,
      {
        ...currentPlant,
        plant_index: plants.length + 1,
      },
    ])

    // Reset current plant
    setCurrentPlant({
      plant_tag: '',
      wet_weight_g: 0,
      quality_grade: 'A',
      notes: '',
    })
  }

  const handleRemovePlant = (index: number) => {
    setPlants(plants.filter((_, i) => i !== index))
  }

  const handleUpdatePlant = (index: number, field: string, value: any) => {
    const updatedPlants = [...plants]
    updatedPlants[index] = {
      ...updatedPlants[index],
      [field]: value,
    }
    setPlants(updatedPlants)
  }

  const handleSubmit = async () => {
    if (plants.length === 0) {
      toast.error('Please add at least one plant')
      return
    }

    if (plants.length !== expectedPlantCount) {
      const confirmSubmit = confirm(
        `Expected ${expectedPlantCount} plants, but only ${plants.length} entered. Continue?`
      )
      if (!confirmSubmit) return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/harvests/plants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          harvest_id: harvestId,
          batch_id: batchId,
          organization_id: organizationId,
          plants: plants,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create plant harvest records')
      }

      const result = await response.json()

      toast.success(`${result.count} plant records created successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: any) => {
          toast.warning(warning.message || warning, { duration: 5000 })
        })
      }

      setOpen(false)
      setPlants([])
      onCreated()
    } catch (error) {
      console.error('Error creating plant harvest records:', error)
      toast.error((error as Error).message || 'Failed to create plant records')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalWeight = plants.reduce((sum, p) => sum + (p.wet_weight_g || 0), 0)
  const avgWeight = plants.length > 0 ? totalWeight / plants.length : 0

  const qualityBreakdown = plants.reduce((acc, p) => {
    const grade = p.quality_grade || 'Ungraded'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Scale className="h-4 w-4 mr-2" />
            Per-Plant Harvest
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Per-Plant Harvest Entry</DialogTitle>
          <DialogDescription>
            Record individual plant weights for batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Stats */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <strong>Expected Plants:</strong> {expectedPlantCount}
                </div>
                <div>
                  <strong>Recorded:</strong> {plants.length}
                </div>
                <div>
                  <strong>Total Weight:</strong> {totalWeight.toFixed(1)}g
                </div>
                <div>
                  <strong>Avg Weight:</strong> {avgWeight.toFixed(1)}g
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Quality Breakdown */}
          {plants.length > 0 && (
            <div className="flex gap-2">
              {Object.entries(qualityBreakdown).map(([grade, count]) => (
                <Badge key={grade} variant={grade === 'A' ? 'default' : 'secondary'}>
                  Grade {grade}: {count}
                </Badge>
              ))}
            </div>
          )}

          {/* Add Plant Form */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="text-sm font-semibold mb-3">Add Plant</h4>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <Label htmlFor="plant_tag" className="text-xs">
                  Plant Tag *
                </Label>
                <Input
                  id="plant_tag"
                  value={currentPlant.plant_tag}
                  onChange={(e) =>
                    setCurrentPlant({ ...currentPlant, plant_tag: e.target.value })
                  }
                  placeholder="1A4FF01..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="wet_weight" className="text-xs">
                  Wet Weight (g) *
                </Label>
                <Input
                  id="wet_weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={currentPlant.wet_weight_g || ''}
                  onChange={(e) =>
                    setCurrentPlant({
                      ...currentPlant,
                      wet_weight_g: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="quality" className="text-xs">
                  Quality Grade
                </Label>
                <Select
                  value={currentPlant.quality_grade}
                  onValueChange={(value: any) =>
                    setCurrentPlant({ ...currentPlant, quality_grade: value })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A (Premium)</SelectItem>
                    <SelectItem value="B">Grade B (Standard)</SelectItem>
                    <SelectItem value="C">Grade C (Lower)</SelectItem>
                    <SelectItem value="Waste">Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                <Label htmlFor="notes" className="text-xs">
                  Notes
                </Label>
                <Input
                  id="notes"
                  value={currentPlant.notes}
                  onChange={(e) =>
                    setCurrentPlant({ ...currentPlant, notes: e.target.value })
                  }
                  placeholder="Optional notes..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  onClick={handleAddPlant}
                  size="sm"
                  className="h-9 w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Plant List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Plant Tag</TableHead>
                  <TableHead className="text-right">Wet Weight (g)</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No plants added yet. Use the form above to add plants.
                    </TableCell>
                  </TableRow>
                ) : (
                  plants.map((plant, index) => (
                    <TableRow key={index}>
                      <TableCell>{plant.plant_index || index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {plant.plant_tag}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={plant.wet_weight_g}
                          onChange={(e) =>
                            handleUpdatePlant(
                              index,
                              'wet_weight_g',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 w-24 text-right text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={plant.quality_grade}
                          onValueChange={(value) =>
                            handleUpdatePlant(index, 'quality_grade', value)
                          }
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Grade A</SelectItem>
                            <SelectItem value="B">Grade B</SelectItem>
                            <SelectItem value="C">Grade C</SelectItem>
                            <SelectItem value="Waste">Waste</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={plant.notes || ''}
                          onChange={(e) =>
                            handleUpdatePlant(index, 'notes', e.target.value)
                          }
                          placeholder="Notes..."
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlant(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || plants.length === 0}>
            {isSubmitting ? 'Creating...' : `Record ${plants.length} Plants`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

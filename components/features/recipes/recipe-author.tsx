'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Save,
  Sun,
  Moon
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  type StageType,
  type SetpointParameterType,
  type PlantType
} from '@/types/recipe'

interface RecipeAuthorProps {
  initialData?: RecipeFormData
  facilityType?: string
  mode?: 'create' | 'edit'
  onCancel?: () => void
  onSave?: (data: RecipeFormData) => Promise<void>
}

interface RecipeFormData {
  name: string
  description: string
  notes: string
  plantTypes: PlantType[]
  tags: string[]
  stages: StageFormData[]
}

interface StageFormData {
  id: string
  name: string
  stageType: StageType
  duration: number
  description: string
  order: number
  setpoints: SetpointFormData[]
}

interface SetpointFormData {
  id: string
  parameterType: SetpointParameterType
  value?: number
  dayValue?: number
  nightValue?: number
  unit: string
  deadband?: number
  minValue?: number
  maxValue?: number
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

const STAGE_TYPES: StageType[] = [
  'germination',
  'clone',
  'vegetative',
  'flowering',
  'harvest',
  'drying',
  'curing'
]

const SETPOINT_TYPES: SetpointParameterType[] = [
  'temperature',
  'humidity',
  'vpd',
  'co2',
  'light_intensity',
  'photoperiod',
  'air_flow',
  'air_pressure'
]

const PLANT_TYPES: PlantType[] = ['cannabis', 'produce']

function getSetpointUnit(type: SetpointParameterType): string {
  switch (type) {
    case 'temperature': return '°C'
    case 'humidity': return '%'
    case 'vpd': return 'kPa'
    case 'co2': return 'ppm'
    case 'light_intensity': return '%'
    case 'photoperiod': return 'hrs'
    case 'air_flow': return 'CFM'
    case 'air_pressure': return 'Pa'
    case 'irrigation_frequency': return 'times/day'
    case 'irrigation_duration': return 'min'
  }
}

function getSetpointDefaults(type: SetpointParameterType): Partial<SetpointFormData> {
  switch (type) {
    case 'temperature':
      return { dayValue: 24, nightValue: 20, deadband: 1, minValue: 18, maxValue: 32 }
    case 'humidity':
      return { dayValue: 60, nightValue: 65, deadband: 5, minValue: 40, maxValue: 80 }
    case 'vpd':
      return { dayValue: 1.0, nightValue: 0.8, deadband: 0.1, minValue: 0.4, maxValue: 1.6 }
    case 'co2':
      return { value: 1200, deadband: 100, minValue: 400, maxValue: 1500 }
    case 'light_intensity':
      return { dayValue: 80, nightValue: 0, deadband: 5, minValue: 0, maxValue: 100 }
    case 'photoperiod':
      return { value: 18, deadband: 0, minValue: 0, maxValue: 24 }
    default:
      return { value: 0 }
  }
}

export function RecipeAuthor({ 
  initialData,
  facilityType,
  mode = 'create',
  onCancel,
  onSave 
}: RecipeAuthorProps) {
  const router = useRouter()
  
  // Determine available plant types based on facility type
  const availablePlantTypes: PlantType[] = facilityType === 'cannabis' 
    ? ['cannabis']
    : facilityType === 'produce'
    ? ['produce']
    : PLANT_TYPES // If no facility type, show both
  
  // Form state
  const [recipeName, setRecipeName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [plantTypes, setPlantTypes] = useState<PlantType[]>(
    initialData?.plantTypes || (facilityType ? [facilityType as PlantType] : [])
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  
  // Stage state
  const [stages, setStages] = useState<StageFormData[]>(initialData?.stages || [])
  const [activeStageId, setActiveStageId] = useState<string | null>(
    initialData?.stages?.[0]?.id || null
  )
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const addStage = () => {
    const newStage: StageFormData = {
      id: `stage-${Date.now()}`,
      name: `Stage ${stages.length + 1}`,
      stageType: 'vegetative',
      duration: 21,
      description: '',
      order: stages.length,
      setpoints: []
    }
    setStages([...stages, newStage])
    setActiveStageId(newStage.id)
  }

  const removeStage = (stageId: string) => {
    const newStages = stages.filter(s => s.id !== stageId)
    // Reorder remaining stages
    const reordered = newStages.map((s, idx) => ({ ...s, order: idx }))
    setStages(reordered)
    
    if (activeStageId === stageId) {
      setActiveStageId(reordered[0]?.id || null)
    }
  }

  const updateStage = (stageId: string, updates: Partial<StageFormData>) => {
    setStages(stages.map(s => s.id === stageId ? { ...s, ...updates } : s))
  }

  const addSetpoint = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    const newSetpoint: SetpointFormData = {
      id: `sp-${Date.now()}`,
      parameterType: 'temperature',
      unit: getSetpointUnit('temperature'),
      ...getSetpointDefaults('temperature')
    }

    updateStage(stageId, {
      setpoints: [...stage.setpoints, newSetpoint]
    })
  }

  const updateSetpoint = (
    stageId: string, 
    setpointId: string, 
    updates: Partial<SetpointFormData>
  ) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    updateStage(stageId, {
      setpoints: stage.setpoints.map(sp => 
        sp.id === setpointId ? { ...sp, ...updates } : sp
      )
    })
  }

  const removeSetpoint = (stageId: string, setpointId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    updateStage(stageId, {
      setpoints: stage.setpoints.filter(sp => sp.id !== setpointId)
    })
  }

  const handleSetpointTypeChange = (
    stageId: string,
    setpointId: string,
    newType: SetpointParameterType
  ) => {
    const defaults = getSetpointDefaults(newType)
    updateSetpoint(stageId, setpointId, {
      parameterType: newType,
      unit: getSetpointUnit(newType),
      ...defaults
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const togglePlantType = (type: PlantType) => {
    if (plantTypes.includes(type)) {
      setPlantTypes(plantTypes.filter(t => t !== type))
    } else {
      setPlantTypes([...plantTypes, type])
    }
  }

  const validateRecipe = (): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!recipeName.trim()) {
      errors.push({ 
        field: 'name', 
        message: 'Recipe name is required', 
        severity: 'error' 
      })
    }

    if (stages.length === 0) {
      errors.push({ 
        field: 'stages', 
        message: 'At least one stage is required', 
        severity: 'error' 
      })
    }

    stages.forEach((stage, idx) => {
      if (stage.duration <= 0) {
        errors.push({ 
          field: `stage-${idx}`, 
          message: `Stage "${stage.name}" must have duration > 0`, 
          severity: 'error' 
        })
      }

      // Validate setpoint bounds
      stage.setpoints.forEach(sp => {
        const value = sp.dayValue ?? sp.value ?? 0
        
        if (sp.minValue !== undefined && value < sp.minValue) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `${sp.parameterType} value below minimum (${sp.minValue})`, 
            severity: 'error' 
          })
        }
        
        if (sp.maxValue !== undefined && value > sp.maxValue) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `${sp.parameterType} value above maximum (${sp.maxValue})`, 
            severity: 'error' 
          })
        }
      })
    })

    return errors
  }

  const handleSave = async (publish: boolean = false) => {
    const errors = validateRecipe()
    setValidationErrors(errors)

    const criticalErrors = errors.filter(e => e.severity === 'error')
    if (criticalErrors.length > 0) {
      toast.error(`Cannot ${publish ? 'publish' : 'save'} recipe with validation errors`)
      return
    }

    setIsSaving(true)
    
    try {
      const formData: RecipeFormData = {
        name: recipeName,
        description,
        notes,
        plantTypes,
        tags,
        stages
      }

      if (onSave) {
        await onSave(formData)
      }
      
      toast.success(publish ? 'Recipe published successfully' : 'Recipe saved as draft')
      
      if (!onCancel) {
        router.push('/dashboard/recipes')
      }
    } catch (error) {
      toast.error('Failed to save recipe')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push('/dashboard/recipes')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === 'edit' ? 'Edit Recipe' : 'Create Recipe'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Define stage-based environmental control recipes
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={isSaving}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Validation Alerts */}
      {validationErrors.length > 0 && (
        <Alert variant={validationErrors.some(e => e.severity === 'error') ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="mb-2 font-medium">Recipe validation issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="text-sm">{err.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>General details about this recipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipeName">Recipe Name *</Label>
            <Input
              id="recipeName"
              placeholder="e.g., Premium Flower Cycle"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose and goals of this recipe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="notes">Version Notes</Label>
            <Textarea
              id="notes"
              placeholder="Document changes and modifications in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Plant Types</Label>
            <div className="flex gap-2 mt-1.5">
              {availablePlantTypes.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={plantTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => togglePlantType(type)}
                  disabled={availablePlantTypes.length === 1}
                >
                  {type}
                </Button>
              ))}
            </div>
            {availablePlantTypes.length === 1 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Plant type determined by facility configuration
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="tagInput">Tags</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="tagInput"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Growth Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Growth Stages</CardTitle>
              <CardDescription>Define environmental targets for each growth phase</CardDescription>
            </div>
            <Button onClick={addStage} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400 border border-dashed rounded-lg">
              <p>No stages defined. Click &quot;Add Stage&quot; to begin.</p>
            </div>
          ) : (
            <Tabs value={activeStageId || stages[0]?.id} onValueChange={setActiveStageId}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 4)}, 1fr)` }}>
                {stages.slice(0, 4).map(stage => (
                  <TabsTrigger key={stage.id} value={stage.id}>
                    <span className="truncate">{stage.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {stages.map(stage => (
                <TabsContent key={stage.id} value={stage.id} className="space-y-4 mt-6">
                  {/* Stage Configuration */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Stage Name</Label>
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      
                      <div>
                        <Label>Stage Type</Label>
                        <Select
                          value={stage.stageType}
                          onValueChange={(value) => updateStage(stage.id, { stageType: value as StageType })}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGE_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={stage.duration}
                          onChange={(e) => updateStage(stage.id, { duration: parseInt(e.target.value) || 1 })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStage(stage.id)}
                      className="mt-7"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <div>
                    <Label>Stage Description</Label>
                    <Textarea
                      value={stage.description}
                      onChange={(e) => updateStage(stage.id, { description: e.target.value })}
                      placeholder="Optional notes about this stage..."
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>

                  {/* Setpoints */}
                  <div className="border-t pt-4 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Environmental Setpoints
                      </h4>
                      <Button 
                        onClick={() => addSetpoint(stage.id)} 
                        size="sm" 
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Setpoint
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {stage.setpoints.map(setpoint => (
                        <Card key={setpoint.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <Label>Parameter</Label>
                                  <Select
                                    value={setpoint.parameterType}
                                    onValueChange={(value) => 
                                      handleSetpointTypeChange(stage.id, setpoint.id, value as SetpointParameterType)
                                    }
                                  >
                                    <SelectTrigger className="mt-1.5">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SETPOINT_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="flex items-center gap-1">
                                    <Sun className="w-3 h-3" /> Day Value
                                  </Label>
                                  <div className="flex gap-2 mt-1.5">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={setpoint.dayValue ?? setpoint.value ?? 0}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        dayValue: parseFloat(e.target.value) || 0 
                                      })}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 self-center min-w-[3rem]">
                                      {setpoint.unit}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <Label className="flex items-center gap-1">
                                    <Moon className="w-3 h-3" /> Night Value
                                  </Label>
                                  <div className="flex gap-2 mt-1.5">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={setpoint.nightValue ?? setpoint.value ?? 0}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        nightValue: parseFloat(e.target.value) || 0 
                                      })}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 self-center min-w-[3rem]">
                                      {setpoint.unit}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <Label>Deadband</Label>
                                  <div className="flex gap-2 mt-1.5">
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={setpoint.deadband ?? 0}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        deadband: parseFloat(e.target.value) || 0 
                                      })}
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 self-center min-w-[3rem]">
                                      {setpoint.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t dark:border-slate-700">
                                <div>
                                  <Label>Minimum Value</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={setpoint.minValue ?? ''}
                                    onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                      minValue: e.target.value ? parseFloat(e.target.value) : undefined 
                                    })}
                                    placeholder="Optional safety minimum"
                                    className="mt-1.5"
                                  />
                                </div>
                                
                                <div>
                                  <Label>Maximum Value</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={setpoint.maxValue ?? ''}
                                    onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                      maxValue: e.target.value ? parseFloat(e.target.value) : undefined 
                                    })}
                                    placeholder="Optional safety maximum"
                                    className="mt-1.5"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSetpoint(stage.id, setpoint.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {stage.setpoints.length === 0 && (
                        <div className="text-center py-8 text-slate-600 dark:text-slate-400 border border-dashed rounded-lg">
                          <p>No setpoints defined for this stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

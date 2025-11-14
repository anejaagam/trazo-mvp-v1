'use client'

import { useState, useRef, useEffect } from 'react'
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
  // Temperature in °C
  tempMin?: number
  tempMax?: number
  // Relative Humidity %
  humidityMin?: number
  humidityMax?: number
  // VPD kPa
  vpdMin?: number
  vpdMax?: number
  // CO2 ppm
  co2Min?: number
  co2Max?: number
  // Light Level %
  lightMin?: number
  lightMax?: number
  // Light Schedule (24-hour format HH:MM)
  lightOn?: string
  lightOff?: string
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

const PLANT_TYPES: PlantType[] = ['cannabis', 'produce']

// Light level percentages for dropdown
const LIGHT_LEVELS = Array.from({ length: 21 }, (_, i) => i * 5) // 0%, 5%, 10%, ..., 100%

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
  
  // Track last added setpoint for scrolling
  const [lastAddedSetpoint, setLastAddedSetpoint] = useState<string | null>(null)
  const setpointRefs = useRef<Record<string, HTMLDivElement | null>>({})
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Check for clone data on mount
  useEffect(() => {
    if (mode === 'create' && !initialData) {
      const cloneData = sessionStorage.getItem('cloneRecipeData')
      if (cloneData) {
        try {
          const data = JSON.parse(cloneData)
          setRecipeName(data.name || '')
          setDescription(data.description || '')
          setPlantTypes(data.plantTypes || [])
          setTags(data.tags || [])
          
          // Convert database stages to form stages
          if (data.stages && data.stages.length > 0) {
            const formStages = data.stages.map((stage: any, idx: number) => {
              const setpoints = stage.setpoints || []
              const tempSetpoint = setpoints.find((sp: any) => sp.parameter_type === 'temperature')
              const humiditySetpoint = setpoints.find((sp: any) => sp.parameter_type === 'humidity')
              const vpdSetpoint = setpoints.find((sp: any) => sp.parameter_type === 'vpd')
              const co2Setpoint = setpoints.find((sp: any) => sp.parameter_type === 'co2')
              const lightSetpoint = setpoints.find((sp: any) => sp.parameter_type === 'light_intensity')
              const photoperiodSetpoint = setpoints.find((sp: any) => sp.parameter_type === 'photoperiod')
              
              // Calculate light schedule from photoperiod
              let lightOn = '06:00'
              let lightOff = '22:00'
              if (photoperiodSetpoint?.value) {
                const hours = photoperiodSetpoint.value
                const offHour = 6 + Math.floor(hours)
                const offMin = Math.round((hours % 1) * 60)
                lightOff = `${offHour.toString().padStart(2, '0')}:${offMin.toString().padStart(2, '0')}`
              }
              
              return {
                id: `stage-${Date.now()}-${idx}`,
                name: stage.name,
                stageType: stage.stage_type || 'vegetative',
                duration: stage.duration_days || 21,
                description: stage.description || '',
                order: idx,
                setpoints: setpoints.length > 0 ? [{
                  id: `sp-${Date.now()}-${idx}`,
                  tempMin: tempSetpoint?.min_value,
                  tempMax: tempSetpoint?.max_value,
                  humidityMin: humiditySetpoint?.min_value,
                  humidityMax: humiditySetpoint?.max_value,
                  vpdMin: vpdSetpoint?.min_value,
                  vpdMax: vpdSetpoint?.max_value,
                  co2Min: co2Setpoint?.min_value,
                  co2Max: co2Setpoint?.max_value,
                  lightMin: lightSetpoint?.min_value,
                  lightMax: lightSetpoint?.max_value,
                  lightOn,
                  lightOff
                }] : []
              }
            })
            setStages(formStages)
            setActiveStageId(formStages[0]?.id || null)
          }
          
          // Clear the clone data
          sessionStorage.removeItem('cloneRecipeData')
        } catch (error) {
          console.error('Error loading clone data:', error)
        }
      }
    }
  }, [mode, initialData])

  // Scroll to newly added setpoint
  useEffect(() => {
    if (lastAddedSetpoint && setpointRefs.current[lastAddedSetpoint]) {
      setTimeout(() => {
        setpointRefs.current[lastAddedSetpoint]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
        setLastAddedSetpoint(null)
      }, 100)
    }
  }, [lastAddedSetpoint])

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
      tempMin: 20,
      tempMax: 26,
      humidityMin: 50,
      humidityMax: 70,
      vpdMin: 0.8,
      vpdMax: 1.2,
      co2Min: 400,
      co2Max: 1500,
      lightMin: 0,
      lightMax: 100,
      lightOn: '06:00',
      lightOff: '22:00'
    }

    updateStage(stageId, {
      setpoints: [...stage.setpoints, newSetpoint]
    })
    
    // Trigger scroll to new setpoint
    setLastAddedSetpoint(newSetpoint.id)
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

      // Validate setpoint ranges
      stage.setpoints.forEach(sp => {
        // Validate temperature range
        if (sp.tempMin !== undefined && sp.tempMax !== undefined && sp.tempMin > sp.tempMax) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `Temperature min cannot be greater than max`, 
            severity: 'error' 
          })
        }
        
        // Validate humidity range
        if (sp.humidityMin !== undefined && sp.humidityMax !== undefined && sp.humidityMin > sp.humidityMax) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `Humidity min cannot be greater than max`, 
            severity: 'error' 
          })
        }
        
        // Validate VPD range
        if (sp.vpdMin !== undefined && sp.vpdMax !== undefined && sp.vpdMin > sp.vpdMax) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `VPD min cannot be greater than max`, 
            severity: 'error' 
          })
        }
        
        // Validate CO2 range
        if (sp.co2Min !== undefined && sp.co2Max !== undefined && sp.co2Min > sp.co2Max) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `CO2 min cannot be greater than max`, 
            severity: 'error' 
          })
        }
        
        // Validate light level range
        if (sp.lightMin !== undefined && sp.lightMax !== undefined && sp.lightMin > sp.lightMax) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `Light level min cannot be greater than max`, 
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
            <Tabs value={activeStageId || stages[0]?.id || ''} onValueChange={setActiveStageId}>
              <div className="relative">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="inline-flex w-auto min-w-full">
                    {stages.map(stage => (
                      <TabsTrigger key={stage.id} value={stage.id} className="flex-shrink-0 min-w-[120px]">
                        <span className="truncate">{stage.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

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
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        Environmental Setpoints
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {stage.setpoints.map(setpoint => (
                        <Card 
                          key={setpoint.id}
                          ref={(el) => {
                            setpointRefs.current[setpoint.id] = el
                          }}
                        >
                          <CardContent className="pt-6">
                            <div className="space-y-6">
                              {/* Temperature */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Temperature (°C):</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Min:</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={setpoint.tempMin ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        tempMin: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Max:</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={setpoint.tempMax ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        tempMax: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Relative Humidity */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Relative Humidity (%):</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Min:</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={setpoint.humidityMin ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        humidityMin: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Max:</Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={setpoint.humidityMax ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        humidityMax: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* VPD */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">VPD (kPa):</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Min:</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={setpoint.vpdMin ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        vpdMin: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Max:</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={setpoint.vpdMax ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        vpdMax: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* CO2 */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">CO₂ (ppm):</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Min:</Label>
                                    <Input
                                      type="number"
                                      step="50"
                                      value={setpoint.co2Min ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        co2Min: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                      placeholder="400"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Max:</Label>
                                    <Input
                                      type="number"
                                      step="50"
                                      value={setpoint.co2Max ?? ''}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        co2Max: e.target.value ? parseFloat(e.target.value) : undefined 
                                      })}
                                      className="mt-1.5"
                                      placeholder="1500"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Light Level */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Light Level (%):</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Min:</Label>
                                    <Select
                                      value={setpoint.lightMin?.toString() ?? '0'}
                                      onValueChange={(value) => updateSetpoint(stage.id, setpoint.id, { 
                                        lightMin: parseInt(value) 
                                      })}
                                    >
                                      <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LIGHT_LEVELS.map(level => (
                                          <SelectItem key={level} value={level.toString()}>
                                            {level}%
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-sm">Max:</Label>
                                    <Select
                                      value={setpoint.lightMax?.toString() ?? '100'}
                                      onValueChange={(value) => updateSetpoint(stage.id, setpoint.id, { 
                                        lightMax: parseInt(value) 
                                      })}
                                    >
                                      <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LIGHT_LEVELS.map(level => (
                                          <SelectItem key={level} value={level.toString()}>
                                            {level}%
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              {/* Light Schedule */}
                              <div>
                                <Label className="text-base font-semibold mb-3 block">Light Schedule:</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">On:</Label>
                                    <Input
                                      type="time"
                                      value={setpoint.lightOn ?? '06:00'}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        lightOn: e.target.value 
                                      })}
                                      className="mt-1.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Off:</Label>
                                    <Input
                                      type="time"
                                      value={setpoint.lightOff ?? '22:00'}
                                      onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                        lightOff: e.target.value 
                                      })}
                                      className="mt-1.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:dark:invert"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end pt-4 border-t dark:border-slate-700">
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
                        <>
                          <div className="text-center py-8 text-slate-600 dark:text-slate-400 border border-dashed rounded-lg">
                            <p>No environmental setpoints defined for this stage</p>
                            <p className="text-sm mt-1">Click the button below to add setpoints</p>
                          </div>

                          <div className="flex justify-center pt-2">
                            <Button 
                              onClick={() => addSetpoint(stage.id)} 
                              size="sm" 
                              variant="outline"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Setpoint
                            </Button>
                          </div>
                        </>
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

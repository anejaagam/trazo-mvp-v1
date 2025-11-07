import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Stage, SetpointTarget, StageType, SetpointType, ValidationError } from '../types';
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface RecipeAuthorProps {
  onCancel: () => void;
  onSave: () => void;
}

export function RecipeAuthor({ onCancel, onSave }: RecipeAuthorProps) {
  const [recipeName, setRecipeName] = useState('');
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const stageTypes: StageType[] = ['Germination', 'Vegetative', 'Flowering', 'Harvest'];
  
  const setpointTypes: SetpointType[] = [
    'Temperature',
    'RH',
    'VPD',
    'CO2',
    'LightIntensity',
    'Photoperiod'
  ];

  const getSetpointUnit = (type: SetpointType): string => {
    switch (type) {
      case 'Temperature': return '°C';
      case 'RH': return '%';
      case 'VPD': return 'kPa';
      case 'CO2': return 'ppm';
      case 'LightIntensity': return '%';
      case 'Photoperiod': return 'hrs';
    }
  };

  const addStage = () => {
    const newStage: Stage = {
      id: `stage-${Date.now()}`,
      recipeVersionId: 'temp',
      name: 'Vegetative',
      duration: 21,
      order: stages.length + 1,
      setpoints: []
    };
    setStages([...stages, newStage]);
    setActiveStageId(newStage.id);
  };

  const removeStage = (stageId: string) => {
    setStages(stages.filter(s => s.id !== stageId));
    if (activeStageId === stageId) {
      setActiveStageId(null);
    }
  };

  const updateStage = (stageId: string, updates: Partial<Stage>) => {
    setStages(stages.map(s => s.id === stageId ? { ...s, ...updates } : s));
  };

  const addSetpoint = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    const newSetpoint: SetpointTarget = {
      id: `sp-${Date.now()}`,
      stageId,
      type: 'Temperature',
      value: 24,
      unit: '°C',
      deadband: 1,
      minValue: 18,
      maxValue: 30
    };

    updateStage(stageId, {
      setpoints: [...stage.setpoints, newSetpoint]
    });
  };

  const updateSetpoint = (stageId: string, setpointId: string, updates: Partial<SetpointTarget>) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    updateStage(stageId, {
      setpoints: stage.setpoints.map(sp => 
        sp.id === setpointId ? { ...sp, ...updates } : sp
      )
    });
  };

  const removeSetpoint = (stageId: string, setpointId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    updateStage(stageId, {
      setpoints: stage.setpoints.filter(sp => sp.id !== setpointId)
    });
  };

  const validateRecipe = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!recipeName.trim()) {
      errors.push({ field: 'name', message: 'Recipe name is required', severity: 'error' });
    }

    if (stages.length === 0) {
      errors.push({ field: 'stages', message: 'At least one stage is required', severity: 'error' });
    }

    stages.forEach((stage, idx) => {
      if (stage.duration <= 0) {
        errors.push({ 
          field: `stage-${idx}`, 
          message: `Stage "${stage.name}" must have duration > 0`, 
          severity: 'error' 
        });
      }

      // Check for conflicting setpoints (e.g., heating and cooling overlap)
      const tempSetpoints = stage.setpoints.filter(sp => sp.type === 'Temperature');
      if (tempSetpoints.length > 1) {
        errors.push({ 
          field: `stage-${idx}`, 
          message: `Stage "${stage.name}" has conflicting temperature setpoints`, 
          severity: 'warning' 
        });
      }

      // Validate bounds
      stage.setpoints.forEach(sp => {
        if (sp.minValue !== undefined && sp.value < sp.minValue) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `${sp.type} value below minimum (${sp.minValue})`, 
            severity: 'error' 
          });
        }
        if (sp.maxValue !== undefined && sp.value > sp.maxValue) {
          errors.push({ 
            field: `setpoint-${sp.id}`, 
            message: `${sp.type} value above maximum (${sp.maxValue})`, 
            severity: 'error' 
          });
        }
      });
    });

    return errors;
  };

  const handleSave = () => {
    const errors = validateRecipe();
    setValidationErrors(errors);

    const criticalErrors = errors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      toast.error('Cannot save recipe with validation errors');
      return;
    }

    toast.success('Recipe saved as draft');
    onSave();
  };

  const handlePublish = () => {
    const errors = validateRecipe();
    setValidationErrors(errors);

    const criticalErrors = errors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      toast.error('Cannot publish recipe with validation errors');
      return;
    }

    toast.success('Recipe published successfully');
    onSave();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-slate-900">Recipe Author</h2>
            <p className="text-slate-600">Create stage-based environmental control recipes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handlePublish}>
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
            <p className="mb-2">Recipe validation issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="text-sm">{err.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipeName">Recipe Name</Label>
            <Input
              id="recipeName"
              placeholder="e.g., Premium Flower Cycle"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Describe the purpose and modifications in this version..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Growth Stages</CardTitle>
              <CardDescription>Define environmental targets for each stage</CardDescription>
            </div>
            <Button onClick={addStage} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stages.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <p>No stages defined. Click "Add Stage" to begin.</p>
            </div>
          ) : (
            <Tabs value={activeStageId || stages[0]?.id} onValueChange={setActiveStageId}>
              <TabsList className="grid w-full grid-cols-4">
                {stages.map(stage => (
                  <TabsTrigger key={stage.id} value={stage.id}>
                    {stage.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {stages.map(stage => (
                <TabsContent key={stage.id} value={stage.id} className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Stage Type</Label>
                        <select
                          className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-md"
                          value={stage.name}
                          onChange={(e) => updateStage(stage.id, { name: e.target.value as StageType })}
                        >
                          {stageTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          value={stage.duration}
                          onChange={(e) => updateStage(stage.id, { duration: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStage(stage.id)}
                      className="ml-4"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-slate-900">Environmental Setpoints</h4>
                      <Button onClick={() => addSetpoint(stage.id)} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Setpoint
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {stage.setpoints.map(setpoint => (
                        <Card key={setpoint.id}>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <Label>Parameter</Label>
                                <select
                                  className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-md text-sm"
                                  value={setpoint.type}
                                  onChange={(e) => {
                                    const newType = e.target.value as SetpointType;
                                    updateSetpoint(stage.id, setpoint.id, { 
                                      type: newType,
                                      unit: getSetpointUnit(newType)
                                    });
                                  }}
                                >
                                  {setpointTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label>Day Value</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={setpoint.dayValue ?? setpoint.value}
                                    onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                      dayValue: parseFloat(e.target.value) || 0 
                                    })}
                                  />
                                  <span className="text-sm text-slate-600 self-center">{setpoint.unit}</span>
                                </div>
                              </div>
                              <div>
                                <Label>Night Value</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={setpoint.nightValue ?? setpoint.value}
                                    onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                      nightValue: parseFloat(e.target.value) || 0 
                                    })}
                                  />
                                  <span className="text-sm text-slate-600 self-center">{setpoint.unit}</span>
                                </div>
                              </div>
                              <div>
                                <Label>Deadband</Label>
                                <Input
                                  type="number"
                                  value={setpoint.deadband || 0}
                                  onChange={(e) => updateSetpoint(stage.id, setpoint.id, { 
                                    deadband: parseFloat(e.target.value) || 0 
                                  })}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSetpoint(stage.id, setpoint.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {stage.setpoints.length === 0 && (
                        <div className="text-center py-6 text-slate-600 border border-dashed rounded-lg">
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
  );
}

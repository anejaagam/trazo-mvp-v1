import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Recipe } from '../types';
import { mockRecipeVersions, createMockStages } from '../lib/mockData';
import { ArrowLeft, Calendar, User, Edit, Copy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RecipeViewerProps {
  recipe: Recipe;
  onClose: () => void;
}

export function RecipeViewer({ recipe, onClose }: RecipeViewerProps) {
  const version = mockRecipeVersions.find(v => v.recipeId === recipe.id) || {
    ...mockRecipeVersions[0],
    stages: createMockStages('temp')
  };

  const handleClone = () => {
    toast.success(`Cloned "${recipe.name}" to drafts`);
  };

  const handleApply = () => {
    toast.success(`Ready to apply "${recipe.name}" to batch groups`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-emerald-100 text-emerald-800';
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-slate-900">{recipe.name}</h2>
              <Badge className={getStatusColor(recipe.status)}>{recipe.status}</Badge>
            </div>
            <p className="text-slate-600">v{recipe.currentVersion} by {recipe.ownerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClone}>
            <Copy className="w-4 h-4 mr-2" />
            Clone
          </Button>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {recipe.status === 'Published' && (
            <Button onClick={handleApply}>
              <Calendar className="w-4 h-4 mr-2" />
              Apply to Batch Group
            </Button>
          )}
        </div>
      </div>

      {/* Version Info */}
      <Card>
        <CardHeader>
          <CardTitle>Version Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Created By</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-slate-900">{version.createdBy}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">Created At</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="text-slate-900">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {version.notes && (
            <div>
              <p className="text-sm text-slate-600">Release Notes</p>
              <p className="text-slate-900 mt-1">{version.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Stages</CardTitle>
          <CardDescription>
            {version.stages.length} stage(s) · Total duration: {version.stages.reduce((sum, s) => sum + s.duration, 0)} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={version.stages[0]?.id}>
            <TabsList className="grid w-full grid-cols-4">
              {version.stages.map(stage => (
                <TabsTrigger key={stage.id} value={stage.id}>
                  {stage.name}
                  <span className="ml-2 text-xs text-slate-500">({stage.duration}d)</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {version.stages.map(stage => (
              <TabsContent key={stage.id} value={stage.id} className="mt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-600">Stage Duration</p>
                      <p className="text-slate-900">{stage.duration} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Setpoints</p>
                      <p className="text-slate-900">{stage.setpoints.length} parameters</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-slate-900">Environmental Setpoints</h4>
                    {stage.setpoints.map(setpoint => (
                      <Card key={setpoint.id}>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-slate-600">Parameter</p>
                              <p className="text-slate-900">{setpoint.type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Day Value</p>
                              <p className="text-slate-900">
                                {setpoint.dayValue ?? setpoint.value} {setpoint.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Night Value</p>
                              <p className="text-slate-900">
                                {setpoint.nightValue ?? setpoint.value} {setpoint.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-slate-600">Deadband</p>
                              <p className="text-slate-900">
                                ±{setpoint.deadband ?? 0} {setpoint.unit}
                              </p>
                            </div>
                          </div>
                          {setpoint.ramp && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-slate-600">Ramp Configuration</p>
                              <p className="text-sm text-slate-900">
                                {setpoint.ramp.start}% → {setpoint.ramp.end}% over {setpoint.ramp.duration} minutes
                              </p>
                            </div>
                          )}
                          {(setpoint.minValue !== undefined || setpoint.maxValue !== undefined) && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-slate-600">Safety Bounds</p>
                              <p className="text-sm text-slate-900">
                                Min: {setpoint.minValue} {setpoint.unit} · Max: {setpoint.maxValue} {setpoint.unit}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

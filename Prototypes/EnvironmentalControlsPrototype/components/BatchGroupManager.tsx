import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { mockBatchGroups, mockRecipes } from '../lib/mockData';
import { BatchGroup } from '../types';
import { Plus, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function BatchGroupManager() {
  const [batchGroups] = useState<BatchGroup[]>(mockBatchGroups);
  const [selectedGroup, setSelectedGroup] = useState<BatchGroup | null>(null);
  const [isApplyingRecipe, setIsApplyingRecipe] = useState(false);

  const handleApplyRecipe = () => {
    toast.success('Recipe scheduled for activation');
    setIsApplyingRecipe(false);
    setSelectedGroup(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Batch Group Management</h2>
          <p className="text-slate-600">Apply recipes and manage environmental controls</p>
        </div>
      </div>

      {/* Batch Group List */}
      <div className="grid gap-6">
        {batchGroups.map(group => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-slate-900">{group.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {group.pods.length} pod(s): {group.pods.join(', ')}
                  </CardDescription>
                </div>
                <Dialog open={selectedGroup?.id === group.id && isApplyingRecipe} onOpenChange={(open) => {
                  setIsApplyingRecipe(open);
                  if (!open) setSelectedGroup(null);
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedGroup(group)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Apply Recipe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Apply Recipe to {group.name}</DialogTitle>
                      <DialogDescription>
                        Schedule a recipe activation for this batch group
                      </DialogDescription>
                    </DialogHeader>
                    <ApplyRecipeForm group={group} onSave={handleApplyRecipe} onCancel={() => {
                      setIsApplyingRecipe(false);
                      setSelectedGroup(null);
                    }} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Recipe */}
              {group.activeRecipeId ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm text-slate-900">Active Recipe</p>
                      </div>
                      <p className="text-slate-900">{group.activeRecipeName}</p>
                      {group.stage && (
                        <div className="mt-3 flex items-center gap-4">
                          <div>
                            <p className="text-xs text-slate-600">Current Stage</p>
                            <Badge variant="outline" className="mt-1">{group.stage}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600">Stage Day</p>
                            <p className="text-sm text-slate-900 mt-1">Day {group.stageDay}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {group.scheduledActivation && (
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Activated</p>
                        <p className="text-sm text-slate-900">
                          {new Date(group.scheduledActivation).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <Activity className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No active recipe</p>
                </div>
              )}

              {/* Pod Status */}
              <div className="space-y-2">
                <p className="text-sm text-slate-900">Pod Status</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {group.pods.map(pod => (
                    <div key={pod} className="p-3 bg-white border border-slate-200 rounded text-center">
                      <p className="text-sm text-slate-900">{pod}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {group.stage || 'Idle'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ApplyRecipeFormProps {
  group: BatchGroup;
  onSave: () => void;
  onCancel: () => void;
}

function ApplyRecipeForm({ group, onSave, onCancel }: ApplyRecipeFormProps) {
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [activationDate, setActivationDate] = useState('');
  const [activationTime, setActivationTime] = useState('08:00');

  const publishedRecipes = mockRecipes.filter(r => r.status === 'Published');

  const handleSubmit = () => {
    if (!selectedRecipeId) {
      toast.error('Please select a recipe');
      return;
    }
    if (!activationDate) {
      toast.error('Please select an activation date and time');
      return;
    }
    onSave();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Select Recipe</Label>
        <select
          className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-md"
          value={selectedRecipeId}
          onChange={(e) => setSelectedRecipeId(e.target.value)}
        >
          <option value="">Choose a published recipe...</option>
          {publishedRecipes.map(recipe => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name} (v{recipe.currentVersion})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Activation Date</Label>
          <Input
            type="date"
            value={activationDate}
            onChange={(e) => setActivationDate(e.target.value)}
          />
        </div>
        <div>
          <Label>Activation Time</Label>
          <Input
            type="time"
            value={activationTime}
            onChange={(e) => setActivationTime(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-slate-900 mb-1">Activation Accuracy: ±1 second</p>
            <p className="text-slate-600">
              The recipe will be activated on the Trazo Edge at the exact scheduled time. 
              All pods in "{group.name}" will inherit this recipe and begin following the 
              stage-based setpoints.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-slate-900 mb-1">Safety Guardrails Active</p>
            <p className="text-slate-600">
              Non-curtailable photoperiod windows will be preserved. Any activation that 
              conflicts with blackout windows or safety interlocks will be blocked.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Activation
        </Button>
      </div>
    </div>
  );
}

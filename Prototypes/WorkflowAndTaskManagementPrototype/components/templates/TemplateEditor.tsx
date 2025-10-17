import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { mockTemplates } from '../../lib/mockData';
import { SOPStep, EvidenceType } from '../../lib/types';
import { Plus, Trash2, GripVertical, Save, X, AlertTriangle, GitBranch } from 'lucide-react';

interface TemplateEditorProps {
  templateId: string | null;
  onClose: () => void;
}

export function TemplateEditor({ templateId, onClose }: TemplateEditorProps) {
  const isNewTemplate = !templateId || templateId === 'new';
  const isCopy = templateId?.startsWith('copy-');
  const actualTemplateId = isCopy ? templateId.replace('copy-', '') : templateId;
  
  const existingTemplate = isNewTemplate ? null : mockTemplates.find(t => t.id === actualTemplateId);

  const [name, setName] = useState(existingTemplate?.name || '');
  const [category, setCategory] = useState(existingTemplate?.category || 'Daily Operations');
  const [description, setDescription] = useState(existingTemplate?.description || '');
  const [estimatedDuration, setEstimatedDuration] = useState(existingTemplate?.estimatedDuration.toString() || '30');
  const [slaHours, setSlaHours] = useState(existingTemplate?.slaHours?.toString() || '24');
  const [steps, setSteps] = useState<SOPStep[]>(
    existingTemplate?.steps || [
      {
        id: `step-${Date.now()}`,
        order: 1,
        title: '',
        description: '',
        evidenceRequired: false
      }
    ]
  );

  const addStep = () => {
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      title: '',
      description: '',
      evidenceRequired: false
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    const filtered = steps.filter(s => s.id !== stepId);
    // Reorder remaining steps
    const reordered = filtered.map((step, idx) => ({
      ...step,
      order: idx + 1
    }));
    setSteps(reordered);
  };

  const updateStep = (stepId: string, updates: Partial<SOPStep>) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const addConditionalLogic = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const newLogic = {
      stepId,
      condition: 'equals' as const,
      value: '',
      nextStepId: steps[0]?.id || ''
    };

    updateStep(stepId, {
      isConditional: true,
      conditionalLogic: [...(step.conditionalLogic || []), newLogic]
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    if (steps.some(s => !s.title.trim())) {
      alert('All steps must have a title');
      return;
    }

    // In real app, save to backend
    alert(`Template "${name}" saved successfully!`);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">
            {isNewTemplate ? 'Create New Template' : isCopy ? 'Copy Template' : 'Edit Template'}
          </h2>
          <p className="text-slate-600">Define workflow steps and evidence requirements</p>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Filter Change"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily Operations">Daily Operations</SelectItem>
                  <SelectItem value="Calibration & Maintenance">Calibration & Maintenance</SelectItem>
                  <SelectItem value="Alarm Response">Alarm Response</SelectItem>
                  <SelectItem value="Batch Operations">Batch Operations</SelectItem>
                  <SelectItem value="Quality Control">Quality Control</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="sla">SLA (hours)</Label>
              <Input
                id="sla"
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this procedure..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Define the sequence of steps to complete this procedure</CardDescription>
            </div>
            <Button onClick={addStep}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className="border-2">
              <CardHeader className="bg-slate-50">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Step {index + 1}</CardTitle>
                      {step.isConditional && (
                        <Badge variant="secondary">
                          <GitBranch className="w-3 h-3 mr-1" />
                          Conditional
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(step.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>Step Title *</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    placeholder="e.g., Safety Check"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.id, { description: e.target.value })}
                    placeholder="Detailed instructions for this step..."
                    rows={2}
                  />
                </div>

                {/* Evidence Settings */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`evidence-${step.id}`}>Require Evidence</Label>
                    <Switch
                      id={`evidence-${step.id}`}
                      checked={step.evidenceRequired}
                      onCheckedChange={(checked) => 
                        updateStep(step.id, { 
                          evidenceRequired: checked,
                          evidenceType: checked ? 'checkbox' : undefined
                        })
                      }
                    />
                  </div>

                  {step.evidenceRequired && (
                    <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                      <div>
                        <Label>Evidence Type</Label>
                        <Select
                          value={step.evidenceType}
                          onValueChange={(value) => 
                            updateStep(step.id, { evidenceType: value as EvidenceType })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="numeric">Numeric Value</SelectItem>
                            <SelectItem value="checkbox">Checklist</SelectItem>
                            <SelectItem value="signature">Signature</SelectItem>
                            <SelectItem value="qr_scan">QR Scan</SelectItem>
                            <SelectItem value="text">Text Notes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {step.evidenceType === 'numeric' && (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Min Value</Label>
                            <Input
                              type="number"
                              placeholder="Min"
                              value={step.evidenceConfig?.minValue || ''}
                              onChange={(e) => updateStep(step.id, {
                                evidenceConfig: {
                                  ...step.evidenceConfig,
                                  minValue: parseFloat(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Max Value</Label>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={step.evidenceConfig?.maxValue || ''}
                              onChange={(e) => updateStep(step.id, {
                                evidenceConfig: {
                                  ...step.evidenceConfig,
                                  maxValue: parseFloat(e.target.value)
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              placeholder="e.g., °C"
                              value={step.evidenceConfig?.unit || ''}
                              onChange={(e) => updateStep(step.id, {
                                evidenceConfig: {
                                  ...step.evidenceConfig,
                                  unit: e.target.value
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}

                      {step.evidenceType === 'checkbox' && (
                        <div>
                          <Label>Checklist Items (one per line)</Label>
                          <Textarea
                            placeholder="Item 1&#10;Item 2&#10;Item 3"
                            value={step.evidenceConfig?.options?.join('\n') || ''}
                            onChange={(e) => updateStep(step.id, {
                              evidenceConfig: {
                                ...step.evidenceConfig,
                                options: e.target.value.split('\n').filter(Boolean)
                              }
                            })}
                            rows={3}
                          />
                        </div>
                      )}

                      {(step.evidenceType === 'qr_scan' || step.evidenceType === 'text') && (
                        <div>
                          <Label>Instructions</Label>
                          <Input
                            placeholder="Special instructions for this evidence..."
                            value={step.evidenceConfig?.requiredText || ''}
                            onChange={(e) => updateStep(step.id, {
                              evidenceConfig: {
                                ...step.evidenceConfig,
                                requiredText: e.target.value
                              }
                            })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Conditional Logic */}
                <div className="space-y-3 pt-3 border-t">
                  {!step.isConditional ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionalLogic(step.id)}
                    >
                      <GitBranch className="w-4 h-4 mr-2" />
                      Add Conditional Logic
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Conditional workflow enabled</span>
                      </div>
                      
                      {step.conditionalLogic?.map((logic, logicIdx) => (
                        <div key={logicIdx} className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label>Condition</Label>
                              <Select
                                value={logic.condition}
                                onValueChange={(value) => {
                                  const newLogic = [...(step.conditionalLogic || [])];
                                  newLogic[logicIdx] = { ...logic, condition: value as any };
                                  updateStep(step.id, { conditionalLogic: newLogic });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                  <SelectItem value="greater_than">Greater Than</SelectItem>
                                  <SelectItem value="less_than">Less Than</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Value</Label>
                              <Input
                                value={logic.value}
                                onChange={(e) => {
                                  const newLogic = [...(step.conditionalLogic || [])];
                                  newLogic[logicIdx] = { ...logic, value: e.target.value };
                                  updateStep(step.id, { conditionalLogic: newLogic });
                                }}
                                placeholder="Comparison value"
                              />
                            </div>
                            
                            <div>
                              <Label>Jump to Step</Label>
                              <Select
                                value={logic.nextStepId}
                                onValueChange={(value) => {
                                  const newLogic = [...(step.conditionalLogic || [])];
                                  newLogic[logicIdx] = { ...logic, nextStepId: value };
                                  updateStep(step.id, { conditionalLogic: newLogic });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {steps.map((s, i) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      Step {i + 1}: {s.title || 'Untitled'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newLogic = (step.conditionalLogic || []).filter((_, i) => i !== logicIdx);
                              updateStep(step.id, { 
                                conditionalLogic: newLogic.length > 0 ? newLogic : undefined,
                                isConditional: newLogic.length > 0
                              });
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addConditionalLogic(step.id)}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Add Another Condition
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No steps added yet. Click "Add Step" to begin.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save/Cancel */}
      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { mockOverrides } from '../lib/mockData';
import { Override, SetpointType } from '../types';
import { Plus, Clock, AlertTriangle, XCircle, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function OverrideControl() {
  const [overrides, setOverrides] = useState<Override[]>(mockOverrides);
  const [isCreating, setIsCreating] = useState(false);

  // Simulate countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setOverrides(current => 
        current.map(override => {
          if (override.status === 'Active' && override.expiresAt) {
            const remaining = new Date(override.expiresAt).getTime() - Date.now();
            if (remaining <= 0) {
              return { ...override, status: 'Reverted', revertedAt: new Date().toISOString() };
            }
          }
          return override;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelOverride = (overrideId: string) => {
    setOverrides(overrides.map(o => 
      o.id === overrideId 
        ? { ...o, status: 'Reverted', revertedAt: new Date().toISOString() }
        : o
    ));
    toast.success('Override cancelled and reverted');
  };

  const handleCreateOverride = () => {
    toast.success('Override activated');
    setIsCreating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Reverted': return 'bg-slate-100 text-slate-600';
      case 'Blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const calculateTimeRemaining = (expiresAt?: string): number => {
    if (!expiresAt) return 0;
    const remaining = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  };

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeOverrides = overrides.filter(o => o.status === 'Active');
  const completedOverrides = overrides.filter(o => o.status === 'Reverted');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Override Control</h2>
          <p className="text-slate-600">Manual setpoint overrides with auto-revert</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Override
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Manual Override</DialogTitle>
              <DialogDescription>
                Temporarily override environmental setpoints with auto-revert timer
              </DialogDescription>
            </DialogHeader>
            <OverrideForm onSave={handleCreateOverride} onCancel={() => setIsCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Precedence Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Control Precedence Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {['Safety', 'E-stop', 'Manual Override', 'Recipe', 'DR'].map((level, idx) => (
              <div key={level} className="flex items-center">
                <Badge variant={idx < 3 ? 'default' : 'outline'}>
                  {level}
                </Badge>
                {idx < 4 && <span className="mx-2 text-slate-400">→</span>}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Safety interlocks and emergency stops take precedence over all manual overrides
          </p>
        </CardContent>
      </Card>

      {/* Active Overrides */}
      <div>
        <h3 className="text-slate-900 mb-4">Active Overrides ({activeOverrides.length})</h3>
        {activeOverrides.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-slate-600">No active overrides</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeOverrides.map(override => {
              const timeRemaining = calculateTimeRemaining(override.expiresAt);
              const totalTime = override.ttl;
              const progress = ((totalTime - timeRemaining) / totalTime) * 100;

              return (
                <Card key={override.id} className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-slate-900">{override.scopeName}</CardTitle>
                          <Badge className={getStatusColor(override.status)}>
                            {override.status}
                          </Badge>
                          <Badge variant="outline">{override.precedence}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {override.parameter}: {override.currentValue}{override.unit} → {override.overrideValue}{override.unit}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOverride(override.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-slate-900">
                            Time Remaining: {formatTimeRemaining(timeRemaining)}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {Math.round(progress)}% elapsed
                        </span>
                      </div>
                      <Progress value={progress} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-slate-600">Initiated By</p>
                        <p className="text-sm text-slate-900">{override.actorName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Started</p>
                        <p className="text-sm text-slate-900">
                          {new Date(override.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    {override.reason && (
                      <div className="p-3 bg-white rounded border border-blue-200">
                        <p className="text-xs text-slate-600 mb-1">Reason</p>
                        <p className="text-sm text-slate-900">{override.reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Overrides */}
      {completedOverrides.length > 0 && (
        <div>
          <h3 className="text-slate-900 mb-4">Recent Completed ({completedOverrides.length})</h3>
          <div className="grid gap-4">
            {completedOverrides.map(override => (
              <Card key={override.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-slate-900">{override.scopeName}</CardTitle>
                        <Badge className={getStatusColor(override.status)}>
                          {override.status}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        {override.parameter}: {override.overrideValue}{override.unit} → {override.currentValue}{override.unit}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Initiated By</p>
                      <p className="text-slate-900">{override.actorName}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Started</p>
                      <p className="text-slate-900">
                        {new Date(override.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Reverted</p>
                      <p className="text-slate-900">
                        {override.revertedAt && new Date(override.revertedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface OverrideFormProps {
  onSave: () => void;
  onCancel: () => void;
}

function OverrideForm({ onSave, onCancel }: OverrideFormProps) {
  const [scopeName, setScopeName] = useState('');
  const [parameter, setParameter] = useState<SetpointType>('Temperature');
  const [overrideValue, setOverrideValue] = useState('');
  const [duration, setDuration] = useState('20');
  const [reason, setReason] = useState('');

  const parameters: SetpointType[] = ['Temperature', 'RH', 'CO2', 'LightIntensity', 'Photoperiod'];

  const getUnit = (param: SetpointType): string => {
    switch (param) {
      case 'Temperature': return '°C';
      case 'RH': return '%';
      case 'CO2': return 'ppm';
      case 'LightIntensity': return '%';
      case 'Photoperiod': return 'hrs';
      default: return '';
    }
  };

  const handleSubmit = () => {
    if (!scopeName || !overrideValue || !duration || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Target Scope</Label>
        <Input
          placeholder="e.g., Pod A"
          value={scopeName}
          onChange={(e) => setScopeName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Parameter</Label>
          <select
            className="w-full mt-1.5 px-3 py-2 border border-slate-300 rounded-md"
            value={parameter}
            onChange={(e) => setParameter(e.target.value as SetpointType)}
          >
            {parameters.map(param => (
              <option key={param} value={param}>{param}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Override Value</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Value"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
            />
            <span className="self-center text-sm text-slate-600 min-w-12">{getUnit(parameter)}</span>
          </div>
        </div>
      </div>

      <div>
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          placeholder="20"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      <div>
        <Label>Reason (required for audit)</Label>
        <Textarea
          placeholder="e.g., Door open for inspection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-slate-900 mb-1">Auto-Revert Enabled</p>
            <p className="text-slate-600">
              This override will automatically revert to the previous setpoint when the timer 
              expires. You can also manually cancel the override at any time.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Apply Override
        </Button>
      </div>
    </div>
  );
}

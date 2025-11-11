import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { mockSchedules } from '../lib/mockData';
import { Schedule, BlackoutWindow } from '../types';
import { Plus, Clock, Moon, Sun, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const handleCreateSchedule = () => {
    toast.success('Schedule created successfully');
    setIsCreating(false);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(s => s.id !== scheduleId));
    toast.success('Schedule deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Schedule Management</h2>
          <p className="text-slate-600">Day/night cycles and maintenance windows</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Schedule</DialogTitle>
              <DialogDescription>Define day/night cycles and blackout windows</DialogDescription>
            </DialogHeader>
            <ScheduleForm onSave={handleCreateSchedule} onCancel={() => setIsCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule List */}
      <div className="grid gap-6">
        {schedules.map(schedule => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-slate-900">{schedule.scopeName}</CardTitle>
                    <Badge variant="outline">{schedule.scope}</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    Timezone: {schedule.timezone}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSchedule(schedule)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Day/Night Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Sun className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm text-slate-600">Day Start</p>
                    <p className="text-slate-900">{schedule.dayStart}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg">
                  <Moon className="w-5 h-5 text-slate-100" />
                  <div>
                    <p className="text-sm text-slate-400">Night Start</p>
                    <p className="text-slate-100">{schedule.nightStart}</p>
                  </div>
                </div>
              </div>

              {/* Active Recipe */}
              {schedule.activeRecipeId && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Active Recipe</p>
                      <p className="text-slate-900">{schedule.activeRecipeName}</p>
                    </div>
                    {schedule.activationTime && (
                      <div className="text-right">
                        <p className="text-sm text-slate-600">Activated</p>
                        <p className="text-sm text-slate-900">
                          {new Date(schedule.activationTime).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blackout Windows */}
              {schedule.blackoutWindows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-slate-900">Blackout Windows</p>
                  </div>
                  <div className="space-y-2">
                    {schedule.blackoutWindows.map((window, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded">
                        <div className="flex items-center gap-4">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-sm text-slate-900">{window.start} - {window.end}</p>
                            <p className="text-xs text-slate-600">{window.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface ScheduleFormProps {
  schedule?: Schedule;
  onSave: () => void;
  onCancel: () => void;
}

function ScheduleForm({ schedule, onSave, onCancel }: ScheduleFormProps) {
  const [scopeName, setScopeName] = useState(schedule?.scopeName || '');
  const [dayStart, setDayStart] = useState(schedule?.dayStart || '06:00');
  const [nightStart, setNightStart] = useState(schedule?.nightStart || '18:00');
  const [blackoutWindows, setBlackoutWindows] = useState<BlackoutWindow[]>(schedule?.blackoutWindows || []);

  const addBlackoutWindow = () => {
    setBlackoutWindows([
      ...blackoutWindows,
      { start: '02:00', end: '04:00', reason: 'Maintenance window' }
    ]);
  };

  const removeBlackoutWindow = (index: number) => {
    setBlackoutWindows(blackoutWindows.filter((_, idx) => idx !== index));
  };

  const updateBlackoutWindow = (index: number, updates: Partial<BlackoutWindow>) => {
    setBlackoutWindows(blackoutWindows.map((window, idx) => 
      idx === index ? { ...window, ...updates } : window
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Scope Name</Label>
        <Input
          placeholder="e.g., Batch Group A-D"
          value={scopeName}
          onChange={(e) => setScopeName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Day Start Time</Label>
          <Input
            type="time"
            value={dayStart}
            onChange={(e) => setDayStart(e.target.value)}
          />
        </div>
        <div>
          <Label>Night Start Time</Label>
          <Input
            type="time"
            value={nightStart}
            onChange={(e) => setNightStart(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Blackout Windows</Label>
          <Button onClick={addBlackoutWindow} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Window
          </Button>
        </div>

        {blackoutWindows.map((window, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start</Label>
                  <Input
                    type="time"
                    value={window.start}
                    onChange={(e) => updateBlackoutWindow(idx, { start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    type="time"
                    value={window.end}
                    onChange={(e) => updateBlackoutWindow(idx, { end: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Reason</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Maintenance"
                      value={window.reason}
                      onChange={(e) => updateBlackoutWindow(idx, { reason: e.target.value })}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlackoutWindow(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save Schedule</Button>
      </div>
    </div>
  );
}

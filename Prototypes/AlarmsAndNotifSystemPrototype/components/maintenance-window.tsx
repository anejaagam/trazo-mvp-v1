import { useState } from 'react';
import { MaintenanceWindow } from '../types/alarm';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, Wrench, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MaintenanceWindowProps {
  windows: MaintenanceWindow[];
  onCreateWindow: (window: MaintenanceWindow) => void;
  onDeleteWindow: (id: string) => void;
}

export function MaintenanceWindowComponent({ windows, onCreateWindow, onDeleteWindow }: MaintenanceWindowProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWindow, setNewWindow] = useState({
    site: '',
    startTime: '',
    endTime: '',
    reason: '',
    suppressCritical: false,
  });
  
  const activeWindows = windows.filter(w => w.endTime > new Date());
  const pastWindows = windows.filter(w => w.endTime <= new Date());
  
  const handleCreateWindow = () => {
    if (!newWindow.site || !newWindow.startTime || !newWindow.endTime || !newWindow.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const window: MaintenanceWindow = {
      id: `MW-${Date.now()}`,
      site: newWindow.site,
      startTime: new Date(newWindow.startTime),
      endTime: new Date(newWindow.endTime),
      reason: newWindow.reason,
      suppressCritical: newWindow.suppressCritical,
      createdBy: 'Current User',
    };
    
    onCreateWindow(window);
    setIsCreateDialogOpen(false);
    setNewWindow({
      site: '',
      startTime: '',
      endTime: '',
      reason: '',
      suppressCritical: false,
    });
    toast.success('Maintenance window created');
  };
  
  const handleDeleteWindow = (id: string) => {
    if (confirm('Are you sure you want to delete this maintenance window?')) {
      onDeleteWindow(id);
      toast.success('Maintenance window deleted');
    }
  };
  
  const isWindowActive = (window: MaintenanceWindow) => {
    const now = new Date();
    return window.startTime <= now && window.endTime > now;
  };
  
  const renderWindowCard = (window: MaintenanceWindow) => {
    const active = isWindowActive(window);
    
    return (
      <Card key={window.id} className={`p-6 ${active ? 'border-orange-200 bg-orange-50' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-orange-200' : 'bg-gray-100'}`}>
              <Wrench className={`w-5 h-5 ${active ? 'text-orange-700' : 'text-gray-600'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3>{window.site}</h3>
                {active && (
                  <Badge className="bg-orange-500">
                    Active Now
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{window.reason}</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteWindow(window.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Start Time</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{format(window.startTime, 'MMM dd, yyyy h:mm a')}</span>
            </div>
          </div>
          
          <div>
            <Label>End Time</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{format(window.endTime, 'MMM dd, yyyy h:mm a')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center gap-2">
            {window.suppressCritical ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <Label>Critical Alarms</Label>
              <p className="text-gray-600">
                {window.suppressCritical ? 'Suppressed during maintenance' : 'Still active during maintenance'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-gray-500">
          Created by {window.createdBy}
        </div>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Maintenance Windows</h1>
          <p className="text-gray-600">Schedule maintenance to suppress non-critical alarms</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Schedule Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance Window</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Site</Label>
                <Input
                  placeholder="e.g., Facility North"
                  value={newWindow.site}
                  onChange={(e) => setNewWindow({ ...newWindow, site: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={newWindow.startTime}
                    onChange={(e) => setNewWindow({ ...newWindow, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newWindow.endTime}
                    onChange={(e) => setNewWindow({ ...newWindow, endTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label>Reason for Maintenance</Label>
                <Textarea
                  placeholder="e.g., HVAC System Upgrade"
                  value={newWindow.reason}
                  onChange={(e) => setNewWindow({ ...newWindow, reason: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <Label>Suppress Critical Alarms</Label>
                    <p className="text-gray-600">Also suppress critical severity alarms during this window</p>
                  </div>
                </div>
                <Switch
                  checked={newWindow.suppressCritical}
                  onCheckedChange={(checked) => setNewWindow({ ...newWindow, suppressCritical: checked })}
                />
              </div>
              
              <Button onClick={handleCreateWindow} className="w-full">
                Create Maintenance Window
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-blue-900 mb-2">About Maintenance Mode</h3>
        <p className="text-blue-800">
          During a maintenance window, alarms from the specified site will be suppressed based on your configuration. 
          By default, only warning and info level alarms are suppressed. Critical alarms will still be raised unless explicitly suppressed.
        </p>
      </Card>
      
      {/* Active Windows */}
      {activeWindows.length > 0 && (
        <div>
          <h2 className="mb-4">Active & Upcoming</h2>
          <div className="space-y-4">
            {activeWindows.map(window => renderWindowCard(window))}
          </div>
        </div>
      )}
      
      {/* Past Windows */}
      {pastWindows.length > 0 && (
        <div>
          <h2 className="mb-4">Past Maintenance</h2>
          <div className="space-y-4">
            {pastWindows.map(window => renderWindowCard(window))}
          </div>
        </div>
      )}
      
      {windows.length === 0 && (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No maintenance windows scheduled</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Your First Maintenance Window
          </Button>
        </Card>
      )}
    </div>
  );
}

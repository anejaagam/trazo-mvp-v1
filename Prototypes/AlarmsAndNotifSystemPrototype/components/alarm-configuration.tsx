import { useState } from 'react';
import { AlarmThreshold } from '../types/alarm';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Settings, Thermometer, Droplet, Sprout, Bell, FileX, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AlarmConfigurationProps {
  thresholds: AlarmThreshold[];
  onUpdateThreshold: (threshold: AlarmThreshold) => void;
  onCreateThreshold: (threshold: AlarmThreshold) => void;
}

const categoryIcons = {
  environmental: Thermometer,
  equipment: Settings,
  irrigation: Droplet,
  system: Bell,
  compliance: FileX,
  security: Shield,
};

export function AlarmConfiguration({ thresholds, onUpdateThreshold, onCreateThreshold }: AlarmConfigurationProps) {
  const [editingThreshold, setEditingThreshold] = useState<AlarmThreshold | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const environmentalThresholds = thresholds.filter(t => t.category === 'environmental');
  const equipmentThresholds = thresholds.filter(t => t.category === 'equipment');
  const irrigationThresholds = thresholds.filter(t => t.category === 'irrigation');
  const systemThresholds = thresholds.filter(t => t.category === 'system');
  const complianceThresholds = thresholds.filter(t => t.category === 'compliance');
  const securityThresholds = thresholds.filter(t => t.category === 'security');
  
  const handleToggleThreshold = (threshold: AlarmThreshold) => {
    onUpdateThreshold({ ...threshold, enabled: !threshold.enabled });
    toast.success(threshold.enabled ? 'Threshold disabled' : 'Threshold enabled');
  };
  
  const handleUpdateValue = (threshold: AlarmThreshold, field: 'minValue' | 'maxValue', value: number) => {
    onUpdateThreshold({ ...threshold, [field]: value });
    toast.success('Threshold updated');
  };
  
  const handleUpdateSeverity = (threshold: AlarmThreshold, severity: string) => {
    onUpdateThreshold({ ...threshold, severity: severity as any });
    toast.success('Severity updated');
  };
  
  const renderThresholdCard = (threshold: AlarmThreshold) => {
    const Icon = categoryIcons[threshold.category];
    
    return (
      <Card key={threshold.id} className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${threshold.enabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3>{threshold.type}</h3>
                  <Badge variant="outline" className={
                    threshold.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    threshold.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }>
                    {threshold.severity}
                  </Badge>
                </div>
                {threshold.site && <p className="text-gray-600">Site: {threshold.site}</p>}
                {threshold.room && <p className="text-gray-600">Room: {threshold.room}</p>}
              </div>
              
              <Switch
                checked={threshold.enabled}
                onCheckedChange={() => handleToggleThreshold(threshold)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {threshold.minValue !== undefined && (
                <div>
                  <Label>Minimum Value</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={threshold.minValue}
                      onChange={(e) => handleUpdateValue(threshold, 'minValue', parseFloat(e.target.value))}
                      disabled={!threshold.enabled}
                    />
                    <span className="text-gray-600">{threshold.unit}</span>
                  </div>
                </div>
              )}
              
              {threshold.maxValue !== undefined && (
                <div>
                  <Label>Maximum Value</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={threshold.maxValue}
                      onChange={(e) => handleUpdateValue(threshold, 'maxValue', parseFloat(e.target.value))}
                      disabled={!threshold.enabled}
                    />
                    <span className="text-gray-600">{threshold.unit}</span>
                  </div>
                </div>
              )}
              
              <div>
                <Label>Severity</Label>
                <Select
                  value={threshold.severity}
                  onValueChange={(value) => handleUpdateSeverity(threshold, value)}
                  disabled={!threshold.enabled}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Alarm Configuration</h1>
          <p className="text-gray-600">Configure thresholds and alarm parameters</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Threshold
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Threshold</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-600">Threshold creation form would go here</p>
              <Button onClick={() => {
                toast.success('Threshold created');
                setIsCreateDialogOpen(false);
              }}>
                Create Threshold
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs by Category */}
      <Tabs defaultValue="environmental" className="w-full">
        <TabsList>
          <TabsTrigger value="environmental">
            Environmental
            <Badge variant="secondary" className="ml-2">{environmentalThresholds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="equipment">
            Equipment
            <Badge variant="secondary" className="ml-2">{equipmentThresholds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="irrigation">
            Irrigation
            <Badge variant="secondary" className="ml-2">{irrigationThresholds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="system">
            System
            <Badge variant="secondary" className="ml-2">{systemThresholds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="compliance">
            Compliance
            <Badge variant="secondary" className="ml-2">{complianceThresholds.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="security">
            Security
            <Badge variant="secondary" className="ml-2">{securityThresholds.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="environmental" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>Environmental Thresholds</h3>
            <p className="text-gray-600">Temperature, humidity, and CO₂ monitoring</p>
          </div>
          {environmentalThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
        
        <TabsContent value="equipment" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>Equipment Thresholds</h3>
            <p className="text-gray-600">Device offline, sensor faults, and communication loss</p>
          </div>
          {equipmentThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
        
        <TabsContent value="irrigation" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>Irrigation Thresholds</h3>
            <p className="text-gray-600">Flow, pressure, and tank level monitoring</p>
          </div>
          {irrigationThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>System Thresholds</h3>
            <p className="text-gray-600">Edge connectivity, recipe compliance, and calibration</p>
          </div>
          {systemThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>Compliance Thresholds</h3>
            <p className="text-gray-600">Metrc sync errors, task reminders, harvest deadlines, and test failures</p>
          </div>
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <p className="text-blue-900">
              Compliance alarms are critical for regulatory adherence and quality assurance. 
              These alerts ensure timely action on Metrc API errors, approaching deadlines, 
              and failed lab tests.
            </p>
          </Card>
          {complianceThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4 mt-6">
          <div className="mb-4">
            <h3>Security Thresholds</h3>
            <p className="text-gray-600">Camera offline, intrusion alarms, and access control faults</p>
          </div>
          <Card className="p-4 mb-4 bg-orange-50 border-orange-200">
            <p className="text-orange-900">
              Security incident alerts are essential for facility protection and regulatory compliance. 
              Immediate notification ensures rapid response to potential security breaches.
            </p>
          </Card>
          {securityThresholds.map(threshold => renderThresholdCard(threshold))}
        </TabsContent>
      </Tabs>
      
      {/* Global Settings */}
      <Card className="p-6">
        <h3 className="mb-4">Global Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Deduplication Window</Label>
              <p className="text-gray-600">Prevent duplicate alarms within this time period</p>
            </div>
            <Select defaultValue="5">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Resolve Timeout</Label>
              <p className="text-gray-600">Automatically resolve alarms if condition clears</p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Daily Digest</Label>
              <p className="text-gray-600">Send daily alarm summary to leadership</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}

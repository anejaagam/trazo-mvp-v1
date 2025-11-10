import { useState } from 'react';
import { EscalationPolicy } from '../types/alarm';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, MoveUp, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface EscalationPolicyProps {
  policies: EscalationPolicy[];
  onUpdatePolicy: (policy: EscalationPolicy) => void;
  onCreatePolicy: (policy: EscalationPolicy) => void;
  onDeletePolicy: (id: string) => void;
}

export function EscalationPolicyComponent({ policies, onUpdatePolicy, onCreatePolicy, onDeletePolicy }: EscalationPolicyProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const handleUpdateInterval = (policy: EscalationPolicy, index: number, value: number) => {
    const newIntervals = [...policy.intervals];
    newIntervals[index] = value;
    onUpdatePolicy({ ...policy, intervals: newIntervals });
    toast.success('Escalation interval updated');
  };
  
  const handleTogglePush = (policy: EscalationPolicy, level: number) => {
    const newRecipients = policy.recipients.map(r => 
      r.level === level ? { ...r, pushEnabled: !r.pushEnabled } : r
    );
    onUpdatePolicy({ ...policy, recipients: newRecipients });
    toast.success('Push notification setting updated');
  };
  
  const handleUpdateEmail = (policy: EscalationPolicy, level: number, email: string) => {
    const newRecipients = policy.recipients.map(r => 
      r.level === level ? { ...r, email } : r
    );
    onUpdatePolicy({ ...policy, recipients: newRecipients });
  };
  
  const handleAddRecipient = (policy: EscalationPolicy) => {
    const newLevel = policy.recipients.length;
    const newRecipients = [...policy.recipients, {
      level: newLevel,
      email: '',
      pushEnabled: true,
    }];
    const newIntervals = [...policy.intervals, 30];
    onUpdatePolicy({ ...policy, recipients: newRecipients, intervals: newIntervals });
    toast.success('Escalation level added');
  };
  
  const handleRemoveRecipient = (policy: EscalationPolicy, level: number) => {
    if (policy.recipients.length <= 1) {
      toast.error('Policy must have at least one recipient');
      return;
    }
    const newRecipients = policy.recipients.filter(r => r.level !== level).map((r, idx) => ({ ...r, level: idx }));
    const newIntervals = policy.intervals.slice(0, -1);
    onUpdatePolicy({ ...policy, recipients: newRecipients, intervals: newIntervals });
    toast.success('Escalation level removed');
  };
  
  const handleDeletePolicy = (id: string) => {
    if (confirm('Are you sure you want to delete this escalation policy?')) {
      onDeletePolicy(id);
      toast.success('Escalation policy deleted');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Escalation Policies</h1>
          <p className="text-gray-600">Configure alarm routing and escalation ladders</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Escalation Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Policy Name</Label>
                <Input placeholder="e.g., Critical Equipment Policy" className="mt-1" />
              </div>
              <div>
                <Label>Site</Label>
                <Input placeholder="e.g., Facility North" className="mt-1" />
              </div>
              <Button onClick={() => {
                toast.success('Policy created');
                setIsCreateDialogOpen(false);
              }}>
                Create Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-blue-900 mb-2">How Escalation Works</h3>
        <p className="text-blue-800">
          When an alarm is raised, notifications are sent to Level 0 recipients. If the alarm is not acknowledged within the specified interval, 
          it escalates to the next level. This continues until the alarm is acknowledged or all levels are exhausted.
        </p>
        <div className="mt-3 flex gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Standard intervals: 5, 10, 15, 30 minutes
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
            Push and email notifications
          </Badge>
        </div>
      </Card>
      
      {/* Policies */}
      <div className="space-y-6">
        {policies.map(policy => (
          <Card key={policy.id} className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2>{policy.name}</h2>
                <p className="text-gray-600">Site: {policy.site}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeletePolicy(policy.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
            
            {/* Escalation Ladder */}
            <div className="space-y-4">
              {policy.recipients.map((recipient, idx) => (
                <div key={recipient.level}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      Level {recipient.level}
                    </Badge>
                    {idx > 0 && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MoveUp className="w-4 h-4" />
                        <span>Escalates after</span>
                        <Input
                          type="number"
                          value={policy.intervals[idx - 1]}
                          onChange={(e) => handleUpdateInterval(policy, idx - 1, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span>minutes</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Label>Email Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          value={recipient.email}
                          onChange={(e) => handleUpdateEmail(policy, recipient.level, e.target.value)}
                          placeholder="recipient@facility.com"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 pt-6">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-600" />
                        <Label>Push</Label>
                      </div>
                      <Switch
                        checked={recipient.pushEnabled}
                        onCheckedChange={() => handleTogglePush(policy, recipient.level)}
                      />
                    </div>
                    
                    {policy.recipients.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRecipient(policy, recipient.level)}
                        className="mt-6"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => handleAddRecipient(policy)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Escalation Level
            </Button>
          </Card>
        ))}
      </div>
      
      {policies.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No escalation policies configured</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Policy
          </Button>
        </Card>
      )}
    </div>
  );
}

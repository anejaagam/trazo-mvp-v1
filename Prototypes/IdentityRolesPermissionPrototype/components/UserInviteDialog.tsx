import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mockRoles, mockSites, mockRooms } from '../lib/mock-data';
import { ScopeType } from '../lib/supabase';

interface UserInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: {
    email: string;
    role: string;
    scopeType: ScopeType;
    scopeId: string;
  }) => void;
}

export function UserInviteDialog({ open, onClose, onInvite }: UserInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('org');
  const [scopeId, setScopeId] = useState('org-001');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({ email, role: roleId, scopeType, scopeId });
    // Reset form
    setEmail('');
    setRoleId('');
    setScopeType('org');
    setScopeId('org-001');
  };

  const getScopeOptions = () => {
    if (scopeType === 'org') {
      return [{ id: 'org-001', name: 'Trazo Inc' }];
    } else if (scopeType === 'site') {
      return mockSites;
    } else if (scopeType === 'room') {
      return mockRooms;
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation with a role and scope assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={roleId} onValueChange={setRoleId} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {mockRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div>
                      <div>{role.display_name}</div>
                      <div className="text-xs text-slate-500">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scopeType">Scope Type</Label>
              <Select 
                value={scopeType} 
                onValueChange={(val) => {
                  setScopeType(val as ScopeType);
                  // Reset scope ID when type changes
                  if (val === 'org') setScopeId('org-001');
                  else if (val === 'site') setScopeId(mockSites[0].id);
                  else if (val === 'room') setScopeId(mockRooms[0].id);
                }}
              >
                <SelectTrigger id="scopeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Organization</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="batch_group">Batch Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scopeId">Scope</Label>
              <Select value={scopeId} onValueChange={setScopeId}>
                <SelectTrigger id="scopeId">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getScopeOptions().map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
            <p className="text-slate-600">
              The user will receive an email invitation. They can accept using email/password or SSO.
            </p>
            <p className="text-slate-600">
              Role binding will be created: <span className="font-mono text-xs">
                {scopeType}:{scopeId}
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email || !roleId}>
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

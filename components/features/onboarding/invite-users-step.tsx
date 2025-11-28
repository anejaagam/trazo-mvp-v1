"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Users, 
  Mail, 
  UserPlus, 
  Trash2, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import type { OnboardingStepProps } from "./types";

interface InvitedUser {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'sent' | 'error';
}

const AVAILABLE_ROLES = [
  { value: 'site_manager', label: 'Site Manager' },
  { value: 'head_grower', label: 'Head Grower' },
  { value: 'operator', label: 'Operator' },
  { value: 'compliance_qa', label: 'Compliance/QA Manager' },
  { value: 'executive_viewer', label: 'Executive Viewer' },
];

export function InviteUsersStep({ organization, onComplete, onSkip }: OnboardingStepProps) {
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addUser() {
    if (!newEmail || !newRole) {
      setError("Please enter an email and select a role");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (invitedUsers.some(u => u.email.toLowerCase() === newEmail.toLowerCase())) {
      setError("This email has already been added");
      return;
    }

    setInvitedUsers([
      ...invitedUsers,
      {
        id: crypto.randomUUID(),
        email: newEmail,
        role: newRole,
        status: 'pending'
      }
    ]);
    setNewEmail("");
    setNewRole("");
    setError("");
  }

  function removeUser(id: string) {
    setInvitedUsers(invitedUsers.filter(u => u.id !== id));
  }

  async function handleSendInvites() {
    if (invitedUsers.length === 0) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Send invitations one by one via API (which sends actual emails)
      for (const invitedUser of invitedUsers) {
        if (invitedUser.status !== 'pending') continue;
        
        try {
          const response = await fetch('/api/admin/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: invitedUser.email,
              role: invitedUser.role,
              organizationId: organization.id,
              fullName: invitedUser.email.split('@')[0],
            }),
          });

          if (response.ok) {
            // Mark as sent
            setInvitedUsers(prev => 
              prev.map(u => u.id === invitedUser.id ? { ...u, status: 'sent' as const } : u)
            );
          } else {
            const errorData = await response.json();
            console.error('Invite failed:', errorData.error);
            // Mark as error but continue with others
            setInvitedUsers(prev => 
              prev.map(u => u.id === invitedUser.id ? { ...u, status: 'error' as const } : u)
            );
          }
        } catch (err) {
          console.error('Invite request error:', err);
          setInvitedUsers(prev => 
            prev.map(u => u.id === invitedUser.id ? { ...u, status: 'error' as const } : u)
          );
        }
      }

      // Wait a moment so user can see the results
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onComplete();
    } catch (err) {
      console.error('Error sending invites:', err);
      setError('Some invitations failed. You can retry from User Management later.');
      // Continue anyway after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingCount = invitedUsers.filter(u => u.status === 'pending').length;
  const sentCount = invitedUsers.filter(u => u.status === 'sent').length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand-lighter-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-brand-lighter-green-600" />
        </div>
        <h2 className="font-display font-bold text-3xl text-secondary-800 mb-2">
          Invite Your Team
        </h2>
        <p className="text-secondary-500">
          Add team members and assign their roles. They&apos;ll receive an email invitation to join.
        </p>
      </div>

      {/* Add User Form */}
      <div className="bg-white border-2 border-secondary-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Role
            </label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-[50px] border-2 border-secondary-200 rounded-xl">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={addUser}
              variant="outline"
              className="h-[50px] px-4 border-2"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Invited Users List */}
      {invitedUsers.length > 0 && (
        <div className="bg-white border-2 border-secondary-200 rounded-2xl overflow-hidden mb-6">
          <div className="p-4 border-b border-secondary-100 bg-secondary-50">
            <h3 className="font-medium text-secondary-800">
              Team Members ({invitedUsers.length})
            </h3>
          </div>
          <div className="divide-y divide-secondary-100">
            {invitedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <span className="text-secondary-600 font-medium">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">{user.email}</p>
                    <p className="text-sm text-secondary-500">
                      {AVAILABLE_ROLES.find(r => r.value === user.role)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.status === 'sent' && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" /> Sent
                    </span>
                  )}
                  {user.status === 'error' && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" /> Failed
                    </span>
                  )}
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-2 text-secondary-400 hover:text-red-500 transition-colors"
                    disabled={isSubmitting}
                    title="Remove user"
                    aria-label="Remove user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invitedUsers.length === 0 && (
        <div className="text-center py-8 px-4 border-2 border-dashed border-secondary-200 rounded-2xl mb-6">
          <Users className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">
            No team members added yet. Add emails above to invite your team.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1 h-12 text-base font-semibold border-2 border-secondary-300 rounded-3xl"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleSendInvites}
          disabled={isSubmitting}
          loading={isSubmitting}
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          {invitedUsers.length > 0 
            ? `Send ${pendingCount > 0 ? pendingCount : ''} Invite${pendingCount !== 1 ? 's' : ''} & Continue`
            : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

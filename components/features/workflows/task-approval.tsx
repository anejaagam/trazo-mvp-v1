'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, SOPTemplate, TaskEvidence } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  Image,
  Signature,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskApprovalProps {
  task: Task;
  template: SOPTemplate | null;
  onApprove: (notes?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function TaskApproval({ task, template, onApprove, onReject, onClose }: TaskApprovalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(approvalNotes || undefined);
      toast({
        title: 'Task Approved',
        description: 'The task has been approved successfully.',
      });
      router.push('/dashboard/workflows');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve task',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this task.',
        variant: 'destructive',
      });
      return;
    }

    setIsRejecting(true);
    try {
      await onReject(rejectionReason);
      toast({
        title: 'Task Rejected',
        description: 'The task has been rejected.',
      });
      router.push('/dashboard/workflows');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject task',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="h-4 w-4" />;
      case 'signature': return <Signature className="h-4 w-4" />;
      case 'numeric': return <Hash className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const evidence = task.evidence as TaskEvidence[] || [];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Task Awaiting Approval
              </CardTitle>
              <CardDescription className="mt-1">
                Review the completed task and evidence before approving or rejecting.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Awaiting Approval
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              {task.description && (
                <p className="text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {task.completed_at && (
                <div>
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="ml-2 font-medium">
                    {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                  </span>
                </div>
              )}
              {task.actual_duration_minutes && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{task.actual_duration_minutes} minutes</span>
                </div>
              )}
              {task.approval_role && (
                <div>
                  <span className="text-muted-foreground">Required Approver:</span>
                  <span className="ml-2 font-medium capitalize">
                    {task.approval_role.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>

            {task.completion_notes && (
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm text-muted-foreground">Completion Notes</Label>
                <p className="mt-1">{task.completion_notes}</p>
              </div>
            )}
          </div>

          {/* Evidence Review */}
          {evidence.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Evidence Collected ({evidence.length} items)
              </h4>
              <div className="space-y-2">
                {evidence.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="p-2 bg-background rounded">
                      {getEvidenceIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{item.type}</span>
                        {item.stepId && (
                          <span className="text-xs text-muted-foreground">
                            Step: {item.stepId}
                          </span>
                        )}
                      </div>
                      {item.type === 'numeric' && (
                        <p className="text-sm mt-1">
                          Value: <span className="font-mono">{item.value}</span>
                        </p>
                      )}
                      {item.type === 'text' && (
                        <p className="text-sm mt-1 text-muted-foreground">{String(item.value)}</p>
                      )}
                      {item.type === 'photo' && item.value && (
                        <img 
                          src={String(item.value)} 
                          alt="Evidence photo" 
                          className="mt-2 max-h-32 rounded object-cover"
                        />
                      )}
                      {item.type === 'signature' && item.value && (
                        <img 
                          src={String(item.value)} 
                          alt="Signature" 
                          className="mt-2 max-h-20 bg-white rounded border p-1"
                        />
                      )}
                      {item.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Captured: {new Date(item.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval/Rejection Forms */}
          {!showRejectForm ? (
            <div className="space-y-3">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Rejecting this task will require it to be re-done. Please provide a clear reason.
                </AlertDescription>
              </Alert>
              <Label htmlFor="rejection-reason">Rejection Reason (Required)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this task is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="border-red-200 focus:border-red-400"
              />
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflows
            </Button>

            <div className="flex items-center gap-3">
              {!showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isApproving ? 'Approving...' : 'Approve Task'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting || !rejectionReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

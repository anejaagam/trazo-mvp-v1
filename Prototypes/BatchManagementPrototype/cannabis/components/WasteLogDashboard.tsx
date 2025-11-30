import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { WasteLog, WasteStatus } from '../types/waste';
import { Trash2, Plus, CheckCircle, XCircle, Clock, FileText, Eye } from 'lucide-react';

interface WasteLogDashboardProps {
  wasteLogs: WasteLog[];
  onCreateNew: () => void;
  onApprove: (logId: string, reviewedBy: string, reviewNotes: string) => void;
  onReject: (logId: string, reviewedBy: string, reviewNotes: string) => void;
  userRole?: 'technician' | 'compliance_manager';
}

const statusColors: Record<WasteStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  reported_to_metrc: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<WasteStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  reported_to_metrc: 'Reported to Metrc',
};

export function WasteLogDashboard({ 
  wasteLogs, 
  onCreateNew, 
  onApprove, 
  onReject,
  userRole = 'technician'
}: WasteLogDashboardProps) {
  const [selectedLog, setSelectedLog] = useState<WasteLog | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const pendingLogs = wasteLogs.filter(l => l.status === 'pending_approval');
  const approvedLogs = wasteLogs.filter(l => l.status === 'approved' || l.status === 'reported_to_metrc');

  const handleOpenReview = (log: WasteLog, action: 'approve' | 'reject') => {
    setSelectedLog(log);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedLog || !reviewerName.trim()) return;

    if (reviewAction === 'approve') {
      onApprove(selectedLog.id, reviewerName.trim(), reviewNotes);
    } else {
      onReject(selectedLog.id, reviewerName.trim(), reviewNotes);
    }

    setReviewDialogOpen(false);
    setSelectedLog(null);
    setReviewerName('');
    setReviewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Logs</p>
              <p className="text-gray-900">{wasteLogs.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Pending Approval</p>
              <p className="text-gray-900">{pendingLogs.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Approved</p>
              <p className="text-gray-900">{approvedLogs.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Waste</p>
              <p className="text-gray-900">
                {wasteLogs.reduce((sum, log) => sum + log.plantMaterialWeight, 0).toFixed(1)} kg
              </p>
            </div>
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Waste Disposal Logs</h2>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Waste Log
        </Button>
      </div>

      {/* Pending Approval Section (for Compliance Manager) */}
      {userRole === 'compliance_manager' && pendingLogs.length > 0 && (
        <div>
          <h3 className="text-gray-900 mb-3">Pending Approval</h3>
          <div className="space-y-3">
            {pendingLogs.map(log => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-gray-900">Waste Log {log.id}</h4>
                      <Badge className={statusColors[log.status]}>
                        {statusLabels[log.status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-gray-500">Plant Material</p>
                        <p className="text-gray-900">{log.plantMaterialWeight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Weight</p>
                        <p className="text-gray-900">{log.totalWeight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Mixing Ratio</p>
                        <p className="text-gray-900">{log.mixingRatio.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Created By</p>
                        <p className="text-gray-900">{log.createdBy}</p>
                      </div>
                    </div>

                    <p className="text-gray-600">{log.notes}</p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReview(log, 'approve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReview(log, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Logs */}
      <div>
        <h3 className="text-gray-900 mb-3">All Waste Logs</h3>
        <div className="space-y-3">
          {wasteLogs.map(log => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-gray-900">Waste Log {log.id}</h4>
                      <Badge className={statusColors[log.status]}>
                        {statusLabels[log.status]}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{log.wasteType.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <p className="text-gray-500">
                  {new Date(log.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                <div>
                  <p className="text-gray-500">Plant Material</p>
                  <p className="text-gray-900">{log.plantMaterialWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Non-Plant Material</p>
                  <p className="text-gray-900">{log.nonPlantMaterialWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="text-gray-900">{log.totalWeight} kg</p>
                </div>
                <div>
                  <p className="text-gray-500">Mixing Ratio</p>
                  <p className="text-gray-900">{log.mixingRatio.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Created By</p>
                  <p className="text-gray-900">{log.createdBy}</p>
                </div>
              </div>

              {log.notes && (
                <p className="text-gray-600 mb-3">{log.notes}</p>
              )}

              {log.evidenceUrls.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {log.evidenceUrls.slice(0, 3).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Evidence"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                  {log.evidenceUrls.length > 3 && (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-600">+{log.evidenceUrls.length - 3}</p>
                    </div>
                  )}
                </div>
              )}

              {log.reviewedBy && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-gray-500">
                    Reviewed by {log.reviewedBy} on {log.reviewedAt && new Date(log.reviewedAt).toLocaleDateString()}
                  </p>
                  {log.reviewNotes && (
                    <p className="text-gray-600 mt-1">{log.reviewNotes}</p>
                  )}
                </div>
              )}

              {log.metrcReportedAt && (
                <div className="border-t pt-3 mt-3">
                  <p className="text-blue-600">
                    ✓ Reported to Metrc on {new Date(log.metrcReportedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </Card>
          ))}

          {wasteLogs.length === 0 && (
            <Card className="p-8 text-center">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No waste logs found</p>
              <p className="text-gray-500 mb-4">
                Create your first waste disposal log to track cannabis waste
              </p>
              <Button onClick={onCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Waste Log
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Waste Log
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to {reviewAction} waste log {selectedLog?.id}.
                </p>

                {selectedLog && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div>
                      <p className="text-gray-500">Plant Material Weight:</p>
                      <p className="text-gray-900">{selectedLog.plantMaterialWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mixing Ratio:</p>
                      <p className="text-gray-900">{selectedLog.mixingRatio.toFixed(1)}% non-plant material</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created By:</p>
                      <p className="text-gray-900">{selectedLog.createdBy}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reviewer-name">
                    Compliance Manager Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="reviewer-name"
                    placeholder="Enter your full name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-notes">
                    Review Notes {reviewAction === 'reject' && <span className="text-red-600">*</span>}
                  </Label>
                  <Textarea
                    id="review-notes"
                    placeholder={
                      reviewAction === 'approve'
                        ? 'Add any comments (optional)'
                        : 'Explain why this log is being rejected'
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {reviewAction === 'approve' && (
                  <p className="text-gray-600">
                    Approved logs will be automatically reported to Metrc.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setReviewerName('');
              setReviewNotes('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitReview}
              disabled={!reviewerName.trim() || (reviewAction === 'reject' && !reviewNotes.trim())}
            >
              {reviewAction === 'approve' ? 'Approve & Report to Metrc' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { batchReleases } from '../../lib/mockData';
import { BatchRelease } from '../../lib/types';
import { CheckCircle2, XCircle, Clock, Package, FileText, AlertTriangle, Shield } from 'lucide-react';

export function BatchReleasePanel() {
  const [selectedBatch, setSelectedBatch] = useState<BatchRelease | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const pendingBatches = batchReleases.filter(b => b.status === 'pending');
  const recentBatches = batchReleases.filter(b => b.status !== 'pending').slice(0, 3);

  const handleApprove = () => {
    if (!selectedBatch) return;
    alert(`Batch ${selectedBatch.batchId} approved for release!`);
    setSelectedBatch(null);
    setShowApprovalDialog(false);
    setReviewNotes('');
  };

  const handleReject = () => {
    if (!selectedBatch || !reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    alert(`Batch ${selectedBatch.batchId} rejected. Reason: ${reviewNotes}`);
    setSelectedBatch(null);
    setShowApprovalDialog(false);
    setReviewNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Batch Release Gating
        </h2>
        <p className="text-slate-600">QA/Compliance approval required for harvest lot release</p>
      </div>

      {/* Pending Approvals Alert */}
      {pendingBatches.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            {pendingBatches.length} batch{pendingBatches.length !== 1 ? 'es' : ''} awaiting approval
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Approvals
          </CardTitle>
          <CardDescription>
            Batches requiring QA/Compliance review before release
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingBatches.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No pending batch approvals</p>
          ) : (
            pendingBatches.map(batch => (
              <Card key={batch.id} className="border-2 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-slate-600" />
                        <h3 className="text-slate-900">{batch.batchId}</h3>
                        <Badge variant="outline">{batch.status}</Badge>
                      </div>
                      <p className="text-slate-600">{batch.productName}</p>
                      <p className="text-slate-500">
                        Harvested: {batch.harvestDate.toLocaleDateString()}
                      </p>
                      <p className="text-slate-500">
                        Submitted: {batch.submittedAt.toLocaleString()} by {batch.submittedBy}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setShowApprovalDialog(true);
                      }}
                      variant="default"
                    >
                      Review
                    </Button>
                  </div>

                  {/* Test Results Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 pt-4 border-t">
                    {batch.testResults.map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {test.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <div className="text-slate-900">{test.name}</div>
                          <div className="text-slate-600">{test.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {batch.notes && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-600">{batch.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
          <CardDescription>Recently reviewed batch releases</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentBatches.map(batch => (
            <div key={batch.id} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-900">{batch.batchId}</span>
                  <Badge variant={batch.status === 'approved' ? 'default' : 'destructive'}>
                    {batch.status}
                  </Badge>
                </div>
                <p className="text-slate-600">{batch.productName}</p>
                {batch.reviewedBy && batch.reviewedAt && (
                  <p className="text-slate-500">
                    {batch.status === 'approved' ? 'Approved' : 'Rejected'} by {batch.reviewedBy} on {batch.reviewedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
              {batch.status === 'approved' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {showApprovalDialog && selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Batch Release Review
              </CardTitle>
              <CardDescription>
                Review and approve/reject batch for packaging and distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="text-slate-600">Batch ID</label>
                  <p className="text-slate-900">{selectedBatch.batchId}</p>
                </div>
                <div>
                  <label className="text-slate-600">Product</label>
                  <p className="text-slate-900">{selectedBatch.productName}</p>
                </div>
                <div>
                  <label className="text-slate-600">Harvest Date</label>
                  <p className="text-slate-900">{selectedBatch.harvestDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-slate-600">Submitted By</label>
                  <p className="text-slate-900">{selectedBatch.submittedBy}</p>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Test Results
                </h3>
                <div className="space-y-2">
                  {selectedBatch.testResults.map((test, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        test.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {test.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <div className="text-slate-900">{test.name}</div>
                          <div className={test.passed ? 'text-green-700' : 'text-red-700'}>
                            {test.value}
                          </div>
                        </div>
                      </div>
                      <Badge variant={test.passed ? 'default' : 'destructive'}>
                        {test.passed ? 'Pass' : 'Fail'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes from Submitter */}
              {selectedBatch.notes && (
                <div>
                  <h3 className="text-slate-900 mb-2">Submitter Notes</h3>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-slate-700">{selectedBatch.notes}</p>
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <h3 className="text-slate-900 mb-2">Review Notes</h3>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision (required for rejection)..."
                  rows={4}
                />
              </div>

              {/* All tests must pass warning */}
              {selectedBatch.testResults.some(t => !t.passed) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    Warning: Some test results have failed. This batch should not be approved for release.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setSelectedBatch(null);
                    setReviewNotes('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Batch
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={selectedBatch.testResults.some(t => !t.passed)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve for Release
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Batch } from '../types/batch';
import { AlertTriangle, ShieldAlert, CheckCircle, Lock } from 'lucide-react';

interface QuarantineManagementProps {
  batch: Batch;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onRelease: (batchId: string, authorizedBy: string, notes: string) => void;
}

export function QuarantineManagement({ batch, onQuarantine, onRelease }: QuarantineManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'quarantine' | 'release'>('quarantine');
  const [reason, setReason] = useState('');
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [notes, setNotes] = useState('');

  const isQuarantined = batch.quarantineStatus === 'quarantined';

  const handleOpenQuarantine = () => {
    setAction('quarantine');
    setDialogOpen(true);
  };

  const handleOpenRelease = () => {
    setAction('release');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!authorizedBy.trim()) return;

    if (action === 'quarantine' && reason.trim()) {
      onQuarantine(batch.id, reason.trim(), authorizedBy.trim());
    } else if (action === 'release') {
      onRelease(batch.id, authorizedBy.trim(), notes.trim());
    }

    setDialogOpen(false);
    setReason('');
    setAuthorizedBy('');
    setNotes('');
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600" />
            <h3 className="text-gray-900">Quarantine Status</h3>
          </div>
          
          {isQuarantined ? (
            <Badge className="bg-red-100 text-red-800">
              <Lock className="w-3 h-3 mr-1" />
              Quarantined
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>

        {isQuarantined ? (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <p className="text-red-900 mb-2">This batch is currently in quarantine.</p>
                <p className="text-red-800">
                  Material cannot be moved or processed until released by authorized personnel.
                </p>
              </AlertDescription>
            </Alert>

            {batch.quarantineReason && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Quarantine Reason</p>
                <p className="text-gray-900">{batch.quarantineReason}</p>
              </div>
            )}

            {batch.quarantinedAt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Quarantined</p>
                <p className="text-gray-900">
                  {new Date(batch.quarantinedAt).toLocaleString()}
                  {batch.quarantinedBy && ` by ${batch.quarantinedBy}`}
                </p>
              </div>
            )}

            <Button onClick={handleOpenRelease} className="w-full">
              Release from Quarantine
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <p className="text-gray-900 mb-2">Quarantine Hold</p>
                <p className="text-gray-700">
                  Place this batch in quarantine hold for incoming material inspection, 
                  quality concerns, or regulatory compliance review.
                </p>
              </AlertDescription>
            </Alert>

            <Button onClick={handleOpenQuarantine} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
              <Lock className="w-4 h-4 mr-2" />
              Place in Quarantine
            </Button>
          </div>
        )}
      </Card>

      {/* Quarantine Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'quarantine' ? 'Place Batch in Quarantine' : 'Release Batch from Quarantine'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {action === 'quarantine' ? (
              <>
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <p className="text-orange-900">
                      This batch will be placed on hold and cannot be moved or processed until released.
                    </p>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="quarantine-reason">
                    Quarantine Reason <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="quarantine-reason"
                    placeholder="Explain why this batch is being quarantined (e.g., incoming material inspection, quality concern, pesticide test pending)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    <p className="text-green-900">
                      This batch will be released from quarantine and returned to normal operations.
                    </p>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="release-notes">Release Notes (Optional)</Label>
                  <Textarea
                    id="release-notes"
                    placeholder="Add notes about the release (e.g., inspection passed, tests cleared)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="authorized-by">
                Authorized By <span className="text-red-600">*</span>
              </Label>
              <Input
                id="authorized-by"
                placeholder="Enter your full name"
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">
                Only authorized personnel can {action === 'quarantine' ? 'quarantine' : 'release'} batches
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogOpen(false);
              setReason('');
              setAuthorizedBy('');
              setNotes('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!authorizedBy.trim() || (action === 'quarantine' && !reason.trim())}
            >
              {action === 'quarantine' ? 'Place in Quarantine' : 'Release from Quarantine'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

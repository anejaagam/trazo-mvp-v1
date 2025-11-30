import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { AlertOctagon, Package, Users, FileText, CheckCircle, Send, AlertTriangle } from 'lucide-react';

interface RecallPackage {
  packageId: string;
  product: string;
  distributor: string;
  quantity: string;
  dateSold: string;
  status: 'pending' | 'notified' | 'returned' | 'destroyed';
}

interface Recall {
  id: string;
  batchId: string;
  product: string;
  reason: string;
  initiatedDate: string;
  status: 'active' | 'completed';
  affectedPackages: number;
  recoveredPackages: number;
  notificationsSent: number;
}

export function RecallManager() {
  const [recalls, setRecalls] = useState<Recall[]>([
    {
      id: 'RCL-2025-001',
      batchId: 'BTH-2038',
      product: 'Sour Diesel 3.5g',
      reason: 'Failed microbial testing - Aspergillus detected',
      initiatedDate: '2025-09-15',
      status: 'completed',
      affectedPackages: 45,
      recoveredPackages: 45,
      notificationsSent: 12,
    },
  ]);

  const [newRecallBatch, setNewRecallBatch] = useState('');
  const [newRecallReason, setNewRecallReason] = useState('');
  const [showNewRecallDialog, setShowNewRecallDialog] = useState(false);

  const affectedPackages: RecallPackage[] = [
    {
      packageId: 'PKG-2042-015',
      product: 'Purple Haze 3.5g',
      distributor: 'Retail Store A',
      quantity: '12 units',
      dateSold: '2025-10-10',
      status: 'pending',
    },
    {
      packageId: 'PKG-2042-016',
      product: 'Purple Haze 3.5g',
      distributor: 'Wholesale Partner B',
      quantity: '50 units',
      dateSold: '2025-10-11',
      status: 'notified',
    },
    {
      packageId: 'PKG-2042-017',
      product: 'Purple Haze 3.5g',
      distributor: 'Retail Store C',
      quantity: '24 units',
      dateSold: '2025-10-12',
      status: 'pending',
    },
    {
      packageId: 'PKG-2042-018',
      product: 'Purple Haze 3.5g',
      distributor: 'Wholesale Partner D',
      quantity: '100 units',
      dateSold: '2025-10-13',
      status: 'pending',
    },
  ];

  const handleInitiateRecall = () => {
    // In production, this would create a new recall and query the database for affected packages
    const newRecall: Recall = {
      id: `RCL-2025-${String(recalls.length + 1).padStart(3, '0')}`,
      batchId: newRecallBatch,
      product: 'Purple Haze 3.5g',
      reason: newRecallReason,
      initiatedDate: '2025-10-16',
      status: 'active',
      affectedPackages: 4,
      recoveredPackages: 0,
      notificationsSent: 0,
    };

    setRecalls([newRecall, ...recalls]);
    setShowNewRecallDialog(false);
    setNewRecallBatch('');
    setNewRecallReason('');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      notified: 'bg-blue-50 text-blue-700 border-blue-200',
      returned: 'bg-purple-50 text-purple-700 border-purple-200',
      destroyed: 'bg-slate-50 text-slate-700 border-slate-200',
      active: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {status}
      </Badge>
    );
  };

  const activeRecall = recalls.find(r => r.status === 'active');
  const recoveryRate = activeRecall 
    ? (activeRecall.recoveredPackages / activeRecall.affectedPackages) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                Recall Execution & Tracking
              </CardTitle>
              <CardDescription>
                Identify affected packages, notify distributors, and document recall process
              </CardDescription>
            </div>
            <Dialog open={showNewRecallDialog} onOpenChange={setShowNewRecallDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  Initiate Recall
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate Product Recall</DialogTitle>
                  <DialogDescription>
                    System will identify all distributed packages from the failed batch
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Failed Batch ID</Label>
                    <Input
                      id="batch"
                      placeholder="BTH-XXXX"
                      value={newRecallBatch}
                      onChange={(e) => setNewRecallBatch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Recall Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="E.g., Failed lab testing, contamination detected, packaging defect..."
                      value={newRecallReason}
                      onChange={(e) => setNewRecallReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      This action will create an immutable recall record and automatically identify all 
                      packages distributed from this batch for notification and recovery.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewRecallDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleInitiateRecall}
                    disabled={!newRecallBatch || !newRecallReason}
                  >
                    Initiate Recall
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeRecall && (
            <>
              <Alert className="border-red-200 bg-red-50">
                <AlertOctagon className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Active Recall:</strong> Batch {activeRecall.batchId} - {activeRecall.product}
                  <br />
                  <strong>Reason:</strong> {activeRecall.reason}
                </AlertDescription>
              </Alert>

              <Card className="bg-slate-50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-slate-600">Affected Packages</p>
                      <p>{activeRecall.affectedPackages}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Recovered</p>
                      <p className="text-purple-600">{activeRecall.recoveredPackages}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Notifications Sent</p>
                      <p className="text-blue-600">{activeRecall.notificationsSent}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Recovery Rate</p>
                      <p className="text-green-600">{recoveryRate.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p>Recovery Progress</p>
                      <p className="text-slate-600">
                        {activeRecall.recoveredPackages} / {activeRecall.affectedPackages}
                      </p>
                    </div>
                    <Progress value={recoveryRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Affected Distribution Packages</p>
                    <p className="text-slate-600">All packages distributed from failed batch</p>
                  </div>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    Send All Notifications
                  </Button>
                </div>

                <div className="border rounded-lg divide-y">
                  {affectedPackages.map((pkg) => (
                    <div key={pkg.packageId} className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <p>{pkg.product}</p>
                          <p className="text-slate-600">Package ID: {pkg.packageId}</p>
                        </div>
                        {getStatusBadge(pkg.status)}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-slate-600">Distributor</p>
                          <p className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {pkg.distributor}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Quantity</p>
                          <p>{pkg.quantity}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Sale Date</p>
                          <p>{pkg.dateSold}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <Send className="w-3 h-3" />
                          Send Notification
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <Package className="w-3 h-3" />
                          Mark Returned
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Mark Destroyed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <p>Recall Documentation</p>
                    <p className="text-slate-600">All actions are logged in the immutable audit trail</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <FileText className="w-4 h-4" />
                      Download Recall Report
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <FileText className="w-4 h-4" />
                      Export Notification Log
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!activeRecall && recalls.length > 0 && (
            <div className="space-y-4">
              <div>
                <p>Recall History</p>
                <p className="text-slate-600">Previous product recalls and their outcomes</p>
              </div>

              <div className="space-y-3">
                {recalls.map((recall) => (
                  <Card key={recall.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {recall.product}
                            <Badge variant="outline" className="font-mono">{recall.batchId}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">{recall.reason}</CardDescription>
                        </div>
                        {getStatusBadge(recall.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-600">Initiated</p>
                        <p>{recall.initiatedDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Affected</p>
                        <p>{recall.affectedPackages} packages</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Recovered</p>
                        <p className="text-green-600">{recall.recoveredPackages}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Notifications</p>
                        <p>{recall.notificationsSent}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!activeRecall && recalls.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <AlertOctagon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No Active Recalls</p>
              <p className="text-slate-600">Click "Initiate Recall" to start a product recall workflow</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

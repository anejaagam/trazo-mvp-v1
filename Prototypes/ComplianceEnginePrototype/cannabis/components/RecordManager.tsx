import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, Unlock, Search, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface Record {
  id: string;
  type: string;
  title: string;
  batch?: string;
  createdDate: string;
  createdBy: string;
  locked: boolean;
  lockedDate?: string;
  lockedBy?: string;
  jurisdiction: string;
  evidenceCount: number;
}

export function RecordManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [records, setRecords] = useState<Record[]>([
    {
      id: 'REC-2025-2045',
      type: 'Batch Record',
      title: 'Production Batch #2045',
      batch: 'BTH-2045',
      createdDate: '2025-10-10',
      createdBy: 'Sarah Chen',
      locked: true,
      lockedDate: '2025-10-15',
      lockedBy: 'Mike Johnson',
      jurisdiction: 'Canada-Cannabis',
      evidenceCount: 8,
    },
    {
      id: 'REC-2025-2044',
      type: 'Batch Record',
      title: 'Production Batch #2044',
      batch: 'BTH-2044',
      createdDate: '2025-10-08',
      createdBy: 'Emma Rodriguez',
      locked: true,
      lockedDate: '2025-10-13',
      lockedBy: 'James Wilson',
      jurisdiction: 'US-California',
      evidenceCount: 6,
    },
    {
      id: 'REC-2025-2043',
      type: 'Batch Record',
      title: 'Production Batch #2043',
      batch: 'BTH-2043',
      createdDate: '2025-10-05',
      createdBy: 'Alex Kumar',
      locked: false,
      jurisdiction: 'Canada-Cannabis',
      evidenceCount: 4,
    },
    {
      id: 'REC-2025-1024',
      type: 'Calibration Record',
      title: 'pH Meter Calibration - PM-104',
      createdDate: '2025-10-13',
      createdBy: 'James Wilson',
      locked: true,
      lockedDate: '2025-10-13',
      lockedBy: 'James Wilson',
      jurisdiction: 'Canada-Produce',
      evidenceCount: 2,
    },
    {
      id: 'REC-2025-0892',
      type: 'Training Record',
      title: 'HACCP Training - October Cohort',
      createdDate: '2025-10-12',
      createdBy: 'Sarah Chen',
      locked: false,
      jurisdiction: 'PrimusGFS',
      evidenceCount: 12,
    },
    {
      id: 'REC-2025-0755',
      type: 'Inspection Record',
      title: 'Quarterly Facility Inspection',
      createdDate: '2025-10-01',
      createdBy: 'Mike Johnson',
      locked: true,
      lockedDate: '2025-10-05',
      lockedBy: 'Sarah Chen',
      jurisdiction: 'PrimusGFS',
      evidenceCount: 15,
    },
  ]);

  const handleLockRecord = (record: Record) => {
    setRecords(records.map(r => 
      r.id === record.id 
        ? { ...r, locked: true, lockedDate: '2025-10-15', lockedBy: 'Current User' }
        : r
    ));
    setSelectedRecord(null);
  };

  const filteredRecords = records.filter((record) => {
    return searchTerm === '' || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.batch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const lockedCount = records.filter(r => r.locked).length;
  const unlockedCount = records.filter(r => !r.locked).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-slate-600">Total Records</p>
          </CardHeader>
          <CardContent>
            <span>{records.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-slate-600">Locked Records</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span>{lockedCount}</span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-slate-600">Unlocked Records</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span>{unlockedCount}</span>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Management</CardTitle>
          <CardDescription>
            Lock records to prevent modifications and ensure audit trail integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Locked records cannot be modified or deleted. Locking a record creates an immutable 
              audit trail entry and protects the record for compliance purposes.
            </AlertDescription>
          </Alert>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search records by title, batch, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono">{record.id}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.title}</TableCell>
                    <TableCell>{record.batch || '-'}</TableCell>
                    <TableCell className="text-slate-600">{record.createdDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.jurisdiction}</Badge>
                    </TableCell>
                    <TableCell>{record.evidenceCount} items</TableCell>
                    <TableCell>
                      {record.locked ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Unlock className="w-3 h-3 mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.locked ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedRecord(record)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Locked Record Details</DialogTitle>
                              <DialogDescription>
                                This record is locked and protected from modifications
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              <div>
                                <p>Record ID</p>
                                <p className="text-slate-600">{record.id}</p>
                              </div>
                              <div>
                                <p>Locked Date</p>
                                <p className="text-slate-600">{record.lockedDate}</p>
                              </div>
                              <div>
                                <p>Locked By</p>
                                <p className="text-slate-600">{record.lockedBy}</p>
                              </div>
                              <Alert>
                                <Lock className="h-4 w-4" />
                                <AlertDescription>
                                  This record is permanently locked and cannot be unlocked or modified 
                                  to maintain audit integrity.
                                </AlertDescription>
                              </Alert>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Lock className="w-3 h-3" />
                              Lock Record
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Lock Record for Audit</DialogTitle>
                              <DialogDescription>
                                Confirm that you want to permanently lock this record
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              <div>
                                <p>Record ID</p>
                                <p className="text-slate-600">{record.id}</p>
                              </div>
                              <div>
                                <p>Title</p>
                                <p className="text-slate-600">{record.title}</p>
                              </div>
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Warning: Once locked, this record cannot be unlocked or modified. 
                                  This action will be logged in the immutable audit trail.
                                </AlertDescription>
                              </Alert>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleLockRecord(record)}>
                                <Lock className="w-4 h-4 mr-2" />
                                Lock Record
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

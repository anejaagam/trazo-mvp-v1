import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Eye, Lock, Download, FileText, Users, FlaskConical, Building2 } from 'lucide-react';

interface InspectionToolkitProps {
  viewMode: 'normal' | 'inspection';
}

export function InspectionToolkit({ viewMode }: InspectionToolkitProps) {
  const inventoryByRoom = [
    { room: 'Vault A', category: 'Flower', units: 1247, weight: '43.2 kg' },
    { room: 'Vault B', category: 'Pre-Rolls', units: 3891, weight: 'N/A' },
    { room: 'Vault C', category: 'Concentrates', units: 892, weight: '8.4 kg' },
    { room: 'Retail Display #1', category: 'Mixed', units: 456, weight: 'N/A' },
    { room: 'Retail Display #2', category: 'Mixed', units: 328, weight: 'N/A' },
  ];

  const employeePermits = [
    { name: 'Sarah Chen', role: 'Production Manager', permitId: 'OR-2024-8934', expiration: '2026-03-15', status: 'valid' },
    { name: 'Mike Johnson', role: 'Cultivation Lead', permitId: 'OR-2024-8935', expiration: '2026-04-22', status: 'valid' },
    { name: 'Alex Kumar', role: 'Quality Assurance', permitId: 'OR-2024-8936', expiration: '2025-11-08', status: 'valid' },
    { name: 'Emma Rodriguez', role: 'Processing Tech', permitId: 'OR-2024-8937', expiration: '2026-01-30', status: 'valid' },
    { name: 'James Wilson', role: 'Inventory Manager', permitId: 'OR-2024-8938', expiration: '2025-12-12', status: 'valid' },
  ];

  const coaReports = [
    { batchId: 'BTH-2045', product: 'Blue Dream 3.5g', testDate: '2025-10-10', lab: 'Green Leaf Analytics', status: 'passed' },
    { batchId: 'BTH-2044', product: 'OG Kush 3.5g', testDate: '2025-10-08', lab: 'Green Leaf Analytics', status: 'passed' },
    { batchId: 'BTH-2043', product: 'Granddaddy Purple', testDate: '2025-10-05', lab: 'Green Leaf Analytics', status: 'passed' },
    { batchId: 'BTH-2042', product: 'Sour Diesel 1g', testDate: '2025-10-03', lab: 'Cascade Testing', status: 'passed' },
  ];

  const rapidReports = [
    {
      title: 'Inventory by Room',
      icon: Building2,
      description: 'Complete breakdown of current inventory by storage location',
      data: inventoryByRoom,
    },
    {
      title: 'Employee Permits',
      icon: Users,
      description: 'All active employee cannabis worker permits with expiration dates',
      data: employeePermits,
    },
    {
      title: 'Certificates of Analysis',
      icon: FlaskConical,
      description: 'Recent batch testing COAs from licensed laboratories',
      data: coaReports,
    },
  ];

  return (
    <div className="space-y-6">
      {viewMode === 'inspection' && (
        <Alert className="border-orange-200 bg-orange-50">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Inspection Mode Active:</strong> System is in read-only mode. All modifications are disabled 
            during regulatory inspection. This mode can be deactivated from the header menu.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Regulatory Inspection Toolkit
              </CardTitle>
              <CardDescription>
                Read-only mode and rapid report generation for regulatory inspectors
              </CardDescription>
            </div>
            {viewMode === 'inspection' && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                <Lock className="w-3 h-3 mr-1" />
                Read-Only Mode
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rapidReports.map((report) => {
              const Icon = report.icon;
              return (
                <Card key={report.title}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {report.title}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <p>Inventory by Room</p>
              <p className="text-slate-600">Current inventory breakdown by storage location</p>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Total Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryByRoom.map((item) => (
                    <TableRow key={item.room}>
                      <TableCell>{item.room}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>{item.units.toLocaleString()}</TableCell>
                      <TableCell>{item.weight}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50">
                    <TableCell>Total</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      {inventoryByRoom.reduce((sum, item) => sum + item.units, 0).toLocaleString()}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p>Employee Cannabis Worker Permits</p>
              <p className="text-slate-600">All employees with valid state-issued permits</p>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeePermits.map((employee) => (
                    <TableRow key={employee.permitId}>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell className="font-mono">{employee.permitId}</TableCell>
                      <TableCell>{employee.expiration}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {employee.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p>Recent Certificates of Analysis (COAs)</p>
              <p className="text-slate-600">Lab testing reports for current batches</p>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Test Date</TableHead>
                    <TableHead>Laboratory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaReports.map((coa) => (
                    <TableRow key={coa.batchId}>
                      <TableCell className="font-mono">{coa.batchId}</TableCell>
                      <TableCell>{coa.product}</TableCell>
                      <TableCell>{coa.testDate}</TableCell>
                      <TableCell>{coa.lab}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {coa.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="gap-1">
                          <FileText className="w-3 h-3" />
                          View COA
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p>Inspector-Ready Reports</p>
                  <p className="text-slate-600">
                    All reports are pre-configured for regulatory inspections and can be generated instantly. 
                    Read-only mode ensures data integrity during inspection visits while providing full transparency.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

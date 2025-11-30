import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Droplets,
  Sprout,
  Users,
  ClipboardCheck,
  Bug,
  Shield,
  FileWarning,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { 
  WaterTestRecord, 
  ChemicalApplicationRecord, 
  WorkerHygieneLog,
  SanitationLog,
  PestControlLog,
  NonConformanceReport,
  TraceabilityTest,
  InternalAudit,
  TrainingRecord,
  ComplianceStatus
} from '../types/compliance';

interface ComplianceDashboardProps {
  waterTests: WaterTestRecord[];
  chemicalApplications: ChemicalApplicationRecord[];
  hygieneLogs: WorkerHygieneLog[];
  sanitationLogs: SanitationLog[];
  pestControl: PestControlLog[];
  nonConformances: NonConformanceReport[];
  traceabilityTests: TraceabilityTest[];
  audits: InternalAudit[];
  trainingRecords: TrainingRecord[];
  onViewDetails: (section: string) => void;
}

export function ComplianceDashboard({
  waterTests,
  chemicalApplications,
  hygieneLogs,
  sanitationLogs,
  pestControl,
  nonConformances,
  traceabilityTests,
  audits,
  trainingRecords,
  onViewDetails,
}: ComplianceDashboardProps) {
  // Calculate metrics
  const waterTestsPassed = waterTests.filter(t => t.overallResult === 'pass').length;
  const waterTestsOverdue = waterTests.filter(t => new Date(t.nextTestDue) < new Date()).length;
  
  const phiCompliant = chemicalApplications.filter(c => c.preHarvestCompliance).length;
  
  const sanitationPassed = sanitationLogs.filter(s => s.verificationResult === 'pass').length;
  
  const openNCRs = nonConformances.filter(n => ['open', 'in_progress'].includes(n.status)).length;
  const criticalNCRs = nonConformances.filter(n => n.severity === 'critical' && n.status !== 'closed').length;
  
  const lastTraceTest = traceabilityTests[0];
  const lastAudit = audits[0];
  
  const totalEmployees = new Set(trainingRecords.flatMap(t => t.attendees.map(a => a.employeeId))).size;
  const currentTraining = trainingRecords.filter(t => 
    t.expiryDate && new Date(t.expiryDate) > new Date()
  );
  const trainedEmployees = new Set(
    currentTraining.flatMap(t => t.attendees.filter(a => a.passed).map(a => a.employeeId))
  ).size;
  
  // Overall compliance status
  const getOverallStatus = (): ComplianceStatus => {
    if (criticalNCRs > 0 || waterTestsOverdue > 0) return 'non_compliant';
    if (openNCRs > 0) return 'corrective_action_required';
    return 'compliant';
  };
  
  const overallStatus = getOverallStatus();
  
  const getStatusBadge = (status: ComplianceStatus) => {
    const styles = {
      compliant: 'bg-green-100 text-green-800',
      non_compliant: 'bg-red-100 text-red-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      corrective_action_required: 'bg-orange-100 text-orange-800',
    };
    
    const labels = {
      compliant: 'Compliant',
      non_compliant: 'Non-Compliant',
      pending_review: 'Pending Review',
      corrective_action_required: 'Action Required',
    };
    
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">PrimusGFS Compliance Dashboard</h2>
          <p className="text-gray-600">Food safety and quality management system overview</p>
        </div>
        {getStatusBadge(overallStatus)}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Water Quality */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Droplets className="w-5 h-5 text-blue-600" />
              {waterTestsOverdue > 0 ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-gray-900">{waterTestsPassed}/{waterTests.length}</div>
              <p className="text-gray-600">Water Tests Passed</p>
              {waterTestsOverdue > 0 && (
                <p className="text-orange-600">{waterTestsOverdue} overdue</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chemical Compliance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Sprout className="w-5 h-5 text-green-600" />
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-gray-900">{phiCompliant}/{chemicalApplications.length}</div>
              <p className="text-gray-600">PHI Compliant</p>
            </div>
          </CardContent>
        </Card>

        {/* Sanitation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Shield className="w-5 h-5 text-purple-600" />
              {sanitationPassed === sanitationLogs.length ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-gray-900">{sanitationPassed}/{sanitationLogs.length}</div>
              <p className="text-gray-600">Sanitation Verified</p>
            </div>
          </CardContent>
        </Card>

        {/* Non-Conformances */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <FileWarning className="w-5 h-5 text-red-600" />
              {openNCRs === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : criticalNCRs > 0 ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-gray-900">{openNCRs}</div>
              <p className="text-gray-600">Open NCRs</p>
              {criticalNCRs > 0 && (
                <p className="text-red-600">{criticalNCRs} critical</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <Tabs defaultValue="gap" className="w-full">
        <TabsList>
          <TabsTrigger value="gap">GAP</TabsTrigger>
          <TabsTrigger value="gmp">GMP</TabsTrigger>
          <TabsTrigger value="traceability">Traceability</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        {/* Good Agricultural Practices */}
        <TabsContent value="gap" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Water Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Water Quality Testing
                </CardTitle>
                <CardDescription>
                  {waterTests.length} tests recorded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {waterTests.slice(0, 3).map(test => (
                  <div key={test.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{test.waterSource}</span>
                        {test.overallResult === 'pass' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-gray-600">
                        Tested: {new Date(test.testDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">
                        Next: {new Date(test.nextTestDue).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('water')}
                >
                  View All Tests
                </Button>
              </CardContent>
            </Card>

            {/* Chemical Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="w-5 h-5" />
                  Chemical Applications
                </CardTitle>
                <CardDescription>
                  {chemicalApplications.length} applications logged
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {chemicalApplications.slice(0, 3).map(app => (
                  <div key={app.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{app.productName}</span>
                        <Badge variant="outline">{app.productType}</Badge>
                      </div>
                      <p className="text-gray-600">
                        Applied: {new Date(app.applicationDate).toLocaleDateString()}
                      </p>
                      {app.phi !== undefined && (
                        <p className="text-gray-600">PHI: {app.phi} days</p>
                      )}
                    </div>
                    {app.preHarvestCompliance && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('chemicals')}
                >
                  View All Applications
                </Button>
              </CardContent>
            </Card>

            {/* Pest Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  Pest Management
                </CardTitle>
                <CardDescription>
                  {pestControl.length} inspections completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pestControl.map(log => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{log.location}</span>
                      <span className="text-gray-600">
                        {new Date(log.inspectionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 border rounded">
                        <p className="text-gray-600">Rodents</p>
                        <Badge variant={log.pestActivity.rodents === 'none' ? 'default' : 'destructive'}>
                          {log.pestActivity.rodents}
                        </Badge>
                      </div>
                      <div className="p-2 border rounded">
                        <p className="text-gray-600">Insects</p>
                        <Badge variant={log.pestActivity.insects === 'none' ? 'default' : 'destructive'}>
                          {log.pestActivity.insects}
                        </Badge>
                      </div>
                      <div className="p-2 border rounded">
                        <p className="text-gray-600">Birds</p>
                        <Badge variant={log.pestActivity.birds === 'none' ? 'default' : 'destructive'}>
                          {log.pestActivity.birds}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('pest')}
                >
                  View All Inspections
                </Button>
              </CardContent>
            </Card>

            {/* Worker Hygiene */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Worker Hygiene
                </CardTitle>
                <CardDescription>
                  {hygieneLogs.length} inspections completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {hygieneLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>{log.location}</span>
                        <Badge variant="outline">{log.shift}</Badge>
                      </div>
                      <p className="text-gray-600">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600">
                        {log.workersInspected} workers inspected
                      </p>
                    </div>
                    {log.violations.length === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('hygiene')}
                >
                  View All Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Good Manufacturing Practices */}
        <TabsContent value="gmp" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sanitation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Facility Sanitation
                </CardTitle>
                <CardDescription>
                  {sanitationLogs.length} cleaning logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sanitationLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <span>{log.facilityArea}</span>
                      <p className="text-gray-600">{log.equipmentType}</p>
                      <p className="text-gray-600">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <Badge variant="outline">{log.cleaningType.replace(/_/g, ' ')}</Badge>
                    </div>
                    {log.verificationResult === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('sanitation')}
                >
                  View All Logs
                </Button>
              </CardContent>
            </Card>

            {/* Non-Conformances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="w-5 h-5" />
                  Non-Conformance Reports
                </CardTitle>
                <CardDescription>
                  {openNCRs} open / {nonConformances.length} total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nonConformances.slice(0, 3).map(ncr => (
                  <div key={ncr.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge 
                          variant={
                            ncr.severity === 'critical' ? 'destructive' :
                            ncr.severity === 'major' ? 'default' : 
                            'secondary'
                          }
                        >
                          {ncr.severity}
                        </Badge>
                        <p className="text-gray-600">{ncr.category.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge variant="outline">{ncr.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p>{ncr.description}</p>
                    <p className="text-gray-600">
                      Reported: {new Date(ncr.reportDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onViewDetails('ncr')}
                >
                  View All NCRs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traceability */}
        <TabsContent value="traceability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Traceability Testing
              </CardTitle>
              <CardDescription>
                Mock recalls and trace verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastTraceTest && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4>Last Mock Recall</h4>
                      <p className="text-gray-600">
                        {new Date(lastTraceTest.testDate).toLocaleDateString()}
                      </p>
                    </div>
                    {lastTraceTest.result === 'pass' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="text-gray-900">{lastTraceTest.durationMinutes} minutes</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Target</p>
                      <p className="text-gray-900">{lastTraceTest.targetTime} minutes</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Accuracy</p>
                      <p className="text-gray-900">{lastTraceTest.traceabilityAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lot Number</p>
                      <p className="text-gray-900">{lastTraceTest.lotNumber}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-2">Records Retrieved</p>
                    <div className="space-y-1">
                      {Object.entries(lastTraceTest.recordsRetrieved).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          {value ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onViewDetails('traceability')}
              >
                View All Tests
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Training Records
              </CardTitle>
              <CardDescription>
                {trainedEmployees} of {totalEmployees} employees current
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <div className="text-green-900">Training Compliance</div>
                  <p className="text-green-700">
                    {Math.round((trainedEmployees / totalEmployees) * 100)}% of staff trained
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>

              {trainingRecords.slice(0, 3).map(record => (
                <div key={record.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span>{record.topic}</span>
                    <Badge variant="outline">{record.trainingType.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-gray-600">
                    {new Date(record.trainingDate).toLocaleDateString()} • {record.duration} hours
                  </p>
                  <p className="text-gray-600">
                    {record.attendees.length} attendees • {record.attendees.filter(a => a.passed).length} passed
                  </p>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onViewDetails('training')}
              >
                View All Training Records
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audits */}
        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Internal Audits
              </CardTitle>
              <CardDescription>
                {audits.length} audits completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastAudit && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4>Last Audit</h4>
                      <p className="text-gray-600">
                        {new Date(lastAudit.auditDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-900">{lastAudit.overallScore}%</div>
                      <p className="text-gray-600">Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded">
                      <div className="text-red-900">{lastAudit.criticalFindings}</div>
                      <p className="text-red-700">Critical</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-orange-900">{lastAudit.majorFindings}</div>
                      <p className="text-orange-700">Major</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-yellow-900">{lastAudit.minorFindings}</div>
                      <p className="text-yellow-700">Minor</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-600 mb-2">Next Audit Due</p>
                    <p className="text-gray-900">
                      {new Date(lastAudit.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onViewDetails('audits')}
              >
                View All Audits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

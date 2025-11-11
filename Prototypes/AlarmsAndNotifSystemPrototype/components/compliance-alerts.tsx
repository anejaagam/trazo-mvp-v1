import { Alarm } from '../types/alarm';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, FileX, Calendar, Beaker, Shield, Clock, ExternalLink } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ComplianceAlertsProps {
  alarms: Alarm[];
}

export function ComplianceAlerts({ alarms }: ComplianceAlertsProps) {
  // Filter compliance and security alarms
  const complianceAlarms = alarms.filter(a => 
    (a.category === 'compliance' || a.category === 'security') && 
    a.status !== 'resolved'
  );
  
  // Group by compliance type
  const metrcErrors = complianceAlarms.filter(a => a.complianceType === 'metrc_sync_error');
  const tasksDue = complianceAlarms.filter(a => a.complianceType === 'compliance_task_due');
  const harvestDeadlines = complianceAlarms.filter(a => a.complianceType === 'harvest_deadline');
  const testFailures = complianceAlarms.filter(a => a.complianceType === 'test_failure');
  const securityIncidents = complianceAlarms.filter(a => a.complianceType === 'security_incident');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Compliance & Security Alerts</h1>
        <p className="text-gray-600">Critical alerts for regulatory compliance and facility security</p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Metrc Errors</p>
              <h2 className="text-red-600">{metrcErrors.length}</h2>
            </div>
            <FileX className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Tasks Due</p>
              <h2 className="text-amber-600">{tasksDue.length}</h2>
            </div>
            <Calendar className="w-8 h-8 text-amber-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Harvest Deadlines</p>
              <h2 className="text-orange-600">{harvestDeadlines.length}</h2>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Test Failures</p>
              <h2 className="text-red-600">{testFailures.length}</h2>
            </div>
            <Beaker className="w-8 h-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Security</p>
              <h2 className="text-red-600">{securityIncidents.length}</h2>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>
      
      {/* Metrc Sync Errors */}
      {metrcErrors.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileX className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900">Metrc Sync Errors</h3>
            <Badge className="bg-red-500">{metrcErrors.length}</Badge>
          </div>
          <div className="space-y-3">
            {metrcErrors.map(alarm => (
              <div key={alarm.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-red-900 mb-1">{alarm.title}</h4>
                    <p className="text-red-800">{alarm.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {alarm.severity}
                  </Badge>
                </div>
                {alarm.metrcError && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <div className="grid grid-cols-2 gap-3 text-red-900">
                      <div>
                        <span className="text-gray-600">Error Code:</span>
                        <span className="ml-2">{alarm.metrcError.errorCode}</span>
                      </div>
                      {alarm.metrcError.tagNumber && (
                        <div>
                          <span className="text-gray-600">Tag Number:</span>
                          <code className="ml-2">{alarm.metrcError.tagNumber}</code>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-red-800">
                      {alarm.metrcError.errorMessage}
                    </div>
                    {alarm.metrcError.submissionId && (
                      <div className="mt-2 text-gray-600">
                        Submission ID: <code>{alarm.metrcError.submissionId}</code>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatDistanceToNow(alarm.raisedAt, { addSuffix: true })}
                  </span>
                  <Button size="sm">Retry Submission</Button>
                  <Button size="sm" variant="outline">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Compliance Tasks Due */}
      {tasksDue.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h3 className="text-amber-900">Compliance Tasks Due</h3>
            <Badge className="bg-amber-500">{tasksDue.length}</Badge>
          </div>
          <div className="space-y-3">
            {tasksDue.map(alarm => (
              <div key={alarm.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-amber-900 mb-1">{alarm.title}</h4>
                    <p className="text-amber-800">{alarm.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                    {alarm.severity}
                  </Badge>
                </div>
                {alarm.taskDetails && (
                  <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                    <div className="grid grid-cols-3 gap-3 text-amber-900">
                      <div>
                        <span className="text-gray-600">Task Type:</span>
                        <div>{alarm.taskDetails.taskType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <div>{format(alarm.taskDetails.dueDate, 'MMM dd, yyyy')}</div>
                      </div>
                      {alarm.taskDetails.assignedTo && (
                        <div>
                          <span className="text-gray-600">Assigned To:</span>
                          <div>{alarm.taskDetails.assignedTo}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <Button size="sm">Mark Complete</Button>
                  <Button size="sm" variant="outline">Snooze</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* 45-Day Harvest Deadlines */}
      {harvestDeadlines.length > 0 && (
        <Card className="p-6 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900">Oregon 45-Day Harvest Deadlines</h3>
            <Badge className="bg-red-500">{harvestDeadlines.length}</Badge>
          </div>
          <div className="space-y-3">
            {harvestDeadlines.map(alarm => (
              <div key={alarm.id} className="p-4 bg-white border-2 border-red-300 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-red-900 mb-1">{alarm.title}</h4>
                    <p className="text-red-800">{alarm.description}</p>
                  </div>
                  <Badge className="bg-red-600">URGENT</Badge>
                </div>
                {alarm.harvestDetails && (
                  <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                    <div className="grid grid-cols-3 gap-3 text-red-900">
                      <div>
                        <span className="text-gray-600">Batch ID:</span>
                        <div><code>{alarm.harvestDetails.batchId}</code></div>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Since Harvest:</span>
                        <div className="text-red-600">{alarm.harvestDetails.daysSinceHarvest} days</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Days Remaining:</span>
                        <div className="text-red-600">{alarm.harvestDetails.daysRemaining} days</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Finalize Harvest Weight
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Batch
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Test Failures */}
      {testFailures.length > 0 && (
        <Card className="p-6 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <Beaker className="w-5 h-5 text-red-600" />
            <h3 className="text-red-900">Laboratory Test Failures</h3>
            <Badge className="bg-red-500">{testFailures.length}</Badge>
          </div>
          <div className="space-y-3">
            {testFailures.map(alarm => (
              <div key={alarm.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-red-900 mb-1">{alarm.title}</h4>
                    <p className="text-red-800">{alarm.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {alarm.severity}
                  </Badge>
                </div>
                {alarm.testFailureDetails && (
                  <div className="mt-3 p-3 bg-white rounded border border-red-200">
                    <div className="grid grid-cols-2 gap-3 mb-3 text-red-900">
                      <div>
                        <span className="text-gray-600">Laboratory:</span>
                        <div>{alarm.testFailureDetails.labName}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Test Type:</span>
                        <div>{alarm.testFailureDetails.testType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Batch ID:</span>
                        <div><code>{alarm.testFailureDetails.batchId}</code></div>
                      </div>
                      <div>
                        <span className="text-gray-600">Sample ID:</span>
                        <div><code>{alarm.testFailureDetails.sampleId}</code></div>
                      </div>
                    </div>
                    <div className="p-2 bg-red-100 rounded">
                      <span className="text-gray-600">Failure Reason:</span>
                      <div className="text-red-900">{alarm.testFailureDetails.failureReason}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">Quarantine Batch</Button>
                  <Button size="sm" variant="outline">Request Retest</Button>
                  <Button size="sm" variant="outline">View Lab Report</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Security Incidents */}
      {securityIncidents.length > 0 && (
        <Card className="p-6 border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-600" />
            <h3 className="text-orange-900">Security Incidents</h3>
            <Badge className="bg-orange-500">{securityIncidents.length}</Badge>
          </div>
          <div className="space-y-3">
            {securityIncidents.map(alarm => (
              <div key={alarm.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-orange-900 mb-1">{alarm.title}</h4>
                    <p className="text-orange-800">{alarm.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                    {alarm.severity}
                  </Badge>
                </div>
                {alarm.securityDetails && (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                    <div className="grid grid-cols-3 gap-3 text-orange-900">
                      <div>
                        <span className="text-gray-600">Incident Type:</span>
                        <div>{alarm.securityDetails.incidentType}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <div>{alarm.securityDetails.location}</div>
                      </div>
                      {alarm.securityDetails.deviceId && (
                        <div>
                          <span className="text-gray-600">Device ID:</span>
                          <div><code>{alarm.securityDetails.deviceId}</code></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatDistanceToNow(alarm.raisedAt, { addSuffix: true })}
                  </span>
                  <Button size="sm">Dispatch Security</Button>
                  <Button size="sm" variant="outline">View Camera Feed</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {complianceAlarms.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-green-100 rounded-full mb-4">
              <FileX className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-green-900 mb-2">All Clear</h3>
            <p className="text-green-700">No active compliance or security alerts</p>
          </div>
        </Card>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';
import { ICannabisBatch } from '../types/domains/cannabis';

interface TestResult {
  id: string;
  testType: 'potency' | 'microbial' | 'pesticide' | 'heavy_metals' | 'mycotoxins' | 'terpene';
  labName: string;
  sampleId: string;
  submittedDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: PotencyResults | MicrobialResults | PesticideResults | TerpeneResults;
  passed?: boolean;
  certificationUrl?: string;
  notes?: string;
}

interface PotencyResults {
  thc: number;
  thca: number;
  cbd: number;
  cbda: number;
  cbg?: number;
  cbn?: number;
  totalThc: number;
  totalCbd: number;
}

interface MicrobialResults {
  totalYeastMold: number;
  aerobicBacteria: number;
  coliforms: number;
  ecoli: 'detected' | 'not-detected';
  salmonella: 'detected' | 'not-detected';
}

interface PesticideResults {
  tested: number;
  detected: number;
  passedAll: boolean;
  detectedPesticides?: string[];
}

interface TerpeneResults {
  total: number;
  profiles: { name: string; percentage: number }[];
}

interface CannabisTestingIntegrationProps {
  batch: ICannabisBatch;
  testResults?: TestResult[];
  onSubmitSample?: (testType: string, labName: string, sampleId: string) => void;
  onRecordResults?: (testId: string, results: any, passed: boolean) => void;
  onRequestRetest?: (testId: string, reason: string) => void;
}

export const CannabisTestingIntegration: React.FC<CannabisTestingIntegrationProps> = ({
  batch,
  testResults = [],
  onSubmitSample
}) => {
  const [newSampleData, setNewSampleData] = useState({
    testType: 'potency' as const,
    labName: '',
    sampleId: ''
  });

  const requiredTests = ['potency', 'microbial', 'pesticide'];
  const allRequiredComplete = requiredTests.every(
    testType => testResults.some(t => t.testType === testType && t.status === 'completed' && t.passed)
  );

  const getTestStatus = (testType: string) => {
    const test = testResults.find(t => t.testType === testType);
    if (!test) return { status: 'not-started', color: 'gray', icon: Clock };
    if (test.status === 'completed' && test.passed) return { status: 'passed', color: 'green', icon: CheckCircle2 };
    if (test.status === 'completed' && !test.passed) return { status: 'failed', color: 'red', icon: XCircle };
    if (test.status === 'in_progress') return { status: 'testing', color: 'blue', icon: FlaskConical };
    return { status: 'pending', color: 'yellow', icon: Clock };
  };

  const testTypes = [
    { value: 'potency', label: 'Potency (THC/CBD)', required: true },
    { value: 'microbial', label: 'Microbial', required: true },
    { value: 'pesticide', label: 'Pesticide', required: true },
    { value: 'heavy_metals', label: 'Heavy Metals', required: false },
    { value: 'mycotoxins', label: 'Mycotoxins', required: false },
    { value: 'terpene', label: 'Terpene Profile', required: false }
  ];

  const handleSubmitSample = () => {
    if (onSubmitSample && newSampleData.labName && newSampleData.sampleId) {
      onSubmitSample(newSampleData.testType, newSampleData.labName, newSampleData.sampleId);
      setNewSampleData({ testType: 'potency', labName: '', sampleId: '' });
    }
  };

  const renderPotencyResults = (test: TestResult) => {
    const results = test.results as PotencyResults;
    if (!results) return null;

    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="p-2 border rounded">
          <div className="text-xs text-muted-foreground">Total THC</div>
          <div className="text-lg font-bold">{results.totalThc.toFixed(2)}%</div>
        </div>
        <div className="p-2 border rounded">
          <div className="text-xs text-muted-foreground">Total CBD</div>
          <div className="text-lg font-bold">{results.totalCbd.toFixed(2)}%</div>
        </div>
        <div className="p-2 border rounded">
          <div className="text-xs text-muted-foreground">THCA</div>
          <div className="text-sm">{results.thca.toFixed(2)}%</div>
        </div>
        <div className="p-2 border rounded">
          <div className="text-xs text-muted-foreground">CBDA</div>
          <div className="text-sm">{results.cbda.toFixed(2)}%</div>
        </div>
        {results.cbg !== undefined && (
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">CBG</div>
            <div className="text-sm">{results.cbg.toFixed(2)}%</div>
          </div>
        )}
        {results.cbn !== undefined && (
          <div className="p-2 border rounded">
            <div className="text-xs text-muted-foreground">CBN</div>
            <div className="text-sm">{results.cbn.toFixed(2)}%</div>
          </div>
        )}
      </div>
    );
  };

  const renderMicrobialResults = (test: TestResult) => {
    const results = test.results as MicrobialResults;
    if (!results) return null;

    return (
      <div className="space-y-2 mt-3">
        <div className="flex justify-between items-center p-2 border rounded">
          <span className="text-sm">Total Yeast & Mold</span>
          <span className="font-medium">{results.totalYeastMold} CFU/g</span>
        </div>
        <div className="flex justify-between items-center p-2 border rounded">
          <span className="text-sm">Aerobic Bacteria</span>
          <span className="font-medium">{results.aerobicBacteria} CFU/g</span>
        </div>
        <div className="flex justify-between items-center p-2 border rounded">
          <span className="text-sm">E. Coli</span>
          <Badge variant={results.ecoli === 'not-detected' ? 'default' : 'destructive'}>
            {results.ecoli === 'not-detected' ? 'Not Detected' : 'DETECTED'}
          </Badge>
        </div>
        <div className="flex justify-between items-center p-2 border rounded">
          <span className="text-sm">Salmonella</span>
          <Badge variant={results.salmonella === 'not-detected' ? 'default' : 'destructive'}>
            {results.salmonella === 'not-detected' ? 'Not Detected' : 'DETECTED'}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Testing Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Lab Testing Status
            </span>
            {allRequiredComplete && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Required Tests Passed
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Track regulatory compliance testing for cannabis batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {testTypes.map(testType => {
              const status = getTestStatus(testType.value);
              const StatusIcon = status.icon;

              return (
                <div
                  key={testType.value}
                  className={`p-3 border rounded-lg ${
                    status.status === 'passed' ? 'border-green-300 bg-green-50' :
                    status.status === 'failed' ? 'border-red-300 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon className={`h-4 w-4 text-${status.color}-600`} />
                    <span className="text-sm font-medium">{testType.label}</span>
                  </div>
                  {testType.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{status.status.replace('_', ' ')}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit New Sample */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Sample for Testing
          </CardTitle>
          <CardDescription>Send samples to certified testing laboratory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-type">Test Type</Label>
              <select
                id="test-type"
                value={newSampleData.testType}
                onChange={(e) => setNewSampleData(prev => ({ ...prev, testType: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                {testTypes.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label} {t.required ? '(Required)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lab-name">Testing Laboratory</Label>
              <Input
                id="lab-name"
                value={newSampleData.labName}
                onChange={(e) => setNewSampleData(prev => ({ ...prev, labName: e.target.value }))}
                placeholder="Lab name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sample-id">Sample ID</Label>
              <Input
                id="sample-id"
                value={newSampleData.sampleId}
                onChange={(e) => setNewSampleData(prev => ({ ...prev, sampleId: e.target.value }))}
                placeholder="e.g., BATCH-001-POT"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmitSample}
            disabled={!newSampleData.labName || !newSampleData.sampleId}
            className="w-full"
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Submit Sample to Lab
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Completed and pending laboratory tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map(test => {
              const status = getTestStatus(test.testType);
              const StatusIcon = status.icon;

              return (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={`h-4 w-4 text-${status.color}-600`} />
                        <h4 className="font-medium capitalize">{test.testType.replace('_', ' ')} Test</h4>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Lab: {test.labName} | Sample: {test.sampleId}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Submitted: {new Date(test.submittedDate).toLocaleDateString()}
                        {test.completedDate && ` | Completed: ${new Date(test.completedDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    {test.passed !== undefined && (
                      <Badge variant={test.passed ? 'default' : 'destructive'}>
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    )}
                  </div>

                  {test.testType === 'potency' && renderPotencyResults(test)}
                  {test.testType === 'microbial' && renderMicrobialResults(test)}

                  {test.status === 'completed' && !test.passed && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This batch failed {test.testType} testing. Retest required before sale.
                      </AlertDescription>
                    </Alert>
                  )}

                  {test.certificationUrl && (
                    <Button variant="outline" size="sm" className="mt-3">
                      <FileText className="h-3 w-3 mr-1" />
                      View Certificate
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Compliance Alert */}
      {!allRequiredComplete && batch.stage === 'testing' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            All required tests (Potency, Microbial, Pesticide) must pass before this batch can proceed to packaging.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

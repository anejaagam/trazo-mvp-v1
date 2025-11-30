import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PackageCheck, AlertTriangle, CheckCircle, ArrowRight, FileText } from 'lucide-react';

type ReconciliationStep = 'select-location' | 'physical-count' | 'review-variance' | 'complete';

interface InventoryItem {
  sku: string;
  productName: string;
  systemCount: number;
  physicalCount: number;
  variance: number;
  variancePercent: number;
  status: 'match' | 'under' | 'over';
}

export function InventoryReconciliation() {
  const [currentStep, setCurrentStep] = useState<ReconciliationStep>('select-location');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { sku: 'BLD-3.5G-001', productName: 'Blue Dream 3.5g', systemCount: 150, physicalCount: 0, variance: 0, variancePercent: 0, status: 'match' },
    { sku: 'OGK-3.5G-002', productName: 'OG Kush 3.5g', systemCount: 200, physicalCount: 0, variance: 0, variancePercent: 0, status: 'match' },
    { sku: 'GDP-3.5G-003', productName: 'Granddaddy Purple 3.5g', systemCount: 125, physicalCount: 0, variance: 0, variancePercent: 0, status: 'match' },
    { sku: 'SCD-1G-004', productName: 'Sour Diesel 1g', systemCount: 300, physicalCount: 0, variance: 0, variancePercent: 0, status: 'match' },
  ]);
  const [varianceNotes, setVarianceNotes] = useState('');

  const updatePhysicalCount = (sku: string, count: string) => {
    const numCount = parseInt(count) || 0;
    setInventoryItems(items =>
      items.map(item => {
        if (item.sku === sku) {
          const variance = numCount - item.systemCount;
          const variancePercent = item.systemCount > 0 ? (variance / item.systemCount) * 100 : 0;
          let status: 'match' | 'under' | 'over' = 'match';
          if (variance < 0) status = 'under';
          if (variance > 0) status = 'over';
          
          return {
            ...item,
            physicalCount: numCount,
            variance,
            variancePercent,
            status,
          };
        }
        return item;
      })
    );
  };

  const totalVariance = inventoryItems.reduce((sum, item) => sum + Math.abs(item.variance), 0);
  const hasVariances = inventoryItems.some(item => item.variance !== 0);
  const progress = currentStep === 'select-location' ? 25 : currentStep === 'physical-count' ? 50 : currentStep === 'review-variance' ? 75 : 100;

  const getVarianceBadge = (status: string) => {
    const colors: Record<string, string> = {
      match: 'bg-green-50 text-green-700 border-green-200',
      under: 'bg-red-50 text-red-700 border-red-200',
      over: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };

    const labels: Record<string, string> = {
      match: 'Match',
      under: 'Under',
      over: 'Over',
    };

    return (
      <Badge variant="outline" className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleComplete = () => {
    setCurrentStep('complete');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5" />
            Inventory Reconciliation Wizard
          </CardTitle>
          <CardDescription>
            Step-by-step audit tool to compare physical vs. system counts and document variances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p>Progress</p>
              <p className="text-slate-600">Step {
                currentStep === 'select-location' ? '1' :
                currentStep === 'physical-count' ? '2' :
                currentStep === 'review-variance' ? '3' : '4'
              } of 4</p>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            {['Select Location', 'Physical Count', 'Review Variance', 'Complete'].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < (progress / 25) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {index < (progress / 25) - 1 ? <CheckCircle className="w-5 h-5" /> : index + 1}
                </div>
                <span className="hidden md:block">{step}</span>
                {index < 3 && <ArrowRight className="w-4 h-4 text-slate-400 mx-2 hidden md:block" />}
              </div>
            ))}
          </div>

          <Separator />

          {currentStep === 'select-location' && (
            <div className="space-y-4">
              <div>
                <p>Step 1: Select Location</p>
                <p className="text-slate-600">Choose the storage location to reconcile</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vault-a">Vault A - Flower Products</SelectItem>
                    <SelectItem value="vault-b">Vault B - Pre-Rolls</SelectItem>
                    <SelectItem value="vault-c">Vault C - Concentrates</SelectItem>
                    <SelectItem value="retail-1">Retail Display #1</SelectItem>
                    <SelectItem value="retail-2">Retail Display #2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <PackageCheck className="h-4 w-4" />
                <AlertDescription>
                  System will load all inventory items assigned to the selected location for physical count verification.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={() => setCurrentStep('physical-count')} 
                disabled={!selectedLocation}
                className="w-full"
              >
                Begin Physical Count
              </Button>
            </div>
          )}

          {currentStep === 'physical-count' && (
            <div className="space-y-4">
              <div>
                <p>Step 2: Physical Count</p>
                <p className="text-slate-600">Enter the actual physical count for each item</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-50 p-4 grid grid-cols-5 gap-4">
                  <p>SKU</p>
                  <p>Product Name</p>
                  <p>System Count</p>
                  <p>Physical Count</p>
                  <p>Status</p>
                </div>
                <div className="divide-y">
                  {inventoryItems.map((item) => (
                    <div key={item.sku} className="p-4 grid grid-cols-5 gap-4 items-center">
                      <p className="font-mono">{item.sku}</p>
                      <p>{item.productName}</p>
                      <p>{item.systemCount}</p>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.physicalCount || ''}
                        onChange={(e) => updatePhysicalCount(item.sku, e.target.value)}
                        className="w-full"
                      />
                      {getVarianceBadge(item.status)}
                    </div>
                  ))}
                </div>
              </div>

              {hasVariances && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Variances detected: {totalVariance} total units. Review and document before proceeding.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('select-location')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep('review-variance')}
                  className="flex-1"
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'review-variance' && (
            <div className="space-y-4">
              <div>
                <p>Step 3: Review Variances</p>
                <p className="text-slate-600">Document any variances and provide explanations</p>
              </div>

              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle>Variance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-600">Total Items</p>
                      <p>{inventoryItems.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Items with Variance</p>
                      <p className="text-yellow-600">
                        {inventoryItems.filter(i => i.variance !== 0).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Total Variance</p>
                      <p className="text-red-600">{totalVariance} units</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="border rounded-lg divide-y">
                {inventoryItems.filter(item => item.variance !== 0).map((item) => (
                  <div key={item.sku} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>{item.productName}</p>
                        <p className="text-slate-600">SKU: {item.sku}</p>
                      </div>
                      {getVarianceBadge(item.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center py-2 bg-slate-50 rounded">
                      <div>
                        <p className="text-slate-600">System</p>
                        <p>{item.systemCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Physical</p>
                        <p>{item.physicalCount}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Variance</p>
                        <p className={item.variance < 0 ? 'text-red-600' : 'text-yellow-600'}>
                          {item.variance > 0 ? '+' : ''}{item.variance} ({item.variancePercent.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Variance Explanation</Label>
                <Textarea
                  id="notes"
                  placeholder="Document the reason for variances (e.g., damaged goods, theft, counting error, system adjustment needed)..."
                  value={varianceNotes}
                  onChange={(e) => setVarianceNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('physical-count')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1"
                >
                  Complete Reconciliation
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <p>Reconciliation Complete</p>
                <p className="text-slate-600">Report generated and logged in audit trail</p>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-600">Location</p>
                      <p>Vault A</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Items Counted</p>
                      <p>{inventoryItems.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Variances</p>
                      <p>{inventoryItems.filter(i => i.variance !== 0).length}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Date</p>
                      <p>2025-10-16</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <FileText className="w-4 h-4" />
                  Download Report
                </Button>
                <Button 
                  onClick={() => {
                    setCurrentStep('select-location');
                    setSelectedLocation('');
                    setVarianceNotes('');
                    setInventoryItems(items => items.map(item => ({
                      ...item,
                      physicalCount: 0,
                      variance: 0,
                      variancePercent: 0,
                      status: 'match' as const,
                    })));
                  }}
                  className="flex-1"
                >
                  New Reconciliation
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

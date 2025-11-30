import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { WasteReason, WasteLog } from '../types/waste';
import { Trash2, Scale, Blend, Camera, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface WasteDisposalWorkflowProps {
  onSubmitForApproval: (log: Omit<WasteLog, 'id' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}

type WorkflowStep = 'categorize' | 'weigh' | 'mix' | 'evidence' | 'review';

const wasteReasonLabels: Record<WasteReason, string> = {
  normal_plant_debris: 'Normal Plant Debris',
  failed_qa: 'Failed QA Testing',
  pest_infestation: 'Pest Infestation',
  mold_contamination: 'Mold/Contamination',
  trim_waste: 'Trim Waste',
  stem_waste: 'Stem/Stalk Waste',
  damaged_product: 'Damaged Product',
  expired_product: 'Expired Product',
  other: 'Other (Specify)',
};

export function WasteDisposalWorkflow({ onSubmitForApproval, onCancel }: WasteDisposalWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('categorize');
  const [wasteType, setWasteType] = useState<WasteReason | ''>('');
  const [wasteTypeOther, setWasteTypeOther] = useState('');
  const [batchId, setBatchId] = useState('');
  const [produceWeight, setProduceWeight] = useState('');
  const [packagingWeight, setPackagingWeight] = useState('');
  const [disposalMethod, setDisposalMethod] = useState<'compost' | 'landfill' | 'donation' | 'animal_feed' | 'other'>('compost');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  const produceWeightNum = parseFloat(produceWeight) || 0;
  const packagingWeightNum = parseFloat(packagingWeight) || 0;
  const totalWeight = produceWeightNum + packagingWeightNum;

  const handleNext = () => {
    if (currentStep === 'categorize' && wasteType) {
      setCurrentStep('weigh');
    } else if (currentStep === 'weigh' && produceWeightNum > 0) {
      setCurrentStep('evidence');
    } else if (currentStep === 'evidence' && evidenceFiles.length > 0) {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'weigh') setCurrentStep('categorize');
    else if (currentStep === 'evidence') setCurrentStep('weigh');
    else if (currentStep === 'review') setCurrentStep('evidence');
  };

  const handleSubmit = () => {
    if (!technicianName.trim()) return;

    // In a real app, we'd upload the evidence files first
    const mockEvidenceUrls = evidenceFiles.map((_, idx) => 
      `https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&${idx}`
    );

    onSubmitForApproval({
      batchId: batchId || undefined,
      wasteType: wasteType as WasteReason,
      wasteTypeOther: wasteType === 'other' ? wasteTypeOther : undefined,
      produceWeight: produceWeightNum,
      packagingWeight: packagingWeightNum > 0 ? packagingWeightNum : undefined,
      totalWeight,
      disposalMethod,
      createdBy: technicianName.trim(),
      evidenceUrls: mockEvidenceUrls,
      notes: notes || undefined,
    });
  };

  const getStepStatus = (step: WorkflowStep): 'complete' | 'current' | 'pending' => {
    const steps: WorkflowStep[] = ['categorize', 'weigh', 'mix', 'evidence', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      {/* SOP Header */}
      <Alert>
        <AlertDescription>
          <div className="flex items-start gap-2">
            <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-900">SOP-003: Waste Disposal</p>
              <p className="text-gray-600">
                Document the destruction of plant waste according to state compliance rules.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Progress Steps */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {(['categorize', 'weigh', 'mix', 'evidence', 'review'] as WorkflowStep[]).map((step, index) => {
            const status = getStepStatus(step);
            const stepLabels = {
              categorize: 'Categorize',
              weigh: 'Weigh',
              mix: 'Mix & Render',
              evidence: 'Evidence',
              review: 'Review',
            };

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${status === 'complete' ? 'bg-green-600 text-white' : ''}
                      ${status === 'current' ? 'bg-red-600 text-white' : ''}
                      ${status === 'pending' ? 'bg-gray-200 text-gray-600' : ''}
                    `}
                  >
                    {status === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>
                  <p
                    className={`mt-2 ${
                      status === 'current' ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {stepLabels[step]}
                  </p>
                </div>
                {index < 4 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      status === 'complete' ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step 1: Categorize Waste */}
      {currentStep === 'categorize' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 1: Categorize Waste Material</h3>
          <p className="text-gray-600 mb-6">
            Select the reason for waste disposal and provide any relevant batch information.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="waste-type">Waste Reason <span className="text-red-600">*</span></Label>
              <Select value={wasteType} onValueChange={(val) => setWasteType(val as WasteReason)}>
                <SelectTrigger id="waste-type" className="mt-2">
                  <SelectValue placeholder="Select waste reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(wasteReasonLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {wasteType === 'other' && (
              <div>
                <Label htmlFor="waste-type-other">Specify Other Reason <span className="text-red-600">*</span></Label>
                <Input
                  id="waste-type-other"
                  placeholder="Describe the waste reason"
                  value={wasteTypeOther}
                  onChange={(e) => setWasteTypeOther(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label htmlFor="batch-id">Related Batch ID (Optional)</Label>
              <Input
                id="batch-id"
                placeholder="BTH-2025-001"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">If this waste is from a specific batch, enter the batch ID</p>
            </div>

            <div>
              <Label htmlFor="initial-notes">Initial Notes (Optional)</Label>
              <Textarea
                id="initial-notes"
                placeholder="Add any initial observations or notes about the waste material..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={!wasteType || (wasteType === 'other' && !wasteTypeOther)}
            >
              Next: Weigh Material
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Weigh */}
      {currentStep === 'weigh' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 2: Weigh Waste Material</h3>
          <p className="text-gray-600 mb-6">
            Weigh the plant waste and non-plant material separately. Ensure at least 50% non-plant waste is added.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="produce-weight">Produce Weight (lbs) <span className="text-red-600">*</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <Input
                  id="produce-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={produceWeight}
                  onChange={(e) => setProduceWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600">lbs</span>
              </div>
            </div>

            <div>
              <Label htmlFor="packaging-weight">Packaging Weight (lbs) <span className="text-gray-500">(optional)</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <Input
                  id="packaging-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={packagingWeight}
                  onChange={(e) => setPackagingWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600">lbs</span>
              </div>
              <p className="text-gray-500 mt-1">
                Include weight of any packaging materials being disposed
              </p>
            </div>

            <div>
              <Label htmlFor="disposal-method">Disposal Method <span className="text-red-600">*</span></Label>
              <select
                id="disposal-method"
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value as any)}
                className="w-full mt-2 rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="compost">Compost</option>
                <option value="landfill">Landfill</option>
                <option value="donation">Donation</option>
                <option value="animal_feed">Animal Feed</option>
                <option value="other">Other</option>
              </select>
            </div>

            {produceWeightNum > 0 && (
              <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-blue-900">
                      Total Weight: {totalWeight.toFixed(2)} lbs
                    </p>
                    <p className="text-blue-700">
                      Disposal Method: {disposalMethod.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Ensure all waste disposal complies with PrimusGFS standards and local food safety regulations.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!produceWeightNum}
            >
              Next: Add Evidence
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Evidence */}
      {currentStep === 'evidence' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 3: Document with Photo/Video Evidence</h3>
          <p className="text-gray-600 mb-6">
            Take photos or videos of the waste disposal process and attach them to this log.
          </p>

          <div className="space-y-4">
            <Alert>
              <Camera className="w-4 h-4" />
              <AlertDescription>
                <p className="text-gray-900 mb-2">Required Evidence:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Photo of produce waste before disposal</li>
                  <li>Photo of waste disposal container/area</li>
                  <li>Photo/video of disposal process</li>
                  <li>Photo of final disposed waste</li>
                  <li>Photo showing proper waste segregation</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="evidence-files">Upload Photos/Videos <span className="text-red-600">*</span></Label>
              <Input
                id="evidence-files"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mt-2"
              />
              {evidenceFiles.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    ✓ {evidenceFiles.length} file(s) selected
                  </p>
                  <ul className="mt-2 space-y-1">
                    {Array.from(evidenceFiles).map((file, idx) => (
                      <li key={idx} className="text-green-700">
                        • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="evidence-notes">Additional Notes</Label>
              <Textarea
                id="evidence-notes"
                placeholder="Add any additional observations, timestamps, or details about the disposal process..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={evidenceFiles.length === 0}
            >
              Next: Review & Submit
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 'review' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 4: Review and Submit for Approval</h3>
          <p className="text-gray-600 mb-6">
            Review all details before submitting to Compliance Manager for approval.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Waste Type</p>
              <p className="text-gray-900">
                {wasteReasonLabels[wasteType as WasteReason]}
                {wasteType === 'other' && wasteTypeOther && ` - ${wasteTypeOther}`}
              </p>
            </div>

            {batchId && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Related Batch</p>
                <p className="text-gray-900">{batchId}</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Weights</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Produce Weight</p>
                  <p className="text-gray-900">{produceWeightNum.toFixed(2)} lbs</p>
                </div>
                <div>
                  <p className="text-gray-600">Packaging Weight</p>
                  <p className="text-gray-900">{packagingWeightNum.toFixed(2)} lbs</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-gray-600">Total Weight</p>
                <p className="text-gray-900">{totalWeight.toFixed(2)} lbs</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-500 mb-1">Disposal Method</p>
              <p className="text-blue-900">
                {disposalMethod.replace('_', ' ')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Evidence Files</p>
              <p className="text-gray-900">{evidenceFiles.length} file(s) attached</p>
            </div>

            {notes && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="technician-name">Technician Name (Sign) <span className="text-red-600">*</span></Label>
              <Input
                id="technician-name"
                placeholder="Enter your full name"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="mt-2"
              />
              <p className="text-gray-500 mt-1">
                Your signature confirms that you have followed SOP-003 and all information is accurate.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                This waste log will be submitted to the Compliance Manager for review and approval. Once approved,
                it will be automatically reported to Metrc.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!technicianName.trim()}
            >
              Submit for Approval
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

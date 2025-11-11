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
  trim_waste: 'Trim Waste (Sugar Leaves)',
  stem_stalks: 'Stems & Stalks',
  fan_leaves: 'Fan Leaves',
  root_balls: 'Root Balls',
  failed_qa_testing: 'Failed QA Testing (Pesticides/Heavy Metals)',
  powdery_mildew: 'Powdery Mildew',
  bud_rot_botrytis: 'Bud Rot (Botrytis)',
  spider_mites: 'Spider Mites',
  other_pest_infestation: 'Other Pest Infestation',
  hermaphrodite_plants: 'Hermaphrodite Plants',
  male_plants: 'Male Plants',
  underweight_buds: 'Underweight/Popcorn Buds',
  damaged_flower: 'Damaged Flower',
  expired_product: 'Expired Product',
  recall: 'Product Recall',
  other: 'Other (Specify)',
};

export function WasteDisposalWorkflow({ onSubmitForApproval, onCancel }: WasteDisposalWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('categorize');
  const [wasteType, setWasteType] = useState<WasteReason | ''>('');
  const [wasteTypeOther, setWasteTypeOther] = useState('');
  const [batchId, setBatchId] = useState('');
  const [plantMaterialWeight, setPlantMaterialWeight] = useState('');
  const [nonPlantMaterialWeight, setNonPlantMaterialWeight] = useState('');
  const [mixingConfirmed, setMixingConfirmed] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  const plantMaterialWeightNum = parseFloat(plantMaterialWeight) || 0;
  const nonPlantMaterialWeightNum = parseFloat(nonPlantMaterialWeight) || 0;
  const totalWeight = plantMaterialWeightNum + nonPlantMaterialWeightNum;
  const mixingRatio = totalWeight > 0 ? (nonPlantMaterialWeightNum / totalWeight) * 100 : 0;
  const meetsRequirement = mixingRatio >= 50;

  const handleNext = () => {
    if (currentStep === 'categorize' && wasteType) {
      setCurrentStep('weigh');
    } else if (currentStep === 'weigh' && plantMaterialWeightNum > 0 && nonPlantMaterialWeightNum > 0 && meetsRequirement) {
      setCurrentStep('mix');
    } else if (currentStep === 'mix' && mixingConfirmed) {
      setCurrentStep('evidence');
    } else if (currentStep === 'evidence' && evidenceFiles.length > 0) {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'weigh') setCurrentStep('categorize');
    else if (currentStep === 'mix') setCurrentStep('weigh');
    else if (currentStep === 'evidence') setCurrentStep('mix');
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
      plantMaterialWeight: plantMaterialWeightNum,
      nonPlantMaterialWeight: nonPlantMaterialWeightNum,
      totalWeight,
      mixingRatio,
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
              <Label htmlFor="plant-material-weight">Plant Material Weight (kg) <span className="text-red-600">*</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <Input
                  id="plant-material-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={plantMaterialWeight}
                  onChange={(e) => setPlantMaterialWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600">kg</span>
              </div>
            </div>

            <div>
              <Label htmlFor="non-plant-material-weight">Non-Plant Material Weight (kg) <span className="text-red-600">*</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <Input
                  id="non-plant-material-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={nonPlantMaterialWeight}
                  onChange={(e) => setNonPlantMaterialWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600">kg</span>
              </div>
              <p className="text-gray-500 mt-1">
                Examples: soil, coffee grounds, paper, cardboard, food waste
              </p>
            </div>

            {plantMaterialWeightNum > 0 && nonPlantMaterialWeightNum > 0 && (
              <div className={`p-4 rounded-lg border-2 ${meetsRequirement ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {meetsRequirement ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={meetsRequirement ? 'text-green-900' : 'text-red-900'}>
                      Mixing Ratio: {mixingRatio.toFixed(1)}% non-plant material
                    </p>
                    <p className={meetsRequirement ? 'text-green-700' : 'text-red-700'}>
                      Total Weight: {totalWeight.toFixed(2)} kg
                    </p>
                  </div>
                </div>
                {meetsRequirement ? (
                  <p className="text-green-700">
                    ✓ Meets requirement: At least 50% non-plant material
                  </p>
                ) : (
                  <p className="text-red-700">
                    ✗ Does not meet requirement: Need at least 50% non-plant material
                  </p>
                )}
              </div>
            )}

            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                State regulations require plant waste to be mixed with at least 50% non-plant material to
                render it unusable and unrecognizable.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!cannabisWeightNum || !nonCannabisWeightNum || !meetsRequirement}
            >
              Next: Mix Materials
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Mix */}
      {currentStep === 'mix' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 3: Render Material Unusable</h3>
          <p className="text-gray-600 mb-6">
            Mix the cannabis waste with non-cannabis material to render it unusable and unrecognizable.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Blend className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-900 mb-2">Mixing Instructions:</p>
                  <ol className="list-decimal list-inside text-blue-800 space-y-1">
                    <li>Grind or shred the plant material thoroughly</li>
                    <li>Add the non-plant waste material (soil, paper, food waste, etc.)</li>
                    <li>Mix thoroughly until plant material is unrecognizable and unusable</li>
                    <li>Ensure uniform distribution throughout the mixture</li>
                    <li>Verify the mixture is at least 50% non-plant material</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Mixture Summary:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Plant Waste</p>
                  <p className="text-gray-900">{plantMaterialWeightNum.toFixed(2)} kg ({(100 - mixingRatio).toFixed(1)}%)</p>
                </div>
                <div>
                  <p className="text-gray-600">Non-Plant Material</p>
                  <p className="text-gray-900">{nonPlantMaterialWeightNum.toFixed(2)} kg ({mixingRatio.toFixed(1)}%)</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <p className="text-gray-900 mb-2">Important Compliance Requirements:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Material must be rendered completely unusable</li>
                  <li>Plant material must be unrecognizable in the final mixture</li>
                  <li>Process must be documented with photo/video evidence</li>
                  <li>Mixture must be properly disposed of according to local regulations</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="mixing-confirmed"
                checked={mixingConfirmed}
                onChange={(e) => setMixingConfirmed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="mixing-confirmed" className="text-gray-700 cursor-pointer">
                I confirm that I have mixed the plant waste with at least 50% non-plant material and rendered
                it completely unusable and unrecognizable according to state regulations.
              </label>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!mixingConfirmed}
            >
              Next: Upload Evidence
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Evidence */}
      {currentStep === 'evidence' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 4: Document with Photo/Video Evidence</h3>
          <p className="text-gray-600 mb-6">
            Take photos or videos of the waste disposal process and attach them to this log.
          </p>

          <div className="space-y-4">
            <Alert>
              <Camera className="w-4 h-4" />
              <AlertDescription>
                <p className="text-gray-900 mb-2">Required Evidence:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Photo of cannabis waste before mixing</li>
                  <li>Photo of non-cannabis material</li>
                  <li>Photo/video of mixing process</li>
                  <li>Photo of final unusable mixture</li>
                  <li>Photo showing waste is unrecognizable</li>
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

      {/* Step 5: Review */}
      {currentStep === 'review' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 5: Review and Submit for Approval</h3>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">Plant Waste</p>
                  <p className="text-gray-900">{plantMaterialWeightNum.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-gray-600">Non-Plant Material</p>
                  <p className="text-gray-900">{nonPlantMaterialWeightNum.toFixed(2)} kg</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Weight</p>
                  <p className="text-gray-900">{totalWeight.toFixed(2)} kg</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-500 mb-1">Mixing Ratio</p>
              <p className="text-green-900">
                {mixingRatio.toFixed(1)}% non-plant material ✓ Meets 50% requirement
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

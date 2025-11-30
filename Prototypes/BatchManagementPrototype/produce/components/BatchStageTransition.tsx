import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { BatchStage } from '../types/batch';
import { ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface BatchStageTransitionProps {
  currentStage: BatchStage;
  onTransition: (newStage: BatchStage) => void;
}

const stageFlow: BatchStage[] = [
  'propagation',
  'vegetative',
  'flowering',
  'harvest',
  'drying',
  'curing',
  'closed',
];

const stageDescriptions: Record<BatchStage, string> = {
  propagation: 'Initial cloning or seed germination phase',
  vegetative: 'Active growth and development phase',
  flowering: 'Reproductive phase with flower development',
  harvest: 'Cutting and initial processing',
  drying: 'Controlled drying environment',
  curing: 'Final curing and quality enhancement',
  closed: 'Batch completed and archived',
};

export function BatchStageTransition({ currentStage, onTransition }: BatchStageTransitionProps) {
  const [notes, setNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState<BatchStage | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const currentIndex = stageFlow.indexOf(currentStage);
  const nextStage = currentIndex < stageFlow.length - 1 ? stageFlow[currentIndex + 1] : null;
  const isLastStage = currentStage === 'closed';

  const handleOpenConfirmation = () => {
    if (selectedStage) {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmTransition = () => {
    if (selectedStage && signatureName.trim()) {
      onTransition(selectedStage);
      setNotes('');
      setSelectedStage(null);
      setSignatureName('');
      setConfirmDialogOpen(false);
    }
  };

  const handleCancelConfirmation = () => {
    setSignatureName('');
    setConfirmDialogOpen(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-gray-900 mb-6">Stage Transition</h3>

      {/* Current Stage */}
      <div className="mb-6">
        <Label>Current Stage</Label>
        <div className="flex items-center gap-3 mt-2 p-4 bg-blue-50 rounded-lg">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-gray-900">{currentStage}</p>
            <p className="text-gray-600">{stageDescriptions[currentStage]}</p>
          </div>
        </div>
      </div>

      {/* Stage Flow Visualization */}
      <div className="mb-6">
        <Label>Stage Flow</Label>
        <div className="flex items-center gap-2 mt-2 overflow-x-auto py-4">
          {stageFlow.map((stage, index) => (
            <div key={stage} className="flex items-center">
              <div
                className={`
                  px-4 py-2 rounded-lg whitespace-nowrap transition-colors
                  ${stage === currentStage ? 'bg-blue-600 text-white' : ''}
                  ${index < currentIndex ? 'bg-green-100 text-green-800' : ''}
                  ${index > currentIndex ? 'bg-gray-100 text-gray-600' : ''}
                `}
              >
                {stage}
              </div>
              {index < stageFlow.length - 1 && (
                <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {!isLastStage ? (
        <>
          {/* Next Stage Selection */}
          <div className="mb-6">
            <Label>Transition To</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {nextStage && (
                <button
                  onClick={() => setSelectedStage(nextStage)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-colors
                    ${selectedStage === nextStage ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <p className="text-gray-900">{nextStage}</p>
                  <p className="text-gray-600">
                    {stageDescriptions[nextStage]}
                  </p>
                  <p className="text-blue-600 mt-2">Recommended next stage</p>
                </button>
              )}
              
              {/* Allow skipping to any future stage */}
              {stageFlow.slice(currentIndex + 2).map(stage => (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-colors
                    ${selectedStage === stage ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <p className="text-gray-900">{stage}</p>
                  <p className="text-gray-600">
                    {stageDescriptions[stage]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Transition Notes */}
          <div className="mb-6">
            <Label htmlFor="notes">Transition Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this stage transition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Warning Alert */}
          {selectedStage && selectedStage !== nextStage && (
            <Alert className="mb-6">
              <AlertDescription>
                Warning: You are skipping stages. This action should only be done if necessary.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            onClick={handleOpenConfirmation}
            disabled={!selectedStage}
            className="w-full"
          >
            Transition to {selectedStage || 'next stage'}
          </Button>
        </>
      ) : (
        <Alert>
          <AlertDescription>
            This batch has been closed. No further stage transitions are available.
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={handleCancelConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stage Transition</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to transition this batch from <span className="font-semibold">{currentStage}</span> to{' '}
                  <span className="font-semibold">{selectedStage}</span>.
                </p>
                
                {selectedStage && selectedStage !== nextStage && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-800">
                      You are skipping one or more stages. This action should only be done if necessary and may affect
                      batch tracking accuracy.
                    </p>
                  </div>
                )}

                {notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 mb-1">Notes:</p>
                    <p className="text-gray-600">{notes}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signature-name" className="text-gray-900">
                    Authorized By (Type your name) <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="signature-name"
                    placeholder="Enter your full name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-gray-500">
                    This signature will be recorded in the batch timeline for audit purposes.
                  </p>
                </div>

                <p className="text-gray-600">
                  This action will be permanently recorded in the batch timeline. Are you sure you want to proceed?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelConfirmation}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmTransition}
              disabled={!signatureName.trim()}
            >
              Confirm Transition
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

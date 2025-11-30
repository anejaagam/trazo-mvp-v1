import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
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
import { Plant, DryingRoom, HarvestRecord } from '../types/harvest';
import { Sprout, Scale, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HarvestWorkflowProps {
  batchId: string;
  batchName: string;
  plants: Plant[];
  dryingRooms: DryingRoom[];
  onCompleteHarvest: (record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported' | 'metrcReportedAt'>) => void;
}

type WorkflowStep = 'select' | 'weigh' | 'location' | 'confirm';

export function HarvestWorkflow({ batchId, batchName, plants, dryingRooms, onCompleteHarvest }: HarvestWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select');
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [wetWeight, setWetWeight] = useState('');
  const [selectedDryingRoom, setSelectedDryingRoom] = useState<string>('');
  const [supervisorName, setSupervisorName] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const floweringPlants = plants.filter(p => p.status === 'flowering');
  const selectedPlants = floweringPlants.filter(p => selectedPlantIds.includes(p.id));
  const selectedRoom = dryingRooms.find(r => r.id === selectedDryingRoom);

  const togglePlantSelection = (plantId: string) => {
    setSelectedPlantIds(prev =>
      prev.includes(plantId) ? prev.filter(id => id !== plantId) : [...prev, plantId]
    );
  };

  const selectAllPlants = () => {
    setSelectedPlantIds(floweringPlants.map(p => p.id));
  };

  const deselectAllPlants = () => {
    setSelectedPlantIds([]);
  };

  const handleNext = () => {
    if (currentStep === 'select' && selectedPlantIds.length > 0) {
      setCurrentStep('weigh');
    } else if (currentStep === 'weigh' && wetWeight && parseFloat(wetWeight) > 0) {
      setCurrentStep('location');
    } else if (currentStep === 'location' && selectedDryingRoom) {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'weigh') {
      setCurrentStep('select');
    } else if (currentStep === 'location') {
      setCurrentStep('weigh');
    } else if (currentStep === 'confirm') {
      setCurrentStep('location');
    }
  };

  const handleOpenConfirmation = () => {
    setConfirmDialogOpen(true);
  };

  const handleConfirmHarvest = () => {
    if (supervisorName.trim()) {
      onCompleteHarvest({
        batchId,
        plantIds: selectedPlantIds,
        wetWeight: parseFloat(wetWeight),
        dryingRoomLocation: selectedRoom!.name,
        harvestedBy: supervisorName.trim(),
      });
      setConfirmDialogOpen(false);
      // Reset workflow
      setCurrentStep('select');
      setSelectedPlantIds([]);
      setWetWeight('');
      setSelectedDryingRoom('');
      setSupervisorName('');
    }
  };

  const getStepStatus = (step: WorkflowStep): 'complete' | 'current' | 'pending' => {
    const steps: WorkflowStep[] = ['select', 'weigh', 'location', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* SOP Header */}
      <Alert>
        <AlertDescription>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-900">SOP-002: Harvest & Batching</p>
              <p className="text-gray-600">
                Follow this compliant workflow to harvest flowering plants and record wet weight.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Progress Steps */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          {(['select', 'weigh', 'location', 'confirm'] as WorkflowStep[]).map((step, index) => {
            const status = getStepStatus(step);
            const stepLabels = {
              select: 'Select Plants',
              weigh: 'Weigh Plants',
              location: 'Drying Location',
              confirm: 'Confirm Harvest',
            };

            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${status === 'complete' ? 'bg-green-600 text-white' : ''}
                      ${status === 'current' ? 'bg-blue-600 text-white' : ''}
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
                {index < 3 && (
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

      {/* Step 1: Select Plants */}
      {currentStep === 'select' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900">Step 1: Select Plants to Harvest</h3>
              <p className="text-gray-600">
                Select the plants from batch {batchName} that are ready for harvest
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllPlants}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllPlants}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <Badge variant="outline">
              {selectedPlantIds.length} of {floweringPlants.length} plants selected
            </Badge>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {floweringPlants.map(plant => (
              <div
                key={plant.id}
                className={`
                  flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedPlantIds.includes(plant.id) ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                `}
                onClick={() => togglePlantSelection(plant.id)}
              >
                <Checkbox
                  checked={selectedPlantIds.includes(plant.id)}
                  onCheckedChange={() => togglePlantSelection(plant.id)}
                />
                <Sprout className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-gray-900">{plant.tagId}</p>
                  <p className="text-gray-600">{plant.location}</p>
                </div>
                <Badge>{plant.status}</Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleNext}
              disabled={selectedPlantIds.length === 0}
            >
              Next: Weigh Plants
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Weigh Plants */}
      {currentStep === 'weigh' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 2: Weigh Harvested Plants</h3>
          <p className="text-gray-600 mb-6">
            Cut down the selected plants and weigh them collectively. Enter the total wet weight.
          </p>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-5 h-5 text-blue-600" />
              <p className="text-gray-900">Selected Plants: {selectedPlantIds.length}</p>
            </div>
            <div className="text-gray-600 max-h-24 overflow-y-auto">
              {selectedPlants.map(p => p.tagId).join(', ')}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="wet-weight">Total Wet Weight (kg) <span className="text-red-600">*</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scale className="w-5 h-5 text-gray-400" />
                <Input
                  id="wet-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={wetWeight}
                  onChange={(e) => setWetWeight(e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-600">kg</span>
              </div>
            </div>

            {wetWeight && parseFloat(wetWeight) > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  Average weight per plant: {(parseFloat(wetWeight) / selectedPlantIds.length).toFixed(2)} kg
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!wetWeight || parseFloat(wetWeight) <= 0}
            >
              Next: Select Drying Location
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Drying Location */}
      {currentStep === 'location' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 3: Specify Drying Room Location</h3>
          <p className="text-gray-600 mb-6">
            Select the drying room where the harvested plants will be processed.
          </p>

          <div className="space-y-3">
            {dryingRooms.map(room => {
              const utilizationPercent = (room.currentLoad / room.capacity) * 100;
              const availableCapacity = room.capacity - room.currentLoad;
              const wetWeightNum = parseFloat(wetWeight);

              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedDryingRoom(room.id)}
                  className={`
                    w-full p-4 border-2 rounded-lg text-left transition-colors
                    ${selectedDryingRoom === room.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-gray-900">{room.name}</p>
                        <p className="text-gray-600">{room.location}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        utilizationPercent > 80
                          ? 'bg-red-100 text-red-800'
                          : utilizationPercent > 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {utilizationPercent.toFixed(0)}% Full
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-gray-600">
                    <div>
                      <p className="text-gray-500">Capacity</p>
                      <p>{room.capacity} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Available</p>
                      <p>{availableCapacity} kg</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Conditions</p>
                      <p>{room.temperature}°C / {room.humidity}% RH</p>
                    </div>
                  </div>

                  {wetWeightNum > availableCapacity && (
                    <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-red-800">
                        Insufficient capacity for this harvest
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedDryingRoom}
            >
              Next: Confirm Harvest
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {currentStep === 'confirm' && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-2">Step 4: Review and Confirm Harvest</h3>
          <p className="text-gray-600 mb-6">
            Review the harvest details before confirming. This will report to Metrc.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Batch</p>
              <p className="text-gray-900">{batchName}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Plants Selected</p>
              <p className="text-gray-900">{selectedPlantIds.length} plants</p>
              <p className="text-gray-600 mt-1">
                {selectedPlants.map(p => p.tagId).join(', ')}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Total Wet Weight</p>
              <p className="text-gray-900">{wetWeight} kg</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Drying Room</p>
              <p className="text-gray-900">{selectedRoom?.name}</p>
              <p className="text-gray-600">{selectedRoom?.location}</p>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-900">Important</p>
                  <p className="text-gray-600">
                    Confirming this harvest will automatically report the data to Metrc. Ensure all information is
                    accurate before proceeding.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleOpenConfirmation}>
              Confirm Harvest
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Harvest Completion</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to confirm the harvest of <span className="font-semibold">{selectedPlantIds.length} plants</span> with
                  a total wet weight of <span className="font-semibold">{wetWeight} kg</span>.
                </p>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    This action will automatically report the harvest to Metrc and cannot be undone.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supervisor-name" className="text-gray-900">
                    Harvest Supervisor (Type your name) <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="supervisor-name"
                    placeholder="Enter your full name"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-gray-500">
                    Your signature confirms compliance with SOP-002 and authorizes the Metrc report.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupervisorName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmHarvest}
              disabled={!supervisorName.trim()}
            >
              Confirm & Report to Metrc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

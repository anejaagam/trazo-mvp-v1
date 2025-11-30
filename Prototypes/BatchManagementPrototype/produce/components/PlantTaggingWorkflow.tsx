import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
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
import { PlantTag, TaggedPlant, TaggingSession } from '../types/tagging';
import { Tag, CheckCircle2, AlertTriangle, Scan, Link as LinkIcon } from 'lucide-react';

interface PlantTaggingWorkflowProps {
  batchId: string;
  batchName: string;
  plantCount: number;
  availableTags: PlantTag[];
  onCompleteSession: (session: Omit<TaggingSession, 'id' | 'startedAt'>) => void;
  onCancel: () => void;
}

export function PlantTaggingWorkflow({
  batchId,
  batchName,
  plantCount,
  availableTags,
  onCompleteSession,
  onCancel,
}: PlantTaggingWorkflowProps) {
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0);
  const [scannedTag, setScannedTag] = useState('');
  const [taggedPlants, setTaggedPlants] = useState<TaggedPlant[]>([]);
  const [confirmAttached, setConfirmAttached] = useState(false);
  const [technicianName, setTechnicianName] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const currentPlant = currentPlantIndex + 1;
  const progressPercent = (taggedPlants.length / plantCount) * 100;

  // Auto-focus on tag input when ready for next plant
  useEffect(() => {
    if (sessionStarted && !confirmAttached) {
      const input = document.getElementById('tag-scanner');
      if (input) input.focus();
    }
  }, [sessionStarted, confirmAttached, currentPlantIndex]);

  const handleStartSession = () => {
    if (technicianName.trim()) {
      setSessionStarted(true);
    }
  };

  const handleScanTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedTag.trim()) return;

    const trimmedTag = scannedTag.trim();

    // Check if tag already used in this session
    if (taggedPlants.some(p => p.tagNumber === trimmedTag)) {
      alert('This tag has already been used in this session.');
      setScannedTag('');
      return;
    }

    // For testing: Accept any tag that looks like a valid format
    // Valid formats: starts with letters/numbers and is at least 8 characters
    if (trimmedTag.length < 8) {
      alert('Tag number must be at least 8 characters long.');
      setScannedTag('');
      return;
    }

    setConfirmAttached(true);
  };

  const handleConfirmAttachment = () => {
    const trimmedTag = scannedTag.trim();
    
    // Try to find existing tag, otherwise create a mock one for testing
    const existingTag = availableTags.find(t => t.tagNumber === trimmedTag);
    const tagId = existingTag?.id || `tag-generated-${Date.now()}`;
    const metrcUid = existingTag?.metrcUid || trimmedTag;

    const newTaggedPlant: TaggedPlant = {
      id: `plant-${Date.now()}-${currentPlantIndex}`,
      batchId,
      tagId: tagId,
      tagNumber: trimmedTag,
      metrcUid: metrcUid,
      physicallyAttached: true,
      attachedBy: technicianName,
      attachedAt: new Date().toISOString(),
      location: `${batchName} - Plant ${currentPlant}`,
      varietyName: 'Batch Variety',
      harvestDate: new Date().toISOString().split('T')[0],
    };

    setTaggedPlants([...taggedPlants, newTaggedPlant]);
    setScannedTag('');
    setConfirmAttached(false);

    // Move to next plant or complete
    if (currentPlantIndex + 1 < plantCount) {
      setCurrentPlantIndex(currentPlantIndex + 1);
    } else {
      setReviewDialogOpen(true);
    }
  };

  const handleSkipPlant = () => {
    setScannedTag('');
    setConfirmAttached(false);
    
    if (currentPlantIndex + 1 < plantCount) {
      setCurrentPlantIndex(currentPlantIndex + 1);
    } else {
      setReviewDialogOpen(true);
    }
  };

  const handleOpenComplete = () => {
    setReviewDialogOpen(false);
    setCompleteDialogOpen(true);
  };

  const handleCompleteSession = () => {
    onCompleteSession({
      batchId,
      batchName,
      startedBy: technicianName,
      completedAt: new Date().toISOString(),
      plantsToTag: plantCount,
      plantsTagged: taggedPlants.length,
      taggedPlants,
    });
  };

  if (!sessionStarted) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            <div className="flex items-start gap-2">
              <Tag className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-900">SOP-001: Plant Tagging</p>
                <p className="text-gray-600">
                  Assign unique Metrc UID tags to every immature plant in the batch.
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Start Tagging Session</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-500 mb-1">Batch</p>
              <p className="text-gray-900">{batchName}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-500 mb-1">Plants to Tag</p>
              <p className="text-gray-900">{plantCount} plants</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-500 mb-1">Available Tags</p>
              <p className="text-gray-900">{availableTags.filter(t => t.status === 'available').length} pre-loaded tags</p>
              <p className="text-gray-600 mt-1">You can also enter any tag number manually for testing</p>
            </div>

            <Alert>
              <AlertDescription>
                <p className="text-gray-900 mb-2">Testing Mode:</p>
                <p className="text-gray-700">
                  You can scan from the {availableTags.filter(t => t.status === 'available').length} available tags
                  or enter any tag number manually (min. 8 characters). Examples:
                </p>
                <ul className="list-disc list-inside text-gray-600 mt-1">
                  <li>1A4060300000001</li>
                  <li>1A4060300000002</li>
                  <li>TEST-TAG-001</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="technician-name">Cultivation Technician Name <span className="text-red-600">*</span></Label>
              <Input
                id="technician-name"
                placeholder="Enter your full name"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="mt-2"
              />
            </div>

            <Alert>
              <AlertDescription>
                <p className="text-gray-900 mb-2">Tagging Process:</p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li>Scan the Metrc plant tag</li>
                  <li>Physically attach the tag to the plant's main stem</li>
                  <li>Confirm the attachment in the platform</li>
                  <li>Repeat for all plants in the batch</li>
                  <li>Review and complete to sync with Metrc</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleStartSession} disabled={!technicianName.trim()}>
              Start Tagging Session
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-gray-900">Tagging Session: {batchName}</h3>
            <p className="text-gray-600">Technician: {technicianName}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {taggedPlants.length} / {plantCount} Tagged
          </Badge>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <p className="text-gray-600">Progress</p>
            <p className="text-gray-900">{progressPercent.toFixed(0)}%</p>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </Card>

      {/* Current Plant Tagging */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Tag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-gray-900">Plant {currentPlant} of {plantCount}</h3>
            <p className="text-gray-600">Scan Metrc tag and attach to plant</p>
          </div>
        </div>

        {!confirmAttached ? (
          <form onSubmit={handleScanTag} className="space-y-4">
            <div>
              <Label htmlFor="tag-scanner">Scan Metrc Plant Tag <span className="text-red-600">*</span></Label>
              <div className="flex items-center gap-3 mt-2">
                <Scan className="w-5 h-5 text-gray-400" />
                <Input
                  id="tag-scanner"
                  placeholder="Scan or enter tag number (min. 8 characters)"
                  value={scannedTag}
                  onChange={(e) => setScannedTag(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
              </div>
              <p className="text-gray-500 mt-1">
                Use barcode scanner or manually enter any tag number (8+ characters)
              </p>
            </div>

            {/* Quick Test Tags */}
            <div className="flex flex-wrap gap-2">
              <p className="text-gray-600 w-full">Quick test tags:</p>
              {availableTags.slice(0, 5).map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScannedTag(tag.tagNumber)}
                >
                  {tag.tagNumber}
                </Button>
              ))}
            </div>

            <Alert>
              <AlertDescription>
                <p className="text-gray-900 mb-2">Instructions:</p>
                <ol className="list-decimal list-inside text-gray-700 space-y-1">
                  <li>Scan the next available Metrc plant tag</li>
                  <li>Securely attach the tag to the plant's main stem</li>
                  <li>Confirm the attachment below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={!scannedTag.trim()}>
                Continue
              </Button>
              <Button type="button" variant="outline" onClick={handleSkipPlant}>
                Skip Plant
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-900">Tag Scanned Successfully</p>
              </div>
              <p className="text-green-800">Tag Number: {scannedTag}</p>
            </div>

            <Alert>
              <LinkIcon className="w-4 h-4" />
              <AlertDescription>
                <p className="text-gray-900 mb-2">Physical Attachment Required:</p>
                <p className="text-gray-700">
                  Before confirming, ensure the tag is securely attached to the plant's main stem.
                  The tag must remain with the plant throughout its lifecycle.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <input
                type="checkbox"
                id="confirm-attached"
                checked={false}
                onChange={() => {}}
                className="mt-1"
              />
              <label htmlFor="confirm-attached" className="text-gray-700">
                I confirm that tag <span className="font-semibold">{scannedTag}</span> has been physically
                attached securely to plant {currentPlant}'s main stem.
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirmAttachment} className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm Attachment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setScannedTag('');
                  setConfirmAttached(false);
                }}
              >
                Re-scan Tag
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Recently Tagged */}
      {taggedPlants.length > 0 && (
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">Recently Tagged Plants</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...taggedPlants].reverse().slice(0, 5).map((plant, idx) => (
              <div key={plant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-gray-900">Plant {taggedPlants.length - idx}</p>
                    <p className="text-gray-600">{plant.tagNumber}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Tagged</Badge>
              </div>
            ))}
          </div>
          
          {taggedPlants.length < plantCount && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setReviewDialogOpen(true)}
            >
              Review Progress
            </Button>
          )}
        </Card>
      )}

      {/* Review Dialog */}
      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Review Tagging Progress</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Total Plants</p>
                    <p className="text-gray-900">{plantCount}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-gray-500">Plants Tagged</p>
                    <p className="text-green-900">{taggedPlants.length}</p>
                  </div>
                </div>

                {taggedPlants.length < plantCount && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      {plantCount - taggedPlants.length} plant(s) remain untagged. You can continue tagging
                      or complete the session now and tag remaining plants later.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="max-h-64 overflow-y-auto border rounded-lg p-3">
                  <p className="text-gray-900 mb-2">Tagged Plants:</p>
                  <div className="space-y-1">
                    {taggedPlants.map((plant, idx) => (
                      <div key={plant.id} className="flex justify-between text-gray-700">
                        <span>Plant {idx + 1}</span>
                        <span className="font-mono">{plant.tagNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Tagging</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenComplete}>
              Complete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Tagging Session</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  You are about to complete the tagging session for <span className="font-semibold">{batchName}</span>.
                </p>

                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div>
                    <p className="text-gray-500">Plants Tagged:</p>
                    <p className="text-gray-900">{taggedPlants.length} of {plantCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Technician:</p>
                    <p className="text-gray-900">{technicianName}</p>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    This action will sync the tagged plants with Metrc. Ensure all tags are correctly attached
                    before confirming.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteSession}>
              Complete & Sync to Metrc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

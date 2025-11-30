import { Batch, TimelineEvent, Pod } from '../types/batch';
import { Plant, DryingRoom, HarvestRecord } from '../types/harvest';
import { PlantTag, TaggingSession } from '../types/tagging';
import { BatchGenealogy } from '../types/cultivar';
import { PlantCountSnapshot } from '../types/plant-tracking';
import { DryingRecord, CuringRecord, PackagingRecord } from '../types/post-harvest';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Calendar, MapPin, Users, TrendingUp, FileText } from 'lucide-react';
import { BatchTimeline } from './BatchTimeline';
import { BatchMetricsPanel } from './BatchMetricsPanel';
import { BatchStageTransition } from './BatchStageTransition';
import { EvidenceCapture } from './EvidenceCapture';
import { HarvestWorkflow } from './HarvestWorkflow';
import { PlantTaggingWorkflow } from './PlantTaggingWorkflow';
import { BatchGenealogyView } from './BatchGenealogyView';
import { PlantCountTracking } from './PlantCountTracking';
import { PostHarvestProcessing } from './PostHarvestProcessing';
import { QuarantineManagement } from './QuarantineManagement';
import { BatchStage } from '../types/batch';

interface BatchDetailViewProps {
  batch: Batch;
  pods: Pod[];
  events: TimelineEvent[];
  plants: Plant[];
  dryingRooms: DryingRoom[];
  availableTags: PlantTag[];
  genealogy: BatchGenealogy | null;
  plantCountSnapshots: PlantCountSnapshot[];
  dryingRecords: DryingRecord[];
  curingRecords: CuringRecord[];
  packagingRecords: PackagingRecord[];
  onBack: () => void;
  onStageTransition: (batchId: string, newStage: BatchStage) => void;
  onAddEvidence: (batchId: string, evidence: { type: string; description: string; files: File[] }) => void;
  onCompleteHarvest: (record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported' | 'metrcReportedAt'>) => void;
  onCompleteTagging: (session: Omit<TaggingSession, 'id' | 'startedAt'>) => void;
  onRecordPlantCount: (snapshot: Omit<PlantCountSnapshot, 'id' | 'timestamp'>) => void;
  onStartDrying: (record: Omit<DryingRecord, 'id'>) => void;
  onCompleteDrying: (recordId: string, data: { endWeight: number; qualityNotes: string; completedBy: string }) => void;
  onStartCuring: (record: Omit<CuringRecord, 'id'>) => void;
  onCompleteCuring: (recordId: string, data: { endWeight: number; qualityNotes: string; completedBy: string }) => void;
  onCompletePackaging: (record: Omit<PackagingRecord, 'id'>) => void;
  onQuarantine: (batchId: string, reason: string, authorizedBy: string) => void;
  onReleaseQuarantine: (batchId: string, authorizedBy: string, notes: string) => void;
}

const stageColors: Record<BatchStage, string> = {
  propagation: 'bg-blue-100 text-blue-800',
  vegetative: 'bg-green-100 text-green-800',
  flowering: 'bg-purple-100 text-purple-800',
  harvest: 'bg-yellow-100 text-yellow-800',
  drying: 'bg-orange-100 text-orange-800',
  curing: 'bg-amber-100 text-amber-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function BatchDetailView({ 
  batch, 
  pods, 
  events, 
  plants,
  dryingRooms,
  availableTags,
  genealogy,
  plantCountSnapshots,
  dryingRecords,
  curingRecords,
  packagingRecords,
  onBack, 
  onStageTransition,
  onAddEvidence,
  onCompleteHarvest,
  onCompleteTagging,
  onRecordPlantCount,
  onStartDrying,
  onCompleteDrying,
  onStartCuring,
  onCompleteCuring,
  onCompletePackaging,
  onQuarantine,
  onReleaseQuarantine
}: BatchDetailViewProps) {
  const batchPods = pods.filter(p => batch.growingAreaIds.includes(p.id));
  const daysActive = Math.floor(
    (new Date().getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-gray-900">{batch.name}</h1>
            <Badge className={stageColors[batch.stage]}>
              {batch.stage}
            </Badge>
          </div>
          <p className="text-gray-500">{batch.cultivar}</p>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Generate Batch Packet
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-500">Days Active</p>
              <p className="text-gray-900">{daysActive}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-500">Plant Count</p>
              <p className="text-gray-900">{batch.plantCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-500">Pods</p>
              <p className="text-gray-900">{batchPods.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-gray-500">Started</p>
              <p className="text-gray-900">
                {new Date(batch.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pods List */}
      <Card className="p-4">
        <h3 className="text-gray-900 mb-3">Assigned Pods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {batchPods.map(pod => (
            <div key={pod.id} className="border rounded-lg p-3">
              <p className="text-gray-900">{pod.name}</p>
              <p className="text-gray-500">{pod.location}</p>
              <p className="text-gray-600">Capacity: {pod.capacity}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="genealogy">Genealogy</TabsTrigger>
          <TabsTrigger value="plant-count">Plant Count</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          {(batch.stage === 'propagation' || batch.stage === 'vegetative') && (
            <TabsTrigger value="tagging">Plant Tagging (SOP-001)</TabsTrigger>
          )}
          {batch.stage === 'flowering' && (
            <TabsTrigger value="harvest">Harvest (SOP-002)</TabsTrigger>
          )}
          {(batch.stage === 'drying' || batch.stage === 'curing') && (
            <TabsTrigger value="post-harvest">Post-Harvest</TabsTrigger>
          )}
          <TabsTrigger value="stage">Stage Transition</TabsTrigger>
          <TabsTrigger value="evidence">Evidence & QA</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <BatchTimeline events={events} />
        </TabsContent>

        <TabsContent value="genealogy" className="mt-4">
          <div className="space-y-6">
            <BatchGenealogyView genealogy={genealogy} cultivarName={batch.cultivar} />
            <QuarantineManagement
              batch={batch}
              onQuarantine={onQuarantine}
              onRelease={onReleaseQuarantine}
            />
          </div>
        </TabsContent>

        <TabsContent value="plant-count" className="mt-4">
          <PlantCountTracking
            batchId={batch.id}
            snapshots={plantCountSnapshots}
            onRecordSnapshot={onRecordPlantCount}
          />
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <BatchMetricsPanel batchId={batch.id} />
        </TabsContent>

        {(batch.stage === 'propagation' || batch.stage === 'vegetative') && (
          <TabsContent value="tagging" className="mt-4">
            <PlantTaggingWorkflow
              batchId={batch.id}
              batchName={batch.name}
              plantCount={batch.plantCount}
              availableTags={availableTags}
              onCompleteSession={onCompleteTagging}
              onCancel={() => {}}
            />
          </TabsContent>
        )}

        {batch.stage === 'flowering' && (
          <TabsContent value="harvest" className="mt-4">
            <HarvestWorkflow
              batchId={batch.id}
              batchName={batch.name}
              plants={plants}
              dryingRooms={dryingRooms}
              onCompleteHarvest={onCompleteHarvest}
            />
          </TabsContent>
        )}

        {(batch.stage === 'drying' || batch.stage === 'curing') && (
          <TabsContent value="post-harvest" className="mt-4">
            <PostHarvestProcessing
              batchId={batch.id}
              batchName={batch.name}
              currentStage={batch.stage}
              dryingRecords={dryingRecords}
              curingRecords={curingRecords}
              packagingRecords={packagingRecords}
              onStartDrying={onStartDrying}
              onCompleteDrying={onCompleteDrying}
              onStartCuring={onStartCuring}
              onCompleteCuring={onCompleteCuring}
              onCompletePackaging={onCompletePackaging}
            />
          </TabsContent>
        )}

        <TabsContent value="stage" className="mt-4">
          <BatchStageTransition 
            currentStage={batch.stage} 
            onTransition={(newStage) => onStageTransition(batch.id, newStage)}
          />
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <EvidenceCapture 
            batchId={batch.id}
            onAddEvidence={(evidence) => onAddEvidence(batch.id, evidence)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

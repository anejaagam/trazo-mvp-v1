import { useState } from 'react';
import { BatchDashboard } from './components/BatchDashboard';
import { BatchDetailView } from './components/BatchDetailView';
import { CreateBatchDialog } from './components/CreateBatchDialog';
import { BatchGroupManagement } from './components/BatchGroupManagement';
import { WasteLogDashboard } from './components/WasteLogDashboard';
import { WasteDisposalWorkflow } from './components/WasteDisposalWorkflow';
import { CultivarManagement } from './components/CultivarManagement';
import { RoomCapacityMonitor } from './components/RoomCapacityMonitor';
import { BulkBatchOperations } from './components/BulkBatchOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Batch, BatchStage, BatchGroup } from './types/batch';
import { HarvestRecord } from './types/harvest';
import { WasteLog } from './types/waste';
import { TaggingSession } from './types/tagging';
import { ProduceVariety } from './types/cultivar';
import { PlantCountSnapshot } from './types/plant-tracking';
import { DryingRecord, CuringRecord, PackagingRecord } from './types/post-harvest';
import { mockBatches, mockGrowingAreas, mockGroups, mockTimelineEvents } from './lib/mock-data';
import { mockProducePlants, mockPostHarvestFacilities, mockHarvestRecords } from './lib/harvest-mock-data';
import { mockWasteLogs } from './lib/waste-mock-data';
import { mockAvailableLabels, mockLabeledContainers } from './lib/tagging-mock-data';
import { mockProduceVarieties, mockGenealogyRecords } from './lib/cultivar-mock-data';
import { mockPlantCountSnapshots } from './lib/plant-tracking-mock-data';
import { Sprout } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

export default function App() {
  const [batches, setBatches] = useState<Batch[]>(mockBatches);
  const [groups, setGroups] = useState<BatchGroup[]>(mockGroups);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(mockWasteLogs);
  const [cultivars, setCultivars] = useState<ProduceVariety[]>(mockProduceVarieties);
  const [plantCountSnapshots, setPlantCountSnapshots] = useState<PlantCountSnapshot[]>(mockPlantCountSnapshots);
  const [dryingRecords, setDryingRecords] = useState<DryingRecord[]>([]);
  const [curingRecords, setCuringRecords] = useState<CuringRecord[]>([]);
  const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wasteWorkflowOpen, setWasteWorkflowOpen] = useState(false);
  const [userRole] = useState<'technician' | 'compliance_manager'>('compliance_manager');

  const handleCreateBatch = (data: {
    name: string;
    variety: string;
    varietyId?: string;
    stage: BatchStage;
    startDate: string;
    growingAreaIds: string[];
    plantCount: number;
  }) => {
    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      name: data.name,
      variety: data.variety,
      varietyId: data.varietyId,
      stage: data.stage,
      startDate: data.startDate,
      growingAreaIds: data.growingAreaIds,
      plantCount: data.plantCount,
      createdAt: new Date().toISOString(),
      quarantineStatus: 'none',
    };
    setBatches([...batches, newBatch]);
    toast.success('Batch created successfully');
  };

  const handleStageTransition = (batchId: string, newStage: BatchStage) => {
    setBatches(batches.map(b =>
      b.id === batchId ? { ...b, stage: newStage } : b
    ));
    if (selectedBatch?.id === batchId) {
      setSelectedBatch({ ...selectedBatch, stage: newStage });
    }
    toast.success(`Batch transitioned to ${newStage} stage`);
  };

  const handleAddEvidence = (batchId: string, evidence: { type: string; description: string; files: File[] }) => {
    toast.success('Evidence added successfully');
  };

  const handleCompleteHarvest = (record: Omit<HarvestRecord, 'id' | 'harvestDate' | 'metrcReported' | 'metrcReportedAt'>) => {
    // Update batch to harvest stage
    setBatches(batches.map(b =>
      b.id === record.batchId 
        ? { 
            ...b, 
            stage: 'harvest',
            yieldData: { ...b.yieldData, wetWeight: record.wetWeight }
          } 
        : b
    ));
    
    if (selectedBatch?.id === record.batchId) {
      setSelectedBatch({ 
        ...selectedBatch, 
        stage: 'harvest',
        yieldData: { ...selectedBatch.yieldData, wetWeight: record.wetWeight }
      });
    }
    
    toast.success(
      `Harvest completed! ${record.plantIds.length} plants (${record.wetWeight} kg) recorded in traceability system`,
      { duration: 5000 }
    );
  };

  const handleCreateGroup = (data: { name: string; description: string; batchIds: string[] }) => {
    const newGroup: BatchGroup = {
      id: `group-${Date.now()}`,
      name: data.name,
      description: data.description,
      batchIds: data.batchIds,
      createdAt: new Date().toISOString(),
    };
    setGroups([...groups, newGroup]);
    
    // Update batches with group assignment
    setBatches(batches.map(b =>
      data.batchIds.includes(b.id) ? { ...b, groupId: newGroup.id } : b
    ));
    
    toast.success('Batch group created successfully');
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    
    // Remove group assignment from batches
    setBatches(batches.map(b =>
      b.groupId === groupId ? { ...b, groupId: undefined } : b
    ));
    
    toast.success('Batch group deleted');
  };

  const handleAddBatchToGroup = (groupId: string, batchId: string) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, batchIds: [...g.batchIds, batchId] } : g
    ));
    setBatches(batches.map(b =>
      b.id === batchId ? { ...b, groupId } : b
    ));
    toast.success('Batch added to group');
  };

  const handleRemoveBatchFromGroup = (groupId: string, batchId: string) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, batchIds: g.batchIds.filter(id => id !== batchId) } : g
    ));
    setBatches(batches.map(b =>
      b.id === batchId && b.groupId === groupId ? { ...b, groupId: undefined } : b
    ));
    toast.success('Batch removed from group');
  };

  const handleSubmitWasteLog = (log: Omit<WasteLog, 'id' | 'createdAt' | 'status'>) => {
    const newLog: WasteLog = {
      ...log,
      id: `waste-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending_approval',
    };
    setWasteLogs([newLog, ...wasteLogs]);
    setWasteWorkflowOpen(false);
    toast.success('Waste log submitted for approval');
  };

  const handleApproveWasteLog = (logId: string, reviewedBy: string, reviewNotes: string) => {
    setWasteLogs(wasteLogs.map(log =>
      log.id === logId
        ? {
            ...log,
            status: 'reported_to_metrc' as const,
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reviewNotes,
            metrcReportedAt: new Date().toISOString(),
          }
        : log
    ));
    toast.success('Waste log approved and recorded in traceability system', { duration: 5000 });
  };

  const handleRejectWasteLog = (logId: string, reviewedBy: string, reviewNotes: string) => {
    setWasteLogs(wasteLogs.map(log =>
      log.id === logId
        ? {
            ...log,
            status: 'rejected' as const,
            reviewedBy,
            reviewedAt: new Date().toISOString(),
            reviewNotes,
          }
        : log
    ));
    toast.error('Waste log rejected');
  };

  const handleCompleteTagging = (session: Omit<TaggingSession, 'id' | 'startedAt'>) => {
    toast.success(
      `Labeling session completed! ${session.plantsTagged} of ${session.plantsToTag} units labeled and recorded in traceability system`,
      { duration: 5000 }
    );
  };

  const handleCreateCultivar = (cultivar: Omit<ProduceVariety, 'id' | 'createdAt'>) => {
    const newCultivar: ProduceVariety = {
      ...cultivar,
      id: `var-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCultivars([...cultivars, newCultivar]);
    toast.success('Variety created successfully');
  };

  const handleUpdateCultivar = (id: string, data: Partial<ProduceVariety>) => {
    setCultivars(cultivars.map(c => c.id === id ? { ...c, ...data } : c));
    toast.success(data.isActive === false ? 'Variety archived' : 'Variety updated');
  };

  const handleRecordPlantCount = (snapshot: Omit<PlantCountSnapshot, 'id' | 'timestamp'>) => {
    const newSnapshot: PlantCountSnapshot = {
      ...snapshot,
      id: `snapshot-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setPlantCountSnapshots([newSnapshot, ...plantCountSnapshots]);
    toast.success('Plant count recorded');
  };

  const handleStartDrying = (record: Omit<DryingRecord, 'id'>) => {
    const newRecord: DryingRecord = {
      ...record,
      id: `drying-${Date.now()}`,
    };
    setDryingRecords([...dryingRecords, newRecord]);
    toast.success('Drying process started');
  };

  const handleCompleteDrying = (recordId: string, data: any) => {
    setDryingRecords(dryingRecords.map(r =>
      r.id === recordId ? { ...r, endDate: new Date().toISOString(), ...data } : r
    ));
    toast.success('Drying process completed');
  };

  const handleStartCuring = (record: Omit<CuringRecord, 'id'>) => {
    const newRecord: CuringRecord = {
      ...record,
      id: `curing-${Date.now()}`,
    };
    setCuringRecords([...curingRecords, newRecord]);
    toast.success('Curing process started');
  };

  const handleCompleteCuring = (recordId: string, data: any) => {
    setCuringRecords(curingRecords.map(r =>
      r.id === recordId ? { ...r, endDate: new Date().toISOString(), ...data } : r
    ));
    toast.success('Curing process completed');
  };

  const handleCompletePackaging = (record: Omit<PackagingRecord, 'id'>) => {
    const newRecord: PackagingRecord = {
      ...record,
      id: `pkg-${Date.now()}`,
      metrcReported: true,
      metrcReportedAt: new Date().toISOString(),
    };
    setPackagingRecords([...packagingRecords, newRecord]);
    toast.success('Packaging completed and recorded in traceability system', { duration: 5000 });
  };

  const handleQuarantine = (batchId: string, reason: string, authorizedBy: string) => {
    setBatches(batches.map(b =>
      b.id === batchId
        ? {
            ...b,
            quarantineStatus: 'quarantined' as const,
            quarantineReason: reason,
            quarantinedAt: new Date().toISOString(),
            quarantinedBy: authorizedBy,
          }
        : b
    ));
    if (selectedBatch?.id === batchId) {
      setSelectedBatch({
        ...selectedBatch,
        quarantineStatus: 'quarantined',
        quarantineReason: reason,
        quarantinedAt: new Date().toISOString(),
        quarantinedBy: authorizedBy,
      });
    }
    toast.error(`Batch placed in quarantine: ${reason}`);
  };

  const handleReleaseQuarantine = (batchId: string, authorizedBy: string, notes: string) => {
    setBatches(batches.map(b =>
      b.id === batchId
        ? { ...b, quarantineStatus: 'released' as const }
        : b
    ));
    if (selectedBatch?.id === batchId) {
      setSelectedBatch({ ...selectedBatch, quarantineStatus: 'released' });
    }
    toast.success('Batch released from quarantine');
  };

  const handleBulkStageUpdate = (batchIds: string[], newStage: BatchStage, authorizedBy: string) => {
    setBatches(batches.map(b =>
      batchIds.includes(b.id) ? { ...b, stage: newStage } : b
    ));
    toast.success(`${batchIds.length} batch(es) updated to ${newStage} stage`);
  };

  const handleBulkLocationUpdate = (batchIds: string[], growingAreaIds: string[], authorizedBy: string) => {
    setBatches(batches.map(b =>
      batchIds.includes(b.id) ? { ...b, growingAreaIds } : b
    ));
    toast.success(`${batchIds.length} batch(es) moved to new location(s)`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Sprout className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-gray-900">Produce Batch Management System</h1>
              <p className="text-gray-600">Comprehensive tracking from seed to harvest</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wasteWorkflowOpen ? (
          <WasteDisposalWorkflow
            onSubmitForApproval={handleSubmitWasteLog}
            onCancel={() => setWasteWorkflowOpen(false)}
          />
        ) : selectedBatch ? (
          <BatchDetailView
            batch={selectedBatch}
            pods={mockGrowingAreas}
            events={mockTimelineEvents.filter(e => e.batchId === selectedBatch.id)}
            plants={mockProducePlants.filter(p => p.batchId === selectedBatch.id)}
            dryingRooms={mockPostHarvestFacilities}
            availableTags={mockAvailableLabels}
            genealogy={mockGenealogyRecords.find(g => g.batchId === selectedBatch.id) || null}
            plantCountSnapshots={plantCountSnapshots.filter(s => s.batchId === selectedBatch.id)}
            dryingRecords={dryingRecords.filter(r => r.batchId === selectedBatch.id)}
            curingRecords={curingRecords.filter(r => r.batchId === selectedBatch.id)}
            packagingRecords={packagingRecords.filter(r => r.batchId === selectedBatch.id)}
            onBack={() => setSelectedBatch(null)}
            onStageTransition={handleStageTransition}
            onAddEvidence={handleAddEvidence}
            onCompleteHarvest={handleCompleteHarvest}
            onCompleteTagging={handleCompleteTagging}
            onRecordPlantCount={handleRecordPlantCount}
            onStartDrying={handleStartDrying}
            onCompleteDrying={handleCompleteDrying}
            onStartCuring={handleStartCuring}
            onCompleteCuring={handleCompleteCuring}
            onCompletePackaging={handleCompletePackaging}
            onQuarantine={handleQuarantine}
            onReleaseQuarantine={handleReleaseQuarantine}
          />
        ) : (
          <Tabs defaultValue="batches" className="w-full">
            <TabsList>
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="cultivars">Cultivars</TabsTrigger>
              <TabsTrigger value="capacity">Room Capacity</TabsTrigger>
              <TabsTrigger value="bulk-ops">Bulk Operations</TabsTrigger>
              <TabsTrigger value="groups">Batch Groups</TabsTrigger>
              <TabsTrigger value="waste">Waste Disposal</TabsTrigger>
            </TabsList>

            <TabsContent value="batches" className="mt-6">
              <BatchDashboard
                batches={batches}
                onCreateBatch={() => setCreateDialogOpen(true)}
                onSelectBatch={setSelectedBatch}
              />
            </TabsContent>

            <TabsContent value="cultivars" className="mt-6">
              <CultivarManagement
                cultivars={cultivars}
                onCreateCultivar={handleCreateCultivar}
                onUpdateCultivar={handleUpdateCultivar}
              />
            </TabsContent>

            <TabsContent value="capacity" className="mt-6">
              <RoomCapacityMonitor
                pods={mockGrowingAreas}
                batches={batches}
              />
            </TabsContent>

            <TabsContent value="bulk-ops" className="mt-6">
              <BulkBatchOperations
                batches={batches}
                pods={mockGrowingAreas}
                onBulkStageUpdate={handleBulkStageUpdate}
                onBulkLocationUpdate={handleBulkLocationUpdate}
              />
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              <BatchGroupManagement
                groups={groups}
                batches={batches}
                onCreateGroup={handleCreateGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddBatchToGroup={handleAddBatchToGroup}
                onRemoveBatchFromGroup={handleRemoveBatchFromGroup}
              />
            </TabsContent>

            <TabsContent value="waste" className="mt-6">
              <WasteLogDashboard
                wasteLogs={wasteLogs}
                onCreateNew={() => setWasteWorkflowOpen(true)}
                onApprove={handleApproveWasteLog}
                onReject={handleRejectWasteLog}
                userRole={userRole}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Create Batch Dialog */}
      <CreateBatchDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        pods={mockGrowingAreas}
        onCreateBatch={handleCreateBatch}
      />
    </div>
  );
}

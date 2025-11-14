import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  LayoutDashboard, 
  Sprout, 
  Workflow, 
  Shield
} from 'lucide-react';

// Context Providers
import { DomainProvider } from './contexts/DomainContext';

// Components
import { DomainToggle } from './components/DomainToggle';
import { BatchManagement } from './components/BatchManagement';
import { CannabisWorkflowManager } from './components/CannabisWorkflowManager';
import { ProduceWorkflowManager } from './components/ProduceWorkflowManager';
import { CannabisFlowDemo } from './components/CannabisFlowDemo';
import { ProduceFlowDemo } from './components/ProduceFlowDemo';
import { ValidationDemo } from './components/ValidationDemo';

// Hooks
import { useBatches } from './hooks/useBatches';
import { useDomain } from './contexts/DomainContext';

function UnifiedAppContent() {
  const { domain } = useDomain();
  const { batches, updateBatch } = useBatches();
  const [activeTab, setActiveTab] = useState('batches');

  const handleStageTransition = (batchId: string, newStage: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch) {
      updateBatch(batchId, { stage: newStage as any });
    }
  };

  const handleOpenComponent = (componentName: string, _batch?: any) => {
    console.log(`Opening ${componentName}`, _batch);
    // In a real implementation, this would open modals or navigate
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Trazo Batch Management
                </h1>
                <p className="text-sm text-gray-600">
                  Unified {domain === 'cannabis' ? 'Cannabis' : 'Produce'} Platform
                </p>
              </div>
            </div>
            <DomainToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Batch Management
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              Flow Demos
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Validation
            </TabsTrigger>
          </TabsList>

          {/* Batch Management Tab */}
          <TabsContent value="batches">
            <BatchManagement />
          </TabsContent>

          {/* Workflow Manager Tab */}
          <TabsContent value="workflows">
            {domain === 'cannabis' ? (
              <CannabisWorkflowManager
                batches={batches}
                onStageTransition={handleStageTransition}
                onOpenComponent={handleOpenComponent}
              />
            ) : (
              <ProduceWorkflowManager
                batches={batches}
                onStageTransition={handleStageTransition}
                onOpenComponent={handleOpenComponent}
              />
            )}
          </TabsContent>

          {/* Flow Demo Tab */}
          <TabsContent value="flows">
            {domain === 'cannabis' ? (
              <CannabisFlowDemo />
            ) : (
              <ProduceFlowDemo />
            )}
          </TabsContent>

          {/* Validation Demo Tab */}
          <TabsContent value="validation">
            <ValidationDemo />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              Trazo Batch Management Prototype • Domain: <strong>{domain}</strong> • 
              {batches.length} batches loaded
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DomainProvider>
      <UnifiedAppContent />
    </DomainProvider>
  );
}

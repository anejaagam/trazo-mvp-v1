import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { RecipeLibrary } from './components/RecipeLibrary';
import { RecipeAuthor } from './components/RecipeAuthor';
import { ScheduleManager } from './components/ScheduleManager';
import { OverrideControl } from './components/OverrideControl';
import { AuditLog } from './components/AuditLog';
import { BatchGroupManager } from './components/BatchGroupManager';
import { Leaf, Calendar, Settings, FileText, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('recipes');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900">Trazo Control</h1>
                <p className="text-slate-600 text-sm">Environmental Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-slate-900">Head Grower</p>
                <p className="text-xs text-slate-600">Site Alpha</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Recipes
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Batch Groups
            </TabsTrigger>
            <TabsTrigger value="overrides" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Overrides
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes">
            <RecipeLibrary />
          </TabsContent>

          <TabsContent value="schedules">
            <ScheduleManager />
          </TabsContent>

          <TabsContent value="batches">
            <BatchGroupManager />
          </TabsContent>

          <TabsContent value="overrides">
            <OverrideControl />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

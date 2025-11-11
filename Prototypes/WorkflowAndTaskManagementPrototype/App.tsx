import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ClipboardList, FolderKanban, CheckSquare, LayoutTemplate, Shield } from 'lucide-react';
import { TaskBoard } from './components/dashboard/TaskBoard';
import { TemplateLibrary } from './components/templates/TemplateLibrary';
import { TaskList } from './components/tasks/TaskList';
import { TemplateEditor } from './components/templates/TemplateEditor';
import { BatchReleasePanel } from './components/approvals/BatchReleasePanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-slate-900">Workflows & SOPs</h1>
          <p className="text-slate-600">Mobile-first task execution with evidence capture & compliance controls</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              <span className="hidden sm:inline">Task Board</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">My Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Approvals</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Editor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <TaskBoard />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList />
          </TabsContent>

          <TabsContent value="approvals">
            <BatchReleasePanel />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateLibrary onEditTemplate={(id) => {
              setEditingTemplate(id);
              setActiveTab('editor');
            }} />
          </TabsContent>

          <TabsContent value="editor">
            <TemplateEditor 
              templateId={editingTemplate} 
              onClose={() => {
                setEditingTemplate(null);
                setActiveTab('templates');
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

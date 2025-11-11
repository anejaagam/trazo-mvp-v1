import { useState, createContext, useContext } from 'react';
import { Dashboard } from './components/Dashboard';
import { AuditLog } from './components/AuditLog';
import { EvidenceVault } from './components/EvidenceVault';
import { ComplianceTemplates } from './components/ComplianceTemplates';
import { ReportGenerator } from './components/ReportGenerator';
import { RecordManager } from './components/RecordManager';
import { TraceabilityTool } from './components/TraceabilityTool';
import { InventoryReconciliation } from './components/InventoryReconciliation';
import { RulesEngine } from './components/RulesEngine';
import { InspectionToolkit } from './components/InspectionToolkit';
import { RecallManager } from './components/RecallManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Shield, FileText, Lock, Folder, ClipboardCheck, Download, GitBranch, PackageCheck, Scale, Eye, AlertOctagon, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';

// Jurisdiction types
export type JurisdictionCode = 'OR' | 'MD' | 'CA' | 'WA' | 'CO' | 'CAN-CANNABIS' | 'CAN-PRODUCE';

export interface Jurisdiction {
  code: JurisdictionCode;
  name: string;
  state?: string;
  country: string;
  category: string;
}

// Available jurisdictions
export const jurisdictions: Jurisdiction[] = [
  { code: 'OR', name: 'Oregon Cannabis', state: 'Oregon', country: 'USA', category: 'Cannabis' },
  { code: 'MD', name: 'Maryland Cannabis', state: 'Maryland', country: 'USA', category: 'Cannabis' },
  { code: 'CA', name: 'California Cannabis', state: 'California', country: 'USA', category: 'Cannabis' },
  { code: 'WA', name: 'Washington Cannabis', state: 'Washington', country: 'USA', category: 'Cannabis' },
  { code: 'CO', name: 'Colorado Cannabis', state: 'Colorado', country: 'USA', category: 'Cannabis' },
  { code: 'CAN-CANNABIS', name: 'Canada - Cannabis (CTLS)', country: 'Canada', category: 'Cannabis' },
  { code: 'CAN-PRODUCE', name: 'Canada - Produce Safety', country: 'Canada', category: 'Produce' },
];

// Jurisdiction Context
interface JurisdictionContextType {
  jurisdiction: Jurisdiction;
  setJurisdiction: (jurisdiction: Jurisdiction) => void;
}

const JurisdictionContext = createContext<JurisdictionContextType | undefined>(undefined);

export const useJurisdiction = () => {
  const context = useContext(JurisdictionContext);
  if (!context) {
    throw new Error('useJurisdiction must be used within JurisdictionProvider');
  }
  return context;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'normal' | 'inspection'>('normal');
  const [currentJurisdiction, setCurrentJurisdiction] = useState<Jurisdiction>(jurisdictions[0]);

  return (
    <JurisdictionContext.Provider value={{ jurisdiction: currentJurisdiction, setJurisdiction: setCurrentJurisdiction }}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1>Trazo Compliance Engine</h1>
                  <p className="text-slate-600">Rules, Audits & Reporting</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-slate-600">Jurisdiction</p>
                    <p>{currentJurisdiction.name}</p>
                  </div>
                </div>
                <Select 
                  value={currentJurisdiction.code} 
                  onValueChange={(code) => {
                    const jurisdiction = jurisdictions.find(j => j.code === code);
                    if (jurisdiction) setCurrentJurisdiction(jurisdiction);
                  }}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j.code} value={j.code}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {j.category}
                          </Badge>
                          {j.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal Mode</SelectItem>
                    <SelectItem value="inspection">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Inspection Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6 space-y-2">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="traceability" className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Traceability
                </TabsTrigger>
                <TabsTrigger value="reconciliation" className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4" />
                  Reconciliation
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Rules Engine
                </TabsTrigger>
                <TabsTrigger value="inspection" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Inspection
                </TabsTrigger>
                <TabsTrigger value="recall" className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" />
                  Recalls
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Audit Log
                </TabsTrigger>
                <TabsTrigger value="evidence" className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="records" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Records
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="placeholder" disabled className="opacity-0 cursor-default">
                  {/* Empty slot for grid alignment */}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <Dashboard />
            </TabsContent>

            <TabsContent value="traceability">
              <TraceabilityTool />
            </TabsContent>

            <TabsContent value="reconciliation">
              <InventoryReconciliation />
            </TabsContent>

            <TabsContent value="rules">
              <RulesEngine />
            </TabsContent>

            <TabsContent value="inspection">
              <InspectionToolkit viewMode={viewMode} />
            </TabsContent>

            <TabsContent value="recall">
              <RecallManager />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLog />
            </TabsContent>

            <TabsContent value="evidence">
              <EvidenceVault />
            </TabsContent>

            <TabsContent value="templates">
              <ComplianceTemplates />
            </TabsContent>

            <TabsContent value="records">
              <RecordManager />
            </TabsContent>

            <TabsContent value="reports">
              <ReportGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </JurisdictionContext.Provider>
  );
}

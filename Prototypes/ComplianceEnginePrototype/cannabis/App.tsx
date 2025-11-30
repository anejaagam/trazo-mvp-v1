import { useState, createContext, useContext } from 'react';
import { Dashboard } from './components/Dashboard';
import { ReportGenerator } from './components/ReportGenerator';
import { EvidenceVault } from './components/EvidenceVault';
import { AuditLog } from './components/AuditLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Shield, FileText, Folder, BarChart3, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import type { Jurisdiction, JurisdictionCode } from './types';

// Available jurisdictions
export const jurisdictions: Jurisdiction[] = [
  { 
    code: 'OR', 
    name: 'Oregon', 
    state: 'Oregon', 
    country: 'USA', 
    system: 'Metrc',
    reportingFrequency: 'Monthly'
  },
  { 
    code: 'MD', 
    name: 'Maryland', 
    state: 'Maryland', 
    country: 'USA', 
    system: 'Metrc',
    reportingFrequency: 'Daily'
  },
  { 
    code: 'CAN-CANNABIS', 
    name: 'Canada (Health Canada)', 
    country: 'Canada', 
    system: 'CTLS',
    reportingFrequency: 'Monthly'
  },
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
  const [currentJurisdiction, setCurrentJurisdiction] = useState<Jurisdiction>(jurisdictions[0]);

  return (
    <JurisdictionContext.Provider value={{ jurisdiction: currentJurisdiction, setJurisdiction: setCurrentJurisdiction }}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1>Trazo Compliance Engine</h1>
                  <p className="text-slate-600">Regulatory Reporting & Evidence Management</p>
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
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j.code} value={j.code}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {j.system}
                          </Badge>
                          {j.name} • {j.reportingFrequency}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Compliance Dashboard
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="evidence" className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Evidence Vault
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Audit Trail
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>

              <TabsContent value="reports">
                <ReportGenerator />
              </TabsContent>

              <TabsContent value="evidence">
                <EvidenceVault />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLog />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </JurisdictionContext.Provider>
  );
}

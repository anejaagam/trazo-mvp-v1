import { useState, createContext, useContext } from 'react';
import { Dashboard } from './components/Dashboard';
import { ReportGenerator } from './components/ReportGenerator';
import { EvidenceVault } from './components/EvidenceVault';
import { AuditLog } from './components/AuditLog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Shield, FileText, Folder, BarChart3, Leaf, Flag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Badge } from './components/ui/badge';
import type { Region } from './types';

// Region Context
interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return context;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRegion, setCurrentRegion] = useState<Region>('US');

  const regionInfo = {
    US: {
      name: 'United States',
      flag: '🇺🇸',
      systems: ['FSMA', 'USDA GAP', 'PrimusGFS', 'State Agriculture'],
      primaryRegulator: 'FDA',
    },
    Canada: {
      name: 'Canada',
      flag: '🇨🇦',
      systems: ['CFIA SFCR', 'PrimusGFS'],
      primaryRegulator: 'CFIA',
    },
  };

  const currentInfo = regionInfo[currentRegion];

  return (
    <RegionContext.Provider value={{ region: currentRegion, setRegion: setCurrentRegion }}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <Leaf className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1>Trazo Compliance Engine</h1>
                  <p className="text-slate-600">Produce Safety & Food Compliance Management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-slate-600">Operating Region</p>
                    <p>{currentInfo.name} {currentInfo.flag}</p>
                  </div>
                </div>
                <Select 
                  value={currentRegion} 
                  onValueChange={(v) => setCurrentRegion(v as Region)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">
                      <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span>United States</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Canada">
                      <div className="flex items-center gap-2">
                        <span>🇨🇦</span>
                        <span>Canada</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-slate-600">Active Standards</p>
                  <div className="flex items-center gap-2 mt-1">
                    {currentRegion === 'US' && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          FSMA
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          USDA GAP
                        </span>
                      </>
                    )}
                    {currentRegion === 'Canada' && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          CFIA SFCR
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          PrimusGFS v3.2
                        </span>
                      </>
                    )}
                  </div>
                </div>
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
                {currentRegion === 'US' ? 'FSMA & Audits' : 'CFIA & Audits'}
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
    </RegionContext.Provider>
  );
}

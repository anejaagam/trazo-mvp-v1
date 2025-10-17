import { useState } from 'react';
import { Alarm, AlarmCategory, AlarmSeverity, AlarmStatus } from '../types/alarm';
import { AlarmCard } from './alarm-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AlarmInboxProps {
  alarms: Alarm[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
}

export function AlarmInbox({ alarms, onAcknowledge, onResolve, onSnooze }: AlarmInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<AlarmCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AlarmSeverity | 'all'>('all');
  
  // Get unique sites
  const sites = Array.from(new Set(alarms.map(a => a.site)));
  
  // Filter alarms
  const filterAlarms = (status: AlarmStatus | 'all') => {
    return alarms.filter(alarm => {
      const matchesStatus = status === 'all' || alarm.status === status;
      const matchesSearch = searchQuery === '' || 
        alarm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alarm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alarm.site.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSite = selectedSite === 'all' || alarm.site === selectedSite;
      const matchesCategory = selectedCategory === 'all' || alarm.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || alarm.severity === selectedSeverity;
      
      return matchesStatus && matchesSearch && matchesSite && matchesCategory && matchesSeverity;
    });
  };
  
  const activeAlarms = filterAlarms('active');
  const acknowledgedAlarms = filterAlarms('acknowledged');
  const snoozedAlarms = filterAlarms('snoozed');
  const allActiveAlarms = [...activeAlarms, ...acknowledgedAlarms, ...snoozedAlarms];
  
  const handleAcknowledge = (id: string) => {
    onAcknowledge(id);
    toast.success('Alarm acknowledged', {
      description: 'Escalation timer has been paused',
    });
  };
  
  const handleResolve = (id: string) => {
    onResolve(id);
    toast.success('Alarm resolved', {
      description: 'The alarm has been marked as resolved',
    });
  };
  
  const handleSnooze = (id: string, minutes: number) => {
    onSnooze(id, minutes);
    toast.success(`Alarm snoozed for ${minutes} minutes`, {
      description: 'Notifications will be suppressed during this time',
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Alarm Inbox</h1>
        <p className="text-gray-600">Monitor and manage active alarms across all facilities</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search alarms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map(site => (
              <SelectItem key={site} value={site}>{site}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as AlarmCategory | 'all')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="environmental">Environmental</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="irrigation">Irrigation</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="security">Security</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as AlarmSeverity | 'all')}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All Active
            {allActiveAlarms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {allActiveAlarms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            {activeAlarms.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                {activeAlarms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acknowledged
            {acknowledgedAlarms.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                {acknowledgedAlarms.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="snoozed">
            Snoozed
            {snoozedAlarms.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {snoozedAlarms.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          {allActiveAlarms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active alarms
            </div>
          ) : (
            allActiveAlarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4 mt-6">
          {activeAlarms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No active alarms
            </div>
          ) : (
            activeAlarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="acknowledged" className="space-y-4 mt-6">
          {acknowledgedAlarms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No acknowledged alarms
            </div>
          ) : (
            acknowledgedAlarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="snoozed" className="space-y-4 mt-6">
          {snoozedAlarms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No snoozed alarms
            </div>
          ) : (
            snoozedAlarms.map(alarm => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onAcknowledge={handleAcknowledge}
                onResolve={handleResolve}
                onSnooze={handleSnooze}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

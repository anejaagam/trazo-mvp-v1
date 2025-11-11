import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StatusBadge, SpecStatusBadge } from './StatusBadge';
import type { PodSnapshot } from '../../types/telemetry';
import { Search, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';

interface FleetViewProps {
  snapshots: PodSnapshot[];
  onPodClick: (snapshot: PodSnapshot) => void;
}

type SortKey = 'name' | 'stage' | 'temp_drift' | 'rh_drift' | 'co2_drift' | 'alarms';
type SortDirection = 'asc' | 'desc';

export function FleetView({ snapshots, onPodClick }: FleetViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Get unique stages for filter
  const stages = useMemo(() => {
    const uniqueStages = new Set(snapshots.map(s => s.room.stage));
    return Array.from(uniqueStages).sort();
  }, [snapshots]);
  
  // Filter and sort data
  const filteredAndSorted = useMemo(() => {
    let filtered = snapshots;
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(s => s.room.stage === stageFilter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      switch (sortKey) {
        case 'name':
          aVal = a.pod.name;
          bVal = b.pod.name;
          break;
        case 'stage':
          aVal = a.room.stage;
          bVal = b.room.stage;
          break;
        case 'temp_drift':
          aVal = Math.abs(a.drift.temp);
          bVal = Math.abs(b.drift.temp);
          break;
        case 'rh_drift':
          aVal = Math.abs(a.drift.rh);
          bVal = Math.abs(b.drift.rh);
          break;
        case 'co2_drift':
          aVal = Math.abs(a.drift.co2);
          bVal = Math.abs(b.drift.co2);
          break;
        case 'alarms':
          aVal = a.alarm_count_24h;
          bVal = b.alarm_count_24h;
          break;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return sorted;
  }, [snapshots, searchTerm, stageFilter, sortKey, sortDirection]);
  
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const SortButton = ({ column }: { column: SortKey }) => (
    <Button 
      variant="ghost" 
      size="sm"
      className="h-8 px-2"
      onClick={() => toggleSort(column)}
    >
      <ArrowUpDown className="w-3 h-3" />
    </Button>
  );
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fleet Overview</CardTitle>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            
            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSorted.length} of {snapshots.length} pods
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Pod / Room
                    <SortButton column="name" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Stage
                    <SortButton column="stage" />
                  </div>
                </TableHead>
                <TableHead>Temp (°C)</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Δ Temp
                    <SortButton column="temp_drift" />
                  </div>
                </TableHead>
                <TableHead>RH (%)</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Δ RH
                    <SortButton column="rh_drift" />
                  </div>
                </TableHead>
                <TableHead>CO₂ (ppm)</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Δ CO₂
                    <SortButton column="co2_drift" />
                  </div>
                </TableHead>
                <TableHead>VPD (kPa)</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    Alarms (24h)
                    <SortButton column="alarms" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map(snapshot => {
                const hasIssues = 
                  snapshot.temp.health !== 'Healthy' ||
                  snapshot.rh.health !== 'Healthy' ||
                  snapshot.co2.health !== 'Healthy' ||
                  Math.abs(snapshot.drift.temp) > 2 ||
                  Math.abs(snapshot.drift.rh) > 5 ||
                  Math.abs(snapshot.drift.co2) > 150;
                
                return (
                  <TableRow 
                    key={snapshot.pod.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onPodClick(snapshot)}
                  >
                    <TableCell>
                      <div>
                        <div>{snapshot.pod.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {snapshot.room.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {snapshot.room.stage}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {snapshot.temp.value.toFixed(1)}
                        <StatusBadge health={snapshot.temp.health} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={Math.abs(snapshot.drift.temp) > 1.5 ? 'text-destructive' : ''}>
                          {snapshot.drift.temp > 0 ? '+' : ''}{snapshot.drift.temp.toFixed(1)}
                        </span>
                        <SpecStatusBadge drift={snapshot.drift.temp} tolerance={2.0} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {snapshot.rh.value.toFixed(1)}
                        <StatusBadge health={snapshot.rh.health} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={Math.abs(snapshot.drift.rh) > 4 ? 'text-destructive' : ''}>
                          {snapshot.drift.rh > 0 ? '+' : ''}{snapshot.drift.rh.toFixed(1)}
                        </span>
                        <SpecStatusBadge drift={snapshot.drift.rh} tolerance={5.0} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {snapshot.co2.value.toFixed(0)}
                        <StatusBadge health={snapshot.co2.health} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={Math.abs(snapshot.drift.co2) > 120 ? 'text-destructive' : ''}>
                          {snapshot.drift.co2 > 0 ? '+' : ''}{snapshot.drift.co2.toFixed(0)}
                        </span>
                        <SpecStatusBadge drift={snapshot.drift.co2} tolerance={150} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {snapshot.vpd.value.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {snapshot.alarm_count_24h > 0 ? (
                        <span className="text-destructive">
                          {snapshot.alarm_count_24h}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {hasIssues ? (
                        <span className="text-destructive text-xs">⚠ Issues</span>
                      ) : (
                        <span className="text-green-600 text-xs">✓ OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

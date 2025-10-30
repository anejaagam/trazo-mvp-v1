/**
 * FleetView Component
 * 
 * Multi-pod monitoring table with search, filter, and sort
 * Displays real-time environmental data for all pods in a site
 * 
 * Migrated from: /Prototypes/MonitoringAndTelemeteryPrototype/components/dashboard/FleetView.tsx
 * Created: October 29, 2025
 * Phase: 4 - Component Migration (Tier 1)
 */

'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown } from 'lucide-react';
import { usePodSnapshots } from '@/hooks/use-telemetry';
import { usePermissions } from '@/hooks/use-permissions';

interface FleetViewProps {
  siteId: string;
  onPodClick?: (podId: string) => void;
  realtime?: boolean;
  refreshInterval?: number;
}

type SortKey = 'name' | 'room' | 'temp' | 'humidity' | 'co2' | 'vpd';
type SortDirection = 'asc' | 'desc';

/**
 * Calculate VPD from temperature and humidity
 */
function calculateVPD(tempC: number | null, rhPct: number | null): number | null {
  if (tempC === null || rhPct === null) return null;
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return svp * (1 - rhPct / 100);
}

/**
 * Determine health status from sensor fault
 */
function getHealthStatus(fault: boolean | null): 'Healthy' | 'Faulted' {
  return fault ? 'Faulted' : 'Healthy';
}

export function FleetView({ 
  siteId, 
  onPodClick, 
  realtime = true,
  refreshInterval = 30 
}: FleetViewProps) {
  const { can } = usePermissions('org_admin');
  const { snapshots, loading, error } = usePodSnapshots({
    siteId,
    realtime,
    refreshInterval,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Get unique rooms for filter - must be before conditional returns
  const rooms = useMemo(() => {
    const uniqueRooms = new Set(snapshots.map(s => s.room.name));
    return Array.from(uniqueRooms).sort();
  }, [snapshots]);

  // Filter and sort data - must be before conditional returns
  const filteredAndSorted = useMemo(() => {
    let filtered = snapshots;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.pod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.room.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply room filter
    if (roomFilter !== 'all') {
      filtered = filtered.filter(s => s.room.name === roomFilter);
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
        case 'room':
          aVal = a.room.name;
          bVal = b.room.name;
          break;
        case 'temp':
          aVal = a.temperature_c ?? -999;
          bVal = b.temperature_c ?? -999;
          break;
        case 'humidity':
          aVal = a.humidity_pct ?? -999;
          bVal = b.humidity_pct ?? -999;
          break;
        case 'co2':
          aVal = a.co2_ppm ?? -999;
          bVal = b.co2_ppm ?? -999;
          break;
        case 'vpd':
          aVal = a.vpd_kpa ?? calculateVPD(a.temperature_c, a.humidity_pct) ?? -999;
          bVal = b.vpd_kpa ?? calculateVPD(b.temperature_c, b.humidity_pct) ?? -999;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [snapshots, searchTerm, roomFilter, sortKey, sortDirection]);

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

  // Permission check - after all hooks
  if (!can('monitoring:view')) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No permission to view monitoring data</p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading && snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load fleet data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

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

            {/* Room Filter */}
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room} value={room}>
                    {room}
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
                <TableHead>Temp (°C)</TableHead>
                <TableHead>RH (%)</TableHead>
                <TableHead>CO₂ (ppm)</TableHead>
                <TableHead>VPD (kPa)</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No pods found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map(snapshot => {
                  const vpd = snapshot.vpd_kpa ?? calculateVPD(snapshot.temperature_c, snapshot.humidity_pct);
                  const tempHealth = getHealthStatus(snapshot.sensor_faults.temperature);
                  const humidityHealth = getHealthStatus(snapshot.sensor_faults.humidity);
                  const co2Health = getHealthStatus(snapshot.sensor_faults.co2);
                  
                  const hasIssues =
                    tempHealth === 'Faulted' ||
                    humidityHealth === 'Faulted' ||
                    co2Health === 'Faulted';

                  const activeEquipment = [
                    snapshot.equipment.cooling && 'Cool',
                    snapshot.equipment.heating && 'Heat',
                    snapshot.equipment.dehumidifier && 'Dehum',
                    snapshot.equipment.humidifier && 'Hum',
                    snapshot.equipment.co2_injection && 'CO₂',
                  ].filter(Boolean);

                  const secondsSinceUpdate = snapshot.last_update
                    ? Math.floor((Date.now() - new Date(snapshot.last_update).getTime()) / 1000)
                    : null;

                  return (
                    <TableRow
                      key={snapshot.pod.id}
                      className={onPodClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                      onClick={() => onPodClick?.(snapshot.pod.id)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{snapshot.pod.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {snapshot.room.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{snapshot.temperature_c?.toFixed(1) ?? '--'}</span>
                          <Badge
                            variant={tempHealth === 'Healthy' ? 'default' : 'destructive'}
                            className="text-xs px-1.5 py-0"
                          >
                            {tempHealth === 'Healthy' ? 'OK' : 'Fault'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{snapshot.humidity_pct?.toFixed(1) ?? '--'}</span>
                          <Badge
                            variant={humidityHealth === 'Healthy' ? 'default' : 'destructive'}
                            className="text-xs px-1.5 py-0"
                          >
                            {humidityHealth === 'Healthy' ? 'OK' : 'Fault'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{snapshot.co2_ppm?.toFixed(0) ?? '--'}</span>
                          <Badge
                            variant={co2Health === 'Healthy' ? 'default' : 'destructive'}
                            className="text-xs px-1.5 py-0"
                          >
                            {co2Health === 'Healthy' ? 'OK' : 'Fault'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vpd?.toFixed(2) ?? '--'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {activeEquipment.length > 0 ? (
                            activeEquipment.map((eq, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {eq}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">Idle</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {hasIssues ? (
                          <span className="text-destructive text-xs">⚠ Fault</span>
                        ) : (
                          <span className="text-green-600 text-xs">✓ OK</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {secondsSinceUpdate !== null
                          ? secondsSinceUpdate < 60
                            ? `${secondsSinceUpdate}s ago`
                            : `${Math.floor(secondsSinceUpdate / 60)}m ago`
                          : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

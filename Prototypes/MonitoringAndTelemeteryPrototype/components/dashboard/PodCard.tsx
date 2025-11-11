import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatusBadge, SpecStatusBadge } from './StatusBadge';
import { Badge } from '../ui/badge';
import type { PodSnapshot } from '../../types/telemetry';
import { Thermometer, Droplets, Wind, Sun, Zap, Fan, Snowflake, WindIcon } from 'lucide-react';

interface PodCardProps {
  snapshot: PodSnapshot;
  onClick: () => void;
}

export const PodCard = memo(function PodCard({ snapshot, onClick }: PodCardProps) {
  const { pod, room, temp, rh, co2, light, vpd, devices, setpoints, drift, last_update } = snapshot;
  
  // Calculate seconds since last update (only when snapshot changes)
  const secondsSinceUpdate = Math.floor((Date.now() - last_update.getTime()) / 1000);
  const isStale = secondsSinceUpdate > 30;
  
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {pod.name}
              {isStale && <StatusBadge health="Stale" size="sm" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {room.name} • {room.stage}
            </p>
            {snapshot.alarm_count_24h > 0 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                {snapshot.alarm_count_24h} Alarm{snapshot.alarm_count_24h > 1 ? 's' : ''} (24h)
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {secondsSinceUpdate}s ago
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Environmental Readings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Temperature */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{temp.value.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">°C</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge health={temp.health} size="sm" />
              <SpecStatusBadge drift={drift.temp} tolerance={2.0} size="sm" />
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {setpoints.temp}°C
            </div>
          </div>
          
          {/* Relative Humidity */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="w-3.5 h-3.5" />
              <span>Humidity</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{rh.value.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge health={rh.health} size="sm" />
              <SpecStatusBadge drift={drift.rh} tolerance={5.0} size="sm" />
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {setpoints.rh}%
            </div>
          </div>
          
          {/* CO2 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wind className="w-3.5 h-3.5" />
              <span>CO₂</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{co2.value.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">ppm</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge health={co2.health} size="sm" />
              <SpecStatusBadge drift={drift.co2} tolerance={150} size="sm" />
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {setpoints.co2} ppm
            </div>
          </div>
          
          {/* Light */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sun className="w-3.5 h-3.5" />
              <span>Lighting</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">{light.value.toFixed(0)}</span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge health={light.health} size="sm" />
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {setpoints.light}%
            </div>
          </div>
        </div>
        
        {/* VPD - Derived Metric */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5" />
                <span>VPD (Derived)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl">{vpd.value.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">kPa</span>
              </div>
            </div>
            <StatusBadge health={vpd.health} size="sm" />
          </div>
        </div>
        
        {/* Device States */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Equipment Status</div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={devices.fan ? 'default' : 'outline'} className="text-xs">
              <Fan className="w-3 h-3 mr-1" />
              Fan
            </Badge>
            <Badge variant={devices.cooling ? 'default' : 'outline'} className="text-xs">
              <Snowflake className="w-3 h-3 mr-1" />
              Cooling
            </Badge>
            <Badge variant={devices.dehum ? 'default' : 'outline'} className="text-xs">
              <WindIcon className="w-3 h-3 mr-1" />
              Dehum
            </Badge>
            <Badge variant={devices.co2_enable ? 'default' : 'outline'} className="text-xs">
              <Wind className="w-3 h-3 mr-1" />
              CO₂
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if pod ID changes or snapshot values change significantly
  return (
    prevProps.snapshot.pod.id === nextProps.snapshot.pod.id &&
    prevProps.snapshot.temp.value === nextProps.snapshot.temp.value &&
    prevProps.snapshot.rh.value === nextProps.snapshot.rh.value &&
    prevProps.snapshot.co2.value === nextProps.snapshot.co2.value &&
    prevProps.snapshot.light.value === nextProps.snapshot.light.value &&
    prevProps.snapshot.temp.health === nextProps.snapshot.temp.health &&
    prevProps.snapshot.rh.health === nextProps.snapshot.rh.health &&
    prevProps.snapshot.alarm_count_24h === nextProps.snapshot.alarm_count_24h
  );
});

/**
 * PodCard Component
 * 
 * Real-time pod status card with environmental readings
 * Displays temperature, humidity, CO2, light, VPD, and equipment status
 * 
 * Migrated from: /Prototypes/MonitoringAndTelemeteryPrototype/components/dashboard/PodCard.tsx
 * Created: October 29, 2025
 * Phase: 4 - Component Migration (Tier 1)
 */

'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Wind, Sun, Zap, Fan, Snowflake, Wind as WindIcon } from 'lucide-react';
import { useTelemetry } from '@/hooks/use-telemetry';
import { usePermissions } from '@/hooks/use-permissions';
import type { TelemetryReading } from '@/types/telemetry';

interface PodCardProps {
  podId: string;
  podName: string;
  roomName: string;
  stage?: string;
  onClick?: () => void;
  realtime?: boolean;
}

/**
 * Calculate VPD (Vapor Pressure Deficit) from temperature and humidity
 * Formula: VPD = SVP * (1 - RH/100)
 * Where SVP = 0.6108 * exp(17.27 * T / (T + 237.3))
 */
function calculateVPD(tempC: number, rhPct: number): number {
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return svp * (1 - rhPct / 100);
}

/**
 * Determine sensor health status based on fault indicators
 */
function getSensorHealth(reading: TelemetryReading): {
  temp: 'Healthy' | 'Faulted';
  humidity: 'Healthy' | 'Faulted';
  co2: 'Healthy' | 'Faulted';
} {
  return {
    temp: reading.temp_sensor_fault ? 'Faulted' : 'Healthy',
    humidity: reading.humidity_sensor_fault ? 'Faulted' : 'Healthy',
    co2: reading.co2_sensor_fault ? 'Faulted' : 'Healthy',
  };
}

/**
 * Check if reading is stale (older than threshold)
 */
function isStale(timestamp: string, thresholdMinutes: number = 5): boolean {
  const readingTime = new Date(timestamp).getTime();
  const now = Date.now();
  const ageMinutes = (now - readingTime) / 1000 / 60;
  return ageMinutes > thresholdMinutes;
}

/**
 * Format time ago string
 */
function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export const PodCard = memo(function PodCard({
  podId,
  podName,
  roomName,
  stage,
  onClick,
  realtime = true,
}: PodCardProps) {
  // TODO: Get user role from auth context (temporary bypass for development)
  const { can } = usePermissions('org_admin'); // Will be replaced with actual user role
  const { reading, loading, error } = useTelemetry({
    podId,
    realtime,
    autoFetch: true,
  });

  // Permission check
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
  if (loading && !reading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-destructive">
            Failed to load pod data: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!reading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No telemetry data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate derived metrics
  const vpd = reading.vpd_kpa ?? calculateVPD(
    reading.temperature_c ?? 0,
    reading.humidity_pct ?? 0
  );
  
  const sensorHealth = getSensorHealth(reading);
  const stale = isStale(reading.timestamp);

  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-lg' : ''} transition-shadow`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {podName}
              {stale && (
                <Badge variant="secondary" className="text-xs">
                  Stale
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {roomName}
              {stage && ` • ${stage}`}
            </p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {formatTimeAgo(reading.timestamp)}
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
              <span className="text-2xl">
                {reading.temperature_c?.toFixed(1) ?? '--'}
              </span>
              <span className="text-sm text-muted-foreground">°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant={sensorHealth.temp === 'Healthy' ? 'default' : 'destructive'}
                className="text-xs px-1.5 py-0"
              >
                {sensorHealth.temp === 'Healthy' ? 'OK' : 'Fault'}
              </Badge>
            </div>
          </div>
          
          {/* Relative Humidity */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="w-3.5 h-3.5" />
              <span>Humidity</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">
                {reading.humidity_pct?.toFixed(1) ?? '--'}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant={sensorHealth.humidity === 'Healthy' ? 'default' : 'destructive'}
                className="text-xs px-1.5 py-0"
              >
                {sensorHealth.humidity === 'Healthy' ? 'OK' : 'Fault'}
              </Badge>
            </div>
          </div>
          
          {/* CO2 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wind className="w-3.5 h-3.5" />
              <span>CO₂</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">
                {reading.co2_ppm?.toFixed(0) ?? '--'}
              </span>
              <span className="text-sm text-muted-foreground">ppm</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant={sensorHealth.co2 === 'Healthy' ? 'default' : 'destructive'}
                className="text-xs px-1.5 py-0"
              >
                {sensorHealth.co2 === 'Healthy' ? 'OK' : 'Fault'}
              </Badge>
            </div>
          </div>
          
          {/* Light */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sun className="w-3.5 h-3.5" />
              <span>Lighting</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl">
                {reading.light_intensity_pct?.toFixed(0) ?? '--'}
              </span>
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant="default"
                className="text-xs px-1.5 py-0"
              >
                OK
              </Badge>
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
                <span className="text-xl">{vpd.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">kPa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Equipment Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted-foreground">Equipment Status</div>
            {(() => {
              // Parse equipment_states for AUTO mode count
              const equipmentStates = reading.equipment_states as Record<string, {
                mode: 'MANUAL' | 'AUTOMATIC'
                state: number
              }> | null

              let autoCount = 0
              
              if (equipmentStates) {
                Object.values(equipmentStates).forEach(equip => {
                  if (equip.mode === 'AUTOMATIC') {
                    autoCount++
                  }
                })
              }

              return autoCount > 0 ? (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                  {autoCount} AUTO
                </Badge>
              ) : null
            })()}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(() => {
              // Parse equipment_states for AUTO mode indicators
              const equipmentStates = reading.equipment_states as Record<string, {
                mode: 'MANUAL' | 'AUTOMATIC'
                state: number
              }> | null

              const getEquipmentVariant = (key: string, fallbackActive: boolean | null): 'default' | 'outline' | 'secondary' => {
                if (equipmentStates?.[key]?.mode === 'AUTOMATIC') {
                  return 'secondary'
                }
                return fallbackActive ? 'default' : 'outline'
              }

              const getEquipmentClass = (key: string) => {
                if (equipmentStates?.[key]?.mode === 'AUTOMATIC') {
                  return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                }
                return ''
              }

              return (
                <>
                  <Badge 
                    variant={getEquipmentVariant('circulation_fan', reading.circulation_fan_active)} 
                    className={`text-xs ${getEquipmentClass('circulation_fan')}`}
                  >
                    <Fan className="w-3 h-3 mr-1" />
                    Fan{equipmentStates?.circulation_fan?.mode === 'AUTOMATIC' ? ' (A)' : ''}
                  </Badge>
                  <Badge 
                    variant={getEquipmentVariant('cooling', reading.cooling_active)} 
                    className={`text-xs ${getEquipmentClass('cooling')}`}
                  >
                    <Snowflake className="w-3 h-3 mr-1" />
                    Cooling{equipmentStates?.cooling?.mode === 'AUTOMATIC' ? ' (A)' : ''}
                  </Badge>
                  <Badge 
                    variant={getEquipmentVariant('dehumidifier', reading.dehumidifier_active)} 
                    className={`text-xs ${getEquipmentClass('dehumidifier')}`}
                  >
                    <WindIcon className="w-3 h-3 mr-1" />
                    Dehum{equipmentStates?.dehumidifier?.mode === 'AUTOMATIC' ? ' (A)' : ''}
                  </Badge>
                  <Badge 
                    variant={getEquipmentVariant('co2_injection', reading.co2_injection_active)} 
                    className={`text-xs ${getEquipmentClass('co2_injection')}`}
                  >
                    <Wind className="w-3 h-3 mr-1" />
                    CO₂{equipmentStates?.co2_injection?.mode === 'AUTOMATIC' ? ' (A)' : ''}
                  </Badge>
                </>
              )
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if pod ID changes
  return prevProps.podId === nextProps.podId;
});

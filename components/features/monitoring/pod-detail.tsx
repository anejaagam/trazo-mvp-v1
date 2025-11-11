'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnvironmentChart } from './environment-chart'
import { EquipmentControlCard } from './equipment-control-card'
import { Clock, RefreshCw, Thermometer, Droplets, Wind, Sun } from 'lucide-react'
import { useTelemetry } from '@/hooks/use-telemetry'
import { usePermissions } from '@/hooks/use-permissions'
import type { EquipmentControlRecord } from '@/lib/supabase/queries/equipment-controls'
import type { EquipmentControlRecord as TypedEquipmentControlRecord } from '@/types/equipment'

interface PodDetailProps {
  podId: string
  podName: string
  roomName: string
  deviceToken?: string | null
  stage?: string
  onBack?: () => void
}

export function PodDetail({ podId, podName, roomName, deviceToken, stage }: PodDetailProps) {
  const [timeWindow] = useState<24 | 168 | 720>(24) // 24h, 7d, 30d
  const [equipmentControls, setEquipmentControls] = useState<EquipmentControlRecord[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  
  // Permission check
  const { can } = usePermissions('org_admin')
  
  // Fetch real-time telemetry
  const { reading, loading: telemetryLoading, error: telemetryError } = useTelemetry({
    podId,
    realtime: true,
    autoFetch: true
  })
  
  // Fetch equipment controls
  useEffect(() => {
    async function fetchEquipmentControls() {
      try {
        setEquipmentLoading(true)
        const response = await fetch(`/api/equipment-controls?podId=${podId}`)
        if (response.ok) {
          const data = await response.json()
          setEquipmentControls(data)
        }
      } catch (error) {
        console.error('Error fetching equipment controls:', error)
      } finally {
        setEquipmentLoading(false)
      }
    }
    
    fetchEquipmentControls()
  }, [podId])
  
  // Calculate VPD (Vapor Pressure Deficit)
  const calculateVPD = (temp: number, rh: number): number => {
    const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3))
    const vpd = svp * (1 - rh / 100)
    return vpd
  }
  
  // Calculate time ago
  const getTimeAgo = (timestamp: string): string => {
    const secondsAgo = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    const minutesAgo = Math.floor(secondsAgo / 60)
    if (minutesAgo < 60) return `${minutesAgo}m ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    return `${hoursAgo}h ago`
  }
  
  const handleRefresh = () => {
    // Trigger a manual refresh by forcing component re-render
    // The useTelemetry hook will fetch fresh data
    window.location.reload()
  }
  
  // Check permission
  if (!can('monitoring:view')) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You do not have permission to view monitoring details.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-3xl font-bold">{podName}</h1>
            <p className="text-muted-foreground">
              {roomName}{stage ? ` • ${stage}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last update: {reading ? getTimeAgo(reading.timestamp) : '--'}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Loading State */}
      {telemetryLoading && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading telemetry data...</p>
        </div>
      )}
      
      {/* Error State */}
      {telemetryError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Error loading telemetry: {telemetryError.message}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Current Readings - Summary Cards */}
      {reading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Temperature Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.temperature_c?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-muted-foreground">°C</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.temp_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Humidity Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.humidity_pct?.toFixed(1) ?? '--'}
                    </span>
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.humidity_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* CO₂ Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  CO₂
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.co2_ppm?.toFixed(0) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">ppm</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reading.co2_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">OK</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lighting Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Lighting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.light_intensity_pct?.toFixed(0) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">OK</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* VPD Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">VPD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {reading.temperature_c && reading.humidity_pct
                        ? calculateVPD(reading.temperature_c, reading.humidity_pct).toFixed(2)
                        : reading.vpd_kpa?.toFixed(2) ?? '--'}
                    </span>
                    <span className="text-muted-foreground text-sm">kPa</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Derived metric
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Equipment Controls (AUTO Mode Support) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Equipment Status & Controls</CardTitle>
            </CardHeader>
            <CardContent>
              {equipmentLoading || telemetryLoading ? (
                <p className="text-sm text-muted-foreground">Loading equipment status...</p>
              ) : equipmentControls.length > 0 ? (
                /* Show advanced controls if equipment_controls exist */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipmentControls.map((control) => (
                    <EquipmentControlCard
                      key={control.id}
                      equipment={control as unknown as TypedEquipmentControlRecord}
                      onStateChange={async (state, level) => {
                        // TODO: Call API to update equipment state
                        console.log('State change:', { equipment: control.equipment_type, state, level })
                        // Refresh equipment controls after update
                        const response = await fetch(`/api/equipment-controls?podId=${podId}`)
                        if (response.ok) {
                          const data = await response.json()
                          setEquipmentControls(data)
                        }
                      }}
                      onOverrideToggle={async (override) => {
                        // TODO: Call API to toggle override
                        console.log('Override toggle:', { equipment: control.equipment_type, override })
                        // Refresh equipment controls
                        const response = await fetch(`/api/equipment-controls?podId=${podId}`)
                        if (response.ok) {
                          const data = await response.json()
                          setEquipmentControls(data)
                        }
                      }}
                      onConfigureAuto={() => {
                        // AUTO configuration handled by modal in EquipmentControlCard
                      }}
                    />
                  ))}
                </div>
              ) : reading ? (
                /* Fallback: Show enhanced equipment status from telemetry with AUTO mode support */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    // Parse equipment_states JSONB for AUTO mode information
                    let equipmentStates = reading.equipment_states as Record<string, {
                      state: number
                      mode: 'MANUAL' | 'AUTOMATIC'
                      override: boolean
                      level?: number
                      schedule_enabled?: boolean
                    }> | null

                    // Fallback: If equipment_states is empty, parse raw_data
                    if (!equipmentStates && reading.raw_data) {
                      const rawData = reading.raw_data as { 
                        variables?: Record<string, { 
                          value: number
                          metadata?: {
                            ov?: number
                            mode?: number
                            level?: number
                            schedule?: number
                          }
                        }> 
                      }
                      if (rawData.variables) {
                        equipmentStates = {}
                        const vars = rawData.variables
                        
                        // Map TagoIO variables to equipment states
                        const mapping: Record<string, string> = {
                          'light_state': 'lighting',
                          'co2_valve': 'co2_injection',
                          'cooling_valve': 'cooling',
                          'heating_valve': 'heating',
                          'dehum': 'dehumidifier',
                          'hum': 'humidifier',
                          'ex_fan': 'exhaust_fan',
                          'circ_fan': 'circulation_fan',
                        }

                        Object.entries(mapping).forEach(([tagoVar, equipKey]) => {
                          const data = vars[tagoVar]
                          if (data?.metadata) {
                            const meta = data.metadata
                            // TagoIO: ov=2 means AUTO, ov=0/1 means MANUAL
                            const isAuto = meta.ov === 2
                            equipmentStates![equipKey] = {
                              state: data.value || 0,
                              mode: isAuto ? 'AUTOMATIC' : 'MANUAL',
                              override: meta.ov === 1,
                              level: meta.level,
                              schedule_enabled: meta.schedule === 1,
                            }
                          }
                        })
                      }
                    }

                    // Helper to render equipment with AUTO mode support
                    const renderEquipment = (
                      name: string,
                      booleanActive: boolean | null,
                      stateKey: string
                    ) => {
                      if (booleanActive === null) return null

                      const equipmentState = equipmentStates?.[stateKey]
                      const isAuto = equipmentState?.mode === 'AUTOMATIC'
                      const level = equipmentState?.level

                      // Don't show redundant equipment (both cooling AND heating if both off)
                      // Only show if active OR if it's the primary control for that function
                      const isPrimary = ['lighting', 'co2_injection', 'exhaust_fan', 'circulation_fan'].includes(stateKey)
                      if (!booleanActive && !isPrimary && !isAuto) return null

                      // Build status label: "AUTO (On)" or "AUTO (Off)" or just "On"/"Off"
                      let statusLabel: string
                      let statusClass: string

                      if (isAuto) {
                        statusLabel = booleanActive ? 'AUTO (On)' : 'AUTO (Off)'
                        statusClass = booleanActive ? 'text-blue-600 font-medium' : 'text-blue-500'
                      } else {
                        statusLabel = booleanActive ? 'On' : 'Off'
                        statusClass = booleanActive ? 'text-green-600 font-medium' : 'text-muted-foreground'
                      }

                      // Add power level if available and equipment is on
                      if (level !== undefined && level > 0 && booleanActive) {
                        statusLabel += ` ${level}%`
                      }

                      return (
                        <div key={stateKey} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">{name}</span>
                          <span className={`text-sm ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <>
                        {renderEquipment('Lighting', reading.lights_on, 'lighting')}
                        {renderEquipment('CO₂ Injection', reading.co2_injection_active, 'co2_injection')}
                        {renderEquipment('Cooling', reading.cooling_active, 'cooling')}
                        {renderEquipment('Heating', reading.heating_active, 'heating')}
                        {renderEquipment('Dehumidifier', reading.dehumidifier_active, 'dehumidifier')}
                        {renderEquipment('Humidifier', reading.humidifier_active, 'humidifier')}
                        {renderEquipment('Exhaust Fan', reading.exhaust_fan_active, 'exhaust_fan')}
                        {renderEquipment('Circulation Fan', reading.circulation_fan_active, 'circulation_fan')}
                      </>
                    )
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No equipment data available. Waiting for telemetry...</p>
              )}
            </CardContent>
          </Card>
          
          {/* Time Series Charts */}
          <EnvironmentChart podId={podId} deviceToken={deviceToken || undefined} hours={timeWindow} />

          
          {/* Compliance Notice */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Compliance Notice:</strong> All telemetry data is stored immutably with UTC timestamps.
                Sensor health transitions, alarms, and exports are logged for audit trails.
                This monitoring interface is read-only and does not issue control commands.
              </p>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* No Data State */}
      {!telemetryLoading && !telemetryError && !reading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No telemetry data available for this pod.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnvironmentChart } from './environment-chart'
import { EquipmentControlCard } from './equipment-control-card'
import { Clock, RefreshCw, Thermometer, Droplets, Wind, Sun, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { useTelemetry } from '@/hooks/use-telemetry'
import { usePermissions } from '@/hooks/use-permissions'
import { getActiveRecipe } from '@/app/actions/monitoring'
import { deactivateRecipe } from '@/app/actions/recipes'
import { createClient } from '@/lib/supabase/client'
import type { EquipmentControlRecord } from '@/lib/supabase/queries/equipment-controls'
import type { EquipmentControlRecord as TypedEquipmentControlRecord } from '@/types/equipment'
import { EquipmentState } from '@/types/equipment'
import type { ActiveRecipeDetails, EnvironmentalSetpoint } from '@/types/recipe'
import type { RoleKey } from '@/lib/rbac/types'
import type { TelemetryReading } from '@/types/telemetry'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PodDetailProps {
  podId: string
  podName: string
  roomName: string
  deviceToken?: string | null
  stage?: string
  activeRecipe?: ActiveRecipeDetails | null
  onBack?: () => void
}

export function PodDetail({ podId, podName, roomName, deviceToken, stage, activeRecipe: initialActiveRecipe }: PodDetailProps) {
  const [timeWindow] = useState<24 | 168 | 720>(24) // 24h, 7d, 30d
  const [equipmentControls, setEquipmentControls] = useState<EquipmentControlRecord[]>([])
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  const [activeRecipe, setActiveRecipe] = useState<ActiveRecipeDetails | null>(initialActiveRecipe || null)
  const [recipeLoading, setRecipeLoading] = useState(!initialActiveRecipe)
  const [userRole, setUserRole] = useState<RoleKey | null>(null)
  const [overrideMode, setOverrideMode] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Map<string, { state: EquipmentState; level?: number }>>(new Map())
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [removing, setRemoving] = useState(false)
  
  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        if (userData?.role) {
          setUserRole(userData.role as RoleKey)
        }
      }
    }
    fetchUserRole()
  }, [])
  
  // Permission check
  const { can } = usePermissions(userRole)
  
  // Fetch real-time telemetry
  const { reading, loading: telemetryLoading, error: telemetryError } = useTelemetry({
    podId,
    realtime: true,
    autoFetch: true
  })
  
  // Fetch active recipe for this pod (only if not provided as prop)
  useEffect(() => {
    if (initialActiveRecipe) {
      // Recipe already provided as prop, skip fetching
      setActiveRecipe(initialActiveRecipe)
      setRecipeLoading(false)
      return
    }
    
    async function fetchActiveRecipe() {
      setRecipeLoading(true)
      const { data, error } = await getActiveRecipe('pod', podId)
      if (!error && data) {
        setActiveRecipe(data)
      } else {
        setActiveRecipe(null)
      }
      setRecipeLoading(false)
    }
    fetchActiveRecipe()
  }, [podId, initialActiveRecipe])
  
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
  
  // Extract equipment states from telemetry data
  const getEquipmentFromTelemetry = () => {
    if (!reading) return []
    
    const equipmentStates: Record<string, { 
      state: number; 
      mode: 'MANUAL' | 'AUTOMATIC'; 
      override: boolean; 
      level?: number; 
      schedule_enabled?: boolean 
    }> = {}

    // Check equipment_states JSONB field first (new format with AUTO mode support)
    const equipmentStatesData = reading.equipment_states as Record<string, {
      state?: number;
      mode?: number;
      override?: boolean;
      level?: number;
      schedule_enabled?: boolean;
    }> | null

    if (equipmentStatesData && Object.keys(equipmentStatesData).length > 0) {
      // Use equipment_states JSONB field (has AUTO mode support from TagoIO)
      Object.entries(equipmentStatesData).forEach(([equipType, control]) => {
        equipmentStates[equipType] = {
          state: control.state ?? 0,
          mode: control.mode === 1 ? 'AUTOMATIC' : 'MANUAL',
          override: control.override ?? false,
          level: control.level,
          schedule_enabled: control.schedule_enabled ?? false,
        }
      })
    } else {
      // Fallback to boolean fields from telemetry (no AUTO mode support)
      // This happens when TagoIO only sends sensor data, not equipment control data
      const mapping: Record<string, { key: string; readingField: keyof TelemetryReading }> = {
        'lighting': { key: 'lighting', readingField: 'lights_on' },
        'co2_injection': { key: 'co2_injection', readingField: 'co2_injection_active' },
        'cooling': { key: 'cooling', readingField: 'cooling_active' },
        'heating': { key: 'heating', readingField: 'heating_active' },
        'dehumidifier': { key: 'dehumidifier', readingField: 'dehumidifier_active' },
        'humidifier': { key: 'humidifier', readingField: 'humidifier_active' },
        'exhaust_fan': { key: 'exhaust_fan', readingField: 'exhaust_fan_active' },
        'circulation_fan': { key: 'circulation_fan', readingField: 'circulation_fan_active' },
      }

      Object.entries(mapping).forEach(([equipType, { readingField }]) => {
        const booleanActive = reading[readingField] as boolean | null
        
        equipmentStates[equipType] = {
          state: booleanActive ? 1 : 0,
          mode: 'MANUAL',
          override: false,
          level: undefined,
          schedule_enabled: false,
        }
      })
    }
    
    // If no equipment states found, return empty array (will fall back to equipment_controls table)
    if (Object.keys(equipmentStates).length === 0) {
      return []
    }
    
    // Convert to EquipmentControlRecord format for display
    const result = Object.entries(equipmentStates).map(([equipType, state]) => ({
      id: `telemetry-${equipType}`,
      pod_id: podId,
      equipment_type: equipType,
      state: state.state,
      mode: state.mode === 'AUTOMATIC' ? 1 : 0,
      override: state.override,
      schedule_enabled: state.schedule_enabled || false,
      level: state.level || 0,
      auto_config: null,
      last_state_change: reading.timestamp,
      last_mode_change: reading.timestamp,
      changed_by: null,
      created_at: reading.timestamp,
      updated_at: reading.timestamp,
    } as EquipmentControlRecord))
    
    return result
  }
  
  const handleRefresh = () => {
    // Trigger a manual refresh by forcing component re-render
    // The useTelemetry hook will fetch fresh data
    window.location.reload()
  }
  
  const handleRemoveRecipe = async () => {
    if (!activeRecipe?.activation?.id || !userRole) {
      toast.error('Unable to remove recipe')
      return
    }
    
    setRemoving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in to remove a recipe')
        return
      }
      
      // Deactivate the recipe using server action (includes audit logging)
      const { error: deactivateError } = await deactivateRecipe(
        activeRecipe.activation.id,
        user.id,
        `Manual removal from ${podName} via monitoring dashboard`
      )
      
      if (deactivateError) {
        console.error('Error deactivating recipe:', deactivateError)
        toast.error('Failed to remove recipe')
        return
      }
      
      // Refresh the active recipe state
      setActiveRecipe(null)
      setShowRemoveDialog(false)
      toast.success(`Recipe removed from ${podName}`)
      
      // Refresh after a short delay to allow state to update
      setTimeout(() => handleRefresh(), 1000)
    } catch (error) {
      console.error('Error removing recipe:', error)
      toast.error('Failed to remove recipe')
    } finally {
      setRemoving(false)
    }
  }
  
  // Helper to get setpoint for a parameter type
  const getSetpoint = (parameterType: string): EnvironmentalSetpoint | null => {
    if (!activeRecipe?.activation?.current_stage?.setpoints) return null
    return activeRecipe.activation.current_stage.setpoints.find(
      sp => sp.parameter_type === parameterType && sp.enabled
    ) || null
  }
  
  // Helper to check if value is in range
  const checkInRange = (value: number, setpoint: EnvironmentalSetpoint | null): 
    { status: 'ok' | 'warning' | 'critical' | 'none'; deviation?: number } => {
    if (!setpoint) return { status: 'none' }
    
    const target = setpoint.value || setpoint.day_value || 0
    const min = setpoint.min_value || (target - (setpoint.deadband || 0))
    const max = setpoint.max_value || (target + (setpoint.deadband || 0))
    const deviation = value - target
    
    if (value < min || value > max) {
      // Critical: outside min/max bounds
      return { status: 'critical', deviation }
    } else if (setpoint.deadband && Math.abs(deviation) > setpoint.deadband) {
      // Warning: outside deadband
      return { status: 'warning', deviation }
    } else {
      // OK: within acceptable range
      return { status: 'ok', deviation }
    }
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{podName}</h1>
              {!recipeLoading && (
                activeRecipe?.activation?.recipe ? (
                  <Badge variant="secondary" className="text-xs">
                    Recipe: {activeRecipe.activation.recipe.name} - {activeRecipe.activation.current_stage?.name || 'Stage 1'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">No Recipe</Badge>
                )
              )}
            </div>
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
          {activeRecipe?.activation && can('control:recipe_apply') && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowRemoveDialog(true)}
              disabled={removing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Remove Recipe
            </Button>
          )}
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
                  <div className="flex flex-wrap gap-1 items-center">
                    {reading.temp_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (() => {
                      const setpoint = getSetpoint('temperature')
                      if (!setpoint || reading.temperature_c === null) {
                        return <Badge variant="secondary" className="text-xs">OK</Badge>
                      }
                      const { status } = checkInRange(reading.temperature_c, setpoint)
                      const min = setpoint.min_value ?? 0
                      const max = setpoint.max_value ?? 0
                      const value = reading.temperature_c
                      
                      let message = ''
                      if (value < min) {
                        message = `${(min - value).toFixed(1)}°C below range`
                      } else if (value > max) {
                        message = `${(value - max).toFixed(1)}°C above range`
                      } else {
                        // In range - show how much headroom to nearest boundary
                        const belowMax = (max - value).toFixed(1)
                        const aboveMin = (value - min).toFixed(1)
                        message = `${Math.min(parseFloat(belowMax), parseFloat(aboveMin)).toFixed(1)}°C within range`
                      }
                      
                      return (
                        <>
                          <Badge 
                            variant={status === 'ok' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {status === 'ok' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {status === 'critical' && <XCircle className="w-3 h-3 mr-1" />}
                            {status === 'ok' ? 'In Range' : status === 'warning' ? 'Deviation' : 'Out of Range'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message}
                          </span>
                        </>
                      )
                    })()}
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
                  <div className="flex flex-wrap gap-1 items-center">
                    {reading.humidity_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (() => {
                      const setpoint = getSetpoint('humidity')
                      if (!setpoint || reading.humidity_pct === null) {
                        return <Badge variant="secondary" className="text-xs">OK</Badge>
                      }
                      const { status } = checkInRange(reading.humidity_pct, setpoint)
                      const min = setpoint.min_value ?? 0
                      const max = setpoint.max_value ?? 0
                      const value = reading.humidity_pct
                      
                      let message = ''
                      if (value < min) {
                        message = `${(min - value).toFixed(1)}% below range`
                      } else if (value > max) {
                        message = `${(value - max).toFixed(1)}% above range`
                      } else {
                        // In range - show how much headroom to nearest boundary
                        const belowMax = (max - value).toFixed(1)
                        const aboveMin = (value - min).toFixed(1)
                        message = `${Math.min(parseFloat(belowMax), parseFloat(aboveMin)).toFixed(1)}% within range`
                      }
                      
                      return (
                        <>
                          <Badge 
                            variant={status === 'ok' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {status === 'ok' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {status === 'critical' && <XCircle className="w-3 h-3 mr-1" />}
                            {status === 'ok' ? 'In Range' : status === 'warning' ? 'Deviation' : 'Out of Range'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message}
                          </span>
                        </>
                      )
                    })()}
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
                  <div className="flex flex-wrap gap-1 items-center">
                    {reading.co2_sensor_fault ? (
                      <Badge variant="destructive" className="text-xs">Fault</Badge>
                    ) : (() => {
                      const setpoint = getSetpoint('co2')
                      if (!setpoint || reading.co2_ppm === null) {
                        return <Badge variant="secondary" className="text-xs">OK</Badge>
                      }
                      const { status } = checkInRange(reading.co2_ppm, setpoint)
                      const min = setpoint.min_value ?? 0
                      const max = setpoint.max_value ?? 0
                      const value = reading.co2_ppm
                      
                      let message = ''
                      if (value < min) {
                        message = `${Math.round(min - value)}ppm below range`
                      } else if (value > max) {
                        message = `${Math.round(value - max)}ppm above range`
                      } else {
                        // In range - show how much headroom to nearest boundary
                        const belowMax = max - value
                        const aboveMin = value - min
                        message = `${Math.round(Math.min(belowMax, aboveMin))}ppm within range`
                      }
                      
                      return (
                        <>
                          <Badge 
                            variant={status === 'ok' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {status === 'ok' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {status === 'critical' && <XCircle className="w-3 h-3 mr-1" />}
                            {status === 'ok' ? 'In Range' : status === 'warning' ? 'Deviation' : 'Out of Range'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message}
                          </span>
                        </>
                      )
                    })()}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">VPD</CardTitle>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                    Derived
                  </Badge>
                </div>
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
                  {(() => {
                    const vpdValue = reading.temperature_c && reading.humidity_pct
                      ? calculateVPD(reading.temperature_c, reading.humidity_pct)
                      : reading.vpd_kpa ?? null
                    
                    // Typical VPD ranges: 0.4-0.8 for veg, 0.8-1.2 for flower
                    // Using general optimal range of 0.8-1.2 kPa
                    const minVPD = 0.8
                    const maxVPD = 1.2
                    
                    if (vpdValue === null) {
                      return (
                        <div className="text-xs text-muted-foreground">
                          No data
                        </div>
                      )
                    }
                    
                    const inRange = vpdValue >= minVPD && vpdValue <= maxVPD
                    
                    return (
                      <div className={`text-xs font-medium ${inRange ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {inRange ? '✓ In range' : '⚠ Out of range'} ({minVPD}-{maxVPD} kPa)
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Equipment Controls with Global Override */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Equipment Status & Controls</CardTitle>
                {can('equipment:override') && (
                  <Button
                    variant={overrideMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (overrideMode) {
                        // Cancel - reset pending changes
                        setPendingChanges(new Map())
                        setOverrideMode(false)
                        toast.info('Override mode cancelled', { description: 'No changes were saved' })
                      } else {
                        setOverrideMode(true)
                      }
                    }}
                  >
                    {overrideMode ? 'Cancel' : 'Override Controls'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {equipmentLoading || telemetryLoading ? (
                <p className="text-sm text-muted-foreground">Loading equipment status...</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Equipment display logic:
                      - Override mode: Show equipment_controls (database config for editing)
                      - Default mode: Show telemetry equipment_states (real-time from TagoIO)
                      - Fallback: If no telemetry equipment data, show equipment_controls
                    */}
                    {(() => {
                      const telemetryEquipment = getEquipmentFromTelemetry()
                      const displayData = overrideMode 
                        ? equipmentControls 
                        : (telemetryEquipment.length > 0 ? telemetryEquipment : equipmentControls)
                      
                      return displayData.map((control) => (
                        <EquipmentControlCard
                          key={control.id}
                          equipment={control as unknown as TypedEquipmentControlRecord}
                          userRole={userRole}
                          overrideMode={overrideMode}
                          onStateChange={(equipmentId, state, level) => {
                            // Store pending changes in Map
                            const newChanges = new Map(pendingChanges)
                            newChanges.set(equipmentId, { state, level })
                            setPendingChanges(newChanges)
                          }}
                        />
                      ))
                    })()}
                  </div>
                  
                  {/* Save button when in override mode */}
                  {overrideMode && pendingChanges.size > 0 && (
                    <Button
                      className="w-full"
                      onClick={async () => {
                        // TODO: When TagoIO integration is ready, send commands here
                        // Loop through pendingChanges and send each to TagoIO
                        // for (const [equipmentId, change] of pendingChanges.entries()) {
                        //   await sendTagoIOCommand(podId, equipmentId, change.state, change.level)
                        // }
                        
                        toast.success(
                          `${pendingChanges.size} equipment change(s) applied`,
                          { description: 'Commands will be sent to TagoIO when integration is complete' }
                        )
                        
                        // Clear pending changes and exit override mode
                        setPendingChanges(new Map())
                        setOverrideMode(false)
                        
                        // Refresh equipment controls
                        const response = await fetch(`/api/equipment-controls?podId=${podId}`)
                        if (response.ok) {
                          const data = await response.json()
                          setEquipmentControls(data)
                        }
                      }}
                    >
                      Save {pendingChanges.size} Change{pendingChanges.size !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
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
      
      {/* Remove Recipe Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Recipe from {podName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the current recipe ({activeRecipe?.activation?.recipe?.name || 'Unknown'}) 
              and stop tracking its progress. The recipe itself will remain in your library.
              <br /><br />
              This action will be logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRecipe}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove Recipe'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

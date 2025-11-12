'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import type { SetpointParameterType } from '@/types/recipe'

// =====================================================
// Types
// =====================================================

export interface ControlTarget {
  parameter: SetpointParameterType
  target_value: number
  min_value?: number
  max_value?: number
  unit: string
}

export interface ControlReading {
  parameter: SetpointParameterType
  current_value: number
  target?: ControlTarget
  in_range: boolean
  deviation?: number
  deviation_pct?: number
}

export interface ControlPanelProps {
  podId: string
  podName?: string
  readings: ControlReading[]
  activeRecipeName?: string
  activeRecipeStageName?: string
  onOverrideClick?: (parameter: SetpointParameterType) => void
  onViewHistory?: (parameter: SetpointParameterType) => void
  userRole?: RoleKey | null
  loading?: boolean
  compact?: boolean
}

// =====================================================
// Control Panel Component
// =====================================================

export function ControlPanel({
  podName,
  readings,
  activeRecipeName,
  activeRecipeStageName,
  onOverrideClick,
  onViewHistory,
  userRole,
  loading = false,
  compact = false,
}: ControlPanelProps) {
  const { can } = usePermissions(userRole)

  // Permission checks
  const canOverride = can('equipment:override')
  const canViewHistory = can('monitoring:view')

  // Get icon for parameter type
  const getParameterIcon = (parameter: SetpointParameterType) => {
    const iconClass = "h-4 w-4"
    switch (parameter) {
      case 'temperature':
        return <Thermometer className={iconClass} />
      case 'humidity':
        return <Droplets className={iconClass} />
      case 'vpd':
        return <Droplets className={iconClass} />
      case 'co2':
        return <Wind className={iconClass} />
      case 'light_intensity':
      case 'photoperiod':
        return <Sun className={iconClass} />
      default:
        return <Target className={iconClass} />
    }
  }

  // Get display name for parameter
  const getParameterLabel = (parameter: SetpointParameterType): string => {
    switch (parameter) {
      case 'temperature':
        return 'Temperature'
      case 'humidity':
        return 'Humidity'
      case 'vpd':
        return 'VPD'
      case 'co2':
        return 'CO₂'
      case 'light_intensity':
        return 'Light Intensity'
      case 'photoperiod':
        return 'Photoperiod'
      case 'air_flow':
        return 'Air Flow'
      case 'air_pressure':
        return 'Air Pressure'
      case 'irrigation_frequency':
        return 'Irrigation Freq'
      case 'irrigation_duration':
        return 'Irrigation Duration'
      default:
        return String(parameter).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
  }

  // Get status badge
  const getStatusBadge = (reading: ControlReading) => {
    if (!reading.target) {
      return <Badge variant="outline" className="text-xs">No Target</Badge>
    }

    if (reading.in_range) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          In Range
        </Badge>
      )
    }

    const deviationPct = Math.abs(reading.deviation_pct || 0)

    if (deviationPct > 20) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </Badge>
      )
    } else if (deviationPct > 10) {
      return (
        <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-500 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Out of Range
      </Badge>
    )
  }

  // Get trend indicator
  const getTrendIndicator = (reading: ControlReading) => {
    if (!reading.target || !reading.deviation) return null

    if (reading.deviation > 0) {
      return <TrendingUp className="h-3 w-3 text-red-500" />
    } else if (reading.deviation < 0) {
      return <TrendingDown className="h-3 w-3 text-blue-500" />
    }
    return null
  }

  // Calculate progress percentage (how close to target)
  const getProgressPercentage = (reading: ControlReading): number => {
    if (!reading.target) return 0

    const { current_value, target } = reading
    const { target_value, min_value, max_value } = target

    // If we have a range
    if (min_value !== undefined && max_value !== undefined) {
      const range = max_value - min_value
      const position = current_value - min_value
      return Math.min(100, Math.max(0, (position / range) * 100))
    }

    // If we only have target, show 100% if within ±10%
    const tolerance = target_value * 0.1
    const deviation = Math.abs(current_value - target_value)
    if (deviation <= tolerance) return 100
    
    // Otherwise calculate based on deviation
    return Math.max(0, 100 - (deviation / tolerance) * 100)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Environmental Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading control data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Environmental Control
              {podName && <span className="text-muted-foreground font-normal">- {podName}</span>}
            </CardTitle>
            {activeRecipeName && (
              <CardDescription>
                Recipe: <strong>{activeRecipeName}</strong>
                {activeRecipeStageName && ` / Stage: ${activeRecipeStageName}`}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {readings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No control parameters configured
          </div>
        ) : (
          <div className="space-y-4">
            {readings.map((reading) => {
              const progress = getProgressPercentage(reading)
              const progressColor = reading.in_range 
                ? 'bg-green-600' 
                : (reading.deviation_pct || 0) > 20 
                  ? 'bg-red-600' 
                  : 'bg-amber-500'

              return (
                <div key={reading.parameter} className="space-y-2 p-4 border rounded-lg">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getParameterIcon(reading.parameter)}
                      <span className="font-medium">{getParameterLabel(reading.parameter)}</span>
                      {getTrendIndicator(reading)}
                    </div>
                    {getStatusBadge(reading)}
                  </div>

                  {/* Current vs Target */}
                  <div className="flex items-baseline justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-semibold text-lg">
                        {reading.current_value.toFixed(1)} {reading.target?.unit || ''}
                      </span>
                    </div>
                    {reading.target && (
                      <div className="text-right">
                        <span className="text-muted-foreground">Target: </span>
                        <span className="font-medium">
                          {reading.target.min_value !== undefined && reading.target.max_value !== undefined
                            ? `${reading.target.min_value.toFixed(1)} - ${reading.target.max_value.toFixed(1)}`
                            : reading.target.target_value.toFixed(1)
                          } {reading.target.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {reading.target && (
                    <div className="space-y-1">
                      <Progress value={progress} className={`h-2 [&>[data-state=filled]]:${progressColor}`} />
                      {reading.deviation !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Deviation: {reading.deviation > 0 ? '+' : ''}{reading.deviation.toFixed(2)} {reading.target.unit}
                          {reading.deviation_pct !== undefined && (
                            <span> ({reading.deviation_pct > 0 ? '+' : ''}{reading.deviation_pct.toFixed(1)}%)</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {!compact && (
                    <div className="flex gap-2 pt-2">
                      {canOverride && onOverrideClick && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOverrideClick(reading.parameter)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Override
                        </Button>
                      )}
                      {canViewHistory && onViewHistory && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewHistory(reading.parameter)}
                        >
                          View History
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

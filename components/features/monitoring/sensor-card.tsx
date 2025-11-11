'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendIndicator } from './trend-indicator'
import { RealTimeBadge } from './real-time-badge'
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

export type SensorStatus = 'online' | 'offline' | 'error' | 'warning'

export interface SensorCardProps {
  name: string
  type: 'temperature' | 'humidity' | 'co2' | 'light' | 'vpd' | 'other'
  currentValue: number
  unit: string
  status: SensorStatus
  trend?: number // Percentage change from previous reading
  min?: number
  max?: number
  lastUpdate?: string
  isRealTime?: boolean
  thresholdMin?: number
  thresholdMax?: number
}

export function SensorCard({
  name,
  type,
  currentValue,
  unit,
  status,
  trend,
  min,
  max,
  lastUpdate,
  isRealTime = false,
  thresholdMin,
  thresholdMax,
}: SensorCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-5 w-5" />
      case 'humidity':
        return <Droplets className="h-5 w-5" />
      case 'co2':
        return <Wind className="h-5 w-5" />
      case 'light':
        return <Sun className="h-5 w-5" />
      case 'vpd':
        return <Activity className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      case 'offline':
        return 'text-gray-500'
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return <Badge variant="outline" className="text-green-500 border-green-500">Online</Badge>
      case 'warning':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Warning</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>
    }
  }

  // Check if value is outside thresholds
  const isOutOfRange = () => {
    if (thresholdMin !== undefined && currentValue < thresholdMin) return true
    if (thresholdMax !== undefined && currentValue > thresholdMax) return true
    return false
  }

  return (
    <Card className={isOutOfRange() ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={getStatusColor()}>
              {getIcon()}
            </div>
            <CardTitle className="text-base font-medium">{name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isRealTime && <RealTimeBadge />}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Reading */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {currentValue.toFixed(1)}
            </span>
            <span className="text-lg text-muted-foreground">{unit}</span>
            {trend !== undefined && <TrendIndicator value={trend} size="md" />}
          </div>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Min/Max Range */}
        {(min !== undefined || max !== undefined) && (
          <div className="flex items-center justify-between text-sm">
            {min !== undefined && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="font-medium">{min.toFixed(1)} {unit}</p>
              </div>
            )}
            {max !== undefined && (
              <div className="space-y-0.5 text-right">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="font-medium">{max.toFixed(1)} {unit}</p>
              </div>
            )}
          </div>
        )}

        {/* Threshold Warning */}
        {isOutOfRange() && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Value outside acceptable range
              {thresholdMin !== undefined && thresholdMax !== undefined && (
                <span className="block mt-0.5">
                  ({thresholdMin.toFixed(1)} - {thresholdMax.toFixed(1)} {unit})
                </span>
              )}
            </p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {getStatusIcon()}
          <span className="text-sm capitalize">{status}</span>
        </div>
      </CardContent>
    </Card>
  )
}

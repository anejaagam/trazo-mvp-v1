'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Power,
  Settings,
  AlertTriangle,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Zap,
  Fan,
  Sprout,
  Waves,
  Shield,
  Radio,
} from 'lucide-react'
import {
  EquipmentType,
  EquipmentState,
  EquipmentControlRecord,
  getEquipmentStateLabel,
  getEquipmentStateColor,
} from '@/types/equipment'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'

export interface EquipmentControlCardProps {
  equipment: EquipmentControlRecord
  userRole?: RoleKey | null
  onStateChange?: (state: EquipmentState, level?: number) => Promise<void>
  onModeChange?: (autoMode: boolean) => Promise<void>
  onOverrideToggle?: (override: boolean) => Promise<void>
  onConfigureAuto?: () => void
  compact?: boolean
  disabled?: boolean
}

export function EquipmentControlCard({
  equipment,
  userRole,
  onStateChange,
  // onModeChange, // Reserved for future mode toggle functionality
  onOverrideToggle,
  onConfigureAuto,
  compact = false,
  disabled = false,
}: EquipmentControlCardProps) {
  const { can } = usePermissions(userRole)
  const [isUpdating, setIsUpdating] = useState(false)
  const [localLevel, setLocalLevel] = useState(equipment.level || 0)

  // Permission checks
  const canControlManual = can('equipment:control:manual')
  const canControlAuto = can('equipment:control:auto')
  const canOverride = can('equipment:override')

  const isControlDisabled = disabled || isUpdating || (!canControlManual && !canControlAuto)

  // Get equipment icon
  const getEquipmentIcon = () => {
    const iconClass = "h-5 w-5"
    switch (equipment.equipment_type) {
      case EquipmentType.COOLING:
        return <Thermometer className={iconClass} />
      case EquipmentType.HEATING:
        return <Thermometer className={iconClass} />
      case EquipmentType.DEHUMIDIFIER:
        return <Droplets className={iconClass} />
      case EquipmentType.HUMIDIFIER:
        return <Droplets className={iconClass} />
      case EquipmentType.CO2_INJECTION:
        return <Wind className={iconClass} />
      case EquipmentType.EXHAUST_FAN:
        return <Fan className={iconClass} />
      case EquipmentType.CIRCULATION_FAN:
        return <Fan className={iconClass} />
      case EquipmentType.LIGHTING:
        return <Sun className={iconClass} />
      case EquipmentType.IRRIGATION:
        return <Sprout className={iconClass} />
      case EquipmentType.FOGGER:
        return <Waves className={iconClass} />
      case EquipmentType.HEPA_FILTER:
        return <Shield className={iconClass} />
      case EquipmentType.UV_STERILIZATION:
        return <Radio className={iconClass} />
      default:
        return <Zap className={iconClass} />
    }
  }

  // Get equipment display name
  const getEquipmentName = () => {
    return equipment.equipment_type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Handle state button click
  const handleStateClick = async (newState: EquipmentState) => {
    if (isControlDisabled || !onStateChange) return
    
    setIsUpdating(true)
    try {
      await onStateChange(newState, newState === EquipmentState.ON ? localLevel : undefined)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle mode toggle (MANUAL <-> AUTO) - not currently used but prepared for future
  // const handleModeToggle = async (checked: boolean) => {
  //   if (!canControlAuto || !onModeChange) return
  //   
  //   setIsUpdating(true)
  //   try {
  //     await onModeChange(checked)
  //   } finally {
  //     setIsUpdating(false)
  //   }
  // }

  // Handle override toggle
  const handleOverrideToggle = async (checked: boolean) => {
    if (!canOverride || !onOverrideToggle) return
    
    setIsUpdating(true)
    try {
      await onOverrideToggle(checked)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle level change
  const handleLevelChange = async (value: number[]) => {
    const newLevel = value[0]
    setLocalLevel(newLevel)
  }

  // Handle level commit (on mouse up)
  const handleLevelCommit = async () => {
    if (equipment.state === EquipmentState.ON && onStateChange) {
      setIsUpdating(true)
      try {
        await onStateChange(EquipmentState.ON, localLevel)
      } finally {
        setIsUpdating(false)
      }
    }
  }

  const stateColorClass = getEquipmentStateColor(equipment.state)

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          {getEquipmentIcon()}
          <span className="text-sm font-medium">{getEquipmentName()}</span>
          {equipment.override && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>Manual override active</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={stateColorClass}>
            {getEquipmentStateLabel(equipment.state)}
          </Badge>
          {equipment.state === EquipmentState.AUTO && (
            <Badge variant="secondary" className="text-xs">AUTO</Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getEquipmentIcon()}
            {getEquipmentName()}
          </CardTitle>
          <div className="flex items-center gap-2">
            {equipment.override && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>Manual override active</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge variant="outline" className={stateColorClass}>
              {getEquipmentStateLabel(equipment.state)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 3-State Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={equipment.state === EquipmentState.OFF ? "default" : "outline"}
            size="sm"
            onClick={() => handleStateClick(EquipmentState.OFF)}
            disabled={isControlDisabled || !canControlManual}
            className="w-full"
          >
            <Power className="h-4 w-4 mr-1" />
            OFF
          </Button>
          <Button
            variant={equipment.state === EquipmentState.ON ? "default" : "outline"}
            size="sm"
            onClick={() => handleStateClick(EquipmentState.ON)}
            disabled={isControlDisabled || !canControlManual}
            className="w-full"
          >
            ON
          </Button>
          <Button
            variant={equipment.state === EquipmentState.AUTO ? "default" : "outline"}
            size="sm"
            onClick={() => handleStateClick(EquipmentState.AUTO)}
            disabled={isControlDisabled || !canControlAuto}
            className="w-full"
          >
            AUTO
          </Button>
        </div>

        {/* Power Level Slider (for MANUAL mode) */}
        {equipment.state === EquipmentState.ON && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Power Level</Label>
              <span className="text-xs font-medium">{localLevel}%</span>
            </div>
            <Slider
              value={[localLevel]}
              onValueChange={handleLevelChange}
              onValueCommit={handleLevelCommit}
              min={0}
              max={100}
              step={1}
              disabled={isControlDisabled || !canControlManual}
              className="w-full"
            />
          </div>
        )}

        {/* AUTO Mode Configuration Display */}
        {equipment.state === EquipmentState.AUTO && equipment.auto_config && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">AUTO Configuration</Label>
              {canControlAuto && onConfigureAuto && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onConfigureAuto}
                  disabled={isUpdating}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Thresholds */}
            {(equipment.auto_config.temp_threshold?.min !== undefined ||
              equipment.auto_config.temp_threshold?.max !== undefined) && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Temp:</span>{' '}
                {equipment.auto_config.temp_threshold.min}°C -{' '}
                {equipment.auto_config.temp_threshold.max}°C
              </div>
            )}
            
            {(equipment.auto_config.humidity_threshold?.min !== undefined ||
              equipment.auto_config.humidity_threshold?.max !== undefined) && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Humidity:</span>{' '}
                {equipment.auto_config.humidity_threshold.min}% -{' '}
                {equipment.auto_config.humidity_threshold.max}%
              </div>
            )}
            
            {(equipment.auto_config.co2_threshold?.min !== undefined ||
              equipment.auto_config.co2_threshold?.max !== undefined) && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">CO₂:</span>{' '}
                {equipment.auto_config.co2_threshold.min} ppm -{' '}
                {equipment.auto_config.co2_threshold.max} ppm
              </div>
            )}
            
            {equipment.auto_config.schedule && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Schedule:</span>{' '}
                {equipment.auto_config.schedule.on_time} - {equipment.auto_config.schedule.off_time}
              </div>
            )}
          </div>
        )}

        {/* Override Toggle */}
        {canOverride && onOverrideToggle && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Label htmlFor={`override-${equipment.equipment_type}`} className="text-xs">
              Manual Override
            </Label>
            <Switch
              id={`override-${equipment.equipment_type}`}
              checked={equipment.override || false}
              onCheckedChange={handleOverrideToggle}
              disabled={isUpdating}
            />
          </div>
        )}

        {/* Schedule Enabled Indicator */}
        {equipment.schedule_enabled && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">Schedule Active</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

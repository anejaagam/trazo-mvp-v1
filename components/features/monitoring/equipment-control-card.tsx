'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
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
  onStateChange?: (equipmentId: string, state: EquipmentState, level?: number) => void
  overrideMode?: boolean  // Global override mode controlled by parent
  compact?: boolean
  disabled?: boolean
}

export function EquipmentControlCard({
  equipment,
  userRole,
  onStateChange,
  overrideMode = false,
  compact = false,
  disabled = false,
}: EquipmentControlCardProps) {
  const { can } = usePermissions(userRole)
  const [localLevel, setLocalLevel] = useState(equipment.level || 0)

  // Permission checks
  const canControlManual = can('equipment:control:manual')
  const canControlAuto = can('equipment:control:auto')

  const isControlDisabled = disabled || (!canControlManual && !canControlAuto)

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
  const handleStateClick = (newState: EquipmentState) => {
    if (isControlDisabled || !onStateChange) return
    onStateChange(equipment.id, newState, newState === EquipmentState.ON ? localLevel : undefined)
  }

  // Handle level change
  const handleLevelChange = (value: number[]) => {
    const newLevel = value[0]
    setLocalLevel(newLevel)
  }

  // Handle level commit (on mouse up)
  const handleLevelCommit = () => {
    if (equipment.state === EquipmentState.ON && onStateChange) {
      onStateChange(equipment.id, EquipmentState.ON, localLevel)
    }
  }

  const stateColorClass = getEquipmentStateColor(equipment.state)

  // Compact view OR when not in override mode - just show icon, name, and badge
  if (compact || !overrideMode) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="flex items-center gap-2">
          {getEquipmentIcon()}
          <span className="text-sm font-medium">{getEquipmentName()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={stateColorClass}>
            {getEquipmentStateLabel(equipment.state)}
            {equipment.state !== EquipmentState.OFF && equipment.level !== undefined && equipment.level > 0 && (
              <span className="ml-1 font-semibold">{equipment.level}%</span>
            )}
          </Badge>
        </div>
      </div>
    )
  }

  // Full control view (when in override mode)
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {getEquipmentIcon()}
            {getEquipmentName()}
          </CardTitle>
          <Badge variant="outline" className={stateColorClass}>
            {getEquipmentStateLabel(equipment.state)}
          </Badge>
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

        {/* Power Level Slider (only when ON) */}
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
      </CardContent>
    </Card>
  )
}

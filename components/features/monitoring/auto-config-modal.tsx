'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AutoConfiguration,
  EquipmentType,
  TemperatureThreshold,
  HumidityThreshold,
  CO2Threshold,
  EquipmentSchedule,
} from '@/types/equipment'
import { Thermometer, Droplets, Wind, Clock, Zap } from 'lucide-react'

export interface AutoConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentType: EquipmentType | string
  currentConfig?: AutoConfiguration
  onSave: (config: AutoConfiguration) => Promise<void>
  onCancel?: () => void
}

export function AutoConfigModal({
  open,
  onOpenChange,
  equipmentType,
  currentConfig,
  onSave,
  onCancel,
}: AutoConfigModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'thresholds' | 'schedule'>('thresholds')

  // Temperature threshold state
  const [tempMin, setTempMin] = useState<string>(
    currentConfig?.temp_threshold?.min?.toString() || ''
  )
  const [tempMax, setTempMax] = useState<string>(
    currentConfig?.temp_threshold?.max?.toString() || ''
  )

  // Humidity threshold state
  const [humidityMin, setHumidityMin] = useState<string>(
    currentConfig?.humidity_threshold?.min?.toString() || ''
  )
  const [humidityMax, setHumidityMax] = useState<string>(
    currentConfig?.humidity_threshold?.max?.toString() || ''
  )

  // CO2 threshold state
  const [co2Min, setCo2Min] = useState<string>(
    currentConfig?.co2_threshold?.min?.toString() || ''
  )
  const [co2Max, setCo2Max] = useState<string>(
    currentConfig?.co2_threshold?.max?.toString() || ''
  )

  // Schedule state
  const [onTime, setOnTime] = useState<string>(
    currentConfig?.schedule?.on_time || ''
  )
  const [offTime, setOffTime] = useState<string>(
    currentConfig?.schedule?.off_time || ''
  )

  // Get equipment-specific configuration needs
  const needsTemperature = [
    EquipmentType.COOLING,
    EquipmentType.HEATING,
  ].includes(equipmentType as EquipmentType)

  const needsHumidity = [
    EquipmentType.DEHUMIDIFIER,
    EquipmentType.HUMIDIFIER,
    EquipmentType.FOGGER,
  ].includes(equipmentType as EquipmentType)

  const needsCO2 = [
    EquipmentType.CO2_INJECTION,
  ].includes(equipmentType as EquipmentType)

  const needsSchedule = [
    EquipmentType.LIGHTING,
    EquipmentType.UV_STERILIZATION,
    EquipmentType.IRRIGATION,
  ].includes(equipmentType as EquipmentType)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const config: AutoConfiguration = {}

      // Build temperature threshold
      if (needsTemperature && (tempMin || tempMax)) {
        const threshold: TemperatureThreshold = {
          min: tempMin ? parseFloat(tempMin) : 0,
          max: tempMax ? parseFloat(tempMax) : 100,
        }
        config.temp_threshold = threshold
      }

      // Build humidity threshold
      if (needsHumidity && (humidityMin || humidityMax)) {
        const threshold: HumidityThreshold = {
          min: humidityMin ? parseFloat(humidityMin) : 0,
          max: humidityMax ? parseFloat(humidityMax) : 100,
        }
        config.humidity_threshold = threshold
      }

      // Build CO2 threshold
      if (needsCO2 && (co2Min || co2Max)) {
        const threshold: CO2Threshold = {
          min: co2Min ? parseFloat(co2Min) : 0,
          max: co2Max ? parseFloat(co2Max) : 5000,
        }
        config.co2_threshold = threshold
      }

      // Build schedule
      if (needsSchedule && onTime && offTime) {
        const schedule: EquipmentSchedule = {
          on_time: onTime,
          off_time: offTime,
        }
        config.schedule = schedule
      }

      await onSave(config)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  const getEquipmentName = () => {
    return equipmentType
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Configure AUTO Mode: {getEquipmentName()}
          </DialogTitle>
          <DialogDescription>
            Set thresholds and schedules for automatic equipment control
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="thresholds">
              <Thermometer className="h-4 w-4 mr-2" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds" className="space-y-4 mt-4">
            {/* Temperature Thresholds */}
            {needsTemperature && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Temperature Range</Label>
                  <Badge variant="secondary" className="ml-auto">°C</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temp-min">Minimum</Label>
                    <Input
                      id="temp-min"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 20"
                      value={tempMin}
                      onChange={(e) => setTempMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temp-max">Maximum</Label>
                    <Input
                      id="temp-max"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 24"
                      value={tempMax}
                      onChange={(e) => setTempMax(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {equipmentType === EquipmentType.COOLING && 'Cooling activates when temperature exceeds maximum'}
                  {equipmentType === EquipmentType.HEATING && 'Heating activates when temperature falls below minimum'}
                </p>
              </div>
            )}

            {needsTemperature && (needsHumidity || needsCO2) && <Separator />}

            {/* Humidity Thresholds */}
            {needsHumidity && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Humidity Range</Label>
                  <Badge variant="secondary" className="ml-auto">%</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="humidity-min">Minimum</Label>
                    <Input
                      id="humidity-min"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="e.g., 40"
                      value={humidityMin}
                      onChange={(e) => setHumidityMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="humidity-max">Maximum</Label>
                    <Input
                      id="humidity-max"
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      placeholder="e.g., 60"
                      value={humidityMax}
                      onChange={(e) => setHumidityMax(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {equipmentType === EquipmentType.DEHUMIDIFIER && 'Dehumidifier activates when humidity exceeds maximum'}
                  {equipmentType === EquipmentType.HUMIDIFIER && 'Humidifier activates when humidity falls below minimum'}
                  {equipmentType === EquipmentType.FOGGER && 'Fogger activates when humidity falls below minimum'}
                </p>
              </div>
            )}

            {needsHumidity && needsCO2 && <Separator />}

            {/* CO2 Thresholds */}
            {needsCO2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">CO₂ Concentration Range</Label>
                  <Badge variant="secondary" className="ml-auto">ppm</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="co2-min">Minimum</Label>
                    <Input
                      id="co2-min"
                      type="number"
                      step="50"
                      placeholder="e.g., 800"
                      value={co2Min}
                      onChange={(e) => setCo2Min(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co2-max">Maximum</Label>
                    <Input
                      id="co2-max"
                      type="number"
                      step="50"
                      placeholder="e.g., 1200"
                      value={co2Max}
                      onChange={(e) => setCo2Max(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  CO₂ injection activates when concentration falls below minimum
                </p>
              </div>
            )}

            {!needsTemperature && !needsHumidity && !needsCO2 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>This equipment type does not use threshold-based automation.</p>
                <p className="text-sm mt-2">Configure a schedule instead.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* Schedule Configuration */}
            {needsSchedule ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Operating Schedule</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="on-time">Turn On Time</Label>
                    <Input
                      id="on-time"
                      type="time"
                      value={onTime}
                      onChange={(e) => setOnTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="off-time">Turn Off Time</Label>
                    <Input
                      id="off-time"
                      type="time"
                      value={offTime}
                      onChange={(e) => setOffTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Equipment will automatically turn on/off at specified times
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>This equipment type does not use schedule-based automation.</p>
                <p className="text-sm mt-2">Configure thresholds instead.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

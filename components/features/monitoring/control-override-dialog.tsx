'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Shield, Clock, Info } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import type { SetpointParameterType, OverridePriority } from '@/types/recipe'

// =====================================================
// Types
// =====================================================

export interface ControlOverrideRequest {
  parameter: SetpointParameterType
  value: number
  priority: OverridePriority
  duration_minutes?: number
  reason: string
}

export interface ControlOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  podId: string
  podName?: string
  parameter?: SetpointParameterType
  currentValue?: number
  targetValue?: number
  unit?: string
  onSubmit: (request: ControlOverrideRequest) => Promise<void>
  userRole?: RoleKey | null
}

// =====================================================
// Control Override Dialog Component
// =====================================================

export function ControlOverrideDialog({
  open,
  onOpenChange,
  podName,
  parameter,
  currentValue,
  targetValue,
  unit = '',
  onSubmit,
  userRole,
}: ControlOverrideDialogProps) {
  const { can } = usePermissions(userRole)

  // Form state
  const [overrideValue, setOverrideValue] = useState<number>(targetValue || currentValue || 0)
  const [priority, setPriority] = useState<OverridePriority>('manual')
  const [duration, setDuration] = useState<number>(60) // Default 1 hour
  const [reason, setReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Permission checks
  const canOverride = can('equipment:override')
  const canEmergencyOverride = can('equipment:override') && (userRole === 'org_admin' || userRole === 'site_manager')

  // Get parameter display name
  const getParameterLabel = (param: SetpointParameterType | undefined): string => {
    if (!param) return 'Parameter'
    
    switch (param) {
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
        return 'Irrigation Frequency'
      case 'irrigation_duration':
        return 'Irrigation Duration'
      default:
        return String(param).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    }
  }

  // Get parameter value limits
  const getParameterLimits = (param: SetpointParameterType | undefined): { min: number; max: number; step: number } => {
    if (!param) return { min: 0, max: 100, step: 1 }

    switch (param) {
      case 'temperature':
        return { min: 10, max: 40, step: 0.1 }
      case 'humidity':
        return { min: 20, max: 95, step: 1 }
      case 'vpd':
        return { min: 0.4, max: 1.6, step: 0.05 }
      case 'co2':
        return { min: 400, max: 1500, step: 50 }
      case 'light_intensity':
        return { min: 0, max: 100, step: 5 }
      case 'photoperiod':
        return { min: 0, max: 24, step: 0.5 }
      case 'air_flow':
        return { min: 0, max: 100, step: 5 }
      default:
        return { min: 0, max: 100, step: 1 }
    }
  }

  const limits = getParameterLimits(parameter)

  // Handle submit
  const handleSubmit = async () => {
    if (!parameter) {
      setError('No parameter selected')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this override')
      return
    }

    if (overrideValue < limits.min || overrideValue > limits.max) {
      setError(`Value must be between ${limits.min} and ${limits.max} ${unit}`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        parameter,
        value: overrideValue,
        priority,
        duration_minutes: duration,
        reason: reason.trim(),
      })

      // Reset form and close
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit override')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle close
  const handleClose = () => {
    setOverrideValue(targetValue || currentValue || 0)
    setPriority('manual')
    setDuration(60)
    setReason('')
    setError(null)
    onOpenChange(false)
  }

  if (!canOverride) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You do not have permission to override environmental controls.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Override Environmental Control
          </DialogTitle>
          <DialogDescription>
            {podName && <span className="font-medium">Pod: {podName}</span>}
            {parameter && <span className="ml-2">• {getParameterLabel(parameter)}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current vs Target Info */}
          {parameter && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Current Value</div>
                <div className="text-2xl font-semibold">
                  {currentValue?.toFixed(1) || 'N/A'} {unit}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Recipe Target</div>
                <div className="text-2xl font-semibold">
                  {targetValue?.toFixed(1) || 'N/A'} {unit}
                </div>
              </div>
            </div>
          )}

          {/* Override Value */}
          <div className="space-y-2">
            <Label htmlFor="override-value">Override Value</Label>
            <div className="flex gap-4 items-center">
              <Slider
                id="override-value"
                min={limits.min}
                max={limits.max}
                step={limits.step}
                value={[overrideValue]}
                onValueChange={([value]) => setOverrideValue(value)}
                className="flex-1"
              />
              <Input
                type="number"
                value={overrideValue}
                onChange={(e) => setOverrideValue(Number(e.target.value))}
                min={limits.min}
                max={limits.max}
                step={limits.step}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground w-16">{unit}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Range: {limits.min} - {limits.max} {unit}
            </p>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as OverridePriority)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canEmergencyOverride && (
                  <SelectItem value="emergency">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Emergency (Overrides all)
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Manual (Overrides recipe)
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Scheduled (Time-based)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Override Duration (minutes)</Label>
            <div className="flex gap-2">
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                max={1440}
                step={5}
              />
              <Button
                variant="outline"
                onClick={() => setDuration(30)}
                size="sm"
              >
                30m
              </Button>
              <Button
                variant="outline"
                onClick={() => setDuration(60)}
                size="sm"
              >
                1h
              </Button>
              <Button
                variant="outline"
                onClick={() => setDuration(240)}
                size="sm"
              >
                4h
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Override will automatically expire after this duration
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Override *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this override is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Warning Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This override will take precedence over the active recipe until it expires or is cancelled.
              All control changes are logged for compliance and audit purposes.
            </AlertDescription>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? 'Submitting...' : 'Apply Override'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

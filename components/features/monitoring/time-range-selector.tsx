'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subHours, subDays, startOfDay, endOfDay } from 'date-fns'

export type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom'

export interface TimeRange {
  start: Date
  end: Date
  preset: TimeRangePreset
}

export interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  className?: string
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStart, setCustomStart] = useState<Date | undefined>(value.start)
  const [customEnd, setCustomEnd] = useState<Date | undefined>(value.end)

  const presets = [
    { value: '1h' as const, label: 'Last Hour', hours: 1 },
    { value: '6h' as const, label: 'Last 6 Hours', hours: 6 },
    { value: '24h' as const, label: 'Last 24 Hours', hours: 24 },
    { value: '7d' as const, label: 'Last 7 Days', days: 7 },
    { value: '30d' as const, label: 'Last 30 Days', days: 30 },
  ]

  const handlePresetChange = (preset: TimeRangePreset) => {
    const now = new Date()
    let start: Date

    switch (preset) {
      case '1h':
        start = subHours(now, 1)
        break
      case '6h':
        start = subHours(now, 6)
        break
      case '24h':
        start = subHours(now, 24)
        break
      case '7d':
        start = subDays(now, 7)
        break
      case '30d':
        start = subDays(now, 30)
        break
      default:
        return
    }

    onChange({
      start,
      end: now,
      preset,
    })
    setIsOpen(false)
  }

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      onChange({
        start: startOfDay(customStart),
        end: endOfDay(customEnd),
        preset: 'custom',
      })
      setIsOpen(false)
    }
  }

  const getDisplayLabel = () => {
    if (value.preset === 'custom') {
      return `${format(value.start, 'MMM d')} - ${format(value.end, 'MMM d, yyyy')}`
    }
    const preset = presets.find((p) => p.value === value.preset)
    return preset?.label || 'Select Range'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start text-left font-normal', className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {getDisplayLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Preset Options */}
          <div className="border-r p-3 space-y-1 min-w-[140px]">
            <div className="text-sm font-medium mb-2">Quick Select</div>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={value.preset === preset.value ? 'default' : 'ghost'}
                className="w-full justify-start text-sm"
                onClick={() => handlePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Range Picker */}
          <div className="p-3 space-y-3">
            <div className="text-sm font-medium">Custom Range</div>
            
            {/* Start Date */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={setCustomStart}
                disabled={(date) => date > new Date()}
                className="rounded-md border"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
                disabled={(date) => 
                  date > new Date() || (customStart ? date < customStart : false)
                }
                className="rounded-md border"
              />
            </div>

            {/* Apply Button */}
            <Button
              className="w-full"
              onClick={handleCustomRange}
              disabled={!customStart || !customEnd}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Apply Custom Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

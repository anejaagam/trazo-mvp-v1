'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Layers, Tags, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrackingMode } from '@/types/batch'

interface TrackingModeIndicatorProps {
  trackingMode?: TrackingMode | null
  plantCount?: number
  tagCount?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Visual indicator for batch tracking mode (Open Loop vs Closed Loop)
 * Shows tracking status and tag assignment progress
 */
export function TrackingModeIndicator({
  trackingMode = 'open_loop',
  plantCount = 0,
  tagCount = 0,
  showLabel = true,
  size = 'md',
  className,
}: TrackingModeIndicatorProps) {
  const isOpenLoop = trackingMode !== 'closed_loop'
  const isClosedLoop = trackingMode === 'closed_loop'
  const hasAllTags = tagCount >= plantCount && plantCount > 0
  const hasSomeTags = tagCount > 0 && tagCount < plantCount
  const hasNoTags = tagCount === 0

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const tooltipContent = isOpenLoop
    ? 'Open Loop: Plants tracked by count (batch-level). Assign individual tags to convert to Closed Loop.'
    : 'Closed Loop: Each plant has a unique tag for individual tracking.'

  const trackingStatus = () => {
    if (isClosedLoop && hasAllTags) {
      return { label: 'Fully Tagged', color: 'success', icon: CheckCircle2 }
    }
    if (isClosedLoop && hasSomeTags) {
      return { label: 'Partially Tagged', color: 'warning', icon: AlertTriangle }
    }
    if (isOpenLoop && hasNoTags) {
      return { label: 'Open Loop', color: 'secondary', icon: Layers }
    }
    if (isOpenLoop && hasSomeTags) {
      return { label: 'Converting', color: 'warning', icon: Tags }
    }
    return { label: 'Open Loop', color: 'secondary', icon: Layers }
  }

  const status = trackingStatus()
  const StatusIcon = status.icon

  const badgeVariant = {
    success: 'default' as const,
    warning: 'secondary' as const,
    secondary: 'outline' as const,
  }[status.color]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center gap-1.5', className)}>
            <Badge
              variant={badgeVariant}
              className={cn(
                sizeClasses[size],
                'gap-1 cursor-help',
                status.color === 'success' &&
                  'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100',
                status.color === 'warning' &&
                  'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-100'
              )}
            >
              <StatusIcon className={iconSizes[size]} />
              {showLabel && <span>{status.label}</span>}
            </Badge>

            {/* Tag count indicator */}
            {plantCount > 0 && (
              <span
                className={cn(
                  'text-muted-foreground',
                  sizeClasses[size]
                )}
              >
                {tagCount}/{plantCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{isOpenLoop ? 'Open Loop Tracking' : 'Closed Loop Tracking'}</p>
            <p className="text-xs text-muted-foreground">{tooltipContent}</p>
            {plantCount > 0 && (
              <p className="text-xs">
                {tagCount} of {plantCount} plants tagged
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Compact version for table cells
 */
export function TrackingModeCompact({
  trackingMode,
  className,
}: {
  trackingMode?: TrackingMode | null
  className?: string
}) {
  const isOpenLoop = trackingMode !== 'closed_loop'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isOpenLoop ? 'outline' : 'default'}
            className={cn(
              'text-xs cursor-help',
              !isOpenLoop && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
              className
            )}
          >
            {isOpenLoop ? (
              <>
                <Layers className="h-3 w-3 mr-1" />
                Open
              </>
            ) : (
              <>
                <Tags className="h-3 w-3 mr-1" />
                Closed
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isOpenLoop
            ? 'Open Loop: Batch-level tracking'
            : 'Closed Loop: Individual plant tracking'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Source traceability indicator
 */
export function SourceTraceabilityIndicator({
  sourceType,
  sourceTag,
  className,
}: {
  sourceType?: 'package' | 'mother' | null
  sourceTag?: string | null
  className?: string
}) {
  if (!sourceType || !sourceTag) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground', className)}>
        No source
      </Badge>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn('text-xs cursor-help', className)}
          >
            {sourceType === 'package' ? 'PKG' : 'MOT'}: {sourceTag.slice(-8)}...
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            Source {sourceType === 'package' ? 'Package' : 'Mother Plant'}: {sourceTag}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

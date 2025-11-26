'use client'

import { Badge } from '@/components/ui/badge'
import { Factory, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProductionStatus = 'available' | 'in_production' | 'processed' | 'on_hold'
export type ProductionBatchStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'

interface ProductionStatusBadgeProps {
  status: ProductionStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface ProductionBatchStatusBadgeProps {
  status: ProductionBatchStatus
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const packageStatusConfig: Record<
  ProductionStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Factory; color: string }
> = {
  available: {
    label: 'Available',
    variant: 'outline',
    icon: CheckCircle,
    color: 'text-green-600 border-green-300 bg-green-50',
  },
  in_production: {
    label: 'In Production',
    variant: 'default',
    icon: Factory,
    color: 'text-blue-600 border-blue-300 bg-blue-50',
  },
  processed: {
    label: 'Processed',
    variant: 'secondary',
    icon: CheckCircle,
    color: 'text-purple-600 border-purple-300 bg-purple-50',
  },
  on_hold: {
    label: 'On Hold',
    variant: 'destructive',
    icon: AlertCircle,
    color: 'text-amber-600 border-amber-300 bg-amber-50',
  },
}

const batchStatusConfig: Record<
  ProductionBatchStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Factory; color: string }
> = {
  planned: {
    label: 'Planned',
    variant: 'outline',
    icon: Clock,
    color: 'text-slate-600 border-slate-300 bg-slate-50',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    icon: Factory,
    color: 'text-blue-600 border-blue-300 bg-blue-50',
  },
  completed: {
    label: 'Completed',
    variant: 'secondary',
    icon: CheckCircle,
    color: 'text-green-600 border-green-300 bg-green-50',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    icon: XCircle,
    color: 'text-red-600 border-red-300 bg-red-50',
  },
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-base px-3 py-1',
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
}

export function ProductionStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: ProductionStatusBadgeProps) {
  const config = packageStatusConfig[status] || packageStatusConfig.available
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], config.color, className)}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.label}
    </Badge>
  )
}

export function ProductionBatchStatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
}: ProductionBatchStatusBadgeProps) {
  const config = batchStatusConfig[status] || batchStatusConfig.planned
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], config.color, className)}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.label}
    </Badge>
  )
}

export type ProductionType = 'processing' | 'extraction' | 'infusion' | 'packaging' | 'preroll' | 'other'

interface ProductionTypeBadgeProps {
  type: ProductionType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const productionTypeConfig: Record<ProductionType, { label: string; color: string }> = {
  processing: { label: 'Processing', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  extraction: { label: 'Extraction', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  infusion: { label: 'Infusion', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  packaging: { label: 'Packaging', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  preroll: { label: 'Pre-Roll', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

export function ProductionTypeBadge({ type, size = 'md', className }: ProductionTypeBadgeProps) {
  const config = productionTypeConfig[type] || productionTypeConfig.other

  return (
    <Badge variant="outline" className={cn(sizeClasses[size], config.color, className)}>
      {config.label}
    </Badge>
  )
}

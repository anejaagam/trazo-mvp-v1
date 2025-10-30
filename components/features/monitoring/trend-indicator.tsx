'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TrendDirection = 'up' | 'down' | 'stable'
export type TrendSize = 'sm' | 'md' | 'lg'

export interface TrendIndicatorProps {
  value: number // Percentage change (positive = increase, negative = decrease)
  size?: TrendSize
  showValue?: boolean
  className?: string
  inverse?: boolean // If true, negative is good (e.g., for errors)
}

export function TrendIndicator({
  value,
  size = 'md',
  showValue = true,
  className,
  inverse = false,
}: TrendIndicatorProps) {
  const getDirection = (): TrendDirection => {
    if (Math.abs(value) < 0.1) return 'stable'
    return value > 0 ? 'up' : 'down'
  }

  const direction = getDirection()

  const getColor = () => {
    if (direction === 'stable') return 'text-muted-foreground'
    
    // Normal: up is good, down is bad
    // Inverse: down is good, up is bad (e.g., for errors)
    if (inverse) {
      return direction === 'up' ? 'text-red-500' : 'text-green-500'
    }
    return direction === 'up' ? 'text-green-500' : 'text-red-500'
  }

  const getIcon = () => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    }

    const iconClass = sizeClasses[size]

    switch (direction) {
      case 'up':
        return <ArrowUp className={iconClass} />
      case 'down':
        return <ArrowDown className={iconClass} />
      case 'stable':
        return <Minus className={iconClass} />
    }
  }

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'md':
        return 'text-sm'
      case 'lg':
        return 'text-base'
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5',
        getColor(),
        getTextSize(),
        className
      )}
    >
      {getIcon()}
      {showValue && (
        <span className="font-medium">
          {Math.abs(value).toFixed(1)}%
        </span>
      )}
    </div>
  )
}

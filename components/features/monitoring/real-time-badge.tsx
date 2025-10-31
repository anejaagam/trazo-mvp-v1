'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface RealTimeBadgeProps {
  className?: string
  size?: 'sm' | 'md'
}

export function RealTimeBadge({ className, size = 'md' }: RealTimeBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400',
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="font-medium">Live</span>
    </Badge>
  )
}

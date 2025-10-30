'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendIndicator } from './trend-indicator'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatItem {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  description?: string
  color?: 'default' | 'success' | 'warning' | 'error'
}

export interface StatsGridProps {
  stats: StatItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'success':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      case 'default':
      default:
        return 'text-primary'
    }
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={cn('h-4 w-4', getColorClasses(stat.color))} />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.trend !== undefined && (
                    <TrendIndicator value={stat.trend} size="sm" />
                  )}
                </div>
                {stat.description && (
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

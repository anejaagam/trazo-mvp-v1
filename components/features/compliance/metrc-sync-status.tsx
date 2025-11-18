'use client'

/**
 * Metrc Sync Status Component
 *
 * Displays sync status badge for inventory lots
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'

type SyncStatus = 'synced' | 'pending' | 'error' | 'not_required'

interface MetrcSyncStatusProps {
  status: SyncStatus
  lastSyncedAt?: string | null
  errorMessage?: string | null
}

export function MetrcSyncStatus({
  status,
  lastSyncedAt,
  errorMessage,
}: MetrcSyncStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle2,
          label: 'Synced',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        }
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        }
      case 'error':
        return {
          icon: XCircle,
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        }
      case 'not_required':
        return {
          icon: AlertCircle,
          label: 'Not Required',
          variant: 'outline' as const,
          className: 'text-muted-foreground',
        }
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          variant: 'outline' as const,
          className: '',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      {lastSyncedAt && status === 'synced' && (
        <span className="text-xs text-muted-foreground">
          {new Date(lastSyncedAt).toLocaleString()}
        </span>
      )}
      {errorMessage && status === 'error' && (
        <span className="text-xs text-destructive">
          {errorMessage}
        </span>
      )}
    </div>
  )
}

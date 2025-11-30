'use client'

/**
 * Batch Metrc Sync Status Component
 *
 * Displays sync status badge for batches
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle, Clock, XCircle, ExternalLink } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SyncStatus = 'synced' | 'pending' | 'error' | 'not_synced' | 'not_required'

interface BatchMetrcSyncStatusProps {
  status: SyncStatus
  metrcBatchId?: string | null
  metrcBatchName?: string | null
  lastSyncedAt?: string | null
  errorMessage?: string | null
  domainType?: string
  showDetails?: boolean
}

export function BatchMetrcSyncStatus({
  status,
  metrcBatchId,
  metrcBatchName,
  lastSyncedAt,
  errorMessage,
  domainType,
  showDetails = true,
}: BatchMetrcSyncStatusProps) {
  // Don't show sync status for non-cannabis batches
  if (domainType && domainType !== 'cannabis') {
    return null
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle2,
          label: 'Synced to Metrc',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        }
      case 'pending':
        return {
          icon: Clock,
          label: 'Sync Pending',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
        }
      case 'error':
        return {
          icon: XCircle,
          label: 'Sync Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
        }
      case 'not_synced':
        return {
          icon: AlertCircle,
          label: 'Not Synced',
          variant: 'outline' as const,
          className: 'text-muted-foreground border-dashed',
        }
      case 'not_required':
        return {
          icon: AlertCircle,
          label: 'Sync Not Required',
          variant: 'outline' as const,
          className: 'text-muted-foreground',
        }
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown Status',
          variant: 'outline' as const,
          className: '',
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (!showDetails) {
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.variant} className={`${config.className} cursor-help`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Metrc Sync Status</p>
              {metrcBatchId && (
                <p className="text-xs">
                  <span className="font-medium">Metrc ID:</span> {metrcBatchId}
                </p>
              )}
              {metrcBatchName && (
                <p className="text-xs">
                  <span className="font-medium">Metrc Name:</span> {metrcBatchName}
                </p>
              )}
              {lastSyncedAt && (
                <p className="text-xs">
                  <span className="font-medium">Last Synced:</span> {formatDate(lastSyncedAt)}
                </p>
              )}
              {errorMessage && (
                <p className="text-xs text-destructive">
                  <span className="font-medium">Error:</span> {errorMessage}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {status === 'synced' && metrcBatchName && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <span>{metrcBatchName}</span>
        </div>
      )}

      {lastSyncedAt && status === 'synced' && (
        <span className="text-xs text-muted-foreground">
          Synced {formatDate(lastSyncedAt)}
        </span>
      )}

      {errorMessage && status === 'error' && (
        <span className="text-xs text-destructive max-w-xs truncate" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  )
}

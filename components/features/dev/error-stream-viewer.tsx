'use client'

import { useState } from 'react'
import { useErrorStream } from '@/hooks/use-error-stream'
import { SeverityBadge } from './severity-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Code
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ErrorSeverity, ErrorLog } from '@/lib/errors/types'
import { cn } from '@/lib/utils'

interface ErrorStreamViewerProps {
  className?: string
}

export function ErrorStreamViewer({ className }: ErrorStreamViewerProps) {
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const {
    errors,
    isConnected,
    connectionStatus,
    clearErrors,
    deleteAllErrors,
    isLoading,
  } = useErrorStream({
    severityFilter: severityFilter === 'all' ? undefined : [severityFilter],
    showCriticalNotifications: true,
    loadInitial: true,
    initialLimit: 100,
  })

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'disconnected':
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className={cn('h-4 w-4', getConnectionStatusColor())} />
            ) : (
              <WifiOff className={cn('h-4 w-4', getConnectionStatusColor())} />
            )}
            <span className="text-sm text-muted-foreground capitalize">
              {connectionStatus}
            </span>
          </div>

          {/* Error Count */}
          <Badge variant="secondary" className="text-xs">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onValueChange={(value) => setSeverityFilter(value as ErrorSeverity | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearErrors}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Clear View
          </Button>

          {/* Delete All Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={deleteAllErrors}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3 w-3" />
            Delete All
          </Button>
        </div>
      </div>

      {/* Error List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : errors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed py-12">
          <AlertTriangle className="mb-3 h-10 w-10 text-green-400" />
          <p className="text-sm text-muted-foreground">No errors logged</p>
          <p className="text-xs text-muted-foreground">Platform is running smoothly</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {errors.map((error: ErrorLog) => (
            <ErrorItem
              key={error.id}
              error={error}
              isExpanded={expandedIds.has(error.id)}
              onToggle={() => toggleExpanded(error.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Individual error item component
function ErrorItem({
  error,
  isExpanded,
  onToggle,
}: {
  error: ErrorLog
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <div className="mt-0.5">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={error.severity} />
                {error.route && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {error.route}
                  </Badge>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm">{error.message}</p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            {/* Component */}
            {error.component && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Component</p>
                <Badge variant="outline" className="font-mono text-xs">
                  {error.component}
                </Badge>
              </div>
            )}

            {/* Stack Trace */}
            {error.stack && (
              <div className="mb-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Code className="h-3 w-3" />
                  Stack Trace
                </p>
                <pre className="max-h-48 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300 dark:bg-slate-950">
                  {error.stack}
                </pre>
              </div>
            )}

            {/* Metadata */}
            {error.metadata && Object.keys(error.metadata).length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Metadata</p>
                <pre className="max-h-32 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300 dark:bg-slate-950">
                  {JSON.stringify(error.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* User ID */}
            {error.user_id && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  User: <span className="font-mono">{error.user_id}</span>
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

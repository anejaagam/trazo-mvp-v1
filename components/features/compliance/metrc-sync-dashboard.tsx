'use client'

/**
 * Metrc Sync Dashboard Component
 *
 * Displays sync status and allows manual sync triggers
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { MetrcSyncLogEntry } from '@/lib/supabase/queries/compliance'

interface Site {
  id: string
  name: string
}

interface SyncLog {
  siteId: string
  siteName: string
  logs: MetrcSyncLogEntry[]
}

interface MetrcSyncDashboardProps {
  sites: Site[]
  syncLogs: SyncLog[]
  canSync: boolean
}

export function MetrcSyncDashboard({ sites, syncLogs, canSync }: MetrcSyncDashboardProps) {
  const [selectedSite, setSelectedSite] = useState<string>(sites[0]?.id || '')
  const [selectedSyncType, setSelectedSyncType] = useState<string>('packages')
  const [isSyncing, setIsSyncing] = useState(false)

  const selectedSiteLogs =
    syncLogs.find((log) => log.siteId === selectedSite)?.logs || []

  const handleSync = async () => {
    if (!selectedSite || !selectedSyncType) {
      toast.error('Please select a site and sync type')
      return
    }

    setIsSyncing(true)

    try {
      const response = await fetch('/api/compliance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSite,
          syncType: selectedSyncType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(
          `Sync completed: ${result.result.packagesCreated} created, ${result.result.packagesUpdated} updated`
        )
        // Reload the page to show updated logs
        window.location.reload()
      } else {
        toast.error(`Sync failed: ${result.result.errors.join(', ')}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error((error as Error).message || 'Failed to sync with Metrc')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
          <CardDescription>Trigger a manual sync with Metrc</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select sync type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="packages">Packages</SelectItem>
                <SelectItem value="plants" disabled>
                  Plants (Coming Soon)
                </SelectItem>
                <SelectItem value="plant_batches" disabled>
                  Plant Batches (Coming Soon)
                </SelectItem>
                <SelectItem value="harvests" disabled>
                  Harvests (Coming Soon)
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleSync}
              disabled={!canSync || isSyncing || !selectedSite}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent sync operations for the selected site</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedSiteLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync history found for this site
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSiteLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <SyncStatusIcon status={log.status} />
                    <div>
                      <div className="font-medium capitalize">
                        {log.sync_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()}
                      </div>
                      {log.error_message && (
                        <div className="text-sm text-destructive mt-1">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SyncStatusBadge status={log.status} />
                    <Badge variant="outline" className="capitalize">
                      {log.direction}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SyncStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-destructive" />
    case 'in_progress':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    case 'partial':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />
  }
}

function SyncStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <Badge variant="default">Completed</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    case 'in_progress':
      return <Badge variant="secondary">In Progress</Badge>
    case 'partial':
      return <Badge variant="outline">Partial</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

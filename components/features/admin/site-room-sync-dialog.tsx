'use client'

/**
 * SiteRoomSyncDialog Component
 * Dialog for syncing rooms/locations between Trazo and Metrc
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Loader2,
  RefreshCw,
  DoorOpen,
  CheckCircle,
  AlertCircle,
  Plus,
  Link2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Site {
  id: string
  name: string
  metrc_license_number?: string | null
  compliance_status?: 'compliant' | 'uncompliant' | 'pending' | 'not_required' | string | null
}

interface Room {
  id: string
  name: string
  room_type: string
  capacity_pods: number
  is_active: boolean
  metrc_location_id?: number | null
  metrc_location_name?: string | null
  metrc_sync_status?: string | null
}

interface SyncItem {
  metrcLocationId: number
  metrcLocationName: string
  metrcLocationTypeName: string
  trazoRoomId?: string
  action: 'created' | 'updated' | 'matched' | 'orphaned'
  details?: string
}

interface SyncResult {
  metrcLocationsFound: number
  roomsCreated: number
  roomsUpdated: number
  roomsMatched: number
  roomsOrphaned: number
  roomsPushedToMetrc: number
  errors: string[]
}

interface PushItem {
  trazoRoomId: string
  trazoRoomName: string
  metrcLocationId?: number
  metrcLocationName?: string
  action: 'pushed' | 'push_error' | 'skipped'
  details?: string
}

interface SiteRoomSyncDialogProps {
  open: boolean
  onClose: () => void
  site: Site | null
  onSuccess?: () => void
}

export function SiteRoomSyncDialog({
  open,
  onClose,
  site,
  onSuccess,
}: SiteRoomSyncDialogProps) {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    site: {
      id: string
      name: string
      metrcLicenseNumber: string
      lastSyncedAt: string | null
      complianceStatus: string
    }
    rooms: Room[]
    syncStatus: {
      total: number
      synced: number
      pending: number
      errors: number
      notSynced: number
    }
  } | null>(null)
  const [syncResult, setSyncResult] = useState<{
    syncResult: SyncResult
    items: SyncItem[]
    pushItems: PushItem[]
    durationMs: number
  } | null>(null)

  // Load sync status when dialog opens
  useEffect(() => {
    if (open && site?.metrc_license_number) {
      loadSyncStatus()
    }
  }, [open, site])

  const loadSyncStatus = async () => {
    if (!site) return

    try {
      setLoading(true)
      const response = await fetch(`/api/compliance/metrc/sites/${site.id}/sync-locations`)
      const data = await response.json()

      if (response.ok) {
        setSyncStatus(data)
      } else {
        toast.error(data.error || 'Failed to load sync status')
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
      toast.error('Failed to load sync status')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!site) return

    try {
      setSyncing(true)
      setSyncResult(null)

      const response = await fetch(`/api/compliance/metrc/sites/${site.id}/sync-locations`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync locations')
      }

      setSyncResult({
        syncResult: data.syncResult,
        items: data.items,
        pushItems: data.pushItems || [],
        durationMs: data.durationMs,
      })

      if (data.success) {
        const pushedCount = data.syncResult.roomsPushedToMetrc || 0
        const pulledCount = data.syncResult.metrcLocationsFound
        if (pushedCount > 0) {
          toast.success(`Synced: ${pulledCount} from Metrc, ${pushedCount} pushed to Metrc`)
        } else {
          toast.success(`Synced ${pulledCount} locations from Metrc`)
        }
      } else {
        toast.warning('Sync completed with some errors')
      }

      // Refresh status
      loadSyncStatus()
      onSuccess?.()
    } catch (error) {
      console.error('Error syncing locations:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to sync locations')
    } finally {
      setSyncing(false)
    }
  }

  const getActionIcon = (action: SyncItem['action']) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'updated':
        return <Link2 className="w-4 h-4 text-blue-600" />
      case 'matched':
        return <CheckCircle className="w-4 h-4 text-slate-400" />
      case 'orphaned':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
    }
  }

  const getActionBadge = (action: SyncItem['action']) => {
    switch (action) {
      case 'created':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Created</Badge>
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Updated</Badge>
      case 'matched':
        return <Badge variant="outline">Matched</Badge>
      case 'orphaned':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Orphaned</Badge>
    }
  }

  const getPushIcon = (action: PushItem['action']) => {
    switch (action) {
      case 'pushed':
        return <ArrowRight className="w-4 h-4 text-purple-600" />
      case 'push_error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-slate-400" />
    }
  }

  const getPushBadge = (action: PushItem['action']) => {
    switch (action) {
      case 'pushed':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Pushed to Metrc</Badge>
      case 'push_error':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Push Error</Badge>
      case 'skipped':
        return <Badge variant="outline">Skipped</Badge>
    }
  }

  const getSyncStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Synced</Badge>
      case 'pending_sync':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Pending</Badge>
      case 'sync_error':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>
      case 'out_of_sync':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Out of Sync</Badge>
      default:
        return <Badge variant="outline">Not Synced</Badge>
    }
  }

  if (!site?.metrc_license_number) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync Rooms with Metrc</DialogTitle>
          </DialogHeader>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This site is not linked to a Metrc facility. Please link it first to enable room sync.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Sync Rooms with Metrc
          </DialogTitle>
          <DialogDescription>
            Bidirectional sync: Pull locations from Metrc and push unsynced rooms to Metrc.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading sync status...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Site Info */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{site.name}</span>
                <Badge variant="outline">{site.metrc_license_number}</Badge>
              </div>
              {syncStatus?.site.lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(syncStatus.site.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Sync Status Summary */}
            {syncStatus && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Current Status</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-green-50 rounded p-2">
                    <div className="text-lg font-bold text-green-700">{syncStatus.syncStatus.synced}</div>
                    <div className="text-xs text-green-600">Synced</div>
                  </div>
                  <div className="bg-blue-50 rounded p-2">
                    <div className="text-lg font-bold text-blue-700">{syncStatus.syncStatus.pending}</div>
                    <div className="text-xs text-blue-600">Pending</div>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <div className="text-lg font-bold text-slate-700">{syncStatus.syncStatus.notSynced}</div>
                    <div className="text-xs text-slate-600">Not Synced</div>
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    <div className="text-lg font-bold text-red-700">{syncStatus.syncStatus.errors}</div>
                    <div className="text-xs text-red-600">Errors</div>
                  </div>
                </div>
                {syncStatus.syncStatus.total > 0 && (
                  <Progress
                    value={(syncStatus.syncStatus.synced / syncStatus.syncStatus.total) * 100}
                    className="h-2"
                  />
                )}
              </div>
            )}

            {/* Current Rooms List */}
            {syncStatus && syncStatus.rooms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <DoorOpen className="w-4 h-4" />
                  Current Rooms ({syncStatus.rooms.length})
                </h4>
                <ScrollArea className="h-40 border rounded-lg">
                  <div className="p-2 space-y-1">
                    {syncStatus.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-sm">{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {room.room_type} • {room.capacity_pods} pods
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {room.metrc_location_id && (
                            <span className="text-xs text-muted-foreground">
                              ID: {room.metrc_location_id}
                            </span>
                          )}
                          {getSyncStatusBadge(room.metrc_sync_status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Separator />

            {/* Sync Results */}
            {syncResult && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Sync Results
                  <span className="text-xs text-muted-foreground">
                    ({syncResult.durationMs}ms)
                  </span>
                </h4>

                {/* Summary */}
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-100 rounded p-2">
                    <div className="font-bold">{syncResult.syncResult.metrcLocationsFound}</div>
                    <div className="text-muted-foreground">From Metrc</div>
                  </div>
                  <div className="bg-green-100 rounded p-2">
                    <div className="font-bold text-green-700">{syncResult.syncResult.roomsCreated}</div>
                    <div className="text-green-600">Created</div>
                  </div>
                  <div className="bg-blue-100 rounded p-2">
                    <div className="font-bold text-blue-700">{syncResult.syncResult.roomsUpdated}</div>
                    <div className="text-blue-600">Updated</div>
                  </div>
                  <div className="bg-slate-100 rounded p-2">
                    <div className="font-bold">{syncResult.syncResult.roomsMatched}</div>
                    <div className="text-muted-foreground">Matched</div>
                  </div>
                  <div className="bg-amber-100 rounded p-2">
                    <div className="font-bold text-amber-700">{syncResult.syncResult.roomsOrphaned}</div>
                    <div className="text-amber-600">Orphaned</div>
                  </div>
                  <div className="bg-purple-100 rounded p-2">
                    <div className="font-bold text-purple-700">{syncResult.syncResult.roomsPushedToMetrc || 0}</div>
                    <div className="text-purple-600">Pushed</div>
                  </div>
                </div>

                {/* Errors */}
                {syncResult.syncResult.errors.length > 0 && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>{syncResult.syncResult.errors.length} errors occurred:</strong>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        {syncResult.syncResult.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Pull Items (Metrc → Trazo) */}
                {syncResult.items.length > 0 && (
                  <>
                    <h5 className="text-xs font-medium text-muted-foreground mt-2">
                      Metrc → Trazo ({syncResult.items.length})
                    </h5>
                    <ScrollArea className="h-32 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {syncResult.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm"
                          >
                            {getActionIcon(item.action)}
                            <div className="flex-1">
                              <span className="font-medium">{item.metrcLocationName}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {item.metrcLocationTypeName}
                              </span>
                              {item.details && (
                                <p className="text-xs text-muted-foreground">{item.details}</p>
                              )}
                            </div>
                            {getActionBadge(item.action)}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}

                {/* Push Items (Trazo → Metrc) */}
                {syncResult.pushItems && syncResult.pushItems.length > 0 && (
                  <>
                    <h5 className="text-xs font-medium text-muted-foreground mt-2">
                      Trazo → Metrc ({syncResult.pushItems.length})
                    </h5>
                    <ScrollArea className="h-32 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {syncResult.pushItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-purple-50 rounded text-sm"
                          >
                            {getPushIcon(item.action)}
                            <div className="flex-1">
                              <span className="font-medium">{item.trazoRoomName}</span>
                              {item.metrcLocationId && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  → Metrc ID: {item.metrcLocationId}
                                </span>
                              )}
                              {item.details && (
                                <p className="text-xs text-muted-foreground">{item.details}</p>
                              )}
                            </div>
                            {getPushBadge(item.action)}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </div>
            )}

            {/* How it works */}
            {!syncResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How bidirectional sync works:</strong>
                  <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                    <li><strong>Pull:</strong> Fetches locations from Metrc and creates/updates rooms in Trazo</li>
                    <li><strong>Push:</strong> Creates locations in Metrc for any unsynced Trazo rooms</li>
                    <li>Links existing rooms by matching names</li>
                    <li>Marks rooms as orphaned if their Metrc location was deleted</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={syncing}>
            Close
          </Button>
          <Button onClick={handleSync} disabled={syncing || loading}>
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

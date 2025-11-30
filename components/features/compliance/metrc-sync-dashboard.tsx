'use client'

/**
 * Metrc Sync Dashboard Component
 *
 * Displays sync status and allows manual sync triggers
 * Uses global site context - only shows site selector when "All Sites" is selected
 */

import { useState, useEffect } from 'react'
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
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, Package, Leaf, Scissors, MapPin, Dna, Box, Tag, Download, ArrowDownToLine, Link2, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { useSite } from '@/hooks/use-site'
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

interface UnlinkedMetrcBatch {
  id: string
  metrc_batch_id: number
  name: string
  type: string
  count: number
  strain_name: string
  planted_date: string
  room_name: string | null
  untracked_count: number | null
  tracked_count: number | null
}

interface MetrcSyncDashboardProps {
  sites: Site[]
  syncLogs: SyncLog[]
  canSync: boolean
}

const SYNC_TYPE_LABELS: Record<string, string> = {
  packages: 'Packages',
  plants: 'Plants',
  plant_batches: 'Plant Batches',
  harvests: 'Harvests',
  strains: 'Strains',
  items: 'Items',
  tags: 'Tags',
  locations_sync: 'Locations',
}

export function MetrcSyncDashboard({ sites, syncLogs, canSync }: MetrcSyncDashboardProps) {
  const { siteId: globalSiteId, isAllSitesMode } = useSite()
  const [localSelectedSite, setLocalSelectedSite] = useState<string>(sites[0]?.id || '')
  const [selectedSyncType, setSelectedSyncType] = useState<string>('packages')
  const [isSyncing, setIsSyncing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [syncTypeFilter, setSyncTypeFilter] = useState<string>('all')
  const [unlinkedBatches, setUnlinkedBatches] = useState<UnlinkedMetrcBatch[]>([])
  const [loadingUnlinked, setLoadingUnlinked] = useState(false)
  const [linkingBatchId, setLinkingBatchId] = useState<string | null>(null)

  // Use global site ID when a specific site is selected, otherwise use local selector
  const selectedSite = isAllSitesMode ? localSelectedSite : (globalSiteId || localSelectedSite)

  // Update local selection when global site changes
  useEffect(() => {
    if (!isAllSitesMode && globalSiteId) {
      setLocalSelectedSite(globalSiteId)
    }
  }, [globalSiteId, isAllSitesMode])

  // Fetch unlinked batches on mount and when site changes
  useEffect(() => {
    fetchUnlinkedBatches()
  }, [selectedSite])

  const fetchUnlinkedBatches = async () => {
    setLoadingUnlinked(true)
    try {
      const response = await fetch('/api/compliance/metrc/plant-batches/link')
      if (!response.ok) {
        throw new Error('Failed to fetch unlinked batches')
      }
      const data = await response.json()
      setUnlinkedBatches(data.batches || [])
    } catch (error) {
      console.error('Error fetching unlinked batches:', error)
    } finally {
      setLoadingUnlinked(false)
    }
  }

  const handleLinkBatch = async (metrcBatchCacheId: string) => {
    setLinkingBatchId(metrcBatchCacheId)
    try {
      const response = await fetch('/api/compliance/metrc/plant-batches/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrcPlantBatchCacheId: metrcBatchCacheId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Link failed')
      }

      const result = await response.json()
      if (result.success) {
        toast.success(result.message || 'Successfully linked Metrc plant batch to Trazo batch')
        // Refresh unlinked batches list
        await fetchUnlinkedBatches()
      } else {
        toast.error(result.error || 'Failed to link batch')
      }
    } catch (error) {
      console.error('Link error:', error)
      toast.error((error as Error).message || 'Failed to link Metrc plant batch')
    } finally {
      setLinkingBatchId(null)
    }
  }

  const allSelectedSiteLogs =
    syncLogs.find((log) => log.siteId === selectedSite)?.logs || []

  const selectedSiteLogs = syncTypeFilter === 'all'
    ? allSelectedSiteLogs
    : allSelectedSiteLogs.filter((log) => log.sync_type === syncTypeFilter)

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
        const syncLabel = SYNC_TYPE_LABELS[selectedSyncType] || selectedSyncType
        const details = result.result
        let message = `${syncLabel} sync completed`
        if (details?.packagesCreated !== undefined || details?.created !== undefined) {
          const created = details.packagesCreated ?? details.created ?? 0
          const updated = details.packagesUpdated ?? details.updated ?? 0
          message += `: ${created} created, ${updated} updated`
        } else if (details?.synced !== undefined) {
          message += `: ${details.synced} synced`
        }
        toast.success(message)
        // Reload the page to show updated logs
        window.location.reload()
      } else {
        const errors = result.result?.errors || result.errors || ['Unknown error']
        toast.error(`Sync failed: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error((error as Error).message || 'Failed to sync with Metrc')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleImportBatches = async () => {
    if (!selectedSite) {
      toast.error('Please select a site')
      return
    }

    setIsImporting(true)

    try {
      const response = await fetch('/api/compliance/import-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSite,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Import failed')
      }

      const result = await response.json()

      if (result.success) {
        if (result.imported > 0) {
          toast.success(`Imported ${result.imported} clone lots to inventory from Metrc`)
        } else if (result.skipped > 0) {
          toast.info(`No new items to import. ${result.skipped} skipped (already exist in inventory)`)
        } else {
          toast.info('No plant batches found in Metrc cache to import')
        }
        // Reload the page to show updated data
        window.location.reload()
      } else {
        const errors = result.errors || ['Unknown error']
        toast.error(`Import failed: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error((error as Error).message || 'Failed to import batches from Metrc')
    } finally {
      setIsImporting(false)
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
            {/* Only show site selector when "All Sites" is selected globally */}
            {isAllSitesMode && (
              <Select value={localSelectedSite} onValueChange={setLocalSelectedSite}>
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
            )}

            <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select sync type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="packages">Packages</SelectItem>
                <SelectItem value="plants">Plants</SelectItem>
                <SelectItem value="plant_batches">Plant Batches</SelectItem>
                <SelectItem value="harvests">Harvests</SelectItem>
                <SelectItem value="strains">Strains</SelectItem>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="tags">Tags</SelectItem>
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

      {/* Import from Metrc to Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Import to Inventory
          </CardTitle>
          <CardDescription>
            Import clones/seeds from Metrc into your inventory. Use this for Closed Loop
            Environment where Metrc already has starting inventory. First sync Plant Batches
            above, then import them here as inventory lots ready for planting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            {/* Site selector shown only in all-sites mode */}
            {isAllSitesMode && (
              <Select value={localSelectedSite} onValueChange={setLocalSelectedSite}>
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
            )}

            <Button
              onClick={handleImportBatches}
              disabled={!canSync || isImporting || !selectedSite}
              variant="outline"
            >
              <Download className={`mr-2 h-4 w-4 ${isImporting ? 'animate-pulse' : ''}`} />
              {isImporting ? 'Importing...' : 'Import to Inventory'}
            </Button>

            <span className="text-sm text-muted-foreground">
              Creates inventory lots from Metrc plant batches (clones/seeds)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Link Metrc Plant Batches to Trazo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Available Metrc Plant Batches
              </CardTitle>
              <CardDescription>
                Link Metrc plant batches directly to create Trazo batches for testing.
                These are synced from Metrc and not yet linked to any Trazo batch.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUnlinkedBatches}
              disabled={loadingUnlinked}
            >
              <RefreshCw className={`h-4 w-4 ${loadingUnlinked ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUnlinked ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : unlinkedBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unlinked Metrc plant batches available. Sync Plant Batches first to populate this list.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metrc Batch Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Strain</TableHead>
                  <TableHead>Plant Count</TableHead>
                  <TableHead>Planted Date</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unlinkedBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-sm">{batch.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{batch.type}</Badge>
                    </TableCell>
                    <TableCell>{batch.strain_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{batch.count} total</div>
                        <div className="text-xs text-muted-foreground">
                          {batch.tracked_count || 0} tracked / {batch.untracked_count || batch.count} untracked
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(batch.planted_date).toLocaleDateString()}</TableCell>
                    <TableCell>{batch.room_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleLinkBatch(batch.id)}
                        disabled={!canSync || linkingBatchId === batch.id}
                      >
                        {linkingBatchId === batch.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Linking...
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 h-4 w-4" />
                            Link to Trazo
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Recent sync operations for the selected site</CardDescription>
            </div>
            <Select value={syncTypeFilter} onValueChange={setSyncTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="packages">Packages</SelectItem>
                <SelectItem value="plants">Plants</SelectItem>
                <SelectItem value="plant_batches">Plant Batches</SelectItem>
                <SelectItem value="harvests">Harvests</SelectItem>
                <SelectItem value="strains">Strains</SelectItem>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="tags">Tags</SelectItem>
                <SelectItem value="locations_sync">Locations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedSiteLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {syncTypeFilter === 'all'
                ? 'No sync history found for this site'
                : `No ${SYNC_TYPE_LABELS[syncTypeFilter] || syncTypeFilter} sync history found`}
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSiteLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <SyncTypeIcon syncType={log.sync_type} />
                    <div>
                      <div className="font-medium">
                        {SYNC_TYPE_LABELS[log.sync_type] || log.sync_type.replace('_', ' ')}
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
                      {log.direction?.replace('_', ' → ') || 'sync'}
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
    case 'success':
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

function SyncTypeIcon({ syncType }: { syncType: string }) {
  switch (syncType) {
    case 'packages':
      return <Package className="h-5 w-5 text-blue-500" />
    case 'plants':
    case 'plant_batches':
      return <Leaf className="h-5 w-5 text-green-500" />
    case 'harvests':
      return <Scissors className="h-5 w-5 text-amber-500" />
    case 'locations':
    case 'locations_sync':
      return <MapPin className="h-5 w-5 text-purple-500" />
    case 'strains':
      return <Dna className="h-5 w-5 text-pink-500" />
    case 'items':
      return <Box className="h-5 w-5 text-cyan-500" />
    case 'tags':
      return <Tag className="h-5 w-5 text-orange-500" />
    default:
      return <RefreshCw className="h-5 w-5 text-muted-foreground" />
  }
}

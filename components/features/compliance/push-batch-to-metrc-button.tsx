'use client'

/**
 * Push Batch to Metrc Button Component (Semi-Autonomous)
 *
 * Automatically uses:
 * - Source info saved on batch (from batch creation)
 * - Location auto-resolved from pod -> room -> Metrc location mapping
 *
 * Only asks for input when data is missing.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, Loader2, Info, MapPin, AlertTriangle, Package, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { isOpenLoopState } from '@/lib/jurisdiction/plant-batch-config'

interface MetrcLocation {
  id: number
  name: string
  locationTypeName: string
  forPlantBatches: boolean
}

interface BatchSourceInfo {
  sourcePackageTag?: string | null
  sourceMotherPlantTag?: string | null
  hasSource: boolean
}

interface LocationInfo {
  source: 'pod_mapping' | 'room_name' | 'site_default' | 'manual'
  metrcLocation: string
  podName?: string
  roomName?: string
}

interface PushBatchToMetrcButtonProps {
  batchId: string
  batchNumber?: string
  siteId?: string
  stateCode?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  onPushComplete?: () => void
  className?: string
}

export function PushBatchToMetrcButton({
  batchId,
  batchNumber,
  siteId,
  stateCode = 'OR',
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  onPushComplete,
  className,
}: PushBatchToMetrcButtonProps) {
  const [isPushing, setIsPushing] = useState(false)
  const [isPushed, setIsPushed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Auto-resolved data
  const [batchSourceInfo, setBatchSourceInfo] = useState<BatchSourceInfo | null>(null)
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [locations, setLocations] = useState<MetrcLocation[]>([])

  // Manual override/fallback state (only used when auto-resolution fails)
  const [manualLocation, setManualLocation] = useState('')
  const [manualSourceType, setManualSourceType] = useState<'from_package' | 'from_mother' | 'no_source'>('no_source')
  const [manualSourceTag, setManualSourceTag] = useState('')

  // Determine if this is a closed loop state
  const isClosedLoop = !isOpenLoopState(stateCode)

  // Determine what's missing
  const hasSource = batchSourceInfo?.hasSource || false
  const hasLocation = !!locationInfo?.metrcLocation
  const needsSource = isClosedLoop && !hasSource
  const needsLocation = !hasLocation

  // Can we push?
  const canPush =
    !isLoading &&
    (hasLocation || manualLocation.trim()) &&
    (!needsSource || (manualSourceType !== 'no_source' && manualSourceTag.trim()))

  // Load data when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadData()
    }
  }, [isDialogOpen])

  const loadData = async () => {
    setIsLoading(true)
    setLoadError(null)

    console.log('[PushBatchToMetrc] Loading data for batch:', batchId)

    try {
      // Fetch all data in parallel
      const [batchResponse, resolveResponse, locationsResponse] = await Promise.all([
        fetch(`/api/batches/${batchId}`),
        fetch(`/api/compliance/resolve-location?batchId=${batchId}`),
        siteId ? fetch(`/api/compliance/metrc/locations?siteId=${siteId}`) : Promise.resolve(null),
      ])

      // Process batch source info
      console.log('[PushBatchToMetrc] Batch response status:', batchResponse.status)
      if (batchResponse.ok) {
        const batchData = await batchResponse.json()
        console.log('[PushBatchToMetrc] Batch data:', {
          batch_number: batchData.batch_number,
          source_package_tag: batchData.source_package_tag,
          source_mother_plant_tag: batchData.source_mother_plant_tag,
        })
        setBatchSourceInfo({
          sourcePackageTag: batchData.source_package_tag,
          sourceMotherPlantTag: batchData.source_mother_plant_tag,
          hasSource: !!(batchData.source_package_tag || batchData.source_mother_plant_tag),
        })
      } else {
        const errorText = await batchResponse.text()
        console.error('[PushBatchToMetrc] Batch fetch failed:', errorText)
      }

      // Process resolved location
      console.log('[PushBatchToMetrc] Location response status:', resolveResponse.status)
      if (resolveResponse.ok) {
        const resolveData = await resolveResponse.json()
        console.log('[PushBatchToMetrc] Location data:', resolveData)
        if (resolveData.metrcLocation) {
          setLocationInfo({
            source: resolveData.source,
            metrcLocation: resolveData.metrcLocation,
            podName: resolveData.podName,
            roomName: resolveData.roomName,
          })
        }
      } else {
        const errorText = await resolveResponse.text()
        console.error('[PushBatchToMetrc] Location resolve failed:', errorText)
      }

      // Process available locations (fallback)
      if (locationsResponse?.ok) {
        const locationsData = await locationsResponse.json()
        setLocations(locationsData.locations || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setLoadError('Failed to load batch data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePush = async () => {
    // Determine final location
    const finalLocation = locationInfo?.metrcLocation || manualLocation.trim()
    if (!finalLocation) {
      toast.error('Location is required')
      return
    }

    // Validate source for closed loop states
    if (needsSource && (manualSourceType === 'no_source' || !manualSourceTag.trim())) {
      toast.error(`${stateCode} is a Closed Loop state. Source is required.`)
      return
    }

    try {
      setIsPushing(true)
      const displayName = batchNumber || `Batch ${batchId.substring(0, 8)}`
      toast.info(`Pushing ${displayName} to Metrc...`)

      // Build source info - only send if we're providing manual source
      // If batch already has source, the API will use it automatically
      const sourceInfo = needsSource && manualSourceType !== 'no_source'
        ? {
            type: manualSourceType,
            packageTag: manualSourceType === 'from_package' ? manualSourceTag.trim() : undefined,
            motherPlantTags: manualSourceType === 'from_mother' ? [manualSourceTag.trim()] : undefined,
          }
        : undefined

      const response = await fetch('/api/compliance/push-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          location: finalLocation,
          sourceInfo,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || 'Push failed')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`${displayName} pushed to Metrc successfully`)
        result.warnings?.forEach((w: string) => toast.warning(w))
        setIsPushed(true)
        setIsDialogOpen(false)
        onPushComplete?.()
        setTimeout(() => setIsPushed(false), 3000)
      } else {
        throw new Error(result.message || 'Push failed')
      }
    } catch (error) {
      console.error('Push to Metrc error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to push to Metrc')
    } finally {
      setIsPushing(false)
    }
  }

  // Check if everything is ready to push (no manual input needed)
  const isReadyToPush = hasLocation && (!isClosedLoop || hasSource)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isPushed} className={className}>
          {isPushed ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
              {showLabel && 'Pushed'}
            </>
          ) : (
            <>
              <Upload className={`h-4 w-4 ${showLabel ? 'mr-2' : ''}`} />
              {showLabel && 'Push to Metrc'}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Push to Metrc
            {isClosedLoop && (
              <Badge variant="outline" className="text-xs font-normal">
                Closed Loop
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Create plant batch in Metrc for {batchNumber || 'this batch'}.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-2">
            {/* Summary of auto-resolved data */}
            <div className="space-y-3">
              {/* Source Info */}
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                {hasSource ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Source</p>
                      <p className="text-xs text-muted-foreground">
                        {batchSourceInfo?.sourcePackageTag ? (
                          <>
                            <Package className="h-3 w-3 inline mr-1" />
                            Package: {batchSourceInfo.sourcePackageTag}
                          </>
                        ) : batchSourceInfo?.sourceMotherPlantTag ? (
                          <>
                            <Leaf className="h-3 w-3 inline mr-1" />
                            Mother: {batchSourceInfo.sourceMotherPlantTag}
                          </>
                        ) : null}
                      </p>
                    </div>
                  </>
                ) : isClosedLoop ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Source Required</p>
                      <p className="text-xs text-muted-foreground">
                        {stateCode} is a Closed Loop state - source is required
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">No Source</p>
                      <p className="text-xs text-muted-foreground">Open Loop state - source optional</p>
                    </div>
                  </>
                )}
              </div>

              {/* Location Info */}
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                {hasLocation ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {locationInfo?.metrcLocation}
                        {locationInfo?.source === 'pod_mapping' && locationInfo.podName && (
                          <span className="ml-1">(from pod: {locationInfo.podName})</span>
                        )}
                        {locationInfo?.source === 'room_name' && locationInfo.roomName && (
                          <span className="ml-1">(from room)</span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Location Required</p>
                      <p className="text-xs text-muted-foreground">Could not auto-resolve location</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Manual input sections - only shown when needed */}
            {needsSource && (
              <div className="space-y-3 p-3 border border-destructive/50 rounded-md">
                <Label className="text-sm font-medium">Enter Source *</Label>
                <Select
                  value={manualSourceType}
                  onValueChange={(v: 'from_package' | 'from_mother' | 'no_source') => {
                    setManualSourceType(v)
                    setManualSourceTag('')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from_package">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" /> From Package
                      </span>
                    </SelectItem>
                    <SelectItem value="from_mother">
                      <span className="flex items-center gap-2">
                        <Leaf className="h-4 w-4" /> From Mother Plant
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {manualSourceType !== 'no_source' && (
                  <Input
                    placeholder={manualSourceType === 'from_package' ? 'Package tag...' : 'Mother plant tag...'}
                    value={manualSourceTag}
                    onChange={(e) => setManualSourceTag(e.target.value)}
                  />
                )}
              </div>
            )}

            {needsLocation && (
              <div className="space-y-3 p-3 border border-destructive/50 rounded-md">
                <Label className="text-sm font-medium">Select Location *</Label>
                {locations.length > 0 ? (
                  <Select value={manualLocation} onValueChange={setManualLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Metrc location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.name}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Enter Metrc location name..."
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Ready to push message */}
            {isReadyToPush && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Ready to push. All required data has been auto-resolved.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPushing}>
            Cancel
          </Button>
          <Button onClick={handlePush} disabled={!canPush || isPushing}>
            {isPushing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pushing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Push to Metrc
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info, Tag, AlertTriangle, Camera, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

interface AssignTagsDialogProps {
  batchId: string
  batchNumber: string
  plantCount: number
  currentTags: string[]
  onAssigned: () => void
  trigger?: React.ReactNode
}

export function AssignTagsDialog({
  batchId,
  batchNumber,
  plantCount,
  currentTags,
  onAssigned,
  trigger,
}: AssignTagsDialogProps) {
  const [open, setOpen] = useState(false)
  const [scannedTags, setScannedTags] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const newTags = scannedTags.filter((tag) => !currentTags.includes(tag))
  const duplicateTags = scannedTags.filter((tag) => currentTags.includes(tag))

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    setIsScanning(false)
  }, [])

  // Cleanup camera on unmount or dialog close
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  useEffect(() => {
    if (!open) {
      stopCamera()
    }
  }, [open, stopCamera])

  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsScanning(true)
      
      // Small delay to ensure video element is mounted
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!videoRef.current) {
        throw new Error('Video element not ready')
      }
      
      // Configure hints for barcode formats
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.QR_CODE,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      
      const reader = new BrowserMultiFormatReader(hints)
      readerRef.current = reader
      
      // Get available video devices
      const devices = await reader.listVideoInputDevices()
      const selectedDeviceId = devices.length > 0 ? devices[0].deviceId : undefined
      
      // Start continuous scanning
      await reader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result) {
            const tagValue = result.getText().trim()
            // Validate it looks like a Metrc tag (at least 20 chars)
            if (tagValue && tagValue.length >= 20) {
              setScannedTags(prev => {
                if (!prev.includes(tagValue) && !currentTags.includes(tagValue)) {
                  toast.success(`Tag scanned: ...${tagValue.slice(-8)}`)
                  // Brief vibration feedback if supported
                  if ('vibrate' in navigator) {
                    navigator.vibrate(100)
                  }
                  return [...prev, tagValue]
                }
                return prev
              })
            }
          }
        }
      )
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Unable to access camera. Please grant camera permissions and try again.')
      setIsScanning(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setScannedTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const clearAllTags = () => {
    setScannedTags([])
  }

  const handleAssign = async () => {
    if (newTags.length === 0) {
      toast.error('No new tags to assign')
      return
    }

    try {
      setIsAssigning(true)

      const response = await fetch('/api/batches/assign-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          tags: newTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to assign tags')
      }

      const result = await response.json()

      toast.success(`${result.tagsAssigned} tags assigned successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      setScannedTags([])
      stopCamera()
      onAssigned()
    } catch (error) {
      console.error('Error assigning tags:', error)
      toast.error((error as Error).message || 'Failed to assign tags')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Assign Tags
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Metrc Plant Tags</DialogTitle>
          <DialogDescription>
            Assign individual Metrc tags to plants in batch {batchNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Batch Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Plant Count</div>
              <div className="text-lg font-semibold">{plantCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tags Assigned</div>
              <div className="text-lg font-semibold">
                {currentTags.length + newTags.length} / {plantCount}
              </div>
            </div>
          </div>

          {/* Current Tags */}
          {currentTags.length > 0 && (
            <div>
              <Label className="mb-2">Current Tags ({currentTags.length})</Label>
              <div className="max-h-20 overflow-y-auto border rounded-md p-2">
                <div className="flex flex-wrap gap-1">
                  {currentTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Camera Scanner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Scan Tag Barcodes</Label>
              {isScanning ? (
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  <X className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanner
                </Button>
              )}
            </div>

            {/* Camera View */}
            {isScanning && (
              <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-48 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning overlay */}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-16 border-2 border-emerald-400 rounded-lg" />
                  <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm bg-black/50 py-1">
                    Position barcode within the frame
                  </div>
                </div>
              </div>
            )}

            {cameraError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">{cameraError}</AlertDescription>
              </Alert>
            )}

            {!isScanning && !cameraError && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Click &quot;Start Scanner&quot; to scan Metrc tag barcodes</p>
                <p className="text-xs mt-1">Uses your device camera to scan tags quickly</p>
              </div>
            )}
          </div>

          {/* Scanned Tags List */}
          {scannedTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Scanned Tags ({scannedTags.length})</Label>
                <Button variant="ghost" size="sm" onClick={clearAllTags} className="text-xs h-7">
                  Clear All
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-emerald-50">
                <div className="flex flex-wrap gap-1">
                  {scannedTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="default" 
                      className="text-xs font-mono bg-emerald-600 hover:bg-emerald-700 gap-1 pr-1"
                    >
                      <Check className="h-3 w-3" />
                      {tag.slice(-8)}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-emerald-800 rounded p-0.5"
                        title="Remove tag"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tag Format Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Metrc Tag Format:</strong> 1A[StateCode][License][Sequence]
              <br />
              Example: 1A4FF01000000220000001 (24 characters)
            </AlertDescription>
          </Alert>

          {/* Count Mismatch Warning */}
          {newTags.length > 0 && newTags.length + currentTags.length !== plantCount && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> Total tags ({newTags.length + currentTags.length}) will not match plant count ({plantCount}).
                Ensure all plants receive tags for full Metrc tracking.
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {duplicateTags.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Notice:</strong> {duplicateTags.length} tags are already assigned and will be skipped.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || newTags.length === 0}
          >
            {isAssigning ? 'Assigning...' : `Assign ${newTags.length} Tags`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

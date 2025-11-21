'use client'

/**
 * Push Batch to Metrc Button Component (Semi-Autonomous)
 *
 * Semi-autonomous: Automatically resolves Metrc location from pod assignment
 * Falls back to manual input if no mapping configured
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, Loader2, Info } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PushBatchToMetrcButtonProps {
  batchId: string
  batchNumber?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  onPushComplete?: () => void
}

export function PushBatchToMetrcButton({
  batchId,
  batchNumber,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  onPushComplete,
}: PushBatchToMetrcButtonProps) {
  const [isPushing, setIsPushing] = useState(false)
  const [isPushed, setIsPushed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [location, setLocation] = useState('')
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [locationInfo, setLocationInfo] = useState<{
    source: string
    podName?: string
    roomName?: string
  } | null>(null)

  // Auto-resolve location when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      resolveLocation()
    }
  }, [isDialogOpen])

  const resolveLocation = async () => {
    setIsResolvingLocation(true)
    try {
      const response = await fetch(`/api/compliance/resolve-location?batchId=${batchId}`)
      const result = await response.json()

      if (result.metrcLocation) {
        setLocation(result.metrcLocation)
        setLocationInfo({
          source: result.source,
          podName: result.podName,
          roomName: result.roomName,
        })
      } else {
        setLocation('')
        setLocationInfo(null)
      }
    } catch (error) {
      console.error('Error resolving location:', error)
      setLocation('')
      setLocationInfo(null)
    } finally {
      setIsResolvingLocation(false)
    }
  }

  const handlePush = async () => {
    if (!location.trim()) {
      toast.error('Please enter a Metrc location/room name')
      return
    }

    try {
      setIsPushing(true)
      const displayName = batchNumber || `Batch ${batchId.substring(0, 8)}`
      toast.info(`Pushing ${displayName} to Metrc...`)

      const response = await fetch('/api/compliance/push-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId, location: location.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Push failed')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`${displayName} pushed to Metrc successfully`)

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning: string) => {
            toast.warning(warning)
          })
        }

        setIsPushed(true)
        setIsDialogOpen(false)
        onPushComplete?.()

        // Reset pushed state after 3 seconds
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isPushed}
        >
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push Batch to Metrc</DialogTitle>
          <DialogDescription>
            This will create a plant batch in Metrc for {batchNumber || 'this batch'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {locationInfo && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {locationInfo.source === 'pod_mapping' ? (
                  <>
                    Location auto-resolved from pod <strong>{locationInfo.podName}</strong> in{' '}
                    <strong>{locationInfo.roomName}</strong>
                  </>
                ) : (
                  <>Location auto-resolved from site default</>
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <Label htmlFor="location">Metrc Location/Room Name *</Label>
            <Input
              id="location"
              placeholder={isResolvingLocation ? 'Resolving location...' : 'e.g., Propagation Room 1'}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPushing || isResolvingLocation}
            />
            <p className="text-xs text-muted-foreground">
              {locationInfo
                ? 'Location was auto-resolved. You can edit if needed.'
                : 'This must match an existing location name in your Metrc facility'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isPushing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePush}
            disabled={isPushing || !location.trim()}
          >
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

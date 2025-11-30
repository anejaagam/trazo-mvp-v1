'use client'

/**
 * Push to Metrc Button Component
 *
 * Manual button to push a specific inventory lot to Metrc
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface PushToMetrcButtonProps {
  lotId: string
  lotNumber?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  onPushComplete?: () => void
}

export function PushToMetrcButton({
  lotId,
  lotNumber,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  onPushComplete,
}: PushToMetrcButtonProps) {
  const [isPushing, setIsPushing] = useState(false)
  const [isPushed, setIsPushed] = useState(false)

  const handlePush = async () => {
    try {
      setIsPushing(true)
      const displayName = lotNumber || `Lot ${lotId.substring(0, 8)}`
      toast.info(`Pushing ${displayName} to Metrc...`)

      const response = await fetch('/api/compliance/push-lot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lotId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Push failed')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`${displayName} pushed to Metrc successfully`)
        setIsPushed(true)
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
    <Button
      variant={variant}
      size={size}
      onClick={handlePush}
      disabled={isPushing || isPushed}
    >
      {isPushed ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
          {showLabel && 'Pushed'}
        </>
      ) : (
        <>
          <Upload className={`h-4 w-4 ${showLabel ? 'mr-2' : ''} ${isPushing ? 'animate-pulse' : ''}`} />
          {showLabel && (isPushing ? 'Pushing...' : 'Push to Metrc')}
        </>
      )}
    </Button>
  )
}

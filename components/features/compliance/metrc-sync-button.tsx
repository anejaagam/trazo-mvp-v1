'use client'

/**
 * Metrc Sync Button Component
 *
 * Manual trigger for Metrc sync operations
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface MetrcSyncButtonProps {
  siteId: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onSyncComplete?: () => void
}

export function MetrcSyncButton({
  siteId,
  variant = 'outline',
  size = 'default',
  onSyncComplete,
}: MetrcSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      toast.info('Starting Metrc sync...')

      const response = await fetch('/api/compliance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          syncTypes: ['packages', 'plants', 'harvests'],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sync failed')
      }

      const result = await response.json()

      if (result.success) {
        toast.success(`Sync completed successfully`)
        onSyncComplete?.()
      } else {
        toast.warning('Sync completed with errors. Check sync dashboard for details.')
      }
    } catch (error) {
      console.error('Metrc sync error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to sync with Metrc')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={isSyncing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Syncing...' : 'Sync with Metrc'}
    </Button>
  )
}

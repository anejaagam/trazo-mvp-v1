'use client'

import { useRouter } from 'next/navigation'
import { PodDetail } from './pod-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PodDetailDashboardProps {
  podId: string
  podName: string
  roomName: string
  userRole: string
  userId: string
  deviceToken?: string | null
}

export function PodDetailDashboard({
  podId,
  podName,
  roomName,
  deviceToken,
}: PodDetailDashboardProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/monitoring')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fleet
      </Button>

      {/* Pod Detail Component */}
      <PodDetail
        podId={podId}
        podName={podName}
        roomName={roomName}
        deviceToken={deviceToken}
        onBack={() => router.push('/dashboard/monitoring')}
      />
    </div>
  )
}

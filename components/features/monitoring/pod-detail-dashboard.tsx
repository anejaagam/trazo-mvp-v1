'use client'

import { useRouter } from 'next/navigation'
import { PodDetail } from './pod-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { ActiveRecipeDetails } from '@/types/recipe'

interface PodDetailDashboardProps {
  podId: string
  podName: string
  roomName: string
  userRole: string
  userId: string
  deviceToken?: string | null
  activeRecipe?: ActiveRecipeDetails | null
}

export function PodDetailDashboard({
  podId,
  podName,
  roomName,
  deviceToken,
  activeRecipe,
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
        activeRecipe={activeRecipe}
        onBack={() => router.push('/dashboard/monitoring')}
      />
    </div>
  )
}

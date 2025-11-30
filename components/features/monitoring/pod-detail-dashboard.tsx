'use client'

import { useRouter } from 'next/navigation'
import { PodDetail } from './pod-detail'
import { ActiveRecipeDisplay } from '@/components/features/recipes/active-recipe-display'
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
  isBatchManaged?: boolean
}

export function PodDetailDashboard({
  podId,
  podName,
  roomName,
  deviceToken,
  activeRecipe,
  isBatchManaged = false,
}: PodDetailDashboardProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Back Navigation - Always at top */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/monitoring')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fleet
      </Button>

      {/* Active Recipe Display - Shows when recipe is active */}
      {activeRecipe && (
        <ActiveRecipeDisplay activeRecipe={activeRecipe} />
      )}

      {/* Pod Detail Component */}
      <PodDetail
        podId={podId}
        podName={podName}
        roomName={roomName}
        deviceToken={deviceToken}
        activeRecipe={activeRecipe}
        isBatchManaged={isBatchManaged}
        onBack={() => router.push('/dashboard/monitoring')}
      />
    </div>
  )
}

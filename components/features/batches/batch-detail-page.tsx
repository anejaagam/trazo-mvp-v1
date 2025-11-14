'use client'

import { useRouter } from 'next/navigation'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'
import { BatchDetailDialog } from './batch-detail-dialog'

interface BatchDetailPageProps {
  batch: BatchListItem
  userId: string
  userRole: string
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchDetailPage({ batch, userId, userRole, jurisdictionId, plantType }: BatchDetailPageProps) {
  const router = useRouter()
  return (
    <BatchDetailDialog
      batch={batch}
      isOpen
      onClose={() => router.push('/dashboard/batches')}
      onRefresh={() => router.refresh()}
      userId={userId}
      userRole={userRole}
      jurisdictionId={jurisdictionId}
      plantType={plantType}
    />
  )
}

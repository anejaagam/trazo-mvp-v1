'use client'

import { useRouter } from 'next/navigation'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import { BatchForm } from './batch-modal'

interface BatchWizardProps {
  organizationId: string
  siteId: string
  userId: string
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchWizard({ organizationId, siteId, userId, jurisdictionId, plantType }: BatchWizardProps) {
  const router = useRouter()

  return (
    <BatchForm
      organizationId={organizationId}
      siteId={siteId}
      userId={userId}
      jurisdictionId={jurisdictionId}
      plantType={plantType}
      onSuccess={() => router.push('/dashboard/batches')}
      onCancel={() => router.push('/dashboard/batches')}
    />
  )
}

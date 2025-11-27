'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Link2,
  Unlink,
  Tag,
  Leaf,
  RefreshCw,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface BatchComplianceData {
  batch: {
    id: string
    batch_number: string
    domain_type: string
    stage: string
    plant_count: number
    metrc_plant_labels?: string[]
  }
  metrcMapping?: {
    metrc_batch_id: string
    metrc_growth_phase: string
    sync_status: string
    last_synced_at: string
  }
  cultivar?: {
    id: string
    name: string
    metrc_strain_id?: number
    metrc_sync_status?: string
  }
  podLocation?: {
    pod_name: string
    metrc_location_name?: string
  }
  tagStats: {
    assigned: number
    available: number
  }
}

interface BatchComplianceStatusProps {
  batchId: string
  onSyncTrigger?: () => void
}

export function BatchComplianceStatus({ batchId, onSyncTrigger }: BatchComplianceStatusProps) {
  const [data, setData] = useState<BatchComplianceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComplianceData()
  }, [batchId])

  const loadComplianceData = async () => {
    setLoading(true)
    try {
      // Fetch batch details with compliance info
      const response = await fetch(`/api/batches/${batchId}?include=compliance`)
      if (!response.ok) throw new Error('Failed to fetch batch')

      const batchData = await response.json()

      // Build compliance data from response
      const complianceData: BatchComplianceData = {
        batch: {
          id: batchData.id,
          batch_number: batchData.batch_number,
          domain_type: batchData.domain_type,
          stage: batchData.stage,
          plant_count: batchData.plant_count,
          metrc_plant_labels: batchData.metrc_plant_labels,
        },
        metrcMapping: batchData.metrc_mapping || undefined,
        cultivar: batchData.cultivar || undefined,
        podLocation: batchData.pod_assignment?.pod
          ? {
              pod_name: batchData.pod_assignment.pod.name,
              metrc_location_name: batchData.pod_assignment.pod.metrc_location_name,
            }
          : undefined,
        tagStats: {
          assigned: batchData.metrc_plant_labels?.length || 0,
          available: batchData.plant_count - (batchData.metrc_plant_labels?.length || 0),
        },
      }

      setData(complianceData)
    } catch (error) {
      console.error('Error loading compliance data:', error)
      toast.error('Failed to load compliance status')
    } finally {
      setLoading(false)
    }
  }

  const getComplianceScore = (): { score: number; label: string; color: string } => {
    if (!data) return { score: 0, label: 'Unknown', color: 'gray' }

    // Non-cannabis batches don't need Metrc compliance
    if (data.batch.domain_type !== 'cannabis') {
      return { score: 100, label: 'N/A', color: 'gray' }
    }

    let score = 0
    const maxScore = 5

    // Check 1: Metrc batch mapping exists
    if (data.metrcMapping) score++

    // Check 2: Cultivar linked to Metrc strain
    if (data.cultivar?.metrc_strain_id) score++

    // Check 3: Pod has Metrc location
    if (data.podLocation?.metrc_location_name) score++

    // Check 4: Plant tags assigned (at least 50% of plants)
    const tagPercent = data.batch.plant_count > 0
      ? (data.tagStats.assigned / data.batch.plant_count) * 100
      : 0
    if (tagPercent >= 50) score++

    // Check 5: Sync status is current
    if (data.metrcMapping?.sync_status === 'synced') score++

    const percent = Math.round((score / maxScore) * 100)

    if (percent >= 80) return { score: percent, label: 'Compliant', color: 'green' }
    if (percent >= 50) return { score: percent, label: 'Partial', color: 'amber' }
    return { score: percent, label: 'Needs Setup', color: 'red' }
  }

  const complianceStatus = getComplianceScore()

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading compliance status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Unable to load compliance data
        </CardContent>
      </Card>
    )
  }

  // Non-cannabis batches
  if (data.batch.domain_type !== 'cannabis') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Metrc compliance is not required for {data.batch.domain_type} batches.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Metrc Compliance
            </CardTitle>
            <CardDescription>Batch #{data.batch.batch_number}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              complianceStatus.color === 'green'
                ? 'bg-green-50 text-green-700 border-green-200'
                : complianceStatus.color === 'amber'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }
          >
            {complianceStatus.label} ({complianceStatus.score}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrc Batch Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Metrc Batch</span>
            {data.metrcMapping ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Synced
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {data.metrcMapping.metrc_batch_id}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                <Clock className="h-3 w-3 mr-1" />
                Not Synced
              </Badge>
            )}
          </div>
          {data.metrcMapping && (
            <div className="text-xs text-muted-foreground pl-2">
              Phase: {data.metrcMapping.metrc_growth_phase} | Last sync:{' '}
              {new Date(data.metrcMapping.last_synced_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <Separator />

        {/* Cultivar/Strain Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cultivar → Strain</span>
            {data.cultivar?.metrc_strain_id ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Link2 className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            ) : data.cultivar ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                <Unlink className="h-3 w-3 mr-1" />
                Not Linked
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                No Cultivar
              </Badge>
            )}
          </div>
          {data.cultivar && (
            <div className="text-xs text-muted-foreground pl-2">
              {data.cultivar.name}
              {data.cultivar.metrc_strain_id && ` → Strain #${data.cultivar.metrc_strain_id}`}
            </div>
          )}
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Location Mapping</span>
            {data.podLocation?.metrc_location_name ? (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mapped
              </Badge>
            ) : data.podLocation ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Mapped
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                No Pod
              </Badge>
            )}
          </div>
          {data.podLocation && (
            <div className="text-xs text-muted-foreground pl-2">
              Pod: {data.podLocation.pod_name}
              {data.podLocation.metrc_location_name &&
                ` → ${data.podLocation.metrc_location_name}`}
            </div>
          )}
        </div>

        <Separator />

        {/* Plant Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plant Tags</span>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {data.tagStats.assigned} / {data.batch.plant_count}
              </span>
              {data.tagStats.assigned === data.batch.plant_count ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : data.tagStats.assigned > 0 ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Partial
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  <XCircle className="h-3 w-3 mr-1" />
                  None
                </Badge>
              )}
            </div>
          </div>
          {data.tagStats.available > 0 && (
            <div className="text-xs text-muted-foreground pl-2">
              {data.tagStats.available} plant(s) need tags assigned
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={loadComplianceData}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          {onSyncTrigger && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={onSyncTrigger}
              disabled={complianceStatus.score < 50}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Sync to Metrc
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

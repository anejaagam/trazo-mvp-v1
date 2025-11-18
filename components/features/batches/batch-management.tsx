'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Filter, Factory, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchFilters, BatchStage, BatchStatus } from '@/types/batch'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'
import { getBatches } from '@/lib/supabase/queries/batches-client'
import { BatchTable } from './batch-table'
import { BatchModal } from './batch-modal'
import { CultivarManagement } from './cultivar-management'

interface BatchManagementProps {
  siteId: string
  organizationId: string
  userId: string
  userRole: string
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

const cannabisStageOptions: BatchStage[] = [
  'planning',
  'germination',
  'clone',
  'vegetative',
  'flowering',
  'harvest',
  'drying',
  'curing',
  'packaging',
  'completed',
]

const produceStageOptions: BatchStage[] = [
  'planning',
  'germination',
  'transplant',
  'growing',
  'harvest_ready',
  'harvesting',
  'washing',
  'grading',
  'packing',
  'storage',
  'completed',
]

export function BatchManagement({
  siteId,
  organizationId,
  userId,
  userRole,
  jurisdictionId,
  plantType,
}: BatchManagementProps) {
  const { can } = usePermissions(userRole as RoleKey, [])
  const jurisdictionState = useJurisdiction(jurisdictionId)

  const [batches, setBatches] = useState<BatchListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCultivarDialog, setShowCultivarDialog] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<BatchStatus | 'all'>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const stageOptions = useMemo(() => {
    return plantType === 'cannabis' ? cannabisStageOptions : produceStageOptions
  }, [plantType])

  const buildFilters = useCallback((): BatchFilters => {
    const filters: BatchFilters = {
      domain_type: plantType,
    }
    if (selectedStatus !== 'all') {
      filters.status = selectedStatus
    } else {
      // By default, exclude destroyed batches unless explicitly filtered
      filters.exclude_destroyed = true
    }
    if (selectedStage !== 'all') {
      filters.stage = selectedStage as BatchStage
    }
    if (searchTerm) {
      filters.search = searchTerm.trim()
    }
    return filters
  }, [plantType, selectedStage, selectedStatus, searchTerm])

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await getBatches(organizationId, siteId, buildFilters())
      if (error) {
        console.error('Error fetching batches:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorType: typeof error,
          organizationId,
          siteId
        })
        // Check if this is an authentication/RLS error (empty error object or permission denied)
        const errorStr = JSON.stringify(error)
        if (errorStr === '{}' || errorStr.includes('permission') || errorStr.includes('RLS')) {
          throw new Error('Authentication required. Please log in to view batches.')
        }
        throw error
      }
      setBatches(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching batches:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(`Failed to load batches: ${errorMessage}`)
      setBatches([])
    } finally {
      setLoading(false)
    }
  }, [organizationId, siteId, buildFilters])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const activeBatches = useMemo(() => batches.filter((batch) => batch.status === 'active'), [batches])
  const quarantined = useMemo(
    () => batches.filter((batch) => batch.status === 'quarantined'),
    [batches]
  )
  
  // Filter out destroyed batches for metrics
  const nonDestroyedBatches = useMemo(
    () => batches.filter((batch) => batch.status !== 'destroyed'),
    [batches]
  )
  
  const totalPlants = useMemo(
    () => nonDestroyedBatches.reduce((sum, batch) => {
      // Sum up plant counts from active pod assignments
      const assignmentTotal = (batch.pod_assignments || [])
        .filter((assignment) => !assignment.removed_at)
        .reduce((assignmentSum, assignment) => assignmentSum + (assignment.plant_count || 0), 0)
      // If there are assignments, use their total; otherwise fall back to batch.plant_count
      const batchTotal = assignmentTotal > 0 ? assignmentTotal : (batch.plant_count || 0)
      return sum + batchTotal
    }, 0),
    [nonDestroyedBatches]
  )
  const recipesWithCoverage = useMemo(
    () => nonDestroyedBatches.filter((batch) => batch.active_recipe).length,
    [nonDestroyedBatches]
  )
  const podsInUse = useMemo(() => {
    const podIds = new Set<string>()
    nonDestroyedBatches.forEach((batch) => {
      batch.pod_assignments
        ?.filter((assignment) => !assignment.removed_at)
        .forEach((assignment) => {
          if (assignment.pod_id) podIds.add(assignment.pod_id)
        })
    })
    return podIds.size
  }, [nonDestroyedBatches])

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchBatches()
  }

  const complianceMessage = useMemo(() => {
    if (!jurisdictionState.jurisdiction) return null
    const { jurisdiction } = jurisdictionState
    const requirements: string[] = []
    if (jurisdictionState.requiresMetrc) requirements.push('METRC IDs required')
    if (jurisdictionState.requiresPlantTags) requirements.push('Plant tags mandatory')
    if (requirements.length === 0) return null
    return `${jurisdiction.name}: ${requirements.join(' · ')}`
  }, [jurisdictionState])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
          <p className="text-muted-foreground">
            Track cultivation progress, pod assignments, and recipe coverage across the facility.
          </p>
        </div>
        <div className="flex gap-2">
          {can('batch:create') && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          )}
        </div>
      </div>

      {complianceMessage && (
        <Alert>
          <AlertTitle>Jurisdiction Controls</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {complianceMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load batches</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonDestroyedBatches.length}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {plantType} · {podsInUse} pods active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches.length}</div>
            <p className="text-xs text-muted-foreground">{recipesWithCoverage} with recipes applied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plants / Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all tracked batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Quarantined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{quarantined.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting QA resolution</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by batch number or cultivar"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFilters((prev) => !prev)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(selectedStatus !== 'all' || selectedStage !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedStatus !== 'all', selectedStage !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as BatchStatus | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="quarantined">Quarantined</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="destroyed">Destroyed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {stageOptions.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Coverage</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {recipesWithCoverage}/{nonDestroyedBatches.length} batches running a recipe
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <BatchTable
        batches={batches}
        loading={loading}
        onRefresh={fetchBatches}
        userId={userId}
        userRole={userRole}
        jurisdictionId={jurisdictionId}
        plantType={plantType}
      />

      {showCreateModal && (
        <BatchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          siteId={siteId}
          organizationId={organizationId}
          userId={userId}
          jurisdictionId={jurisdictionId}
          plantType={plantType}
        />
      )}

      {showCultivarDialog && (
        <CultivarManagement
          organizationId={organizationId}
          userId={userId}
          isOpen={showCultivarDialog}
          onClose={() => setShowCultivarDialog(false)}
          plantType={plantType}
        />
      )}
    </div>
  )
}

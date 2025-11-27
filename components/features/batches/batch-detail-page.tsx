'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Sprout,
  AlertTriangle,
  ArrowLeft,
  Edit3,
  ArrowRightLeft,
  Package,
  MoreVertical,
  FileText,
  Tag,
  ExternalLink,
  Calendar,
  Hash,
  Shield,
  Thermometer,
  Droplet,
  Wind,
  CheckCircle2,
  AlertCircle,
  Activity,
  Info,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BatchModal } from './batch-modal'
import { StageTransitionDialog } from './stage-transition-dialog'
import { HarvestWorkflow } from './harvest-workflow'
import { QualityMetricsPanel } from './quality-metrics-panel'
import { LogInventoryUsageDialog } from './log-inventory-usage-dialog'
import { ApplyRecipeDialog } from './apply-recipe-dialog'
import { AssignPodDialog } from './assign-pod-dialog'
import { BatchTagsList } from './batch-tags-list'
import { AssignTagsDialog } from './assign-tags-dialog'
import { PushBatchToMetrcButton } from '@/components/features/compliance/push-batch-to-metrc-button'
import { BatchMetrcSyncStatus } from '@/components/features/compliance/batch-metrc-sync-status'
import { DestroyPlantBatchDialog } from '@/components/features/waste/destroy-plant-batch-dialog'
import { getBatchDetail, quarantineBatch, releaseFromQuarantine } from '@/lib/supabase/queries/batches-client'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchStageHistory, BatchEvent } from '@/types/batch'
import type { ActiveRecipeDetails } from '@/types/recipe'
import type { TelemetryReading } from '@/types/telemetry'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import { getJurisdictionConfig } from '@/lib/jurisdiction/config'

interface BatchDetailPageProps {
  batch: BatchDetail
  userId: string
  userRole: RoleKey
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchDetailPage({
  batch: initialBatch,
  userId,
  userRole,
  jurisdictionId,
  plantType,
}: BatchDetailPageProps) {
  const router = useRouter()
  const { can } = usePermissions(userRole as RoleKey, [])
  const [detail, setDetail] = useState<BatchDetail>(initialBatch)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [showHarvestDialog, setShowHarvestDialog] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showApplyRecipe, setShowApplyRecipe] = useState(false)
  const [showAssignPod, setShowAssignPod] = useState(false)
  const [showTagsDialog, setShowTagsDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [deactivating, setDeactivating] = useState(false)
  const [showDestroyDialog, setShowDestroyDialog] = useState(false)

  const loadDetail = async () => {
    setLoading(true)
    const { data, error } = await getBatchDetail(detail.id)
    if (error) {
      toast.error('Unable to load batch detail')
    } else if (data) {
      setDetail(data)
    }
    setLoading(false)
  }

  const activeAssignments = useMemo(
    () => detail.pod_assignments?.filter((assignment) => !assignment.removed_at) || [],
    [detail]
  )

  const totalPlantCount = useMemo(() => {
    const assignmentTotal = activeAssignments.reduce((sum, assignment) => sum + (assignment.plant_count || 0), 0)
    return assignmentTotal > 0 ? assignmentTotal : detail.plant_count || 0
  }, [activeAssignments, detail.plant_count])

  const handleQuarantineToggle = async () => {
    try {
      if (detail.status === 'quarantined') {
        const { error } = await releaseFromQuarantine(detail.id, userId)
        if (error) throw error
        toast.success('Batch released from quarantine')
      } else {
        const reason = window.prompt('Reason for quarantine?')
        if (!reason) return
        const { error } = await quarantineBatch(detail.id, reason, userId)
        if (error) throw error
        toast.success('Batch quarantined')
      }
      loadDetail()
    } catch (error) {
      console.error(error)
      toast.error('Unable to update quarantine state')
    }
  }

  const handleDeactivateRecipe = async () => {
    if (!detail.active_recipe_detail?.activation?.id) return

    const confirmed = window.confirm('Deactivate this recipe from the batch?')
    if (!confirmed) return

    setDeactivating(true)
    try {
      const { deactivateRecipe } = await import('@/app/actions/recipes')
      const { error } = await deactivateRecipe(
        detail.active_recipe_detail.activation.id,
        userId,
        `Deactivated from batch ${detail.batch_number}`
      )

      if (error) {
        console.error('Error deactivating recipe:', error)
        toast.error('Failed to deactivate recipe')
        return
      }

      toast.success('Recipe deactivated successfully')
      await loadDetail()
    } catch (error) {
      console.error('Error deactivating recipe:', error)
      toast.error('Failed to deactivate recipe')
    } finally {
      setDeactivating(false)
    }
  }

  const jurisdictionName = useMemo(() => {
    if (!jurisdictionId) return 'Not configured'
    const config = getJurisdictionConfig(jurisdictionId)
    return config?.name ?? 'Not configured'
  }, [jurisdictionId])

  const tagCount = detail.metrc_plant_labels?.length ?? 0

  const pushToMetrcAction = can('compliance:sync') ? (
    <PushBatchToMetrcButton
      batchId={detail.id}
      batchNumber={detail.batch_number}
      onPushComplete={() => loadDetail()}
      variant="outline"
      size="sm"
      className="text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    />
  ) : null

  const assignTagsAction = detail.domain_type === 'cannabis' ? (
    <AssignTagsDialog
      batchId={detail.id}
      batchNumber={detail.batch_number}
      plantCount={totalPlantCount}
      currentTags={detail.metrc_plant_labels || []}
      onAssigned={() => loadDetail()}
      trigger={
        <Button size="sm" className="gap-2 bg-amber-600 text-white hover:bg-amber-700">
          <ExternalLink className="h-4 w-4" />
          Assign Metrc Tags
        </Button>
      }
    />
  ) : null

  const destroyPlantMenuItem =
    detail.domain_type === 'cannabis' && totalPlantCount > 0 ? (
      <DropdownMenuItem
        className="gap-2 text-red-600 focus:text-red-600"
        onSelect={() => {
          setShowDestroyDialog(true)
        }}
      >
        <Trash2 className="h-4 w-4" />
        Destroy plants
      </DropdownMenuItem>
    ) : null

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full space-y-6">
        <Button
          variant="ghost"
          className="gap-2 px-4 text-emerald-600 transition duration-300 hover:text-emerald-700"
          onClick={() => router.push('/dashboard/batches/active')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Batches
        </Button>
        <BatchDetailsHeader
          batch={detail}
          cultivarName={detail.cultivar?.name || detail.cultivar_id || 'Unknown cultivar'}
          isQuarantined={detail.status === 'quarantined'}
          canApplyRecipe={can('control:recipe_apply')}
          onEdit={() => setEditing(true)}
          onStageTransition={() => setShowStageDialog(true)}
          onRecordHarvest={() => setShowHarvestDialog(true)}
          onApplyRecipe={() => setShowApplyRecipe(true)}
          onAssignPod={() => setShowAssignPod(true)}
          onLogInventory={() => {
            setActiveTab('inventory')
            setShowInventoryDialog(true)
          }}
          onToggleQuarantine={handleQuarantineToggle}
          pushToMetrcButton={pushToMetrcAction}
          destroyMenuItem={destroyPlantMenuItem}
        />

        {detail.metrc_batch_id && (
          <BatchMetrcSyncStatus
            status="synced"
            metrcBatchId={detail.metrc_batch_id}
            domainType={detail.domain_type}
          />
        )}

        {detail.domain_type === 'cannabis' && (
          <MetrcTagsSummaryCard
            plantCount={totalPlantCount}
            tagCount={tagCount}
            onManage={() => {
              setActiveTab('overview')
              setShowTagsDialog(true)
            }}
            assignButton={assignTagsAction}
          />
        )}

        {detail.domain_type === 'cannabis' &&
          detail.metrc_batch_id &&
          (!detail.metrc_plant_labels || detail.metrc_plant_labels.length === 0) && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Plant tags required</AlertTitle>
              <AlertDescription>
                This batch is synced to Metrc but has no plant tags assigned. Assign tags to enable
                plant-level tracking and downstream compliance actions.
              </AlertDescription>
            </Alert>
          )}

        {detail.domain_type === 'cannabis' &&
          detail.metrc_batch_id &&
          detail.metrc_plant_labels &&
          detail.metrc_plant_labels.length > 0 &&
          detail.metrc_plant_labels.length < totalPlantCount && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4" />
              <AlertTitle>Incomplete tag assignment</AlertTitle>
              <AlertDescription>
                {detail.metrc_plant_labels.length} of {totalPlantCount} plants tagged (
                {totalPlantCount > 0
                  ? Math.round((detail.metrc_plant_labels.length / totalPlantCount) * 100)
                  : 0}
                % complete). Assign the remaining tags for full Metrc compliance.
              </AlertDescription>
            </Alert>
          )}

        {detail.status === 'quarantined' && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Quarantined</AlertTitle>
            <AlertDescription>{detail.quarantine_reason || 'Pending reason'}</AlertDescription>
          </Alert>
        )}

        {loading && <Skeleton className="h-96 w-full rounded-xl" />}

        {!loading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-2 overflow-x-auto">
              <TabsTrigger value="overview" className="flex-shrink-0">
                Overview
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex-shrink-0">
                Pods & Telemetry
              </TabsTrigger>
              <TabsTrigger value="quality" className="flex-shrink-0">
                Quality
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-shrink-0">
                History
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex-shrink-0">
                Inventory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <StatusOverviewCard
                  stage={detail.stage}
                  plantCount={totalPlantCount}
                  activeRecipeName={detail.active_recipe?.name ?? null}
                />
                <MetadataOverviewCard
                  jurisdictionName={jurisdictionName}
                  batchId={detail.id}
                  siteId={detail.site_id}
                  startDate={detail.start_date}
                  expectedHarvestDate={detail.expected_harvest_date ?? null}
                  notes={detail.notes}
                />
              </div>

              {detail.domain_type === 'cannabis' &&
                detail.metrc_plant_labels &&
                detail.metrc_plant_labels.length > 0 && (
                  <BatchTagsList
                    batchId={detail.id}
                    batchNumber={detail.batch_number}
                    tags={detail.metrc_plant_labels}
                    plantCount={totalPlantCount}
                    onManageTags={() => setShowTagsDialog(true)}
                  />
                )}

              <RecipeOverviewCard
                recipe={detail.active_recipe_detail}
                telemetry={(detail.telemetry_snapshots || [])[0] || null}
                onDeactivate={can('control:recipe_apply') ? handleDeactivateRecipe : undefined}
                isDeactivating={deactivating}
              />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6 space-y-6">
              <Card className="rounded-xl border bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Active pods</CardTitle>
                    <CardDescription>{activeAssignments.length} assignment(s)</CardDescription>
                  </div>
                  {can('batch:assign_pod') && (
                    <Button size="sm" onClick={() => setShowAssignPod(true)}>
                      Assign Pod
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {activeAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-lg border bg-slate-50 p-4 text-sm">
                      <p className="font-medium">{assignment.pod?.name || 'Pod'}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.pod?.room?.name || 'Unassigned room'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.plant_count || 0} plants
                      </p>
                    </div>
                  ))}
                  {activeAssignments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No active assignments.</p>
                  )}
                </CardContent>
              </Card>

              {detail.telemetry_snapshots && detail.telemetry_snapshots.length > 0 && (
                <Card className="rounded-xl border bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent telemetry</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {detail.telemetry_snapshots.map((snapshot) => (
                      <div key={snapshot.id} className="rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{snapshot.pod_id}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <TelemetryStat label="Temp" value={snapshot.temperature_c != null ? `${snapshot.temperature_c}°C` : '—'} />
                          <TelemetryStat label="Humidity" value={snapshot.humidity_pct != null ? `${snapshot.humidity_pct}%` : '—'} />
                          <TelemetryStat label="CO₂" value={snapshot.co2_ppm != null ? `${snapshot.co2_ppm} ppm` : '—'} />
                          <TelemetryStat label="Lights" value={snapshot.lights_on ? 'On' : 'Off'} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="quality" className="mt-6 space-y-6">
              <Card className="rounded-xl border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Quality metrics</CardTitle>
                  <CardDescription>Track lab and on-site quality measurements.</CardDescription>
                </CardHeader>
                <CardContent>
                  <QualityMetricsPanel
                    batchId={detail.id}
                    metrics={detail.quality_metrics}
                    onMetricAdded={() => loadDetail()}
                    userId={userId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
              <Card className="rounded-xl border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Stage history</CardTitle>
                  <CardDescription>Chronological view of lifecycle transitions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(detail.stage_history || [])
                    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
                    .map((entry) => (
                      <HistoryRow key={entry.id} history={entry} />
                    ))}
                  {(!detail.stage_history || detail.stage_history.length === 0) && (
                    <p className="text-sm text-muted-foreground">No stage transitions recorded yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-xl border bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>Operational events tied to this batch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(detail.events || []).map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                  {(!detail.events || detail.events.length === 0) && (
                    <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="mt-6 space-y-6">
              <Card className="rounded-xl border bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Inventory usage</CardTitle>
                    <CardDescription>Movements attributed to this batch.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowInventoryDialog(true)}>
                    Log usage
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {detail.inventory_usage ? (
                    <>
                      <InventorySummary usage={detail.inventory_usage} />
                      <InventoryUsageTable usage={detail.inventory_usage} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No inventory usage recorded yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <LogInventoryUsageDialog
          isOpen={showInventoryDialog}
          onOpenChange={setShowInventoryDialog}
          batchId={detail.id}
          batchNumber={detail.batch_number}
          organizationId={detail.organization_id}
          siteId={detail.site_id}
          onLogged={() => loadDetail()}
        />

        <ApplyRecipeDialog
          open={showApplyRecipe}
          onOpenChange={setShowApplyRecipe}
          organizationId={detail.organization_id}
          batchId={detail.id}
          batchNumber={detail.batch_number}
          userId={userId}
          onApplied={() => loadDetail()}
        />

        <AssignPodDialog
          open={showAssignPod}
          onOpenChange={setShowAssignPod}
          batchId={detail.id}
          batchNumber={detail.batch_number}
          siteId={detail.site_id}
          currentPlantCount={totalPlantCount}
          userId={userId}
          onAssigned={() => loadDetail()}
        />

        <Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Metrc plant tags</DialogTitle>
            </DialogHeader>
            <BatchTagsList
              batchId={detail.id}
              batchNumber={detail.batch_number}
              tags={detail.metrc_plant_labels || []}
              plantCount={totalPlantCount}
            />
          </DialogContent>
        </Dialog>

        {editing && (
          <BatchModal
            isOpen={editing}
            onClose={() => setEditing(false)}
            onSuccess={() => {
              setEditing(false)
              loadDetail()
            }}
            siteId={detail.site_id}
            organizationId={detail.organization_id}
            userId={userId}
            batch={detail}
            jurisdictionId={jurisdictionId}
            plantType={plantType}
          />
        )}

        {showStageDialog && (
          <StageTransitionDialog
            batch={detail}
            isOpen={showStageDialog}
            onClose={() => setShowStageDialog(false)}
            onTransition={() => loadDetail()}
            userId={userId}
            jurisdictionId={jurisdictionId}
          />
        )}

        {showHarvestDialog && (
          <HarvestWorkflow
            batch={detail}
            isOpen={showHarvestDialog}
            onClose={() => setShowHarvestDialog(false)}
            onComplete={() => loadDetail()}
            userId={userId}
          />
        )}

        <DestroyPlantBatchDialog
          batchId={detail.id}
          batchNumber={detail.batch_number}
          currentPlantCount={totalPlantCount}
          plantTags={detail.metrc_plant_labels || []}
          onDestroyed={() => {
            setShowDestroyDialog(false)
            loadDetail()
          }}
          open={showDestroyDialog}
          onOpenChange={setShowDestroyDialog}
          trigger={null}
        />
      </div>
    </div>
  )
}

interface BatchDetailsHeaderProps {
  batch: BatchDetail
  cultivarName: string
  isQuarantined: boolean
  canApplyRecipe: boolean
  onEdit: () => void
  onStageTransition: () => void
  onRecordHarvest: () => void
  onApplyRecipe: () => void
  onAssignPod: () => void
  onLogInventory: () => void
  onToggleQuarantine: () => void
  pushToMetrcButton?: React.ReactNode
  destroyMenuItem?: React.ReactNode
}

function BatchDetailsHeader({
  batch,
  cultivarName,
  isQuarantined,
  canApplyRecipe,
  onEdit,
  onStageTransition,
  onRecordHarvest,
  onApplyRecipe,
  onAssignPod,
  onLogInventory,
  onToggleQuarantine,
  pushToMetrcButton,
  destroyMenuItem,
}: BatchDetailsHeaderProps) {
  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">Batch {batch.batch_number}</h1>
                {isQuarantined && (
                  <Badge variant="destructive" className="gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    Quarantined
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{cultivarName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={onEdit}
            >
              <Edit3 className="h-4 w-4" />
              Edit batch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={onStageTransition}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transition stage
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={onRecordHarvest}
            >
              <Package className="h-4 w-4" />
              Record harvest
            </Button>
            {pushToMetrcButton}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canApplyRecipe && (
                  <DropdownMenuItem className="gap-2" onSelect={onApplyRecipe}>
                    <FileText className="h-4 w-4" />
                    Apply recipe
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2" onSelect={onAssignPod}>
                  <Sprout className="h-4 w-4" />
                  Assign pod
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2" onSelect={onLogInventory}>
                  <FileText className="h-4 w-4" />
                  Log inventory usage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-amber-600 focus:text-amber-600"
                  onSelect={onToggleQuarantine}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {isQuarantined ? 'Release from quarantine' : 'Quarantine batch'}
                </DropdownMenuItem>
                {destroyMenuItem && (
                  <>
                    <DropdownMenuSeparator />
                    {destroyMenuItem}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetrcTagsSummaryCardProps {
  plantCount: number
  tagCount: number
  onManage: () => void
  assignButton: React.ReactNode
}

function MetrcTagsSummaryCard({ plantCount, tagCount, onManage, assignButton }: MetrcTagsSummaryCardProps) {
  const completion = plantCount > 0 ? Math.round((tagCount / plantCount) * 100) : 0
  const isComplete = plantCount > 0 && tagCount >= plantCount

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${
      isComplete 
        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50' 
        : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isComplete ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Tag className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900">Metrc Plant Tags</h3>
              <Badge
                variant="outline"
                className={isComplete 
                  ? 'border-emerald-200 bg-white text-emerald-700 hover:bg-white hover:text-emerald-800'
                  : 'border-amber-200 bg-white text-amber-700 hover:bg-white hover:text-amber-800'
                }
              >
                {plantCount > 0
                  ? isComplete 
                    ? `All ${plantCount} plants tagged ✓`
                    : `${tagCount} of ${plantCount} plants tagged (${completion}%)`
                  : 'No plants assigned'}
              </Badge>
            </div>
            <Progress 
              value={plantCount > 0 ? (tagCount / plantCount) * 100 : 0} 
              className={`h-2 ${isComplete ? 'bg-emerald-100' : 'bg-amber-100'}`} 
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className={`gap-2 border bg-white ${
              isComplete 
                ? 'border-emerald-300 text-emerald-600 hover:border-emerald-400 hover:text-emerald-700'
                : 'border-amber-300 text-amber-500 hover:border-amber-400 hover:text-amber-600'
            }`}
            onClick={onManage}
          >
            Manage Tags
          </Button>
          {!isComplete && assignButton}
        </div>
      </div>
    </div>
  )
}

interface StatusOverviewCardProps {
  stage: string | null
  plantCount: number
  activeRecipeName: string | null
}

function StatusOverviewCard({ stage, plantCount, activeRecipeName }: StatusOverviewCardProps) {
  return (
    <Card className="rounded-xl border bg-white shadow-sm lg:col-span-2">
      <CardHeader className="pb-4">
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current stage</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-green-200 bg-gradient-to-br from-green-100 to-emerald-100">
                <Sprout className="h-6 w-6 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{stage || 'Unknown'}</Badge>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Plant count</p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-200 bg-gradient-to-br from-blue-100 to-indigo-100">
                <Sprout className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-xl font-semibold text-slate-900">{plantCount.toLocaleString()} plants</p>
            </div>
          </div>
        </div>

        {activeRecipeName && (
          <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Active recipe
              </span>
              <p className="text-sm font-medium text-slate-900">{activeRecipeName}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MetadataOverviewCardProps {
  jurisdictionName: string
  batchId: string
  siteId: string
  startDate: string | null
  expectedHarvestDate: string | null
  notes?: string | null
}

function MetadataOverviewCard({
  jurisdictionName,
  batchId,
  siteId,
  startDate,
  expectedHarvestDate,
  notes,
}: MetadataOverviewCardProps) {
  const formatDate = (value: string | null) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return format(date, 'PPP')
  }

  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-600" />
          <CardTitle>Metadata</CardTitle>
        </div>
        <CardDescription>Jurisdiction-aware context</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">Jurisdiction</p>
          <Badge variant="secondary" className="mt-2 gap-2">
            <Shield className="h-3 w-3" />
            {jurisdictionName}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Batch ID</p>
          <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3">
            <Hash className="h-4 w-4 text-slate-400" />
            <code className="break-all text-sm text-slate-700">{batchId}</code>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Site</p>
          <p className="font-medium text-slate-900">{siteId || 'Not assigned'}</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Start date</span>
          </div>
          <p className="font-medium text-slate-900">{formatDate(startDate)}</p>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Expected harvest</span>
          </div>
          <p className="font-medium text-slate-900">{formatDate(expectedHarvestDate)}</p>
        </div>
        {notes && (
          <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">{notes}</div>
        )}
      </CardContent>
    </Card>
  )
}

interface RecipeOverviewCardProps {
  recipe?: ActiveRecipeDetails | null
  telemetry: TelemetryReading | null
  onDeactivate?: () => void
  isDeactivating: boolean
}

function RecipeOverviewCard({ recipe, telemetry, onDeactivate, isDeactivating }: RecipeOverviewCardProps) {
  if (!recipe) {
    return (
      <Card className="rounded-xl border bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recipe</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No recipe applied.</CardContent>
      </Card>
    )
  }

  const stage = recipe.activation.current_stage
  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      actual: telemetry?.temperature_c ?? null,
      Icon: Thermometer,
      color: 'orange' as const,
    },
    {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      actual: telemetry?.humidity_pct ?? null,
      Icon: Droplet,
      color: 'blue' as const,
    },
    {
      key: 'co2',
      label: 'CO₂',
      unit: 'ppm',
      actual: telemetry?.co2_ppm ?? null,
      Icon: Wind,
      color: 'teal' as const,
    },
  ]

  const getSetpoint = (parameterType: string) =>
    recipe.current_setpoints.find((sp) => sp.parameter_type === parameterType)

  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Active recipe
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">
                {recipe.activation.recipe?.name || 'Active recipe'}
              </h2>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {stage?.name || 'No stage'}
              </Badge>
              <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                Day {recipe.activation.current_stage_day ?? 1}
              </Badge>
            </div>
          </div>
          {onDeactivate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-200 text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-700"
              onClick={onDeactivate}
              disabled={isDeactivating}
            >
              <ExternalLink className="h-4 w-4" />
              {isDeactivating ? 'Deactivating...' : 'Deactivate recipe'}
            </Button>
          )}
        </div>
        <CardDescription>
          Latest telemetry compared against the configured setpoints for this stage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const setpoint = getSetpoint(metric.key)
            const min = setpoint?.min_value ?? setpoint?.value ?? null
            const max = setpoint?.max_value ?? setpoint?.value ?? null
            const actual = metric.actual

            let status: 'in-range' | 'out-of-range' | 'no-target' = 'no-target'
            if (setpoint && actual != null && min != null && max != null) {
              status = actual >= min && actual <= max ? 'in-range' : 'out-of-range'
            } else if (!setpoint) {
              status = 'no-target'
            } else if (actual != null) {
              status = 'in-range'
            }

            let targetLabel = 'No target defined'
            if (setpoint) {
              const minLabel = min != null ? min.toFixed(1) : null
              const maxLabel = max != null ? max.toFixed(1) : null
              if (minLabel && maxLabel) {
                targetLabel = `${minLabel} - ${maxLabel}${metric.unit}`
              } else if (minLabel) {
                targetLabel = `${minLabel}${metric.unit}`
              }
            }

            const valueLabel = actual != null ? `${actual.toFixed(1)}${metric.unit}` : '—'

            return (
              <RecipeMetricCard
                key={metric.key}
                label={metric.label}
                value={valueLabel}
                target={targetLabel}
                status={status}
                Icon={metric.Icon}
                color={metric.color}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface RecipeMetricCardProps {
  label: string
  value: string
  target: string
  status: 'in-range' | 'out-of-range' | 'no-target'
  Icon: LucideIcon
  color: 'orange' | 'blue' | 'teal'
}

function RecipeMetricCard({ label, value, target, status, Icon, color }: RecipeMetricCardProps) {
  const iconClassMap = {
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-sky-100 text-sky-700',
    teal: 'bg-teal-100 text-teal-700',
  } as const

  const statusMeta: Record<RecipeMetricCardProps['status'], { label: string; badgeClass: string; Icon: LucideIcon }> = {
    'in-range': {
      label: 'In range',
      badgeClass: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 cursor-default',
      Icon: CheckCircle2,
    },
    'out-of-range': {
      label: 'Out of range',
      badgeClass: 'bg-rose-100 text-rose-700 hover:bg-rose-100 cursor-default',
      Icon: AlertCircle,
    },
    'no-target': {
      label: 'No target',
      badgeClass: 'bg-slate-200 text-slate-700 hover:bg-slate-200 cursor-default',
      Icon: AlertCircle,
    },
  }

  const iconClasses = iconClassMap[color]
  const meta = statusMeta[status]

  return (
    <div className="flex h-full flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClasses}`}>
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-slate-900">{label}</p>
        </div>
        <Badge className={`border-0 ${meta.badgeClass} gap-1.5 px-2 py-1`}>
          <meta.Icon className="h-3 w-3" />
          {meta.label}
        </Badge>
      </div>
      <p className="mt-6 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{target}</p>
    </div>
  )
}

function TelemetryStat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded bg-muted/40 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function HistoryRow({ history }: { history: BatchStageHistory }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-primary/10 p-2">
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{history.stage}</p>
        <p className="text-xs text-muted-foreground">
          Started {format(new Date(history.started_at), 'MMM d, yyyy h:mm a')}
          {history.ended_at && ` · Completed ${format(new Date(history.ended_at), 'MMM d, yyyy h:mm a')}`}
        </p>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: BatchEvent }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="font-medium">{event.event_type}</p>
      <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}</p>
      {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
    </div>
  )
}

function InventorySummary({ usage }: { usage: NonNullable<BatchDetail['inventory_usage']> }) {
  const consumed = usage.summary.consumed_by_type
  const seedsAndClones = (consumed.seeds || 0) + (consumed.clones || 0)
  const nutrients = consumed.nutrient || 0
  const chemicals = consumed.chemical || 0

  const summaryCards = [
    { label: 'Seeds / Clones', value: seedsAndClones },
    { label: 'Nutrients', value: nutrients },
    { label: 'Chemicals', value: chemicals },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((card) => (
        <Card key={card.label} className="rounded-xl border bg-slate-50">
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl">{card.value.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function InventoryUsageTable({ usage }: { usage: NonNullable<BatchDetail['inventory_usage']> }) {
  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Inventory movements</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead className="text-right">Total Qty</TableHead>
              <TableHead>Last updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usage.entries.map((entry) => (
              <TableRow key={`${entry.item_id}-${entry.movement_type}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{entry.item_name}</span>
                    {entry.unit_of_measure && (
                      <span className="text-xs text-muted-foreground">{entry.unit_of_measure}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{entry.item_type}</TableCell>
                <TableCell className="capitalize">{entry.movement_type}</TableCell>
                <TableCell className="text-right">
                  {entry.total_quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(entry.last_movement_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

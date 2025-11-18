'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sprout, MapPin, AlertTriangle, Activity, Beaker, ArrowLeft } from 'lucide-react'
import { BatchModal } from './batch-modal'
import { StageTransitionDialog } from './stage-transition-dialog'
import { HarvestWorkflow } from './harvest-workflow'
import { QualityMetricsPanel } from './quality-metrics-panel'
import type { BatchDetail } from '@/lib/supabase/queries/batches-client'
import { getBatchDetail, quarantineBatch, releaseFromQuarantine } from '@/lib/supabase/queries/batches-client'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchStageHistory, BatchEvent } from '@/types/batch'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LogInventoryUsageDialog } from './log-inventory-usage-dialog'
import { ApplyRecipeDialog } from './apply-recipe-dialog'
import { AssignPodDialog } from './assign-pod-dialog'
import type { ActiveRecipeDetails } from '@/types/recipe'
import type { TelemetryReading } from '@/types/telemetry'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import { PushBatchToMetrcButton } from '@/components/features/compliance/push-batch-to-metrc-button'
import { BatchMetrcSyncStatus } from '@/components/features/compliance/batch-metrc-sync-status'

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
  const [deactivating, setDeactivating] = useState(false)

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
    // If there are assignments, use their total; otherwise fall back to batch.plant_count
    return assignmentTotal > 0 ? assignmentTotal : (detail.plant_count || 0)
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
    
    const confirmed = window.confirm('Are you sure you want to deactivate this recipe from the batch?')
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

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/batches/active')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Batches
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sprout className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Batch {detail.batch_number}</h1>
          </div>
          <p className="text-muted-foreground">{detail.cultivar?.name || detail.cultivar_id || 'Unknown cultivar'}</p>
        </div>
        <Button
          variant={detail.status === 'quarantined' ? 'default' : 'destructive'}
          size="sm"
          onClick={handleQuarantineToggle}
          className={detail.status === 'quarantined' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {detail.status === 'quarantined' ? 'Release' : 'Quarantine'}
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit batch
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowStageDialog(true)}>
          Transition stage
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowHarvestDialog(true)}>
          Record harvest
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowApplyRecipe(true)}>
          Apply recipe
        </Button>
        {can('compliance:push') && (
          <PushBatchToMetrcButton
            batchId={detail.id}
            batchNumber={detail.batch_number}
            onPushComplete={() => loadDetail()}
          />
        )}
      </div>

      {/* Metrc Sync Status */}
      {detail.metrc_batch_id && (
        <BatchMetrcSyncStatus
          status="synced"
          metrcBatchId={detail.metrc_batch_id}
          domainType={detail.domain_type}
        />
      )}

      {/* Quarantine Alert */}
      {detail.status === 'quarantined' && (
        <Alert>
          <AlertTitle>Quarantined</AlertTitle>
          <AlertDescription className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {detail.quarantine_reason || 'Pending reason'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && <Skeleton className="h-96 w-full" />}

      {/* Content Tabs */}
      {!loading && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-5 items-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="overview" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Pods & Telemetry
            </TabsTrigger>
            <TabsTrigger value="quality" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Quality
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              History
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current stage</span>
                    <Badge>{detail.stage}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plant count</span>
                    <span className="text-lg font-semibold">{totalPlantCount.toLocaleString()}</span>
                  </div>
                  {detail.active_recipe && (
                    <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <Beaker className="h-4 w-4" />
                      Active recipe: {detail.active_recipe.name}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                  <CardDescription>Jurisdiction-aware context</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{detail.site_id}</span>
                  </div>
                  <p>Start date: {detail.start_date}</p>
                  <p>Expected harvest: {detail.expected_harvest_date || 'n/a'}</p>
                  {detail.notes && <p className="text-muted-foreground">{detail.notes}</p>}
                </CardContent>
              </Card>
            </div>

            {detail.genealogy && detail.genealogy.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Genealogy</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                  {detail.genealogy.map((node) => (
                    <div key={node.id} className="rounded-md border p-2">
                      <p className="font-medium">{node.batch_number}</p>
                      <p className="text-xs text-muted-foreground">{node.relationship}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <RecipeDetailCard
              recipe={detail.active_recipe_detail}
              telemetry={(detail.telemetry_snapshots || [])[0] || null}
              onDeactivate={can('control:recipe_apply') && !deactivating ? handleDeactivateRecipe : undefined}
            />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Active pods ({activeAssignments.length})</CardTitle>
                {can('batch:assign_pod') && (
                  <Button
                    size="sm"
                    onClick={() => setShowAssignPod(true)}
                  >
                    Assign Pod
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {activeAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{assignment.pod?.name || 'Pod'}</p>
                    <p className="text-muted-foreground">{assignment.pod?.room?.name || 'Unassigned room'}</p>
                    <p className="text-xs text-muted-foreground">{assignment.plant_count || 0} plants</p>
                  </div>
                ))}
                {activeAssignments.length === 0 && <p className="text-sm text-muted-foreground">No active assignments.</p>}
              </CardContent>
            </Card>

            {detail.telemetry_snapshots && detail.telemetry_snapshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent telemetry</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {detail.telemetry_snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>{snapshot.pod_id}</span>
                        <span className="text-xs text-muted-foreground">{new Date(snapshot.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                        <TelemetryStat label="Temp" value={`${snapshot.temperature_c ?? '-'}°C`} />
                        <TelemetryStat label="Humidity" value={`${snapshot.humidity_pct ?? '-'}%`} />
                        <TelemetryStat label="CO₂" value={`${snapshot.co2_ppm ?? '-'}ppm`} />
                        <TelemetryStat label="Lights" value={snapshot.lights_on ? 'On' : 'Off'} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quality" className="space-y-4 mt-6">
            <QualityMetricsPanel
              batchId={detail.id}
              metrics={detail.quality_metrics}
              onMetricAdded={() => {
                loadDetail()
              }}
              userId={userId}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Stage history</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(detail.stage_history || []).map((entry) => (
                  <HistoryRow key={entry.id} history={entry} />
                ))}
                {(!detail.stage_history || detail.stage_history.length === 0) && (
                  <p className="text-sm text-muted-foreground">No stage transitions recorded yet.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Events</CardTitle>
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

          <TabsContent value="inventory" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Track inventory movements attributed to this batch.</p>
              </div>
              <Button size="sm" onClick={() => setShowInventoryDialog(true)}>
                Log usage
              </Button>
            </div>

            {detail.inventory_usage ? (
              <>
                <InventorySummary usage={detail.inventory_usage} />
                <InventoryUsageTable usage={detail.inventory_usage} />
              </>
            ) : (
              <Card>
                <CardContent className="py-6 text-sm text-muted-foreground">
                  No inventory usage recorded yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
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
          onTransition={() => {
            loadDetail()
          }}
          userId={userId}
          jurisdictionId={jurisdictionId}
        />
      )}

      {showHarvestDialog && (
        <HarvestWorkflow
          batch={detail}
          isOpen={showHarvestDialog}
          onClose={() => setShowHarvestDialog(false)}
          onComplete={() => {
            loadDetail()
          }}
          userId={userId}
        />
      )}

      <LogInventoryUsageDialog
        isOpen={showInventoryDialog}
        onOpenChange={setShowInventoryDialog}
        batchId={detail.id}
        batchNumber={detail.batch_number}
        organizationId={detail.organization_id}
        siteId={detail.site_id}
        onLogged={() => {
          loadDetail()
        }}
      />
      <ApplyRecipeDialog
        open={showApplyRecipe}
        onOpenChange={setShowApplyRecipe}
        organizationId={detail.organization_id}
        batchId={detail.id}
        batchNumber={detail.batch_number}
        userId={userId}
        onApplied={() => {
          loadDetail()
        }}
      />
      <AssignPodDialog
        open={showAssignPod}
        onOpenChange={setShowAssignPod}
        batchId={detail.id}
        batchNumber={detail.batch_number}
        siteId={detail.site_id}
        currentPlantCount={detail.plant_count || 0}
        userId={userId}
        onAssigned={() => {
          loadDetail()
        }}
      />
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
          Started {history.started_at}
          {history.ended_at && ` · Completed ${history.ended_at}`}
        </p>
      </div>
    </div>
  )
}

function EventRow({ event }: { event: BatchEvent }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="font-medium">{event.event_type}</p>
      <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</p>
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
        <Card key={card.label}>
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
    <Card>
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

function RecipeDetailCard({
  recipe,
  telemetry,
  onDeactivate,
}: {
  recipe?: ActiveRecipeDetails | null
  telemetry: TelemetryReading | null
  onDeactivate?: () => void
}) {
  if (!recipe) {
    return (
      <Card>
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
    },
    {
      key: 'humidity',
      label: 'Humidity',
      unit: '%',
      actual: telemetry?.humidity_pct ?? null,
    },
    {
      key: 'co2',
      label: 'CO₂',
      unit: 'ppm',
      actual: telemetry?.co2_ppm ?? null,
    },
  ]

  const getSetpoint = (parameterType: string) =>
    recipe.current_setpoints.find((sp) => sp.parameter_type === parameterType)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Recipe: {recipe.activation.recipe?.name || 'Active recipe'}</CardTitle>
            <CardDescription>
              {stage?.name || 'No stage'} · Day {recipe.activation.current_stage_day ?? 1}
            </CardDescription>
          </div>
          {onDeactivate && (
            <Button variant="outline" size="sm" onClick={onDeactivate}>
              Deactivate Recipe
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const setpoint = getSetpoint(metric.key)
            const min = setpoint?.min_value ?? setpoint?.value ?? null
            const max = setpoint?.max_value ?? setpoint?.value ?? null
            const actual = metric.actual
            const inRange =
              actual != null && min != null && max != null && actual >= min && actual <= max

            return (
              <div key={metric.key} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold">
                  {actual != null ? `${actual.toFixed(1)} ${metric.unit}` : '—'}
                </p>
                {setpoint ? (
                  <p className="text-xs text-muted-foreground">
                    Target: {min?.toFixed(1)} - {max?.toFixed(1)} {metric.unit}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No target defined</p>
                )}
                {setpoint && actual != null && (
                  <Badge variant={inRange ? 'secondary' : 'destructive'} className="mt-2 text-xs">
                    {inRange ? 'In range' : 'Out of range'}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

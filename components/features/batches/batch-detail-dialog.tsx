'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sprout, MapPin, AlertTriangle, Activity, Beaker } from 'lucide-react'
import { BatchModal } from './batch-modal'
import { StageTransitionDialog } from './stage-transition-dialog'
import { HarvestWorkflow } from './harvest-workflow'
import { QualityMetricsPanel } from './quality-metrics-panel'
import { BatchTasksPanel } from './batch-tasks-panel'
import { LinkTemplateDialog } from './link-template-dialog'
import type { BatchListItem, BatchDetail } from '@/lib/supabase/queries/batches-client'
import { getBatchDetail, quarantineBatch, releaseFromQuarantine } from '@/lib/supabase/queries/batches-client'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'
import type { BatchStageHistory, BatchEvent } from '@/types/batch'
import type { RoleKey } from '@/lib/rbac/types'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LogInventoryUsageDialog } from './log-inventory-usage-dialog'
import { ApplyRecipeDialog } from './apply-recipe-dialog'
import type { ActiveRecipeDetails } from '@/types/recipe'
import type { TelemetryReading } from '@/types/telemetry'

interface BatchDetailDialogProps {
  batch: BatchListItem
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  userId: string
  userRole: RoleKey
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchDetailDialog({
  batch,
  isOpen,
  onClose,
  onRefresh,
  userId,
  userRole,
  jurisdictionId,
  plantType,
}: BatchDetailDialogProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showStageDialog, setShowStageDialog] = useState(false)
  const [showHarvestDialog, setShowHarvestDialog] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showApplyRecipe, setShowApplyRecipe] = useState(false)
  const [showLinkTemplate, setShowLinkTemplate] = useState(false)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getBatchDetail(batch.id)
    if (error) {
      toast.error('Unable to load batch detail')
    } else {
      setDetail(data)
    }
    setLoading(false)
  }, [batch.id])

  useEffect(() => {
    if (isOpen) {
      loadDetail()
    } else {
      setDetail(null)
    }
  }, [isOpen, loadDetail])

  const activeAssignments = useMemo(
    () => detail?.pod_assignments?.filter((assignment) => !assignment.removed_at) || [],
    [detail]
  )

  const handleQuarantineToggle = async () => {
    try {
      if (detail?.status === 'quarantined') {
        const { error } = await releaseFromQuarantine(batch.id, userId)
        if (error) throw error
        toast.success('Batch released from quarantine')
      } else {
        const reason = window.prompt('Reason for quarantine?')
        if (!reason) return
        const { error } = await quarantineBatch(batch.id, reason, userId)
        if (error) throw error
        toast.success('Batch quarantined')
      }
      loadDetail()
      onRefresh()
    } catch (error) {
      console.error(error)
      toast.error('Unable to update quarantine state')
    }
  }

  const renderedDetail = detail || (batch as BatchDetail)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Sprout className="h-5 w-5" />
            Batch {batch.batch_number}
            <Button
              variant={renderedDetail.status === 'quarantined' ? 'default' : 'outline'}
              size="sm"
              onClick={handleQuarantineToggle}
              className={renderedDetail.status === 'quarantined' ? '' : 'text-destructive hover:text-destructive'}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {renderedDetail.status === 'quarantined' ? 'Release' : 'Quarantine'}
            </Button>
          </DialogTitle>
          <DialogDescription>{batch.cultivar?.name || batch.cultivar_id || 'Unknown cultivar'}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 pb-4">
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
        </div>

        {renderedDetail.status === 'quarantined' && (
          <Alert className="mb-4">
            <AlertTitle>Quarantined</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {renderedDetail.quarantine_reason || 'Pending reason'}
            </AlertDescription>
          </Alert>
        )}

        {loading && <Skeleton className="h-56 w-full" />}

        {!loading && (
          <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid h-11 w-full grid-cols-6 items-center rounded-lg bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="overview" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Pods
            </TabsTrigger>
            <TabsTrigger value="quality" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Quality
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              History
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Inventory
            </TabsTrigger>
          </TabsList>

            <TabsContent value="overview" className="space-y-4 min-h-[500px]">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current stage</span>
                      <Badge>{renderedDetail.stage}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plant count</span>
                      <span className="text-lg font-semibold">{renderedDetail.plant_count?.toLocaleString()}</span>
                    </div>
                    {renderedDetail.active_recipe && (
                      <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
                        <Beaker className="h-4 w-4" />
                        Active recipe: {renderedDetail.active_recipe.name}
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
                      <span>{renderedDetail.site_id}</span>
                    </div>
                    <p>Start date: {renderedDetail.start_date}</p>
                    <p>Expected harvest: {renderedDetail.expected_harvest_date || 'n/a'}</p>
                    {renderedDetail.notes && <p className="text-muted-foreground">{renderedDetail.notes}</p>}
                  </CardContent>
                </Card>
              </div>

              {renderedDetail.genealogy && renderedDetail.genealogy.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Genealogy</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                    {renderedDetail.genealogy.map((node) => (
                      <div key={node.id} className="rounded-md border p-2">
                        <p className="font-medium">{node.batch_number}</p>
                        <p className="text-xs text-muted-foreground">{node.relationship}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <RecipeDetailCard
                recipe={renderedDetail.active_recipe_detail}
                telemetry={(renderedDetail.telemetry_snapshots || [])[0] || null}
              />
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4 min-h-[500px]">
              <Card>
                <CardHeader>
                  <CardTitle>Active pods ({activeAssignments.length})</CardTitle>
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

              {renderedDetail.telemetry_snapshots && renderedDetail.telemetry_snapshots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent telemetry</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {renderedDetail.telemetry_snapshots.map((snapshot) => (
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

            <TabsContent value="quality" className="space-y-4 min-h-[500px]">
              <QualityMetricsPanel
                batchId={batch.id}
                metrics={renderedDetail.quality_metrics}
                onMetricAdded={() => {
                  loadDetail()
                }}
                userId={userId}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4 min-h-[500px]">
              <Card>
                <CardHeader>
                  <CardTitle>Stage history</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(renderedDetail.stage_history || []).map((entry) => (
                    <HistoryRow key={entry.id} history={entry} />
                  ))}
                  {(!renderedDetail.stage_history || renderedDetail.stage_history.length === 0) && (
                    <p className="text-sm text-muted-foreground">No stage transitions recorded yet.</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(renderedDetail.events || []).map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                  {(!renderedDetail.events || renderedDetail.events.length === 0) && (
                    <p className="text-sm text-muted-foreground">No lifecycle events recorded.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 min-h-[500px]">
              <BatchTasksPanel 
                batchId={batch.id}
                userRole={userRole}
                onLinkTemplate={() => setShowLinkTemplate(true)}
                onCreateTask={() => router.push(`/dashboard/workflows/tasks/new?batchId=${batch.id}`)}
              />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4 min-h-[500px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Track inventory movements attributed to this batch.</p>
                </div>
                <Button size="sm" onClick={() => setShowInventoryDialog(true)}>
                  Log usage
                </Button>
              </div>

              {renderedDetail.inventory_usage ? (
                <>
                  <InventorySummary usage={renderedDetail.inventory_usage} />
                  <InventoryUsageTable usage={renderedDetail.inventory_usage} />
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

        {editing && (
          <BatchModal
            isOpen={editing}
            onClose={() => setEditing(false)}
            onSuccess={() => {
              setEditing(false)
              loadDetail()
              onRefresh()
            }}
            siteId={batch.site_id}
            organizationId={batch.organization_id}
            userId={userId}
            batch={renderedDetail}
            jurisdictionId={jurisdictionId}
            plantType={plantType}
          />
        )}

        {showStageDialog && (
          <StageTransitionDialog
            batch={renderedDetail}
            isOpen={showStageDialog}
            onClose={() => setShowStageDialog(false)}
            onTransition={() => {
              loadDetail()
              onRefresh()
            }}
            userId={userId}
            jurisdictionId={jurisdictionId}
          />
        )}

        {showHarvestDialog && (
          <HarvestWorkflow
            batch={renderedDetail}
            isOpen={showHarvestDialog}
            onClose={() => setShowHarvestDialog(false)}
            onComplete={() => {
              loadDetail()
              onRefresh()
            }}
            userId={userId}
          />
        )}

        <LogInventoryUsageDialog
          isOpen={showInventoryDialog}
          onOpenChange={setShowInventoryDialog}
          batchId={batch.id}
          batchNumber={batch.batch_number}
          organizationId={batch.organization_id}
          siteId={batch.site_id}
          onLogged={() => {
            loadDetail()
            onRefresh()
          }}
        />
        <ApplyRecipeDialog
          open={showApplyRecipe}
          onOpenChange={setShowApplyRecipe}
          organizationId={batch.organization_id}
          batchId={batch.id}
          batchNumber={batch.batch_number}
          userId={userId}
          onApplied={() => {
            loadDetail()
            onRefresh()
          }}
        />

        <LinkTemplateDialog
          batchId={batch.id}
          currentStage={renderedDetail.stage}
          isOpen={showLinkTemplate}
          onClose={() => setShowLinkTemplate(false)}
          onSuccess={() => {
            setShowLinkTemplate(false)
            loadDetail()
            onRefresh()
          }}
        />
      </DialogContent>
    </Dialog>
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
}: {
  recipe?: ActiveRecipeDetails | null
  telemetry: TelemetryReading | null
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
        <CardTitle>Recipe: {recipe.activation.recipe?.name || 'Active recipe'}</CardTitle>
        <CardDescription>
          {stage?.name || 'No stage'} · Day {recipe.activation.current_stage_day ?? 1}
        </CardDescription>
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

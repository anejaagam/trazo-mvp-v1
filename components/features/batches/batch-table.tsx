'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Eye, Edit, Trash2, Beaker, Leaf, ChefHat } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions } from '@/hooks/use-permissions'
import type { RoleKey } from '@/lib/rbac/types'
import { BatchModal } from './batch-modal'
import { BatchDetailDialog } from './batch-detail-dialog'
import type { BatchListItem } from '@/lib/supabase/queries/batches-client'
import { deleteBatch } from '@/lib/supabase/queries/batches-client'
import type { JurisdictionId, PlantType } from '@/lib/jurisdiction/types'

interface BatchTableProps {
  batches: BatchListItem[]
  loading: boolean
  onRefresh: () => void
  userId: string
  userRole: string
  jurisdictionId?: JurisdictionId | null
  plantType: PlantType
}

export function BatchTable({
  batches,
  loading,
  onRefresh,
  userId,
  userRole,
  jurisdictionId,
  plantType,
}: BatchTableProps) {
  const router = useRouter()
  const { can } = usePermissions(userRole as RoleKey, [])
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
  const [selectedBatch, setSelectedBatch] = useState<BatchListItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [editingBatch, setEditingBatch] = useState<BatchListItem | null>(null)
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null)

  const allSelected = useMemo(() => {
    if (!batches.length) return false
    return batches.every((batch) => selectedRows[batch.id])
  }, [batches, selectedRows])

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedRows({})
      return
    }
    const next: Record<string, boolean> = {}
    batches.forEach((batch) => {
      next[batch.id] = true
    })
    setSelectedRows(next)
  }

  const handleRowSelection = (batchId: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = { ...prev }
      if (checked) {
        next[batchId] = true
      } else {
        delete next[batchId]
      }
      return next
    })
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!can('batch:delete')) return
    if (!window.confirm('Delete this batch? This action cannot be undone.')) return
    try {
      setDeletingBatchId(batchId)
      const { error } = await deleteBatch(batchId)
      if (error) throw error
      onRefresh()
    } catch (error) {
      console.error('Failed to delete batch', error)
      alert('Unable to delete batch. Please try again.')
    } finally {
      setDeletingBatchId(null)
    }
  }

  if (!loading && batches.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No batches found. Use the Create Batch button to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Key Metric</TableHead>
              <TableHead>Pods</TableHead>
              <TableHead>Recipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Loading batches…
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              batches.map((batch) => {
                const activeAssignments = (batch.pod_assignments || []).filter((assignment) => !assignment.removed_at)
                const cultivarLabel = batch.cultivar?.name || batch.cultivar_id || 'Unknown cultivar'
                const keyMetric = getKeyMetric(batch)
                // Calculate total plant count from assignments, or fall back to batch.plant_count
                const assignmentTotal = activeAssignments.reduce((sum, assignment) => sum + (assignment.plant_count || 0), 0)
                const totalPlants = assignmentTotal > 0 ? assignmentTotal : (batch.plant_count || 0)
                return (
                  <TableRow 
                    key={batch.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      router.push(`/dashboard/batches/${batch.id}`)
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={Boolean(selectedRows[batch.id])}
                        onCheckedChange={(checked) => handleRowSelection(batch.id, Boolean(checked))}
                        aria-label={`Select batch ${batch.batch_number}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{batch.batch_number}</span>
                        <span className="text-xs text-muted-foreground">{cultivarLabel}</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className="gap-1">
                            {batch.domain_type === 'cannabis' ? <Leaf className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}
                            {batch.domain_type === 'cannabis' ? 'Cannabis' : 'Produce'}
                          </Badge>
                          {totalPlants > 0 && (
                            <Badge variant="secondary">{totalPlants.toLocaleString()} units</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStageVariant(batch.stage)}>{batch.stage.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{keyMetric.label}</p>
                      <p className="text-xs text-muted-foreground">{keyMetric.value || '—'}</p>
                    </TableCell>
                    <TableCell>
                      {activeAssignments.length === 0 && <span className="text-xs text-muted-foreground">Unassigned</span>}
                      {activeAssignments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {activeAssignments.slice(0, 2).map((assignment) => (
                            <Badge key={assignment.id} variant="outline">
                              {assignment.pod?.name || 'Pod'}
                              {assignment.plant_count ? ` · ${assignment.plant_count}` : ''}
                            </Badge>
                          ))}
                          {activeAssignments.length > 2 && (
                            <Badge variant="secondary">+{activeAssignments.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {batch.active_recipe ? (
                        <Badge variant="secondary" className="gap-1">
                          <Beaker className="h-3 w-3" />
                          {batch.active_recipe.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {batch.status === 'quarantined' ? (
                        <Badge variant="destructive">Quarantined</Badge>
                      ) : (
                        <Badge variant="outline">{batch.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              router.push(`/dashboard/batches/${batch.id}`)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {can('batch:update') && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBatch(batch)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {can('batch:delete') && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteBatch(batch.id)}
                                className="text-destructive"
                                disabled={deletingBatchId === batch.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingBatchId === batch.id ? 'Deleting…' : 'Delete'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      {editingBatch && (
        <BatchModal
          isOpen={Boolean(editingBatch)}
          onClose={() => setEditingBatch(null)}
          onSuccess={() => {
            setEditingBatch(null)
            onRefresh()
          }}
          siteId={editingBatch.site_id}
          organizationId={editingBatch.organization_id}
          userId={userId}
          batch={editingBatch}
          jurisdictionId={jurisdictionId}
          plantType={plantType}
        />
      )}

      {showDetailDialog && selectedBatch && (
        <BatchDetailDialog
          batch={selectedBatch}
          isOpen={showDetailDialog}
          onClose={() => {
            setShowDetailDialog(false)
            setSelectedBatch(null)
          }}
          onRefresh={onRefresh}
          userId={userId}
          userRole={userRole as RoleKey}
          jurisdictionId={jurisdictionId}
          plantType={plantType}
        />
      )}
    </>
  )
}

function getStageVariant(stage: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    vegetative: 'secondary',
    flowering: 'outline',
    harvest: 'default',
    harvest_ready: 'secondary',
    harvesting: 'outline',
    drying: 'secondary',
    curing: 'outline',
    packaging: 'secondary',
    completed: 'default',
    quarantined: 'destructive',
  }
  return map[stage] || 'default'
}

function getKeyMetric(batch: BatchListItem): { label: string; value?: string | number | null } {
  if (batch.domain_type === 'cannabis') {
    if (batch.thc_content) {
      return { label: 'THC %', value: `${batch.thc_content}%` }
    }
    if (batch.lighting_schedule) {
      return { label: 'Lighting', value: batch.lighting_schedule }
    }
    return { label: 'Cannabis metric', value: 'N/A' }
  }

  if (batch.domain_type === 'produce') {
    if (batch.grade) {
      return { label: 'Grade', value: batch.grade }
    }
    if (batch.brix_level) {
      return { label: 'Brix', value: `${batch.brix_level}°` }
    }
    return { label: 'Produce metric', value: 'N/A' }
  }

  return { label: 'Metric', value: '—' }
}

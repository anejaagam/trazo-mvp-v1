'use client'

/**
 * Batch Table Component
 * Domain-aware table with dynamic columns for cannabis/produce batches
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'
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
import { usePermissions } from '@/hooks/use-permissions'
import { isCannabisBatch, isProduceBatch } from '@/types/batch'
import type { DomainBatch } from '@/types/batch'
import { deleteBatch } from '@/lib/supabase/queries/batches-client'

interface BatchTableProps {
  batches: DomainBatch[]
  onRefresh: () => void
  userId: string
  userRole: string
}

export function BatchTable({ batches, onRefresh, userId, userRole }: BatchTableProps) {
  const { can } = usePermissions(userRole as any, [])
  const router = useRouter()
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null)

  // Get stage color for badge
  const getStageColor = (stage: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const stageColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      // Cannabis stages
      propagation: 'default',
      vegetative: 'secondary',
      flowering: 'outline',
      harvest: 'default',
      drying: 'secondary',
      curing: 'outline',
      testing: 'default',
      packaging: 'secondary',
      
      // Produce stages
      seeding: 'default',
      germination: 'secondary',
      transplant: 'outline',
      growing: 'default',
      harvest_ready: 'secondary',
      harvesting: 'outline',
      washing: 'default',
      grading: 'secondary',
      packing: 'outline',
      storage: 'default',
      shipped: 'secondary',
      
      // Common
      closed: 'destructive',
    }
    
    return stageColors[stage] || 'default'
  }

  const handleViewDetails = (batch: DomainBatch) => {
    router.push(`/dashboard/batches/${batch.id}`)
  }

  const handleDeleteBatch = async (batchId: string) => {
    if (!can('batch:delete')) {
      alert('You do not have permission to delete batches')
      return
    }

    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingBatchId(batchId)
      const { error } = await deleteBatch(batchId)
      
      if (error) {
        throw error
      }
      
      onRefresh()
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Failed to delete batch. Please try again.')
    } finally {
      setDeletingBatchId(null)
    }
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No batches found
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Cultivar</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  {batch.batch_number}
                </TableCell>
                <TableCell>{batch.cultivar_id || 'Unknown'}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {batch.domain_type === 'cannabis' ? '🌿 Cannabis' : '🥬 Produce'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStageColor(batch.stage)}>
                    {batch.stage.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{batch.plant_count?.toLocaleString() || 0}</TableCell>
                <TableCell>
                  {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  {batch.quarantined_at && !batch.quarantine_released_at ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quarantined
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {batch.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(batch)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {can('batch:update') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Batch
                          </DropdownMenuItem>
                        </>
                      )}
                      {can('batch:delete') && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteBatch(batch.id)}
                            disabled={deletingBatchId === batch.id}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingBatchId === batch.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

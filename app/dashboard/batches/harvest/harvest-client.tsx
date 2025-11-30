'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HarvestQueue } from '@/components/features/harvests/harvest-queue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Package, TrendingUp, Scale, AlertCircle, Calendar, Leaf } from 'lucide-react'
import { getHarvests, getBatchesReadyToHarvest } from '@/lib/supabase/queries/harvests-client'
import { formatDate } from '@/lib/utils'

interface HarvestClientProps {
  userId: string
  organizationId: string
  siteId: string
}

export function HarvestClient({ userId, organizationId, siteId }: HarvestClientProps) {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalHarvests: 0,
    activeHarvests: 0,
    readyForPackaging: 0,
    totalWeight: 0,
    readyToHarvest: 0,
  })
  const [readyBatches, setReadyBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    loadReadyBatches()
  }, [organizationId, siteId])

  const loadReadyBatches = async () => {
    try {
      const { data, error } = await getBatchesReadyToHarvest(organizationId, siteId)
      if (error) {
        console.error('Failed to load ready batches:', error)
        return
      }
      setReadyBatches(data || [])
    } catch (err) {
      console.error('Failed to load ready batches:', err)
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const { data: harvests, error } = await getHarvests(organizationId, siteId)

      if (error) {
        console.error('Failed to load harvests:', error)
        return
      }

      if (harvests) {
        const active = harvests.filter((h) => h.status !== 'finished')
        const readyForPackaging = harvests.filter(
          (h) => h.status === 'drying' || h.status === 'curing'
        )
        const totalWeight = harvests
          .filter((h) => h.dry_weight_g)
          .reduce((sum, h) => sum + (h.dry_weight_g || 0), 0)

        setStats({
          totalHarvests: harvests.length,
          activeHarvests: active.length,
          readyForPackaging: readyForPackaging.length,
          totalWeight,
          readyToHarvest: 0, // Will be updated by readyBatches effect
        })
      }
    } catch (err) {
      console.error('Failed to load harvest stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (readyBatches.length > 0) {
      setStats((prev) => ({ ...prev, readyToHarvest: readyBatches.length }))
    }
  }, [readyBatches])

  return (
    <div className="space-y-6">
      {/* Ready to Harvest Section */}
      {readyBatches.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Batches Ready to Harvest ({readyBatches.length})
            </CardTitle>
            <CardDescription>
              These batches are at harvest stage and need harvest records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Cultivar</TableHead>
                    <TableHead>Plants</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Leaf className="h-3 w-3 text-green-600" />
                          {batch.cultivar?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{batch.plant_count}</TableCell>
                      <TableCell>
                        {batch.expected_harvest_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(batch.expected_harvest_date)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {batch.pod_assignments?.[0]?.pod?.name || 'No location'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
                        >
                          Record Harvest
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHarvests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeHarvests}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Package</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyForPackaging}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalWeight / 1000).toFixed(1)}kg</div>
            <p className="text-xs text-muted-foreground">Dry weight</p>
          </CardContent>
        </Card>
      </div>

      {/* Harvest Queue */}
      <HarvestQueue
        organizationId={organizationId}
        siteId={siteId}
        onHarvestSelect={(harvestId) => {
          router.push(`/dashboard/batches/harvest/${harvestId}`)
        }}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common harvest management tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push('/dashboard/batches/active')}
          >
            View All Active Batches
          </Button>
          <Button
            variant="ghost"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push('/dashboard/batches')}
          >
            All Batches
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

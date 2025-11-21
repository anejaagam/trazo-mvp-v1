'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Scale, Calendar, MapPin, AlertCircle, CheckCircle2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getHarvests } from '@/lib/supabase/queries/harvests-client'
import { HarvestDetailDialog } from './harvest-detail-dialog'

interface HarvestRecord {
  id: string
  wet_weight: number
  dry_weight_g?: number
  plant_count: number
  status: 'active' | 'drying' | 'curing' | 'finished' | 'on_hold'
  harvested_at: string
  location?: string
  metrc_harvest_name?: string
  batch: {
    batch_number: string
    cultivar: {
      name: string
    }
  }
  metrc_mapping?: {
    metrc_harvest_id: string
    sync_status: string
  }[]
  packages?: { count: number }[]
}

interface HarvestQueueProps {
  organizationId: string
  siteId?: string
  onHarvestSelect?: (harvestId: string) => void
}

const statusColors: Record<string, string> = {
  active: 'bg-blue-500',
  drying: 'bg-yellow-500',
  curing: 'bg-amber-500',
  finished: 'bg-green-500',
  on_hold: 'bg-gray-500',
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  drying: 'Drying',
  curing: 'Curing',
  finished: 'Finished',
  on_hold: 'On Hold',
}

export function HarvestQueue({ organizationId, siteId, onHarvestSelect }: HarvestQueueProps) {
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedHarvestId, setSelectedHarvestId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    loadHarvests()
  }, [organizationId, siteId])

  const loadHarvests = async () => {
    try {
      setLoading(true)
      const { data: harvestData, error } = await getHarvests(organizationId, siteId)

      if (error) {
        console.error('Failed to load harvests:', error)
        setHarvests([])
      } else {
        setHarvests(harvestData || [])
      }
    } catch (error) {
      console.error('Failed to load harvests:', error)
      setHarvests([])
    } finally {
      setLoading(false)
    }
  }

  const filteredHarvests = harvests.filter((harvest) => {
    if (activeTab === 'all') return true
    if (activeTab === 'ready-for-packaging') {
      return harvest.status === 'drying' || harvest.status === 'curing'
    }
    return harvest.status === activeTab
  })

  const calculateMoistureLoss = (harvest: HarvestRecord) => {
    if (!harvest.dry_weight_g) return null
    const loss = ((harvest.wet_weight - harvest.dry_weight_g) / harvest.wet_weight) * 100
    return loss.toFixed(1)
  }

  const getPackageCount = (harvest: HarvestRecord) => {
    return harvest.packages?.[0]?.count || 0
  }

  const isSyncedToMetrc = (harvest: HarvestRecord) => {
    return harvest.metrc_mapping && harvest.metrc_mapping.length > 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Harvest Queue
        </CardTitle>
        <CardDescription>
          Track and manage harvest processing, drying, curing, and packaging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="drying">Drying</TabsTrigger>
            <TabsTrigger value="curing">Curing</TabsTrigger>
            <TabsTrigger value="ready-for-packaging">
              Ready to Package
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading harvests...
              </div>
            ) : filteredHarvests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No harvests found</p>
                {activeTab !== 'all' && (
                  <p className="text-sm mt-1">Try selecting a different tab</p>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Cultivar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Harvested</TableHead>
                      <TableHead>Wet (g)</TableHead>
                      <TableHead>Dry (g)</TableHead>
                      <TableHead>Loss %</TableHead>
                      <TableHead>Plants</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Metrc</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHarvests.map((harvest) => (
                      <TableRow key={harvest.id}>
                        <TableCell className="font-medium">
                          {harvest.batch.batch_number}
                          {harvest.metrc_harvest_name && (
                            <div className="text-xs text-muted-foreground">
                              {harvest.metrc_harvest_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{harvest.batch.cultivar.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[harvest.status]} text-white`}>
                            {statusLabels[harvest.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(harvest.harvested_at)}
                          </div>
                          {harvest.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {harvest.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {harvest.wet_weight.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {harvest.dry_weight_g ? (
                            <div className="flex items-center gap-1">
                              <Scale className="h-3 w-3" />
                              {harvest.dry_weight_g.toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {calculateMoistureLoss(harvest) ? (
                            <span className="text-sm">{calculateMoistureLoss(harvest)}%</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{harvest.plant_count}</TableCell>
                        <TableCell>
                          {getPackageCount(harvest) > 0 ? (
                            <Badge variant="secondary">
                              {getPackageCount(harvest)} pkg{getPackageCount(harvest) > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isSyncedToMetrc(harvest) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedHarvestId(harvest.id)
                              setShowDetailDialog(true)
                              onHarvestSelect?.(harvest.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Synced to Metrc</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Not synced</span>
            </div>
          </div>
          <div>
            {filteredHarvests.length} harvest{filteredHarvests.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>

      {/* Harvest Detail Dialog */}
      {selectedHarvestId && (
        <HarvestDetailDialog
          harvestId={selectedHarvestId}
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open)
            if (!open) {
              setSelectedHarvestId(null)
            }
          }}
        />
      )}
    </Card>
  )
}

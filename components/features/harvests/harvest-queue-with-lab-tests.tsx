'use client'

/**
 * Enhanced Harvest Queue with Lab Test Integration & Production
 * Phase 3.5 Week 8 + Week 10 Implementation
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Package,
  Scale,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Eye,
  FlaskConical,
  XCircle,
  Clock,
  Plus,
  Factory
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { getHarvests } from '@/lib/supabase/queries/harvests-client'
import { createClient } from '@/lib/supabase/client'
import { HarvestDetailDialog } from './harvest-detail-dialog'
import { PackageTestStatus } from '@/components/features/lab-tests/package-test-status'
import { StartProductionDialog } from '@/components/features/production/start-production-dialog'
import { ProductionStatusBadge } from '@/components/features/production/production-status-badge'

interface PackageWithTestStatus {
  id: string
  package_label: string
  tag?: string
  product_name?: string
  product_type?: string
  current_quantity: number
  unit_of_measure: string
  latest_test_status?: 'passed' | 'failed' | 'pending' | 'retesting' | 'not_tested'
  has_passing_test?: boolean
  production_status?: 'available' | 'in_production' | 'processed'
  lab_test_status?: string
}

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
    id: string
    batch_number: string
    cultivar: {
      name: string
    }
  }
  metrc_mapping?: {
    metrc_harvest_id: string
    sync_status: string
  }[]
  packages?: PackageWithTestStatus[]
}

interface HarvestQueueWithLabTestsProps {
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

export function HarvestQueueWithLabTests({
  organizationId,
  siteId,
  onHarvestSelect
}: HarvestQueueWithLabTestsProps) {
  const [harvests, setHarvests] = useState<HarvestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedHarvestId, setSelectedHarvestId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showProductionDialog, setShowProductionDialog] = useState(false)
  const [selectedHarvestForProduction, setSelectedHarvestForProduction] = useState<HarvestRecord | null>(null)

  useEffect(() => {
    loadHarvestsWithTestStatus()
  }, [organizationId, siteId])

  const loadHarvestsWithTestStatus = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First get harvests with packages
      const { data: harvestData, error: harvestError } = await supabase
        .from('harvest_records')
        .select(`
          *,
          batch:batches!inner (
            id,
            batch_number,
            cultivar:cultivars!inner (
              name
            )
          ),
          metrc_mapping:metrc_harvest_mappings (
            metrc_harvest_id,
            sync_status
          ),
          packages:harvest_packages (
            id,
            package_label,
            tag,
            product_name,
            product_type,
            current_quantity,
            unit_of_measure,
            production_status,
            lab_test_status
          )
        `)
        .eq('organization_id', organizationId)
        .eq('site_id', siteId || '')
        .order('harvested_at', { ascending: false })

      if (harvestError) {
        console.error('Failed to load harvests:', harvestError)
        setHarvests([])
        return
      }

      // Get test status for all packages
      const allPackageIds = harvestData?.flatMap(h =>
        h.packages?.map((p: any) => p.id) || []
      ) || []

      if (allPackageIds.length > 0) {
        // Get package test status using the view we created
        const { data: packageTestData, error: testError } = await supabase
          .from('packages_with_test_status')
          .select('id, latest_test_status, has_passing_test')
          .in('id', allPackageIds)

        if (!testError && packageTestData) {
          // Map test status back to packages
          const testStatusMap = new Map(
            packageTestData.map(pt => [pt.id, {
              latest_test_status: pt.latest_test_status,
              has_passing_test: pt.has_passing_test
            }])
          )

          // Update harvests with test status
          const harvestsWithTestStatus = harvestData?.map(harvest => ({
            ...harvest,
            packages: harvest.packages?.map((pkg: any) => ({
              ...pkg,
              ...testStatusMap.get(pkg.id)
            }))
          }))

          setHarvests(harvestsWithTestStatus || [])
        } else {
          setHarvests(harvestData || [])
        }
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
    if (activeTab === 'needs-testing') {
      // Show harvests with packages that need testing
      return harvest.packages?.some(pkg =>
        !pkg.has_passing_test || pkg.latest_test_status === 'failed'
      )
    }
    if (activeTab === 'ready-for-production') {
      // Show harvests with packages that have passed lab tests and are available
      return harvest.packages?.some(pkg =>
        pkg.has_passing_test &&
        pkg.current_quantity > 0 &&
        (!pkg.production_status || pkg.production_status === 'available')
      )
    }
    if (activeTab === 'in-production') {
      // Show harvests with packages currently in production
      return harvest.packages?.some(pkg =>
        pkg.production_status === 'in_production'
      )
    }
    return harvest.status === activeTab
  })

  // Helper to check if harvest can start production
  const canStartProduction = (harvest: HarvestRecord) => {
    return harvest.packages?.some(pkg =>
      pkg.has_passing_test &&
      pkg.current_quantity > 0 &&
      (!pkg.production_status || pkg.production_status === 'available')
    )
  }

  // Helper to get production status summary
  const getProductionStatusSummary = (harvest: HarvestRecord) => {
    const packages = harvest.packages || []
    const available = packages.filter(p => !p.production_status || p.production_status === 'available').length
    const inProduction = packages.filter(p => p.production_status === 'in_production').length
    const processed = packages.filter(p => p.production_status === 'processed').length
    return { available, inProduction, processed, total: packages.length }
  }

  const calculateMoistureLoss = (harvest: HarvestRecord) => {
    if (!harvest.dry_weight_g) return null
    const loss = ((harvest.wet_weight - harvest.dry_weight_g) / harvest.wet_weight) * 100
    return loss.toFixed(1)
  }

  const getPackageCount = (harvest: HarvestRecord) => {
    return harvest.packages?.length || 0
  }

  const getTestedPackageCount = (harvest: HarvestRecord) => {
    return harvest.packages?.filter(pkg => pkg.has_passing_test).length || 0
  }

  const getFailedPackageCount = (harvest: HarvestRecord) => {
    return harvest.packages?.filter(pkg => pkg.latest_test_status === 'failed').length || 0
  }

  const isSyncedToMetrc = (harvest: HarvestRecord) => {
    return harvest.metrc_mapping && harvest.metrc_mapping.length > 0
  }

  const getTestStatusIcon = (harvest: HarvestRecord) => {
    const totalPackages = getPackageCount(harvest)
    const testedPackages = getTestedPackageCount(harvest)
    const failedPackages = getFailedPackageCount(harvest)

    if (totalPackages === 0) {
      return <span className="text-muted-foreground text-xs">No packages</span>
    }

    if (failedPackages > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs">{failedPackages} failed</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{failedPackages} package(s) failed testing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (testedPackages === totalPackages) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs">All tested</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>All packages have passing tests</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (testedPackages > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-xs">{testedPackages}/{totalPackages}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{testedPackages} of {totalPackages} packages tested</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span className="text-xs">Not tested</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>No packages have been tested</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Harvest Queue with Lab Testing
        </CardTitle>
        <CardDescription>
          Track harvest processing, packaging, and lab test status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="drying">Drying</TabsTrigger>
            <TabsTrigger value="curing">Curing</TabsTrigger>
            <TabsTrigger value="ready-for-packaging">
              Ready to Package
            </TabsTrigger>
            <TabsTrigger value="needs-testing" className="flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" />
              Needs Testing
            </TabsTrigger>
            <TabsTrigger value="ready-for-production" className="flex items-center gap-1 bg-green-50 data-[state=active]:bg-green-100">
              <Factory className="h-3.5 w-3.5" />
              Ready for Production
            </TabsTrigger>
            <TabsTrigger value="in-production" className="flex items-center gap-1 bg-blue-50 data-[state=active]:bg-blue-100">
              <Factory className="h-3.5 w-3.5" />
              In Production
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
                      <TableHead>Lab Tests</TableHead>
                      <TableHead>Production</TableHead>
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
                          {getTestStatusIcon(harvest)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const prodStatus = getProductionStatusSummary(harvest)
                            if (prodStatus.total === 0) {
                              return <span className="text-muted-foreground text-xs">No packages</span>
                            }
                            if (prodStatus.inProduction > 0) {
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1">
                                        <Factory className="h-4 w-4 text-blue-600" />
                                        <span className="text-xs">{prodStatus.inProduction} in prod</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{prodStatus.inProduction} package(s) in production</p>
                                      <p>{prodStatus.processed} processed, {prodStatus.available} available</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            }
                            if (prodStatus.processed > 0) {
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                        <span className="text-xs">{prodStatus.processed} processed</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{prodStatus.processed} package(s) processed</p>
                                      <p>{prodStatus.available} still available</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            }
                            return (
                              <span className="text-muted-foreground text-xs">
                                {prodStatus.available} available
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell>
                          {isSyncedToMetrc(harvest) ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedHarvestId(harvest.id)
                                setShowDetailDialog(true)
                                onHarvestSelect?.(harvest.id)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {getPackageCount(harvest) > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Navigate to lab tests page with packages pre-selected
                                  window.location.href = `/dashboard/lab-tests?harvest=${harvest.id}`
                                }}
                              >
                                <FlaskConical className="h-4 w-4" />
                              </Button>
                            )}
                            {canStartProduction(harvest) && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedHarvestForProduction(harvest)
                                  setShowProductionDialog(true)
                                }}
                              >
                                <Factory className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>All tested</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>Partial testing</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Failed tests</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span>Not tested</span>
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

      {/* Start Production Dialog */}
      {selectedHarvestForProduction && siteId && (
        <StartProductionDialog
          harvest={{
            id: selectedHarvestForProduction.id,
            batch_number: selectedHarvestForProduction.batch.batch_number,
            cultivar_name: selectedHarvestForProduction.batch.cultivar?.name,
            packages: (selectedHarvestForProduction.packages || []).map(pkg => ({
              id: pkg.id,
              tag: pkg.tag,
              product_name: pkg.product_name,
              product_type: pkg.product_type,
              current_quantity: pkg.current_quantity,
              unit_of_measure: pkg.unit_of_measure,
              lab_test_status: pkg.has_passing_test ? 'passed' : pkg.latest_test_status,
              production_status: pkg.production_status,
            }))
          }}
          siteId={siteId}
          organizationId={organizationId}
          open={showProductionDialog}
          onOpenChange={(open) => {
            setShowProductionDialog(open)
            if (!open) {
              setSelectedHarvestForProduction(null)
            }
          }}
          onSuccess={(productionBatchId, batchNumber) => {
            // Refresh harvest data after production is started
            loadHarvestsWithTestStatus()
          }}
        />
      )}
    </Card>
  )
}
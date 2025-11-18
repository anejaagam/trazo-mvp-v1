'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Package,
  Scale,
  Sprout,
  Calendar,
  User,
  MapPin,
  Info,
  ExternalLink,
  TrendingDown,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface HarvestDetailDialogProps {
  harvestId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface HarvestDetail {
  id: string
  wet_weight: number
  dry_weight_g?: number
  waste_weight_g?: number
  plant_count: number
  status: string
  harvested_at: string
  location?: string
  notes?: string
  metrc_harvest_id?: string
  metrc_harvest_name?: string
  batch: {
    id: string
    batch_number: string
    cultivar?: {
      name: string
    }
  }
  harvested_by_user?: {
    full_name: string
  }
  plant_records?: PlantHarvestRecord[]
  packages?: HarvestPackage[]
}

interface PlantHarvestRecord {
  id: string
  plant_tag: string
  wet_weight_g: number
  dry_weight_g?: number
  quality_grade?: 'A' | 'B' | 'C' | 'Waste'
  flower_weight_g: number
  trim_weight_g: number
  shake_weight_g: number
}

interface HarvestPackage {
  id: string
  package_tag: string
  product_name?: string
  quantity: number
  unit_of_measure: string
  status: string
  packaged_at: string
  plant_sources?: PackagePlantSource[]
}

interface PackagePlantSource {
  id: string
  plant_tag: string
  weight_contributed_g: number
  source_type: 'flower' | 'trim' | 'shake' | 'waste'
}

export function HarvestDetailDialog({
  harvestId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: HarvestDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [harvest, setHarvest] = useState<HarvestDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Use controlled or internal open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(newOpen)
    } else {
      setOpen(newOpen)
    }
  }

  useEffect(() => {
    if (isOpen && harvestId) {
      loadHarvestDetail()
    }
  }, [isOpen, harvestId])

  const loadHarvestDetail = async () => {
    try {
      setLoading(true)
      // This would call your API endpoint
      // const response = await fetch(`/api/harvests/${harvestId}/detail`)
      // const data = await response.json()
      // setHarvest(data.harvest)

      // Mock data for now
      setHarvest({
        id: harvestId,
        wet_weight: 1500,
        dry_weight_g: 450,
        waste_weight_g: 50,
        plant_count: 10,
        status: 'finished',
        harvested_at: new Date().toISOString(),
        location: 'Room A - Drying Rack 3',
        notes: 'Premium flower quality, minimal waste',
        metrc_harvest_id: 'METRC-HRV-001',
        metrc_harvest_name: 'BTH-001-H1',
        batch: {
          id: 'batch-123',
          batch_number: 'BTH-001',
          cultivar: { name: 'Blue Dream' },
        },
        harvested_by_user: {
          full_name: 'John Grower',
        },
        plant_records: [
          {
            id: '1',
            plant_tag: '1A4FF01000000220001',
            wet_weight_g: 150,
            dry_weight_g: 45,
            quality_grade: 'A',
            flower_weight_g: 30,
            trim_weight_g: 10,
            shake_weight_g: 5
          },
          {
            id: '2',
            plant_tag: '1A4FF01000000220002',
            wet_weight_g: 145,
            dry_weight_g: 44,
            quality_grade: 'A',
            flower_weight_g: 28,
            trim_weight_g: 11,
            shake_weight_g: 5
          },
          // ... more plants
        ],
        packages: [
          {
            id: 'pkg-1',
            package_tag: '1A4FF02000000220001',
            product_name: 'Blue Dream - Premium Flower',
            quantity: 150,
            unit_of_measure: 'Grams',
            status: 'active',
            packaged_at: new Date().toISOString(),
            plant_sources: [
              { id: '1', plant_tag: '1A4FF01000000220001', weight_contributed_g: 30, source_type: 'flower' },
              { id: '2', plant_tag: '1A4FF01000000220002', weight_contributed_g: 28, source_type: 'flower' },
              { id: '3', plant_tag: '1A4FF01000000220003', weight_contributed_g: 27, source_type: 'flower' },
              { id: '4', plant_tag: '1A4FF01000000220004', weight_contributed_g: 25, source_type: 'flower' },
              { id: '5', plant_tag: '1A4FF01000000220005', weight_contributed_g: 40, source_type: 'flower' },
            ]
          },
          {
            id: 'pkg-2',
            package_tag: '1A4FF02000000220002',
            product_name: 'Blue Dream - Trim',
            quantity: 100,
            unit_of_measure: 'Grams',
            status: 'active',
            packaged_at: new Date().toISOString(),
            plant_sources: [
              { id: '6', plant_tag: '1A4FF01000000220001', weight_contributed_g: 10, source_type: 'trim' },
              { id: '7', plant_tag: '1A4FF01000000220002', weight_contributed_g: 11, source_type: 'trim' },
              { id: '8', plant_tag: '1A4FF01000000220003', weight_contributed_g: 12, source_type: 'trim' },
            ]
          },
        ],
      })
    } catch (error) {
      console.error('Error loading harvest detail:', error)
      toast.error('Failed to load harvest details')
    } finally {
      setLoading(false)
    }
  }

  const calculateMoistureLoss = () => {
    if (!harvest?.dry_weight_g) return null
    const loss = ((harvest.wet_weight - harvest.dry_weight_g) / harvest.wet_weight) * 100
    return loss.toFixed(1)
  }

  const getQualityBreakdown = () => {
    const breakdown: Record<string, number> = {}
    harvest?.plant_records?.forEach((plant) => {
      const grade = plant.quality_grade || 'Ungraded'
      breakdown[grade] = (breakdown[grade] || 0) + 1
    })
    return breakdown
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Harvest Detail: {harvest?.batch.batch_number || harvestId}
          </DialogTitle>
          <DialogDescription>
            View harvest information, plant records, and package traceability
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading harvest details...
          </div>
        ) : !harvest ? (
          <div className="text-center py-12 text-muted-foreground">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Harvest not found or failed to load
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="plants">
                Per-Plant Data ({harvest.plant_records?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="packages">
                Packages ({harvest.packages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="traceability">Traceability</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Wet Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{harvest.wet_weight}g</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Dry Weight
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {harvest.dry_weight_g ? `${harvest.dry_weight_g}g` : '-'}
                    </div>
                    {calculateMoistureLoss() && (
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {calculateMoistureLoss()}% loss
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Plant Count
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{harvest.plant_count}</div>
                    {harvest.dry_weight_g && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {(harvest.dry_weight_g / harvest.plant_count).toFixed(1)}g avg
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="text-base">{harvest.status}</Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Harvest Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Harvest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Sprout className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Batch</p>
                        <p className="text-muted-foreground">{harvest.batch.batch_number}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Cultivar</p>
                        <p className="text-muted-foreground">
                          {harvest.batch.cultivar?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Harvested</p>
                        <p className="text-muted-foreground">
                          {new Date(harvest.harvested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Harvested By</p>
                        <p className="text-muted-foreground">
                          {harvest.harvested_by_user?.full_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    {harvest.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground">{harvest.location}</p>
                        </div>
                      </div>
                    )}
                    {harvest.metrc_harvest_name && (
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Metrc Harvest</p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {harvest.metrc_harvest_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {harvest.notes && (
                    <div className="pt-3 border-t">
                      <p className="font-medium text-sm mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{harvest.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quality Breakdown */}
              {harvest.plant_records && harvest.plant_records.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Breakdown</CardTitle>
                    <CardDescription>Distribution of quality grades across plants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      {Object.entries(getQualityBreakdown()).map(([grade, count]) => (
                        <Badge key={grade} variant={grade === 'A' ? 'default' : 'secondary'}>
                          Grade {grade}: {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Per-Plant Data Tab */}
            <TabsContent value="plants" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Plant Records</CardTitle>
                  <CardDescription>
                    Detailed weight and quality data for each plant in this harvest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!harvest.plant_records || harvest.plant_records.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sprout className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No per-plant data recorded for this harvest</p>
                      <p className="text-sm mt-1">
                        This harvest uses batch-level tracking only
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plant Tag</TableHead>
                            <TableHead className="text-right">Wet (g)</TableHead>
                            <TableHead className="text-right">Dry (g)</TableHead>
                            <TableHead className="text-right">Flower (g)</TableHead>
                            <TableHead className="text-right">Trim (g)</TableHead>
                            <TableHead className="text-right">Shake (g)</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {harvest.plant_records.map((plant) => (
                            <TableRow key={plant.id}>
                              <TableCell className="font-mono text-xs">
                                {plant.plant_tag}
                              </TableCell>
                              <TableCell className="text-right">{plant.wet_weight_g}</TableCell>
                              <TableCell className="text-right">
                                {plant.dry_weight_g || '-'}
                              </TableCell>
                              <TableCell className="text-right">{plant.flower_weight_g}</TableCell>
                              <TableCell className="text-right">{plant.trim_weight_g}</TableCell>
                              <TableCell className="text-right">{plant.shake_weight_g}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    plant.quality_grade === 'A' ? 'default' : 'secondary'
                                  }
                                >
                                  {plant.quality_grade || 'N/A'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Packages Created</CardTitle>
                  <CardDescription>
                    Finished product packages created from this harvest
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!harvest.packages || harvest.packages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No packages created yet</p>
                      <p className="text-sm mt-1">
                        Packages will appear here once created from this harvest
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {harvest.packages.map((pkg) => (
                        <Card key={pkg.id} className="border-2">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">
                                  {pkg.product_name || 'Package'}
                                </CardTitle>
                                <CardDescription className="font-mono text-xs mt-1">
                                  {pkg.package_tag}
                                </CardDescription>
                              </div>
                              <Badge>{pkg.status}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Quantity</p>
                                <p className="text-lg font-semibold">
                                  {pkg.quantity} {pkg.unit_of_measure}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Packaged</p>
                                <p className="text-sm">
                                  {new Date(pkg.packaged_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Source Plants</p>
                                <p className="text-sm font-semibold">
                                  {pkg.plant_sources?.length || 0} plants
                                </p>
                              </div>
                            </div>

                            {/* Package Plant Sources */}
                            {pkg.plant_sources && pkg.plant_sources.length > 0 && (
                              <div className="border-t pt-3">
                                <p className="text-sm font-medium mb-2">Source Plant Contributions:</p>
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Plant Tag</TableHead>
                                        <TableHead>Source Type</TableHead>
                                        <TableHead className="text-right">Weight (g)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {pkg.plant_sources.map((source) => (
                                        <TableRow key={source.id}>
                                          <TableCell className="font-mono text-xs">
                                            {source.plant_tag}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline">{source.source_type}</Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {source.weight_contributed_g}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Traceability Tab */}
            <TabsContent value="traceability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Full Traceability Chain</CardTitle>
                  <CardDescription>
                    Complete seed-to-sale traceability from plants through packages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Traceability Status:</strong>{' '}
                      {harvest.packages && harvest.packages.length > 0
                        ? `${harvest.packages.length} package(s) linked to ${
                            new Set(
                              harvest.packages.flatMap((p) =>
                                p.plant_sources?.map((s) => s.plant_tag) || []
                              )
                            ).size
                          } plant(s)`
                        : 'No packages created yet - traceability will be available once packages are created'}
                    </AlertDescription>
                  </Alert>

                  {harvest.packages && harvest.packages.length > 0 && (
                    <div className="space-y-6">
                      {/* Visual Traceability Tree */}
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <h4 className="font-semibold mb-4">Traceability Visualization</h4>
                        <div className="space-y-4">
                          {/* Harvest Level */}
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                              H
                            </div>
                            <div className="flex-1 border rounded-md p-3">
                              <p className="font-medium">Harvest: {harvest.batch.batch_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {harvest.plant_count} plants, {harvest.dry_weight_g || harvest.wet_weight}g total
                              </p>
                            </div>
                          </div>

                          {/* Arrow Down */}
                          <div className="ml-4 border-l-2 h-6"></div>

                          {/* Package Level */}
                          {harvest.packages.map((pkg, idx) => (
                            <div key={pkg.id}>
                              <div className="flex items-center gap-3">
                                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                                  P
                                </div>
                                <div className="flex-1 border rounded-md p-3">
                                  <p className="font-medium">{pkg.product_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {pkg.quantity}g from {pkg.plant_sources?.length || 0} plants
                                  </p>
                                </div>
                              </div>

                              {/* Plant Sources */}
                              {pkg.plant_sources && pkg.plant_sources.length > 0 && (
                                <>
                                  <div className="ml-4 border-l-2 h-4"></div>
                                  <div className="ml-8 space-y-2">
                                    {pkg.plant_sources.map((source) => (
                                      <div key={source.id} className="flex items-center gap-3">
                                        <Sprout className="h-4 w-4 text-green-600" />
                                        <div className="flex-1 text-sm">
                                          <span className="font-mono">{source.plant_tag}</span>
                                          <span className="text-muted-foreground mx-2">→</span>
                                          <Badge variant="outline" className="text-xs">
                                            {source.source_type}
                                          </Badge>
                                          <span className="text-muted-foreground mx-2">→</span>
                                          <span className="font-semibold">
                                            {source.weight_contributed_g}g
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {idx < harvest.packages.length - 1 && (
                                    <div className="ml-4 border-l-2 h-6"></div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

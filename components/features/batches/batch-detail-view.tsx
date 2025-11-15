'use client'

/**
 * Batch Detail View Component
 * Comprehensive detail page for a single batch
 * Adapted from prototype with shadcn/ui components and Supabase integration
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Users, TrendingUp, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DomainBatch } from '@/types/batch'
import { formatDate } from '@/lib/utils'

interface BatchDetailViewProps {
  batch: DomainBatch
  onBack?: () => void
  userRole: string
}

const stageColors: Record<string, string> = {
  // Cannabis stages
  planning: 'bg-gray-100 text-gray-800',
  germination: 'bg-blue-100 text-blue-800',
  clone: 'bg-cyan-100 text-cyan-800',
  vegetative: 'bg-green-100 text-green-800',
  flowering: 'bg-purple-100 text-purple-800',
  harvest: 'bg-yellow-100 text-yellow-800',
  drying: 'bg-orange-100 text-orange-800',
  curing: 'bg-amber-100 text-amber-800',
  packaging: 'bg-pink-100 text-pink-800',
  completed: 'bg-green-100 text-green-800',
  destroyed: 'bg-red-100 text-red-800',
  
  // Produce stages
  seeding: 'bg-blue-100 text-blue-800',
  seedling: 'bg-cyan-100 text-cyan-800',
  transplant: 'bg-teal-100 text-teal-800',
  growing: 'bg-green-100 text-green-800',
  harvest_ready: 'bg-lime-100 text-lime-800',
  harvesting: 'bg-yellow-100 text-yellow-800',
  washing: 'bg-blue-100 text-blue-800',
  grading: 'bg-purple-100 text-purple-800',
  packing: 'bg-pink-100 text-pink-800',
  storage: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-gray-100 text-gray-800',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  quarantined: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
  destroyed: 'bg-black text-white',
}

export function BatchDetailView({ batch, onBack }: BatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.push('/dashboard/batches')
    }
  }

  const daysActive = batch.start_date
    ? Math.floor(
        (new Date().getTime() - new Date(batch.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{batch.batch_number}</h1>
            <Badge className={stageColors[batch.stage] || 'bg-gray-100 text-gray-800'}>
              {batch.stage}
            </Badge>
            <Badge className={statusColors[batch.status] || 'bg-gray-100 text-gray-800'}>
              {batch.status}
            </Badge>
            {batch.status === 'quarantined' && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Quarantined
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {batch.domain_type === 'cannabis' ? 'Cannabis' : 'Produce'} Batch
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Start Date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batch.start_date ? formatDate(batch.start_date) : 'Not set'}
            </div>
            <p className="text-xs text-muted-foreground">{daysActive} days active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Plant Count
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batch.plant_count || 0}</div>
            <p className="text-xs text-muted-foreground">Active plants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Expected Harvest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batch.expected_harvest_date ? formatDate(batch.expected_harvest_date) : 'TBD'}
            </div>
            <p className="text-xs text-muted-foreground">Target date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Yield
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batch.yield_weight_g || 0}g</div>
            <p className="text-xs text-muted-foreground">
              {batch.yield_units || 0} units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quarantine Warning */}
      {batch.status === 'quarantined' && batch.quarantine_reason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quarantine Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{batch.quarantine_reason}</p>
            {batch.quarantined_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Quarantined on {formatDate(batch.quarantined_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Batch Number</label>
                  <p className="text-sm text-muted-foreground">{batch.batch_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Domain Type</label>
                  <p className="text-sm text-muted-foreground capitalize">{batch.domain_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Stage</label>
                  <p className="text-sm text-muted-foreground capitalize">{batch.stage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground capitalize">{batch.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Source Type</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {batch.source_type || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plant Count</label>
                  <p className="text-sm text-muted-foreground">{batch.plant_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Domain-specific details */}
          {batch.domain_type === 'cannabis' && 'thc_content' in batch && (
            <Card>
              <CardHeader>
                <CardTitle>Cannabis Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {batch.thc_content !== null && (
                    <div>
                      <label className="text-sm font-medium">THC Content</label>
                      <p className="text-sm text-muted-foreground">{batch.thc_content}%</p>
                    </div>
                  )}
                  {batch.cbd_content !== null && (
                    <div>
                      <label className="text-sm font-medium">CBD Content</label>
                      <p className="text-sm text-muted-foreground">{batch.cbd_content}%</p>
                    </div>
                  )}
                  {batch.lighting_schedule && (
                    <div>
                      <label className="text-sm font-medium">Lighting Schedule</label>
                      <p className="text-sm text-muted-foreground">{batch.lighting_schedule}</p>
                    </div>
                  )}
                  {batch.terpene_profile && (
                    <div>
                      <label className="text-sm font-medium">Terpene Profile</label>
                      <p className="text-sm text-muted-foreground">
                        {typeof batch.terpene_profile === 'string' 
                          ? batch.terpene_profile 
                          : JSON.stringify(batch.terpene_profile)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {batch.domain_type === 'produce' && 'grade' in batch && (
            <Card>
              <CardHeader>
                <CardTitle>Produce Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  {batch.grade && (
                    <div>
                      <label className="text-sm font-medium">Grade</label>
                      <p className="text-sm text-muted-foreground">{batch.grade}</p>
                    </div>
                  )}
                  {batch.ripeness && (
                    <div>
                      <label className="text-sm font-medium">Ripeness</label>
                      <p className="text-sm text-muted-foreground">{batch.ripeness}</p>
                    </div>
                  )}
                  {batch.brix_level !== null && (
                    <div>
                      <label className="text-sm font-medium">Brix Level</label>
                      <p className="text-sm text-muted-foreground">{batch.brix_level}°Bx</p>
                    </div>
                  )}
                  {batch.firmness && (
                    <div>
                      <label className="text-sm font-medium">Firmness</label>
                      <p className="text-sm text-muted-foreground">{batch.firmness}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {batch.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{batch.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Harvest Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Expected Harvest</label>
                  <p className="text-sm text-muted-foreground">
                    {batch.expected_harvest_date
                      ? formatDate(batch.expected_harvest_date)
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Actual Harvest</label>
                  <p className="text-sm text-muted-foreground">
                    {batch.actual_harvest_date
                      ? formatDate(batch.actual_harvest_date)
                      : 'Not harvested'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Yield Weight</label>
                  <p className="text-sm text-muted-foreground">
                    {batch.yield_weight_g ? `${batch.yield_weight_g}g` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Yield Units</label>
                  <p className="text-sm text-muted-foreground">{batch.yield_units || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Waste Weight</label>
                  <p className="text-sm text-muted-foreground">
                    {batch.waste_weight_g ? `${batch.waste_weight_g}g` : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {batch.metrc_batch_id && (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Tracking</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">METRC Batch ID</label>
                    <p className="text-sm text-muted-foreground">{batch.metrc_batch_id}</p>
                  </div>
                  {batch.license_number && (
                    <div>
                      <label className="text-sm font-medium">License Number</label>
                      <p className="text-sm text-muted-foreground">{batch.license_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch History</CardTitle>
              <CardDescription>Timeline of events for this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary h-2 w-2 mt-2" />
                    <div className="w-px bg-border flex-1 min-h-[2rem]" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">Batch Created</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.created_at ? formatDate(batch.created_at) : 'Unknown'}
                    </p>
                  </div>
                </div>

                {batch.quarantined_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-destructive h-2 w-2 mt-2" />
                      <div className="w-px bg-border flex-1 min-h-[2rem]" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Quarantined</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.quarantined_at)}
                      </p>
                      {batch.quarantine_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {batch.quarantine_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {batch.quarantine_released_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-500 h-2 w-2 mt-2" />
                      <div className="w-px bg-border flex-1 min-h-[2rem]" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Released from Quarantine</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.quarantine_released_at)}
                      </p>
                    </div>
                  </div>
                )}

                {batch.actual_harvest_date && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-yellow-500 h-2 w-2 mt-2" />
                      <div className="w-px bg-border flex-1 min-h-[2rem]" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Harvested</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.actual_harvest_date)}
                      </p>
                      {batch.yield_weight_g && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Yield: {batch.yield_weight_g}g
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {batch.updated_at && batch.updated_at !== batch.created_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-muted h-2 w-2 mt-2" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(batch.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
              <CardDescription>Quality tracking and measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quality metrics tracking will be available here.
              </p>
              {/* TODO: Integrate batch_quality_metrics table data */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

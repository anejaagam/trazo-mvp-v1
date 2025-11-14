'use client'

/**
 * Batch Detail Dialog Component
 * Comprehensive view of batch information, history, and metrics
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isCannabisBatch, isProduceBatch } from '@/types/batch'
import type { DomainBatch } from '@/types/batch'
import { Sprout, Calendar, MapPin, AlertTriangle, TrendingUp } from 'lucide-react'

interface BatchDetailDialogProps {
  batch: DomainBatch
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
  userId: string
  userRole: string
}

export function BatchDetailDialog({ 
  batch, 
  isOpen, 
  onClose,
  onRefresh,
  userId,
  userRole 
}: BatchDetailDialogProps) {
  
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            Batch {batch.batch_number}
          </DialogTitle>
          <DialogDescription>
            {batch.cultivar_id || 'Unknown Cultivar'} - {batch.domain_type === 'cannabis' ? '🌿 Cannabis' : '🥬 Produce'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Status</span>
                      <Badge variant={batch.status === 'active' ? 'secondary' : 'outline'}>
                        {batch.status}
                      </Badge>
                    </div>
                    {batch.quarantined_at && !batch.quarantine_released_at && (
                      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive font-medium">
                          Quarantined: {batch.quarantine_reason || 'No reason provided'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Stage Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Stage</span>
                      <Badge>{batch.stage.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Batch Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Plant/Unit Count</p>
                      <p className="text-2xl font-bold">{batch.plant_count?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm">{formatDate(batch.start_date)}</p>
                    </div>
                  </div>
                </div>

                {batch.site_id && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Site</p>
                      <p className="text-sm text-muted-foreground">{batch.site_id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Domain-Specific Details</CardTitle>
                <CardDescription>
                  {batch.domain_type === 'cannabis' ? 'Cannabis cultivation details' : 'Produce cultivation details'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCannabisBatch(batch) && (
                  <>
                    {batch.lighting_schedule && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Lighting Schedule</span>
                        <span className="text-sm text-muted-foreground">{batch.lighting_schedule}</span>
                      </div>
                    )}
                    {batch.thc_content && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">THC Content</span>
                        <span className="text-sm text-muted-foreground">{batch.thc_content}%</span>
                      </div>
                    )}
                    {batch.cbd_content && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">CBD Content</span>
                        <span className="text-sm text-muted-foreground">{batch.cbd_content}%</span>
                      </div>
                    )}
                  </>
                )}

                {isProduceBatch(batch) && (
                  <>
                    {batch.grade && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Grade</span>
                        <Badge>{batch.grade}</Badge>
                      </div>
                    )}
                    {batch.ripeness && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Ripeness</span>
                        <span className="text-sm text-muted-foreground">{batch.ripeness}</span>
                      </div>
                    )}
                    {batch.brix_level && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Brix Level</span>
                        <span className="text-sm text-muted-foreground">{batch.brix_level}°</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Batch Timeline</CardTitle>
                <CardDescription>Key events and stage transitions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Batch Created</p>
                      <p className="text-sm text-muted-foreground">{formatDate(batch.created_at)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10">
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Current Stage: {batch.stage.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.plant_count || 0} {batch.domain_type === 'cannabis' ? 'plants' : 'units'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

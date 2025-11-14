'use client'

/**
 * Batch Management Component
 * Main batch management interface with domain awareness (cannabis/produce)
 * Adapted from prototype with shadcn/ui components and Supabase integration
 */

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/use-permissions'
import { BatchTable } from './batch-table'
import { BatchModal } from './batch-modal'
import { getBatches } from '@/lib/supabase/queries/batches-client'
import type { DomainBatch, BatchStatus, CannabisStage, ProduceStage } from '@/types/batch'

interface BatchManagementProps {
  siteId: string
  organizationId: string
  userId: string
  userRole: string
}

export function BatchManagement({ siteId, organizationId, userId, userRole }: BatchManagementProps) {
  const { can } = usePermissions(userRole as any, [])
  
  const [batches, setBatches] = useState<DomainBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<'all' | 'cannabis' | 'produce'>('all')
  const [selectedStatus, setSelectedStatus] = useState<BatchStatus | 'all'>('all')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch batches
  const fetchBatches = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      
      if (selectedDomain !== 'all') {
        filters.domainType = selectedDomain
      }
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }
      if (selectedStage !== 'all') {
        filters.stage = selectedStage
      }
      if (searchTerm) {
        filters.search = searchTerm
      }

      const { data, error: fetchError } = await getBatches(organizationId, siteId, filters)
      
      if (fetchError) {
        throw fetchError
      }
      
      setBatches(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching batches:', err)
      setError('Failed to load batches')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [organizationId, siteId, selectedDomain, selectedStatus, selectedStage, searchTerm])

  // Calculate stats
  const activeBatches = batches.filter(b => b.status === 'active')
  const quarantinedBatches = batches.filter(b => b.quarantined_at !== null && !b.quarantine_released_at)
  const totalPlants = batches.reduce((sum, b) => sum + (b.plant_count || 0), 0)
  const cannabisBatches = batches.filter(b => b.domain_type === 'cannabis')
  const produceBatches = batches.filter(b => b.domain_type === 'produce')

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchBatches()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
          <p className="text-muted-foreground">
            Track and manage cultivation batches across all stages
          </p>
        </div>
        
        {can('batch:create') && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              {cannabisBatches.length} cannabis, {produceBatches.length} produce
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants/Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlants.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all active batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{quarantinedBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search batches by number or cultivar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {(selectedDomain !== 'all' || selectedStatus !== 'all' || selectedStage !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[selectedDomain !== 'all', selectedStatus !== 'all', selectedStage !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <Select value={selectedDomain} onValueChange={(value: any) => setSelectedDomain(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All domains" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      <SelectItem value="cannabis">Cannabis</SelectItem>
                      <SelectItem value="produce">Produce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="quarantined">Quarantined</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="destroyed">Destroyed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stage</label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {selectedDomain === 'cannabis' || selectedDomain === 'all' ? (
                        <>
                          <SelectItem value="propagation">Propagation</SelectItem>
                          <SelectItem value="vegetative">Vegetative</SelectItem>
                          <SelectItem value="flowering">Flowering</SelectItem>
                          <SelectItem value="harvest">Harvest</SelectItem>
                          <SelectItem value="drying">Drying</SelectItem>
                          <SelectItem value="curing">Curing</SelectItem>
                        </>
                      ) : null}
                      {selectedDomain === 'produce' || selectedDomain === 'all' ? (
                        <>
                          <SelectItem value="seeding">Seeding</SelectItem>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="harvest_ready">Harvest Ready</SelectItem>
                          <SelectItem value="harvesting">Harvesting</SelectItem>
                        </>
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading batches...</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No batches found</p>
              {can('batch:create') && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Batch
                </Button>
              )}
            </div>
          ) : (
            <BatchTable 
              batches={batches} 
              onRefresh={fetchBatches}
              userId={userId}
              userRole={userRole}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <BatchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
          siteId={siteId}
          organizationId={organizationId}
          userId={userId}
        />
      )}
    </div>
  )
}

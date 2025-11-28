'use client'

import { useCallback, useEffect, useState } from 'react'
import { Search, Filter, Leaf, Sprout, Flower2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import type { PlantListItem, PlantFilters } from '@/lib/supabase/queries/plants-client'
import { getPlants, getPlantCountsByPhase } from '@/lib/supabase/queries/plants-client'

interface PlantListProps {
  siteId: string
  organizationId: string
  userId: string
  userRole: string
}

const growthPhaseOptions = [
  { value: 'Clone', label: 'Clone', icon: Leaf },
  { value: 'Vegetative', label: 'Vegetative', icon: Sprout },
  { value: 'Flowering', label: 'Flowering', icon: Flower2 },
]

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'Clone':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Vegetative':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'Flowering':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

function PhaseIcon({ phase }: { phase: string }) {
  switch (phase) {
    case 'Clone':
      return <Leaf className="h-4 w-4" />
    case 'Vegetative':
      return <Sprout className="h-4 w-4" />
    case 'Flowering':
      return <Flower2 className="h-4 w-4" />
    default:
      return <Leaf className="h-4 w-4" />
  }
}

export function PlantList({
  siteId,
  organizationId,
  userId,
  userRole,
}: PlantListProps) {
  const [plants, setPlants] = useState<PlantListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlantIds, setSelectedPlantIds] = useState<Set<string>>(new Set())
  const [phaseCounts, setPhaseCounts] = useState<Record<string, number>>({})

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [showActive, setShowActive] = useState<string>('active')
  const [showFilters, setShowFilters] = useState(false)

  const buildFilters = useCallback((): PlantFilters => {
    const filters: PlantFilters = {}

    if (selectedPhase !== 'all') {
      filters.growth_phase = selectedPhase as 'Clone' | 'Vegetative' | 'Flowering'
    }
    if (showActive === 'active') {
      filters.status = 'active'
    } else if (showActive === 'inactive') {
      filters.status = 'harvested' // or 'destroyed' - show non-active
    }
    if (searchTerm) {
      filters.search = searchTerm.trim()
    }
    return filters
  }, [selectedPhase, showActive, searchTerm])

  const fetchPlants = useCallback(async () => {
    try {
      setLoading(true)
      const [plantsResult, countsResult] = await Promise.all([
        getPlants(organizationId, siteId, buildFilters()),
        getPlantCountsByPhase(organizationId, siteId),
      ])

      if (plantsResult.error) {
        throw plantsResult.error
      }
      if (countsResult.error) {
        console.warn('Could not fetch phase counts:', countsResult.error)
      }

      setPlants(plantsResult.data || [])
      setPhaseCounts(countsResult.data || {})
      setError(null)
    } catch (err) {
      console.error('Error fetching plants:', err)
      setError((err as Error).message || 'Failed to load plants')
    } finally {
      setLoading(false)
    }
  }, [organizationId, siteId, buildFilters])

  useEffect(() => {
    fetchPlants()
  }, [fetchPlants])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlantIds(new Set(plants.map((p) => p.id)))
    } else {
      setSelectedPlantIds(new Set())
    }
  }

  const handleSelectPlant = (plantId: string, checked: boolean) => {
    const newSelected = new Set(selectedPlantIds)
    if (checked) {
      newSelected.add(plantId)
    } else {
      newSelected.delete(plantId)
    }
    setSelectedPlantIds(newSelected)
  }

  const totalActivePlants = Object.values(phaseCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivePlants}</div>
            <p className="text-xs text-muted-foreground">Individual plants</p>
          </CardContent>
        </Card>

        {growthPhaseOptions.map(({ value, label, icon: Icon }) => (
          <Card key={value}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phaseCounts[value] || 0}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(((phaseCounts[value] || 0) / (totalActivePlants || 1)) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tag or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>

              <Button variant="outline" onClick={fetchPlants} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 flex flex-wrap gap-4 border-t pt-4">
              <div className="w-48">
                <label className="text-sm font-medium">Growth Phase</label>
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="All phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {growthPhaseOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <label className="text-sm font-medium">Status</label>
                <Select value={showActive} onValueChange={setShowActive}>
                  <SelectTrigger>
                    <SelectValue placeholder="Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plants Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchPlants} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : plants.length === 0 ? (
            <div className="p-12 text-center">
              <Leaf className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No plants found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Individual plants are created when you change a batch&apos;s growth phase in Metrc.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPlantIds.size === plants.length && plants.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Plant Tag</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Cultivar</TableHead>
                  <TableHead>Growth Phase</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phase Changed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.map((plant) => (
                  <TableRow key={plant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPlantIds.has(plant.id)}
                        onCheckedChange={(checked) =>
                          handleSelectPlant(plant.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PhaseIcon phase={plant.growth_phase} />
                        <span className="font-mono text-sm">{plant.metrc_tag || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {plant.batch ? (
                        <Link
                          href={`/dashboard/batches/${plant.plant_batch_id}`}
                          className="text-primary hover:underline"
                        >
                          {plant.batch.batch_number}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plant.strain_name || plant.batch?.cultivar?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPhaseColor(plant.growth_phase)}>
                        {plant.growth_phase}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plant.location_name ? (
                        <div className="text-sm">
                          <div>{plant.location_name}</div>
                          {plant.sublocation && (
                            <div className="text-xs text-muted-foreground">
                              {plant.sublocation}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plant.phase_changed_at ? (
                        <span className="text-sm">
                          {new Date(plant.phase_changed_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plant.status === 'active' ? 'default' : 'secondary'}>
                        {plant.status === 'active' ? 'Active' : plant.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectedPlantIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedPlantIds.size} plant{selectedPlantIds.size > 1 ? 's' : ''} selected
          </span>
          <Button variant="outline" size="sm" onClick={() => setSelectedPlantIds(new Set())}>
            Clear Selection
          </Button>
          {/* Future: Add bulk actions like harvest, move, destroy */}
        </div>
      )}
    </div>
  )
}

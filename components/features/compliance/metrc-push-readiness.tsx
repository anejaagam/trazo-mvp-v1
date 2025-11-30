'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Leaf,
  Package,
  Tag,
  Users,
  MapPin,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ReadinessCheck {
  id: string
  name: string
  category: 'strains' | 'items' | 'locations' | 'tags' | 'batches' | 'cultivars'
  status: 'pass' | 'warning' | 'fail' | 'pending'
  message: string
  details?: string[]
  count?: {
    total: number
    ready: number
    issues: number
  }
}

interface MetrcPushReadinessProps {
  siteId: string
  organizationId: string
  onPushReady?: () => void
}

export function MetrcPushReadiness({ siteId, organizationId, onPushReady }: MetrcPushReadinessProps) {
  const [checks, setChecks] = useState<ReadinessCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set())

  useEffect(() => {
    runChecks()
  }, [siteId, organizationId])

  const runChecks = async () => {
    setLoading(true)
    const newChecks: ReadinessCheck[] = []

    try {
      // Check 1: Strains sync status
      const strainsCheck = await checkStrainReadiness()
      newChecks.push(strainsCheck)

      // Check 2: Items sync status
      const itemsCheck = await checkItemsReadiness()
      newChecks.push(itemsCheck)

      // Check 3: Locations sync status
      const locationsCheck = await checkLocationsReadiness()
      newChecks.push(locationsCheck)

      // Check 4: Tags availability
      const tagsCheck = await checkTagsReadiness()
      newChecks.push(tagsCheck)

      // Check 5: Cultivars linked to strains
      const cultivarsCheck = await checkCultivarsReadiness()
      newChecks.push(cultivarsCheck)

      // Check 6: Batches ready for Metrc
      const batchesCheck = await checkBatchesReadiness()
      newChecks.push(batchesCheck)

      setChecks(newChecks)

      // Notify if all checks pass
      const allPassing = newChecks.every(c => c.status === 'pass')
      if (allPassing && onPushReady) {
        onPushReady()
      }
    } catch (error) {
      console.error('Error running readiness checks:', error)
      toast.error('Failed to run readiness checks')
    } finally {
      setLoading(false)
    }
  }

  const checkStrainReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/compliance/metrc/strains?site_id=${siteId}`)
      if (!response.ok) throw new Error('Failed to fetch strains')

      const data = await response.json()
      const total = data.strains?.length || 0

      if (total === 0) {
        return {
          id: 'strains',
          name: 'Metrc Strains Synced',
          category: 'strains',
          status: 'warning',
          message: 'No strains synced from Metrc yet',
          details: ['Run a strains sync to import available strains from Metrc'],
        }
      }

      return {
        id: 'strains',
        name: 'Metrc Strains Synced',
        category: 'strains',
        status: 'pass',
        message: `${total} strains available`,
        count: { total, ready: total, issues: 0 },
      }
    } catch (error) {
      return {
        id: 'strains',
        name: 'Metrc Strains Synced',
        category: 'strains',
        status: 'fail',
        message: 'Failed to check strains',
        details: [(error as Error).message],
      }
    }
  }

  const checkItemsReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/compliance/metrc/items?site_id=${siteId}`)
      if (!response.ok) throw new Error('Failed to fetch items')

      const data = await response.json()
      const total = data.items?.length || 0

      if (total === 0) {
        return {
          id: 'items',
          name: 'Metrc Items Synced',
          category: 'items',
          status: 'warning',
          message: 'No items synced from Metrc yet',
          details: ['Run an items sync to import available product types from Metrc'],
        }
      }

      return {
        id: 'items',
        name: 'Metrc Items Synced',
        category: 'items',
        status: 'pass',
        message: `${total} items available`,
        count: { total, ready: total, issues: 0 },
      }
    } catch (error) {
      return {
        id: 'items',
        name: 'Metrc Items Synced',
        category: 'items',
        status: 'fail',
        message: 'Failed to check items',
        details: [(error as Error).message],
      }
    }
  }

  const checkLocationsReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/compliance/metrc/locations?site_id=${siteId}`)
      if (!response.ok) {
        // API might not exist yet
        return {
          id: 'locations',
          name: 'Metrc Locations Synced',
          category: 'locations',
          status: 'warning',
          message: 'Locations check unavailable',
          details: ['Location sync API not yet implemented'],
        }
      }

      const data = await response.json()
      const total = data.locations?.length || 0

      if (total === 0) {
        return {
          id: 'locations',
          name: 'Metrc Locations Synced',
          category: 'locations',
          status: 'warning',
          message: 'No locations synced from Metrc yet',
          details: ['Run a locations sync to import facility locations from Metrc'],
        }
      }

      return {
        id: 'locations',
        name: 'Metrc Locations Synced',
        category: 'locations',
        status: 'pass',
        message: `${total} locations mapped`,
        count: { total, ready: total, issues: 0 },
      }
    } catch (error) {
      return {
        id: 'locations',
        name: 'Metrc Locations Synced',
        category: 'locations',
        status: 'warning',
        message: 'Locations check unavailable',
        details: ['Location data not yet available'],
      }
    }
  }

  const checkTagsReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/tags/summary?site_id=${siteId}`)
      if (!response.ok) throw new Error('Failed to fetch tags')

      const data = await response.json()
      const totalsByType = data.totals_by_type || {}
      const plantAvailable = totalsByType['Plant']?.available || 0
      const packageAvailable = totalsByType['Package']?.available || 0

      if (plantAvailable === 0 && packageAvailable === 0) {
        return {
          id: 'tags',
          name: 'Metrc Tags Available',
          category: 'tags',
          status: 'warning',
          message: 'No available tags',
          details: [
            'Receive plant and package tags from Metrc',
            'Tags are required for plants and packages',
          ],
        }
      }

      const issues = []
      if (plantAvailable < 10) {
        issues.push(`Low plant tags: ${plantAvailable} available`)
      }
      if (packageAvailable < 10) {
        issues.push(`Low package tags: ${packageAvailable} available`)
      }

      return {
        id: 'tags',
        name: 'Metrc Tags Available',
        category: 'tags',
        status: issues.length > 0 ? 'warning' : 'pass',
        message: `${plantAvailable} plant, ${packageAvailable} package tags available`,
        details: issues.length > 0 ? issues : undefined,
        count: {
          total: plantAvailable + packageAvailable,
          ready: plantAvailable + packageAvailable,
          issues: issues.length,
        },
      }
    } catch (error) {
      return {
        id: 'tags',
        name: 'Metrc Tags Available',
        category: 'tags',
        status: 'warning',
        message: 'Tags check unavailable',
        details: [(error as Error).message],
      }
    }
  }

  const checkCultivarsReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/cultivars?organization_id=${organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch cultivars')

      const data = await response.json()
      const cultivars = data.cultivars || data || []
      const total = cultivars.length
      const linked = cultivars.filter((c: any) => c.metrc_strain_id).length
      const unlinked = total - linked

      if (total === 0) {
        return {
          id: 'cultivars',
          name: 'Cultivars Linked to Strains',
          category: 'cultivars',
          status: 'warning',
          message: 'No cultivars created',
          details: ['Create cultivars in the Cultivar Management section'],
        }
      }

      if (unlinked > 0) {
        return {
          id: 'cultivars',
          name: 'Cultivars Linked to Strains',
          category: 'cultivars',
          status: 'warning',
          message: `${linked}/${total} cultivars linked`,
          details: [
            `${unlinked} cultivar(s) not linked to Metrc strains`,
            'Link cultivars to strains in Cultivar Management',
          ],
          count: { total, ready: linked, issues: unlinked },
        }
      }

      return {
        id: 'cultivars',
        name: 'Cultivars Linked to Strains',
        category: 'cultivars',
        status: 'pass',
        message: `All ${total} cultivars linked`,
        count: { total, ready: linked, issues: 0 },
      }
    } catch (error) {
      return {
        id: 'cultivars',
        name: 'Cultivars Linked to Strains',
        category: 'cultivars',
        status: 'warning',
        message: 'Cultivars check unavailable',
        details: [(error as Error).message],
      }
    }
  }

  const checkBatchesReadiness = async (): Promise<ReadinessCheck> => {
    try {
      const response = await fetch(`/api/batches?site_id=${siteId}&domain_type=cannabis`)
      if (!response.ok) throw new Error('Failed to fetch batches')

      const data = await response.json()
      const batches = data.batches || data || []
      const activeBatches = batches.filter((b: any) => b.status === 'active')
      const total = activeBatches.length

      if (total === 0) {
        return {
          id: 'batches',
          name: 'Cannabis Batches Ready',
          category: 'batches',
          status: 'pass',
          message: 'No active cannabis batches',
        }
      }

      // Check for batches with plant tags assigned
      const withTags = activeBatches.filter((b: any) =>
        b.metrc_plant_labels && b.metrc_plant_labels.length > 0
      ).length
      const withoutTags = total - withTags

      if (withoutTags > 0) {
        return {
          id: 'batches',
          name: 'Cannabis Batches Ready',
          category: 'batches',
          status: 'warning',
          message: `${withTags}/${total} batches have plant tags`,
          details: [
            `${withoutTags} batch(es) without plant tags`,
            'Assign plant tags to batches for Metrc compliance',
          ],
          count: { total, ready: withTags, issues: withoutTags },
        }
      }

      return {
        id: 'batches',
        name: 'Cannabis Batches Ready',
        category: 'batches',
        status: 'pass',
        message: `All ${total} batches have plant tags`,
        count: { total, ready: withTags, issues: 0 },
      }
    } catch (error) {
      return {
        id: 'batches',
        name: 'Cannabis Batches Ready',
        category: 'batches',
        status: 'warning',
        message: 'Batches check unavailable',
        details: [(error as Error).message],
      }
    }
  }

  const getStatusIcon = (status: ReadinessCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    }
  }

  const getCategoryIcon = (category: ReadinessCheck['category']) => {
    switch (category) {
      case 'strains':
        return <Leaf className="h-4 w-4" />
      case 'items':
        return <Package className="h-4 w-4" />
      case 'locations':
        return <MapPin className="h-4 w-4" />
      case 'tags':
        return <Tag className="h-4 w-4" />
      case 'cultivars':
        return <Users className="h-4 w-4" />
      case 'batches':
        return <Leaf className="h-4 w-4" />
    }
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedChecks)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedChecks(newExpanded)
  }

  const passCount = checks.filter(c => c.status === 'pass').length
  const warningCount = checks.filter(c => c.status === 'warning').length
  const failCount = checks.filter(c => c.status === 'fail').length
  const progressPercent = checks.length > 0 ? (passCount / checks.length) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Metrc Push Readiness</CardTitle>
            <CardDescription>
              Verify your data is ready to sync with Metrc
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runChecks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Re-check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Readiness Score</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {passCount} Pass
              </Badge>
              {warningCount > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {warningCount} Warning
                </Badge>
              )}
              {failCount > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {failCount} Fail
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Checks List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Running checks...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {checks.map((check) => (
              <Collapsible
                key={check.id}
                open={expandedChecks.has(check.id)}
                onOpenChange={() => toggleExpanded(check.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getCategoryIcon(check.category)}
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        expandedChecks.has(check.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {check.details && check.details.length > 0 && (
                    <div className="ml-11 mt-2 p-3 bg-muted/50 rounded-lg">
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {check.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Summary Message */}
        {!loading && (
          <div className="pt-4 border-t">
            {passCount === checks.length ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">All checks passed! Ready to sync with Metrc.</span>
              </div>
            ) : warningCount > 0 && failCount === 0 ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Some items need attention. You can still sync, but review warnings first.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">
                  Some checks failed. Please resolve issues before syncing with Metrc.
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

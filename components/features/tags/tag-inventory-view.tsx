'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tag, Package, Upload, AlertCircle, CheckCircle2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TagInventorySummary {
  tag_type: string
  status: string
  tag_count: number
}

interface TagDetail {
  id: string
  tag_number: string
  tag_type: string
  status: string
  assigned_to_type?: string
  assigned_to_id?: string
  assigned_entity_name?: string
  assigned_at?: string
  used_at?: string
  order_batch_number?: string
  received_at?: string
  created_at: string
}

interface TagInventoryViewProps {
  organizationId: string
  siteId: string
}

export function TagInventoryView({ organizationId, siteId }: TagInventoryViewProps) {
  const [summary, setSummary] = useState<TagInventorySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')

  // Tag list state
  const [tagList, setTagList] = useState<TagDetail[]>([])
  const [tagListLoading, setTagListLoading] = useState(false)
  const [tagListPage, setTagListPage] = useState(1)
  const [tagListTotal, setTagListTotal] = useState(0)
  const [tagListFilter, setTagListFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSummary()
  }, [organizationId, siteId])

  useEffect(() => {
    if (activeTab === 'plant' || activeTab === 'package') {
      loadTagList(activeTab === 'plant' ? 'Plant' : 'Package')
    }
  }, [activeTab, tagListPage, tagListFilter, siteId])

  const loadTagList = async (tagType: string) => {
    try {
      setTagListLoading(true)
      const params = new URLSearchParams({
        site_id: siteId,
        tag_type: tagType,
        page: tagListPage.toString(),
        limit: '25',
      })

      if (tagListFilter) {
        params.set('status', tagListFilter)
      }

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/tags/list?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load tags')
      }

      const data = await response.json()
      setTagList(data.tags || [])
      setTagListTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading tag list:', error)
      toast.error('Failed to load tag list')
    } finally {
      setTagListLoading(false)
    }
  }

  const handleSearch = () => {
    setTagListPage(1)
    if (activeTab === 'plant' || activeTab === 'package') {
      loadTagList(activeTab === 'plant' ? 'Plant' : 'Package')
    }
  }

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tags/summary?site_id=${siteId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to load tag summary')
      }

      const data = await response.json()
      setSummary(data.summary || [])
    } catch (error) {
      console.error('Error loading tag summary:', error)
      toast.error('Failed to load tag inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500'
      case 'assigned':
        return 'bg-blue-500'
      case 'used':
        return 'bg-gray-500'
      case 'destroyed':
        return 'bg-red-500'
      case 'lost':
        return 'bg-orange-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'available':
        return 'default'
      case 'assigned':
        return 'secondary'
      case 'destroyed':
      case 'lost':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const plantTags = summary.filter((s) => s.tag_type === 'Plant')
  const packageTags = summary.filter((s) => s.tag_type === 'Package')

  const calculateTotal = (tags: TagInventorySummary[]) =>
    tags.reduce((sum, t) => sum + t.tag_count, 0)

  const calculateAvailable = (tags: TagInventorySummary[]) =>
    tags.find((t) => t.status === 'available')?.tag_count || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tag Inventory</h2>
        <ReceiveTagsDialog
          organizationId={organizationId}
          siteId={siteId}
          onReceived={loadSummary}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="plant">Plant Tags</TabsTrigger>
          <TabsTrigger value="package">Package Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plant Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Plant Tags
                </CardTitle>
                <CardDescription>
                  For individual plant tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span>{calculateTotal(plantTags)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="text-green-600 font-semibold">
                      {calculateAvailable(plantTags)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {plantTags.map((tag) => (
                      <div key={tag.status} className="flex justify-between items-center text-sm">
                        <Badge variant={getStatusBadgeVariant(tag.status)}>
                          {tag.status}
                        </Badge>
                        <span className="font-medium">{tag.tag_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Tags
                </CardTitle>
                <CardDescription>
                  For finished product packages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span>{calculateTotal(packageTags)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="text-green-600 font-semibold">
                      {calculateAvailable(packageTags)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {packageTags.map((tag) => (
                      <div key={tag.status} className="flex justify-between items-center text-sm">
                        <Badge variant={getStatusBadgeVariant(tag.status)}>
                          {tag.status}
                        </Badge>
                        <span className="font-medium">{tag.tag_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span><strong>Available:</strong> Ready to assign</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span><strong>Assigned:</strong> Allocated but not active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span><strong>Used:</strong> Currently active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span><strong>Destroyed:</strong> Deactivated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span><strong>Lost:</strong> Missing/unaccounted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plant">
          <TagListView
            title="Plant Tags"
            description="Detailed view of all plant tags"
            tags={tagList}
            loading={tagListLoading}
            total={tagListTotal}
            page={tagListPage}
            onPageChange={setTagListPage}
            filter={tagListFilter}
            onFilterChange={setTagListFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            getStatusBadgeVariant={getStatusBadgeVariant}
          />
        </TabsContent>

        <TabsContent value="package">
          <TagListView
            title="Package Tags"
            description="Detailed view of all package tags"
            tags={tagList}
            loading={tagListLoading}
            total={tagListTotal}
            page={tagListPage}
            onPageChange={setTagListPage}
            filter={tagListFilter}
            onFilterChange={setTagListFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            getStatusBadgeVariant={getStatusBadgeVariant}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Tag List View Component
function TagListView({
  title,
  description,
  tags,
  loading,
  total,
  page,
  onPageChange,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onSearch,
  getStatusBadgeVariant,
}: {
  title: string
  description: string
  tags: TagDetail[]
  loading: boolean
  total: number
  page: number
  onPageChange: (page: number) => void
  filter: string | null
  onFilterChange: (filter: string | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearch: () => void
  getStatusBadgeVariant: (status: string) => 'default' | 'secondary' | 'destructive' | 'outline'
}) {
  const limit = 25
  const totalPages = Math.ceil(total / limit)

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="text-sm">Search Tag Number</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search"
                placeholder="Enter tag number..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={onSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="w-40">
            <Label className="text-sm">Status Filter</Label>
            <Select
              value={filter || 'all'}
              onValueChange={(value) => onFilterChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="destroyed">Destroyed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading tags...</span>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tags found</p>
            <p className="text-sm">
              {filter || searchQuery
                ? 'Try adjusting your filters'
                : 'Receive tags from Metrc to get started'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Order Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-mono text-sm">{tag.tag_number}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(tag.status)}>
                        {tag.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tag.assigned_entity_name || tag.assigned_to_type || '-'}
                    </TableCell>
                    <TableCell>{formatDate(tag.assigned_at)}</TableCell>
                    <TableCell>{tag.order_batch_number || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} tags
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Receive Tags Dialog Component
function ReceiveTagsDialog({
  organizationId,
  siteId,
  onReceived,
}: {
  organizationId: string
  siteId: string
  onReceived: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tagType, setTagType] = useState<'Plant' | 'Package' | 'Location'>('Plant')
  const [tagNumbers, setTagNumbers] = useState('')
  const [orderBatchNumber, setOrderBatchNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const tags = tagNumbers
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((tag_number) => ({
        tag_number,
        tag_type: tagType,
        site_id: siteId,
      }))

    if (tags.length === 0) {
      toast.error('Please enter at least one tag number')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/tags/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          site_id: siteId,
          tags,
          order_batch_number: orderBatchNumber || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to receive tags')
      }

      const result = await response.json()

      toast.success(`${result.tags_received} tags received successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: any) => {
          toast.warning(warning.message || warning, { duration: 5000 })
        })
      }

      setOpen(false)
      setTagNumbers('')
      setOrderBatchNumber('')
      onReceived()
    } catch (error) {
      console.error('Error receiving tags:', error)
      toast.error((error as Error).message || 'Failed to receive tags')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Receive Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Receive New Tags</DialogTitle>
          <DialogDescription>
            Import tags received from Metrc. Enter one tag number per line.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tag_type">Tag Type *</Label>
              <Select value={tagType} onValueChange={(value: any) => setTagType(value)}>
                <SelectTrigger id="tag_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plant">Plant Tags</SelectItem>
                  <SelectItem value="Package">Package Tags</SelectItem>
                  <SelectItem value="Location">Location Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_batch">Order Batch # (optional)</Label>
              <Input
                id="order_batch"
                value={orderBatchNumber}
                onChange={(e) => setOrderBatchNumber(e.target.value)}
                placeholder="e.g., METRC-2025-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag_numbers">Tag Numbers (one per line) *</Label>
            <textarea
              id="tag_numbers"
              value={tagNumbers}
              onChange={(e) => setTagNumbers(e.target.value)}
              placeholder={'1A4FF0100000022000001\n1A4FF0100000022000002\n1A4FF0100000022000003'}
              className="w-full min-h-[200px] p-3 text-sm font-mono rounded-md border border-input bg-background"
            />
            <p className="text-xs text-muted-foreground">
              {tagNumbers.split('\n').filter((l) => l.trim()).length} tag(s) entered
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Receiving...' : 'Receive Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

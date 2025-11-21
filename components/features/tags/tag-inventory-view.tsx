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
import { Tag, Package, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface TagInventorySummary {
  tag_type: string
  status: string
  tag_count: number
}

interface TagInventoryViewProps {
  organizationId: string
  siteId: string
}

export function TagInventoryView({ organizationId, siteId }: TagInventoryViewProps) {
  const [summary, setSummary] = useState<TagInventorySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    loadSummary()
  }, [organizationId, siteId])

  const loadSummary = async () => {
    try {
      setIsLoading(true)
      // This would call your API endpoint
      // const response = await fetch(`/api/tags/summary?site_id=${siteId}`)
      // const data = await response.json()
      // setSummary(data.summary)

      // Mock data for now
      setSummary([
        { tag_type: 'Plant', status: 'available', tag_count: 450 },
        { tag_type: 'Plant', status: 'assigned', tag_count: 120 },
        { tag_type: 'Plant', status: 'used', tag_count: 380 },
        { tag_type: 'Package', status: 'available', tag_count: 200 },
        { tag_type: 'Package', status: 'used', tag_count: 85 },
      ])
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
          <Card>
            <CardHeader>
              <CardTitle>Plant Tag Details</CardTitle>
              <CardDescription>
                Detailed view of all plant tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed plant tag list will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="package">
          <Card>
            <CardHeader>
              <CardTitle>Package Tag Details</CardTitle>
              <CardDescription>
                Detailed view of all package tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detailed package tag list will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
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
    <Dialog open={open} onValueChange={setOpen}>
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

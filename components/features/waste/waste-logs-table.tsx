'use client'

/**
 * Waste Logs Table Component
 *
 * Displays waste disposal records with:
 * - Sortable columns
 * - Advanced filtering (date range, type, source, compliance status)
 * - Row actions (view, edit, export)
 * - Pagination
 * - Loading and empty states
 * - Real-time updates via subscriptions
 */

import { useState, useMemo, useEffect } from 'react'
import { usePermissions } from '@/hooks/use-permissions'
import { useWasteLogs } from '@/lib/supabase/queries/waste-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  ArrowUpDown,
  Camera,
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { WasteLogWithRelations, WasteLogFilters, WasteType, SourceType, DisposalMethod } from '@/types/waste'
import type { RoleKey } from '@/lib/rbac/types'
import { isEditable, isDeletable } from '@/types/waste'

interface WasteLogsTableProps {
  siteId: string
  userRole: string
  userId: string
  initialFilters?: WasteLogFilters
  onRowClick?: (wasteLog: WasteLogWithRelations) => void
  onEdit?: (wasteLog: WasteLogWithRelations) => void
  onExport?: (wasteLogId: string) => void
}

type SortField = 'disposed_at' | 'waste_type' | 'quantity' | 'created_at'
type SortDirection = 'asc' | 'desc'

const WASTE_TYPES: { value: WasteType; label: string }[] = [
  { value: 'plant_material', label: 'Plant Material' },
  { value: 'trim', label: 'Trim' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'growing_medium', label: 'Growing Medium' },
  { value: 'other', label: 'Other' },
]

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'batch', label: 'Batch' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'general', label: 'General' },
]

export function WasteLogsTable({
  siteId,
  userRole,
  userId,
  initialFilters = {},
  onRowClick,
  onEdit,
  onExport,
}: WasteLogsTableProps) {
  const { can } = usePermissions(userRole as RoleKey)

  // Filters
  const [filters, setFilters] = useState<WasteLogFilters>(initialFilters)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [wasteTypeFilter, setWasteTypeFilter] = useState<WasteType | 'all'>('all')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceType | 'all'>('all')
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('disposed_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Build filters object
  useEffect(() => {
    const newFilters: WasteLogFilters = {}

    if (startDate) newFilters.date_range = { start: startDate, end: endDate }
    if (endDate) 
    if (wasteTypeFilter !== 'all') newFilters.waste_type = [wasteTypeFilter]
    if (sourceTypeFilter !== 'all') newFilters.source_type = [sourceTypeFilter]

    if (complianceFilter === 'compliant') {
      newFilters.rendered_unusable = true
      newFilters.has_photos = true
    } else if (complianceFilter === 'non-compliant') {
      newFilters.rendered_unusable = false
    }

    setFilters(newFilters)
  }, [startDate, endDate, wasteTypeFilter, sourceTypeFilter, complianceFilter])

  // Fetch waste logs with real-time updates
  const { data: wasteLogs, isLoading, error } = useWasteLogs(siteId, filters)

  // Check permissions
  if (!can('waste:view')) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You don&apos;t have permission to view waste logs.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter by search term
  const searchFilteredLogs = useMemo(() => {
    if (!wasteLogs) return []

    if (!searchTerm) return wasteLogs

    const term = searchTerm.toLowerCase()
    return wasteLogs.filter(log =>
      log.reason?.toLowerCase().includes(term) ||
      log.notes?.toLowerCase().includes(term) ||
      log.waste_type.toLowerCase().includes(term) ||
      (log.source_type?.toLowerCase() || "").includes(term) ||
      log.disposal_method.toLowerCase().includes(term)
    )
  }, [wasteLogs, searchTerm])

  // Sort logs
  const sortedLogs = useMemo(() => {
    if (!searchFilteredLogs) return []

    return [...searchFilteredLogs].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'disposed_at':
          aValue = new Date(a.disposed_at).getTime()
          bValue = new Date(b.disposed_at).getTime()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'waste_type':
          aValue = a.waste_type
          bValue = b.waste_type
          break
        case 'quantity':
          aValue = a.quantity
          bValue = b.quantity
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [searchFilteredLogs, sortField, sortDirection])

  // Paginate
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return sortedLogs.slice(start, end)
  }, [sortedLogs, page, pageSize])

  const totalPages = Math.ceil(sortedLogs.length / pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setWasteTypeFilter('all')
    setSourceTypeFilter('all')
    setComplianceFilter('all')
    setFilters({})
  }

  const renderComplianceBadge = (log: WasteLogWithRelations) => {
    const isCannabis = log.waste_type === 'plant_material' || log.waste_type === 'trim' ||
                       false

    if (!isCannabis) {
      return <Badge variant="secondary">N/A</Badge>
    }

    const hasPhotos = (log.photo_urls?.length || 0) >= 2
    const isRendered = log.rendered_unusable
    const hasWitness = !!log.witnessed_by

    if (isRendered && hasWitness && hasPhotos) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Compliant
        </Badge>
      )
    }

    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Non-Compliant
      </Badge>
    )
  }

  const renderMetrcSyncBadge = (log: WasteLogWithRelations) => {
    if (!log.metrc_sync_status) return null

    switch (log.metrc_sync_status) {
      case 'synced':
        return <Badge variant="default" className="bg-green-500">Synced</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading waste logs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load waste logs</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter and search waste disposal records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason, notes, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Waste Type</label>
              <Select value={wasteTypeFilter} onValueChange={(value) => setWasteTypeFilter(value as WasteType | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {WASTE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <Select value={sourceTypeFilter} onValueChange={(value) => setSourceTypeFilter(value as SourceType | 'all')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {SOURCE_TYPES.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Compliance</label>
              <Select value={complianceFilter} onValueChange={(value) => setComplianceFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="compliant">Compliant Only</SelectItem>
                  <SelectItem value="non-compliant">Non-Compliant Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedLogs.length} of {sortedLogs.length} records
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No waste logs found</p>
              <p className="text-sm mt-1">
                {sortedLogs.length === 0 && !searchTerm && Object.keys(filters).length === 0
                  ? 'No waste has been recorded yet'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('disposed_at')}
                    >
                      <div className="flex items-center gap-2">
                        Disposal Date
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('waste_type')}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center gap-2">
                        Quantity
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Witness</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Metrc</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => {
                    const canEditLog = can('waste:update') && isEditable(log, userId)
                    // Delete not implemented yet

                    return (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onRowClick?.(log)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(log.disposed_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.disposed_at), 'HH:mm')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {WASTE_TYPES.find(t => t.value === log.waste_type)?.label || log.waste_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="capitalize text-sm">{log.source_type}</div>
                          {log.batch_id && (
                            <div className="text-xs text-muted-foreground">
                              Batch: {log.batch?.batch_number || 'Unknown'}
                            </div>
                          )}
                          {log.inventory_item_id && (
                            <div className="text-xs text-muted-foreground">
                              Item: {log.inventory_item?.name || 'Unknown'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {log.quantity} {log.unit_of_measure}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm capitalize">
                            {log.disposal_method.replace(/_/g, ' ')}
                          </div>
                          {log.rendered_unusable && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <CheckCircle className="h-3 w-3" />
                              Rendered
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.witnessed_by ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-3 w-3" />
                              {log.witness?.name || 'Yes'}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderComplianceBadge(log)}
                          {(log.photo_urls?.length || 0) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Camera className="h-3 w-3" />
                              {log.photo_urls.length} photo(s)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderMetrcSyncBadge(log)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                onRowClick?.(log)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEditLog && (
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit?.(log)
                                }}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {can('waste:export') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    onExport?.(log.id)
                                  }}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export PDF
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

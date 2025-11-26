'use client'

/**
 * Lab Tests Dashboard Client Component
 * Phase 3.5 Week 8 Implementation
 *
 * Client-side dashboard for managing lab tests
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Filter,
  Calendar,
  Building,
  Package,
  FlaskConical,
  RefreshCw,
  Upload
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, isAfter, isBefore } from 'date-fns'
import { toast } from 'sonner'
import { COAUploadForm } from './coa-upload-form'
import { TestResultsViewer } from './test-results-viewer'

// Define type locally
type LabTestResult = {
  id: string
  test_number: string
  organization_id: string
  site_id: string | null
  lab_name: string
  lab_license_number: string | null
  test_date: string
  received_date: string
  coa_file_url: string | null
  coa_file_name: string | null
  coa_file_size: number | null
  test_results: any
  notes: string | null
  internal_notes: string | null
  sample_quantity: number | null
  sample_unit_of_measure: string | null
  sample_collected_by: string | null
  metrc_test_id: string | null
  metrc_sync_status: string | null
  metrc_sync_error: string | null
  metrc_last_sync: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'retesting'
  package_test_results?: Array<{
    id: string
    package_id: string
    package_test_status: string
  }>
  batch_test_results?: Array<{
    id: string
    batch_id: string
    batch_test_status: string
  }>
}

interface LabTestsDashboardProps {
  organizationId: string
  siteId: string
  userId: string
  userRole: string
}

export function LabTestsDashboard({
  organizationId,
  siteId,
  userId,
  userRole
}: LabTestsDashboardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<LabTestResult[]>([])
  const [filteredTests, setFilteredTests] = useState<LabTestResult[]>([])
  const [selectedTest, setSelectedTest] = useState<LabTestResult | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [labFilter, setLabFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<string>('all')

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    retesting: 0,
    recentTests: 0,
    packagesWithTests: 0,
    batchesWithTests: 0
  })

  // Unique labs for filter
  const [uniqueLabs, setUniqueLabs] = useState<string[]>([])

  useEffect(() => {
    fetchTests()
  }, [organizationId, siteId])

  useEffect(() => {
    filterTests()
  }, [tests, searchTerm, statusFilter, dateFilter, labFilter, activeTab])

  const fetchTests = async () => {
    // Validate required IDs before querying
    if (!organizationId || !siteId || organizationId === 'undefined' || siteId === 'undefined') {
      console.error('Missing required IDs:', { organizationId, siteId })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('lab_test_results')
        .select(`
          *,
          package_test_results (
            id,
            package_id,
            package_test_status
          ),
          batch_test_results (
            id,
            batch_id,
            batch_test_status
          )
        `)
        .eq('organization_id', organizationId)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTests(data || [])

      // Calculate stats
      const total = data?.length || 0
      const passed = data?.filter(t => t.status === 'passed').length || 0
      const failed = data?.filter(t => t.status === 'failed').length || 0
      const pending = data?.filter(t => t.status === 'pending').length || 0
      const retesting = data?.filter(t => t.status === 'retesting').length || 0
      const sevenDaysAgo = subDays(new Date(), 7)
      const recentTests = data?.filter(t => isAfter(new Date(t.test_date), sevenDaysAgo)).length || 0

      const packagesWithTests = new Set(
        data?.flatMap(t => t.package_test_results?.map((ptr: any) => ptr.package_id) || [])
      ).size

      const batchesWithTests = new Set(
        data?.flatMap(t => t.batch_test_results?.map((btr: any) => btr.batch_id) || [])
      ).size

      setStats({
        total,
        passed,
        failed,
        pending,
        retesting,
        recentTests,
        packagesWithTests,
        batchesWithTests
      })

      // Get unique lab names
      const labs = [...new Set(data?.map(t => t.lab_name).filter(Boolean))]
      setUniqueLabs(labs)

    } catch (error) {
      // Better error logging - Supabase errors may have message in different properties
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error)
      console.error('Error fetching tests:', errorMessage, error)
      toast.error('Failed to load lab tests')
    } finally {
      setLoading(false)
    }
  }

  const filterTests = () => {
    let filtered = [...tests]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.test_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.lab_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.lab_license_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(test => test.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case '7days':
          startDate = subDays(now, 7)
          break
        case '30days':
          startDate = subDays(now, 30)
          break
        case '90days':
          startDate = subDays(now, 90)
          break
        default:
          startDate = new Date(0)
      }

      filtered = filtered.filter(test =>
        isAfter(new Date(test.test_date), startDate)
      )
    }

    // Lab filter
    if (labFilter !== 'all') {
      filtered = filtered.filter(test => test.lab_name === labFilter)
    }

    // Tab filter
    switch (activeTab) {
      case 'passed':
        filtered = filtered.filter(t => t.status === 'passed')
        break
      case 'failed':
        filtered = filtered.filter(t => t.status === 'failed')
        break
      case 'pending':
        filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in_progress')
        break
      case 'retesting':
        filtered = filtered.filter(t => t.status === 'retesting')
        break
    }

    setFilteredTests(filtered)
  }

  const handleUploadComplete = async (testId: string) => {
    setShowUploadDialog(false)
    await fetchTests()
    toast.success('Lab test uploaded successfully')
  }

  const handleViewDetails = (test: LabTestResult) => {
    router.push(`/dashboard/lab-tests/${test.id}`)
  }

  const handleDownloadCOA = (test: LabTestResult) => {
    if (test.coa_file_url) {
      window.open(test.coa_file_url, '_blank')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'conditional':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'retesting':
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: 'default',
      failed: 'destructive',
      conditional: 'secondary',
      pending: 'outline',
      in_progress: 'outline',
      retesting: 'secondary'
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Tests</h1>
          <p className="text-muted-foreground">
            Manage Certificates of Analysis and test results
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload COA
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.recentTests} in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}% pass rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.retesting} retesting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" />
              Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.packagesWithTests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              packages tested
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search test number, lab name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
                <SelectItem value="retesting">Retesting</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={labFilter} onValueChange={setLabFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labs</SelectItem>
                {uniqueLabs.map(lab => (
                  <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="passed">
                Passed ({stats.passed})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({stats.failed})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="retesting">
                Retesting ({stats.retesting})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No lab tests found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload First COA
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Number</TableHead>
                  <TableHead>Lab Name</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>COA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">
                      {test.test_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {test.lab_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(test.test_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(test.status)}
                    </TableCell>
                    <TableCell>
                      {test.package_test_results?.length || 0}
                    </TableCell>
                    <TableCell>
                      {test.batch_test_results?.length || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {test.coa_file_name?.split('.').pop()?.toUpperCase() || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(test)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadCOA(test)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Certificate of Analysis</DialogTitle>
            <DialogDescription>
              Upload a COA document and record test results
            </DialogDescription>
          </DialogHeader>
          <COAUploadForm
            organizationId={organizationId}
            siteId={siteId}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {selectedTest && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lab Test Details</DialogTitle>
              <DialogDescription>
                Test #{selectedTest.test_number}
              </DialogDescription>
            </DialogHeader>
            <TestResultsViewer
              testId={selectedTest.id}
              showDetails={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
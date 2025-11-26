'use client'

/**
 * Test Results Viewer Component
 * Phase 3.5 Week 8 Implementation
 *
 * Displays lab test results and COA document
 */

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  FlaskConical,
  Calendar,
  Building,
  Eye,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Define types locally
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
}

type PackageTestResult = {
  id: string
  package_id: string
  test_result_id: string
  package_test_status: string
  sample_taken: boolean | null
  sample_quantity: number | null
  associated_at: string
  associated_by: string | null
  harvest_packages?: {
    id: string
    package_label: string
    product_name?: string
    quantity?: number
    unit_of_measure?: string
  }
}

interface TestResultsViewerProps {
  testId: string
  showDetails?: boolean
  onStatusChange?: (status: string) => void
  onEdit?: () => void
}

interface TestResultData extends LabTestResult {
  package_test_results?: PackageTestResult[]
  batch_test_results?: any[]
}

export function TestResultsViewer({
  testId,
  showDetails = true,
  onStatusChange,
  onEdit
}: TestResultsViewerProps) {
  const [testData, setTestData] = useState<TestResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPdfViewer, setShowPdfViewer] = useState(false)

  useEffect(() => {
    fetchTestData()
  }, [testId])

  const fetchTestData = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('lab_test_results')
        .select(`
          *,
          package_test_results (
            *,
            harvest_packages (
              id,
              package_label,
              product_name,
              quantity,
              unit_of_measure
            )
          ),
          batch_test_results (
            *,
            batches (
              id,
              batch_number,
              variety
            )
          )
        `)
        .eq('id', testId)
        .single()

      if (error) throw error
      setTestData(data)
    } catch (error) {
      console.error('Error fetching test data:', error)
      toast.error('Failed to load test results')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!testData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Test results not found
        </AlertDescription>
      </Alert>
    )
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
      retesting: 'secondary'
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const testResults = testData.test_results as any || {}

  const handleDownloadCOA = () => {
    if (testData.coa_file_url) {
      window.open(testData.coa_file_url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">
                Test #{testData.test_number}
              </CardTitle>
              <CardDescription className="mt-1">
                Lab test results and Certificate of Analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(testData.status)}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Lab Name</p>
              <p className="font-medium flex items-center gap-1">
                <Building className="h-4 w-4" />
                {testData.lab_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test Date</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(testData.test_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License #</p>
              <p className="font-medium">{testData.lab_license_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sample</p>
              <p className="font-medium">
                {testData.sample_quantity
                  ? `${testData.sample_quantity} ${testData.sample_unit_of_measure}`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {testData.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">{testData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* COA Document Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate of Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">{testData.coa_file_name}</p>
                <p className="text-sm text-muted-foreground">
                  Uploaded on {format(new Date(testData.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPdfViewer(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCOA}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Tabs */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="associations">Packages/Batches</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries({
                    potency: 'Potency',
                    pesticides: 'Pesticides',
                    heavy_metals: 'Heavy Metals',
                    microbials: 'Microbials',
                    mycotoxins: 'Mycotoxins',
                    foreign_matter: 'Foreign Matter',
                    moisture: 'Moisture',
                    water_activity: 'Water Activity'
                  }).map(([key, label]) => {
                    const result = testResults[key]
                    if (!result || !result.tested) {
                      return (
                        <div key={key} className="p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium">Not Tested</p>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={key}
                        className={`p-3 border rounded-lg ${
                          result.passed === false ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {result.passed ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {testResults.potency?.tested && (
                  <div>
                    <h4 className="font-medium mb-2">Potency Results</h4>
                    <Table>
                      <TableBody>
                        {testResults.potency.thc_percent !== undefined && (
                          <TableRow>
                            <TableCell>THC</TableCell>
                            <TableCell>{testResults.potency.thc_percent}%</TableCell>
                          </TableRow>
                        )}
                        {testResults.potency.cbd_percent !== undefined && (
                          <TableRow>
                            <TableCell>CBD</TableCell>
                            <TableCell>{testResults.potency.cbd_percent}%</TableCell>
                          </TableRow>
                        )}
                        {testResults.potency.total_cannabinoids !== undefined && (
                          <TableRow>
                            <TableCell>Total Cannabinoids</TableCell>
                            <TableCell>{testResults.potency.total_cannabinoids}%</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {testResults.microbials?.tested && (
                  <div>
                    <h4 className="font-medium mb-2">Microbial Results</h4>
                    <Table>
                      <TableBody>
                        {testResults.microbials.e_coli && (
                          <TableRow>
                            <TableCell>E. Coli</TableCell>
                            <TableCell>
                              <Badge variant={testResults.microbials.e_coli === 'not_detected' ? 'default' : 'destructive'}>
                                {testResults.microbials.e_coli.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )}
                        {testResults.microbials.salmonella && (
                          <TableRow>
                            <TableCell>Salmonella</TableCell>
                            <TableCell>
                              <Badge variant={testResults.microbials.salmonella === 'not_detected' ? 'default' : 'destructive'}>
                                {testResults.microbials.salmonella.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )}
                        {testResults.microbials.total_yeast_mold_cfu !== undefined && (
                          <TableRow>
                            <TableCell>Yeast & Mold</TableCell>
                            <TableCell>{testResults.microbials.total_yeast_mold_cfu} CFU/g</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {testResults.moisture?.tested && testResults.moisture.percentage !== undefined && (
                  <div>
                    <h4 className="font-medium mb-2">Moisture Content</h4>
                    <p>{testResults.moisture.percentage}%</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="associations" className="space-y-4">
                {testData.package_test_results && testData.package_test_results.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Associated Packages ({testData.package_test_results.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Package Label</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testData.package_test_results.map((ptr) => (
                          <TableRow key={ptr.id}>
                            <TableCell className="font-medium">
                              {ptr.harvest_packages?.package_label}
                            </TableCell>
                            <TableCell>
                              {ptr.harvest_packages?.product_name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {ptr.harvest_packages?.quantity
                                ? `${ptr.harvest_packages.quantity} ${ptr.harvest_packages.unit_of_measure}`
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(ptr.package_test_status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {testData.batch_test_results && testData.batch_test_results.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Associated Batches ({testData.batch_test_results.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch Number</TableHead>
                          <TableHead>Variety</TableHead>
                          <TableHead>Test Stage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testData.batch_test_results.map((btr) => (
                          <TableRow key={btr.id}>
                            <TableCell className="font-medium">
                              {btr.batches?.batch_number}
                            </TableCell>
                            <TableCell>
                              {btr.batches?.variety || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {btr.test_stage || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(btr.batch_test_status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {(!testData.package_test_results || testData.package_test_results.length === 0) &&
                 (!testData.batch_test_results || testData.batch_test_results.length === 0) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No packages or batches are associated with this test
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Certificate of Analysis</DialogTitle>
            <DialogDescription>{testData.coa_file_name || 'Document'}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {testData.coa_file_url && (
              testData.coa_file_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={testData.coa_file_url}
                  className="w-full h-full border-0"
                  title="COA Document"
                />
              ) : (
                <img
                  src={testData.coa_file_url}
                  alt="COA Document"
                className="w-full h-full object-contain"
              />
              )
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPdfViewer(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadCOA}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
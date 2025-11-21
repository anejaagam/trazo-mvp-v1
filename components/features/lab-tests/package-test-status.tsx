'use client'

/**
 * Package Test Status Component
 * Phase 3.5 Week 8 Implementation
 *
 * Shows test status for a package and blocks sales if needed
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Ban,
  RefreshCw,
  Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { COAUploadForm } from './coa-upload-form'
import { TestResultsViewer } from './test-results-viewer'
import type { Database } from '@/types/database'

type HarvestPackage = Database['public']['Tables']['harvest_packages']['Row']

interface PackageTestStatusProps {
  packageId: string
  blockSalesIfFailed?: boolean
  showDetails?: boolean
  onTestAdded?: () => void
  organizationId?: string
  siteId?: string
}

interface TestStatus {
  hasTests: boolean
  latestStatus: 'passed' | 'failed' | 'pending' | 'retesting' | 'not_tested'
  latestTestId?: string
  latestTestNumber?: string
  latestTestDate?: string
  canSell: boolean
  blockReason?: string
  totalTests: number
}

export function PackageTestStatus({
  packageId,
  blockSalesIfFailed = true,
  showDetails = false,
  onTestAdded,
  organizationId,
  siteId
}: PackageTestStatusProps) {
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showTestDetails, setShowTestDetails] = useState(false)
  const [packageData, setPackageData] = useState<HarvestPackage | null>(null)

  useEffect(() => {
    fetchTestStatus()
  }, [packageId])

  const fetchTestStatus = async () => {
    try {
      const supabase = createClient()

      // Get package data
      const { data: pkg } = await supabase
        .from('harvest_packages')
        .select('*')
        .eq('id', packageId)
        .single()

      if (pkg) {
        setPackageData(pkg)
      }

      // Get test results for this package
      const { data: testResults, error } = await supabase
        .from('package_test_results')
        .select(`
          *,
          lab_test_results (
            id,
            test_number,
            test_date,
            status,
            lab_name
          )
        `)
        .eq('package_id', packageId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!testResults || testResults.length === 0) {
        setTestStatus({
          hasTests: false,
          latestStatus: 'not_tested',
          canSell: !blockSalesIfFailed,
          blockReason: blockSalesIfFailed ? 'No test results available' : undefined,
          totalTests: 0
        })
      } else {
        const latest = testResults[0]
        const hasPassed = testResults.some(tr => tr.package_test_status === 'passed')
        const latestFailed = latest.package_test_status === 'failed'

        let canSell = true
        let blockReason = undefined

        if (blockSalesIfFailed) {
          if (!hasPassed) {
            canSell = false
            blockReason = 'No passing test results'
          } else if (latestFailed) {
            canSell = false
            blockReason = 'Latest test failed'
          }
        }

        setTestStatus({
          hasTests: true,
          latestStatus: latest.package_test_status as any,
          latestTestId: latest.lab_test_results?.id,
          latestTestNumber: latest.lab_test_results?.test_number,
          latestTestDate: latest.lab_test_results?.test_date,
          canSell,
          blockReason,
          totalTests: testResults.length
        })
      }
    } catch (error) {
      console.error('Error fetching test status:', error)
      setTestStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleTestAdded = async (testId: string) => {
    setShowUploadDialog(false)
    await fetchTestStatus()
    if (onTestAdded) {
      onTestAdded()
    }
  }

  if (loading) {
    return <Skeleton className="h-6 w-24" />
  }

  if (!testStatus) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-red-600" />
      case 'retesting':
        return <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-yellow-600" />
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: 'default',
      failed: 'destructive',
      retesting: 'secondary',
      pending: 'outline',
      not_tested: 'outline'
    }

    const labels: Record<string, string> = {
      passed: 'Passed',
      failed: 'Failed',
      retesting: 'Retesting',
      pending: 'Pending',
      not_tested: 'Not Tested'
    }

    return (
      <Badge
        variant={variants[status] || 'outline'}
        className="flex items-center gap-1 text-xs"
      >
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  if (!showDetails) {
    // Compact view for tables/lists
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {getStatusBadge(testStatus.latestStatus)}
                {!testStatus.canSell && blockSalesIfFailed && (
                  <Ban className="h-3.5 w-3.5 text-red-600" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                {testStatus.hasTests ? (
                  <>
                    <p>Test #{testStatus.latestTestNumber}</p>
                    {testStatus.latestTestDate && (
                      <p>Date: {new Date(testStatus.latestTestDate).toLocaleDateString()}</p>
                    )}
                    {testStatus.totalTests > 1 && (
                      <p>{testStatus.totalTests} total tests</p>
                    )}
                    {testStatus.blockReason && (
                      <p className="text-red-600">Sale blocked: {testStatus.blockReason}</p>
                    )}
                  </>
                ) : (
                  <p>No test results available</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {testStatus.hasTests && testStatus.latestTestId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTestDetails(true)}
            className="h-6 px-2"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    )
  }

  // Detailed view for package details page
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Lab Test Status</p>
          <div className="flex items-center gap-2">
            {getStatusBadge(testStatus.latestStatus)}
            {testStatus.totalTests > 0 && (
              <span className="text-sm text-muted-foreground">
                ({testStatus.totalTests} test{testStatus.totalTests !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {testStatus.hasTests && testStatus.latestTestId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestDetails(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              View Results
            </Button>
          )}

          {organizationId && siteId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploadDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Test
            </Button>
          )}
        </div>
      </div>

      {!testStatus.canSell && blockSalesIfFailed && (
        <Alert>
          <Ban className="h-4 w-4" />
          <AlertDescription>
            <strong>Sales Blocked:</strong> {testStatus.blockReason}
          </AlertDescription>
        </Alert>
      )}

      {testStatus.latestStatus === 'failed' && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            The latest test failed. This package should not be sold until it passes retesting.
          </AlertDescription>
        </Alert>
      )}

      {testStatus.latestStatus === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Test results are pending. Check back later for updates.
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Dialog */}
      {organizationId && siteId && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Lab Test</DialogTitle>
              <DialogDescription>
                Upload a Certificate of Analysis for this package
              </DialogDescription>
            </DialogHeader>
            <COAUploadForm
              organizationId={organizationId}
              siteId={siteId}
              packages={packageData ? [packageData] : []}
              onUploadComplete={handleTestAdded}
              onCancel={() => setShowUploadDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Test Details Dialog */}
      {testStatus.latestTestId && (
        <Dialog open={showTestDetails} onOpenChange={setShowTestDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lab Test Results</DialogTitle>
              <DialogDescription>
                Test #{testStatus.latestTestNumber}
              </DialogDescription>
            </DialogHeader>
            <TestResultsViewer
              testId={testStatus.latestTestId}
              showDetails={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
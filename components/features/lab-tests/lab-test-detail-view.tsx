'use client'

/**
 * Lab Test Detail View Client Component
 * Phase 3.5 Week 8 Implementation
 *
 * Displays full details of a specific lab test
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft,
  Download,
  Edit,
  FileText,
  AlertCircle,
  Package,
  FlaskConical,
  Building,
  Calendar,
  Printer
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
}

interface LabTestDetailViewProps {
  testId: string
  userId: string
  userRole: string
  organizationId: string
}

export function LabTestDetailView({
  testId,
  userId,
  userRole,
  organizationId
}: LabTestDetailViewProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<LabTestResult | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    fetchTestDetails()
  }, [testId])

  const fetchTestDetails = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('lab_test_results')
        .select('*')
        .eq('id', testId)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Lab test not found')
        router.push('/dashboard/lab-tests')
        return
      }

      // Verify user has access to this test
      if (data.organization_id !== organizationId) {
        toast.error('Access denied')
        router.push('/dashboard/lab-tests')
        return
      }

      setTest(data)
    } catch (error) {
      console.error('Error fetching test details:', error)
      toast.error('Failed to load test details')
      router.push('/dashboard/lab-tests')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCOA = () => {
    if (test?.coa_file_url) {
      window.open(test.coa_file_url, '_blank')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEdit = () => {
    setEditMode(true)
    toast.info('Edit mode coming soon')
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!test) return

    try {
      const response = await fetch('/api/lab-tests/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: test.id,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success('Test status updated')
      fetchTestDetails()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update test status')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-12 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lab test not found
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/dashboard/lab-tests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lab Tests
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/lab-tests">Lab Tests</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{test.test_number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Lab Test #{test.test_number}
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage test results and Certificate of Analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/lab-tests')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadCOA}>
            <Download className="h-4 w-4 mr-2" />
            Download COA
          </Button>
          {(userRole === 'owner' || userRole === 'admin' || userRole === 'manager') && (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Building className="h-4 w-4" />
              Lab Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{test.lab_name}</p>
            {test.lab_license_number && (
              <p className="text-xs text-muted-foreground mt-1">
                License: {test.lab_license_number}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Test Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {new Date(test.test_date).toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Received: {new Date(test.received_date).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <FlaskConical className="h-4 w-4" />
              Sample
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {test.sample_quantity && test.sample_unit_of_measure
                ? `${test.sample_quantity} ${test.sample_unit_of_measure}`
                : 'Not specified'}
            </p>
            {test.sample_collected_by && (
              <p className="text-xs text-muted-foreground mt-1">
                By: {test.sample_collected_by}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm truncate">
              {test.coa_file_name}
            </p>
            {test.coa_file_size && (
              <p className="text-xs text-muted-foreground mt-1">
                {(test.coa_file_size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Main Test Results Viewer */}
      <TestResultsViewer
        testId={test.id}
        showDetails={true}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
      />

      {/* Notes Section */}
      {(test.notes || test.internal_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  General Notes
                </p>
                <p className="text-sm">{test.notes}</p>
              </div>
            )}
            {test.internal_notes && (userRole === 'owner' || userRole === 'admin' || userRole === 'manager') && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Internal Notes (Staff Only)
                </p>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {test.internal_notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(test.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(test.updated_at).toLocaleString()}
              </p>
            </div>
            {test.metrc_test_id && (
              <div>
                <p className="text-muted-foreground">Metrc Test ID</p>
                <p className="font-medium">{test.metrc_test_id}</p>
              </div>
            )}
            {test.metrc_sync_status && (
              <div>
                <p className="text-muted-foreground">Metrc Sync Status</p>
                <p className="font-medium">{test.metrc_sync_status}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
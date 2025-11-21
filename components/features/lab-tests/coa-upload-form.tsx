'use client'

/**
 * COA Upload Form Component
 * Phase 3.5 Week 8 Implementation
 *
 * Handles Certificate of Analysis upload with drag-and-drop support
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Package,
  FlaskConical,
  Building,
  FileUp,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type HarvestPackage = Database['public']['Tables']['harvest_packages']['Row']
type Batch = Database['public']['Tables']['batches']['Row']

interface COAUploadFormProps {
  organizationId: string
  siteId: string
  packages?: HarvestPackage[]
  batches?: Batch[]
  onUploadComplete?: (testId: string) => void
  onCancel?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg']
}

export function COAUploadForm({
  organizationId,
  siteId,
  packages = [],
  batches = [],
  onUploadComplete,
  onCancel
}: COAUploadFormProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [labName, setLabName] = useState('')
  const [labLicenseNumber, setLabLicenseNumber] = useState('')
  const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sampleQuantity, setSampleQuantity] = useState('')
  const [sampleUnit, setSampleUnit] = useState('g')
  const [notes, setNotes] = useState('')

  // Selected packages and batches
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    packages.map(p => p.id)
  )
  const [selectedBatches, setSelectedBatches] = useState<string[]>(
    batches.map(b => b.id)
  )

  // Test results state
  const [testType, setTestType] = useState<'quick' | 'detailed'>('quick')
  const [overallStatus, setOverallStatus] = useState<'passed' | 'failed' | 'conditional'>('passed')
  const [testedCategories, setTestedCategories] = useState({
    potency: false,
    pesticides: false,
    heavy_metals: false,
    microbials: false,
    mycotoxins: false,
    foreign_matter: false,
    moisture: false
  })

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 10MB')
        return
      }
      setUploadedFile(file)
      toast.success('File selected successfully')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  })

  // Handle file upload to Supabase Storage
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `coa_${organizationId}_${timestamp}.${fileExt}`
    const filePath = `lab-tests/${organizationId}/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload file')
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return publicUrl
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadedFile) {
      toast.error('Please select a COA file to upload')
      return
    }

    if (!labName) {
      toast.error('Lab name is required')
      return
    }

    if (selectedPackages.length === 0 && selectedBatches.length === 0) {
      toast.error('Please select at least one package or batch')
      return
    }

    setIsUploading(true)
    setUploadProgress(20)

    try {
      const supabase = createClient()

      // Upload file to storage
      setUploadProgress(40)
      const fileUrl = await uploadFileToStorage(uploadedFile)

      if (!fileUrl) {
        throw new Error('Failed to upload file')
      }

      setUploadProgress(60)

      // Prepare test results based on form input
      const testResults: any = {}

      if (testType === 'quick') {
        // For quick entry, just mark categories as tested/passed based on overall status
        Object.keys(testedCategories).forEach(category => {
          if (testedCategories[category as keyof typeof testedCategories]) {
            testResults[category] = {
              tested: true,
              passed: overallStatus !== 'failed'
            }
          }
        })
      }

      // Create lab test record
      const { data: labTest, error: labTestError } = await supabase
        .from('lab_test_results')
        .insert({
          organization_id: organizationId,
          site_id: siteId,
          lab_name: labName,
          lab_license_number: labLicenseNumber || null,
          test_date: testDate,
          coa_file_url: fileUrl,
          coa_file_name: uploadedFile.name,
          coa_file_size: uploadedFile.size,
          coa_file_type: uploadedFile.type,
          sample_quantity: sampleQuantity ? parseFloat(sampleQuantity) : null,
          sample_unit_of_measure: sampleQuantity ? sampleUnit : null,
          notes: notes || null,
          status: overallStatus,
          test_results: testResults,
          coa_uploaded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (labTestError || !labTest) {
        throw new Error(labTestError?.message || 'Failed to create lab test')
      }

      setUploadProgress(80)

      // Link packages to test
      if (selectedPackages.length > 0) {
        const packageLinks = selectedPackages.map(packageId => ({
          package_id: packageId,
          test_result_id: labTest.id,
          package_test_status: overallStatus,
          associated_by: (supabase.auth.getUser()).data.user?.id
        }))

        const { error: linkError } = await supabase
          .from('package_test_results')
          .insert(packageLinks)

        if (linkError) {
          console.error('Failed to link packages:', linkError)
          toast.warning('Test created but some packages could not be linked')
        }
      }

      // Link batches to test
      if (selectedBatches.length > 0) {
        const batchLinks = selectedBatches.map(batchId => ({
          batch_id: batchId,
          test_result_id: labTest.id,
          batch_test_status: overallStatus,
          associated_by: (supabase.auth.getUser()).data.user?.id
        }))

        const { error: linkError } = await supabase
          .from('batch_test_results')
          .insert(batchLinks)

        if (linkError) {
          console.error('Failed to link batches:', linkError)
          toast.warning('Test created but some batches could not be linked')
        }
      }

      setUploadProgress(100)
      toast.success(`Lab test ${labTest.test_number} created successfully`)

      if (onUploadComplete) {
        onUploadComplete(labTest.id)
      } else {
        router.push(`/dashboard/lab-tests/${labTest.id}`)
      }

    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create lab test')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Upload COA Document
          </CardTitle>
          <CardDescription>
            Upload the Certificate of Analysis (PDF or image)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploadedFile ? 'bg-green-50 border-green-300' : 'hover:border-primary/50'}
            `}
          >
            <input {...getInputProps()} />
            {uploadedFile ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedFile(null)
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="font-medium">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop COA file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (PDF, PNG, JPG - max 10MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lab Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Lab Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labName">Lab Name *</Label>
              <Input
                id="labName"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                placeholder="e.g., Green Scientific Labs"
                required
              />
            </div>
            <div>
              <Label htmlFor="labLicense">Lab License Number</Label>
              <Input
                id="labLicense"
                value={labLicenseNumber}
                onChange={(e) => setLabLicenseNumber(e.target.value)}
                placeholder="e.g., LAB-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="testDate">Test Date *</Label>
              <Input
                id="testDate"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
            <div>
              <Label htmlFor="sampleQty">Sample Quantity</Label>
              <Input
                id="sampleQty"
                type="number"
                step="0.001"
                value={sampleQuantity}
                onChange={(e) => setSampleQuantity(e.target.value)}
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <Label htmlFor="sampleUnit">Unit</Label>
              <Select value={sampleUnit} onValueChange={setSampleUnit}>
                <SelectTrigger id="sampleUnit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this test..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={testType} onValueChange={(v) => setTestType(v as 'quick' | 'detailed')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Entry</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              <div>
                <Label>Overall Status</Label>
                <Select value={overallStatus} onValueChange={(v) => setOverallStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Passed
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Failed
                      </div>
                    </SelectItem>
                    <SelectItem value="conditional">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        Conditional
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tests Performed</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(testedCategories).map(([category, tested]) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={tested}
                        onChange={(e) => setTestedCategories({
                          ...testedCategories,
                          [category]: e.target.checked
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="capitalize">
                        {category.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {overallStatus === 'failed' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed tests will quarantine associated packages. Consider adding details in the notes.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="detailed">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Detailed test entry coming soon. Use Quick Entry for now.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Package/Batch Selection */}
      {(packages.length > 0 || batches.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Associate with Packages/Batches
            </CardTitle>
            <CardDescription>
              Select which packages or batches this test applies to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {packages.length > 0 && (
              <div className="space-y-2">
                <Label>Packages ({selectedPackages.length} selected)</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {packages.map(pkg => (
                    <label key={pkg.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPackages.includes(pkg.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPackages([...selectedPackages, pkg.id])
                          } else {
                            setSelectedPackages(selectedPackages.filter(id => id !== pkg.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span>{pkg.package_label}</span>
                      {pkg.product_name && (
                        <span className="text-sm text-muted-foreground">
                          - {pkg.product_name}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {batches.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Batches ({selectedBatches.length} selected)</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {batches.map(batch => (
                    <label key={batch.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBatches([...selectedBatches, batch.id])
                          } else {
                            setSelectedBatches(selectedBatches.filter(id => id !== batch.id))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span>{batch.batch_number}</span>
                      {batch.variety && (
                        <span className="text-sm text-muted-foreground">
                          - {batch.variety}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isUploading || !uploadedFile}>
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload COA
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
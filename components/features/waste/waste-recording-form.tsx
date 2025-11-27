'use client'

/**
 * Waste Recording Form Component
 *
 * Multi-step wizard for recording waste disposal with compliance documentation
 * - Step 1: Source Selection (batch, inventory, general)
 * - Step 2: Waste Details (type, quantity, reason, method)
 * - Step 3: Rendering Method (50:50 mix calculator for cannabis)
 * - Step 4: Compliance (photos, witness, signature)
 * - Step 5: Review and Submit
 *
 * Supports jurisdiction-specific validation (Metrc, CTLS, PrimusGFS)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { usePermissions } from '@/hooks/use-permissions'
import { useJurisdiction } from '@/hooks/use-jurisdiction'
import SignatureCanvas from 'react-signature-canvas'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  Loader2,
  Package,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadWastePhoto, uploadWitnessSignature } from '@/lib/supabase/queries/waste-client'
import { createWasteLog, updateWasteLog } from '@/app/actions/waste'
import type { CreateWasteLogInput, WasteType, DisposalMethod, RenderingMethod, WasteUnit, WasteLog } from '@/types/waste'
import type { RoleKey } from '@/lib/rbac/types'
import type { JurisdictionId } from '@/lib/jurisdiction/types'

const WASTE_TYPES: { value: WasteType; label: string }[] = [
  { value: 'plant_material', label: 'Plant Material' },
  { value: 'trim', label: 'Trim Waste' },
  { value: 'chemical', label: 'Chemicals' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'growing_medium', label: 'Growing Medium' },
  { value: 'other', label: 'Other' },
]

const DISPOSAL_METHODS: { value: DisposalMethod; label: string }[] = [
  { value: 'compost', label: 'Compost' },
  { value: 'landfill', label: 'Landfill' },
  { value: 'incineration', label: 'Incineration' },
  { value: 'grind_and_dispose', label: 'Grind and Dispose' },
  { value: 'hazardous_waste', label: 'Hazardous Waste' },
  { value: 'recycle', label: 'Recycle' },
  { value: 'other', label: 'Other' },
]

const RENDERING_METHODS: { value: RenderingMethod; label: string; description: string }[] = [
  { value: 'fifty_fifty_mix', label: '50:50 Mix', description: 'Mix with inert material (Required for OR/MD)' },
  { value: 'grinding', label: 'Grinding', description: 'Grind to make unusable' },
  { value: 'composting', label: 'Composting', description: 'Compost with organic matter' },
  { value: 'chemical_treatment', label: 'Chemical Treatment', description: 'Render unusable with chemicals' },
  { value: 'other', label: 'Other', description: 'Other approved method' },
]

const UNITS: { value: WasteUnit; label: string }[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
]

interface WasteRecordingFormProps {
  organizationId: string
  siteId: string
  userId: string
  userRole: string
  jurisdictionId?: JurisdictionId | null
  prefillData?: Partial<CreateWasteLogInput>
  onSuccess?: (wasteLog: WasteLog) => void
  onCancel?: () => void
  availableUsers?: { id: string; name: string; role: string }[]
  availableBatches?: { id: string; name: string }[]
  availableInventoryItems?: { id: string; name: string }[]
  existingWasteLog?: any
  isEditing?: boolean
}

export function WasteRecordingForm({
  organizationId,
  siteId,
  userId,
  userRole,
  jurisdictionId,
  prefillData,
  onSuccess,
  onCancel,
  availableUsers = [],
  availableBatches = [],
  availableInventoryItems = [],
  existingWasteLog,
  isEditing = false,
}: WasteRecordingFormProps) {
  const { can } = usePermissions(userRole as RoleKey)
  const { jurisdiction, getWasteReasons, getDisposalMethods, requiresWitness, isCannabiJurisdiction } = useJurisdiction(jurisdictionId)

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(existingWasteLog?.photo_urls || [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(existingWasteLog?.witness_signature_url || null)
  const signatureRef = useRef<SignatureCanvas>(null)

  const form = useForm<CreateWasteLogInput>({
    defaultValues: isEditing && existingWasteLog ? {
      organization_id: existingWasteLog.organization_id,
      site_id: existingWasteLog.site_id,
      performed_by: existingWasteLog.performed_by,
      source_type: existingWasteLog.source_type,
      batch_id: existingWasteLog.batch_id,
      inventory_item_id: existingWasteLog.inventory_item_id,
      waste_type: existingWasteLog.waste_type,
      disposal_method: existingWasteLog.disposal_method,
      unit_of_measure: existingWasteLog.unit_of_measure,
      quantity: existingWasteLog.quantity,
      disposed_at: new Date(existingWasteLog.disposed_at).toISOString().slice(0, 16),
      reason: existingWasteLog.reason,
      notes: existingWasteLog.notes,
      rendered_unusable: existingWasteLog.rendered_unusable,
      rendering_method: existingWasteLog.rendering_method,
      waste_material_mixed: existingWasteLog.waste_material_mixed,
      mix_ratio: existingWasteLog.mix_ratio,
      witnessed_by: existingWasteLog.witnessed_by,
      witness_id_verified: existingWasteLog.witness_id_verified,
      photo_urls: existingWasteLog.photo_urls || [],
    } : {
      organization_id: organizationId,
      site_id: siteId,
      performed_by: userId,
      source_type: 'general',
      waste_type: 'other',
      disposal_method: 'landfill',
      unit_of_measure: 'kg',
      quantity: '' as unknown as number,
      disposed_at: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      })(),
      rendered_unusable: false,
      photo_urls: [],
      ...prefillData,
    },
  })

  const sourceType = form.watch('source_type')
  const wasteType = form.watch('waste_type')
  const renderedUnusable = form.watch('rendered_unusable')
  const renderingMethod = form.watch('rendering_method')
  const quantity = form.watch('quantity')

  // Check if this is cannabis waste (requires special handling)
  const isCannabisWaste = wasteType === 'plant_material' || wasteType === 'trim' || false

  // Auto-skip step 3 if not cannabis waste or not in cannabis jurisdiction
  useEffect(() => {
    if (step === 3 && (!isCannabisWaste || !isCannabiJurisdiction)) {
      setStep(4)
    }
  }, [step, isCannabisWaste, isCannabiJurisdiction])

  // Check permissions
  if (!can('waste:create')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You do not have permission to record waste.
        </AlertDescription>
      </Alert>
    )
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingPhoto(true)
    try {
      const photoUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validImageTypes.includes(file.type)) {
          toast.error(`${file.name} is not a valid image file. Please upload JPG, PNG, or WebP images.`)
          continue
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Maximum file size is 10MB.`)
          continue
        }

        // Create temp waste log ID (will be replaced with actual ID after creation)
        const tempWasteLogId = `temp-${Date.now()}`
        const label = uploadedPhotos.length === 0 ? 'before' : uploadedPhotos.length === 1 ? 'after' : 'process'

        const result = await uploadWastePhoto(file, tempWasteLogId, label)

        if (result.error) {
          toast.error(`Failed to upload ${file.name}: ${result.error.message}`)
          continue
        }

        if (result.data) {
          photoUrls.push(result.data)
        }
      }

      if (photoUrls.length > 0) {
        const allPhotos = [...uploadedPhotos, ...photoUrls]
        setUploadedPhotos(allPhotos)
        form.setValue('photo_urls', allPhotos)
        toast.success(`Uploaded ${photoUrls.length} photo(s)`)
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploadingPhoto(false)
      // Reset the input so the same file can be selected again
      e.target.value = ''
    }
  }

  const handleRemovePhoto = (url: string) => {
    const newPhotos = uploadedPhotos.filter(p => p !== url)
    setUploadedPhotos(newPhotos)
    form.setValue('photo_urls', newPhotos)
  }

  const validateStep = (stepNumber: number): boolean => {
    const values = form.getValues()

    switch (stepNumber) {
      case 1:
        // Source selection
        if (!values.source_type) {
          toast.error('Please select a waste source')
          return false
        }
        if (values.source_type === 'batch' && !values.batch_id) {
          toast.error('Please select a batch')
          return false
        }
        if (values.source_type === 'inventory' && !values.inventory_item_id) {
          toast.error('Please select an inventory item')
          return false
        }
        return true

      case 2:
        // Waste details
        if (!values.waste_type) {
          toast.error('Please select waste type')
          return false
        }
        if (!values.quantity || values.quantity <= 0) {
          toast.error('Please enter a valid quantity')
          return false
        }
        if (!values.reason) {
          toast.error('Please provide a reason for waste')
          return false
        }
        if (!values.disposal_method) {
          toast.error('Please select a disposal method')
          return false
        }
        return true

      case 3:
        // Rendering method (only for cannabis waste in Metrc jurisdictions)
        if (isCannabisWaste && isCannabiJurisdiction) {
          if (!renderedUnusable) {
            toast.error('Cannabis waste must be rendered unusable per Metrc regulations')
            return false
          }
          if (!values.rendering_method) {
            toast.error('Please select a rendering method')
            return false
          }
          if (values.rendering_method === 'fifty_fifty_mix') {
            if (!values.waste_material_mixed) {
              toast.error('Please specify the inert material used for mixing')
              return false
            }
            if (values.mix_ratio !== '50:50') {
              toast.error('Mix ratio must be 50:50 for Metrc compliance')
              return false
            }
          }
        }
        return true

      case 4:
        // Compliance
        if (isCannabisWaste && isCannabiJurisdiction) {
          if (uploadedPhotos.length < 2) {
            toast.error('Metrc requires at least 2 photos (before and after disposal)')
            return false
          }
          if (requiresWitness && !values.witnessed_by) {
            toast.error('A licensed witness is required for cannabis waste disposal')
            return false
          }
        }
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    // If going back from step 4 and step 3 should be skipped, go to step 2
    if (step === 4 && (!isCannabisWaste || !isCannabiJurisdiction)) {
      setStep(2)
    } else {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (data: CreateWasteLogInput) => {
    if (!validateStep(5)) return

    setIsSubmitting(true)
    try {
      // Upload witness signature if provided
      if (signatureDataUrl && data.witnessed_by && !existingWasteLog?.witness_signature_url) {
        const tempWasteLogId = isEditing ? existingWasteLog.id : `temp-${Date.now()}`
        const signatureResult = await uploadWitnessSignature(signatureDataUrl, tempWasteLogId)

        if (signatureResult.data) {
          data.witness_signature_url = signatureResult.data
        }
      }

      if (isEditing && existingWasteLog) {
        // Update existing waste log
        const updateData = {
          id: existingWasteLog.id,
          ...data,
        }

        const result = await updateWasteLog(updateData)

        if (!result.success) {
          toast.error(result.error || 'Failed to update waste log')
          return
        }

        toast.success('Waste log updated successfully')

        // Redirect to waste detail page
        window.location.href = `/dashboard/waste/${existingWasteLog.id}`
      } else {
        // Create new waste log
        const wasteLogData = {
          ...data,
          site_id: siteId,
          organization_id: organizationId,
        }

        const result = await createWasteLog(wasteLogData)

        if (!result.success) {
          toast.error(result.error || 'Failed to create waste log')
          return
        }

        toast.success('Waste log created successfully')

        // Redirect to waste management page
        window.location.href = '/dashboard/waste'
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepIndicator = () => {
    const totalSteps = isCannabisWaste && isCannabiJurisdiction ? 5 : 4
    // Adjust displayed step if step 3 is skipped
    const displayStep = (!isCannabisWaste || !isCannabiJurisdiction) && step > 3 ? step - 1 : step
    const progress = (displayStep / totalSteps) * 100

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Step {displayStep} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    )
  }

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Step 1: Select Waste Source
        </CardTitle>
        <CardDescription>
          Identify where the waste is coming from
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="source_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Waste Source Type</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="batch" id="batch" />
                    <Label htmlFor="batch" className="cursor-pointer flex-1">
                      <div className="font-medium">Batch</div>
                      <div className="text-sm text-muted-foreground">From cultivation batch</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="inventory" id="inventory" />
                    <Label htmlFor="inventory" className="cursor-pointer flex-1">
                      <div className="font-medium">Inventory</div>
                      <div className="text-sm text-muted-foreground">From inventory item</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general" className="cursor-pointer flex-1">
                      <div className="font-medium">General</div>
                      <div className="text-sm text-muted-foreground">Facility waste</div>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {sourceType === 'batch' && (
          <FormField
            control={form.control}
            name="batch_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Batch</FormLabel>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The cultivation batch this waste came from
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {sourceType === 'inventory' && (
          <FormField
            control={form.control}
            name="inventory_item_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Inventory Item</FormLabel>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an inventory item" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableInventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The inventory item being disposed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="disposed_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disposal Date & Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormDescription>
                Date and time when waste was disposed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )

  const renderStep2 = () => {
    const jurisdictionReasons = getWasteReasons()

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Step 2: Waste Details
          </CardTitle>
          <CardDescription>
            Describe the waste being disposed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="waste_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waste Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select waste type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WASTE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter quantity"
                      {...field}
                      value={field.value === 0 || field.value ? field.value : ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_of_measure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Waste</FormLabel>
                {jurisdictionReasons.length > 0 ? (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jurisdictionReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other (specify in notes)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="Enter reason" {...field} value={field.value || ''} />
                  </FormControl>
                )}
                <FormDescription>
                  Why is this material being disposed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="disposal_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disposal Method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DISPOSAL_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  How will this waste be disposed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional details about this waste disposal..."
                    rows={3}
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    )
  }

  const renderStep3 = () => {
    // Only show rendering step for cannabis waste in Metrc jurisdictions
    if (!isCannabisWaste || !isCannabiJurisdiction) {
      // Step will be auto-skipped by useEffect
      return null
    }

    const mixRatio = form.watch('mix_ratio')
    const wasteMaterialMixed = form.watch('waste_material_mixed')

    // Calculate 50:50 mix amounts
    const wasteAmount = quantity || 0
    const inertAmount = wasteAmount // For 50:50, amounts are equal

    return (
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Rendering Method</CardTitle>
          <CardDescription>
            Cannabis waste must be rendered unusable per Metrc regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {jurisdiction?.state === 'OR' || jurisdiction?.state === 'MD'
                ? 'Oregon and Maryland require 50:50 mix with inert material'
                : 'Cannabis waste must be rendered unusable before disposal'}
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="rendered_unusable"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  Waste has been rendered unusable (Required)
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {renderedUnusable && (
            <>
              <FormField
                control={form.control}
                name="rendering_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rendering Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        {RENDERING_METHODS.map((method) => (
                          <div key={method.value} className="flex items-start space-x-3 border rounded-lg p-3">
                            <RadioGroupItem value={method.value} id={method.value} className="mt-1" />
                            <Label htmlFor={method.value} className="cursor-pointer flex-1">
                              <div className="font-medium">{method.label}</div>
                              <div className="text-sm text-muted-foreground">{method.description}</div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {renderingMethod === 'fifty_fifty_mix' && (
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <h4 className="font-medium">50:50 Mix Calculator</h4>

                  <FormField
                    control={form.control}
                    name="waste_material_mixed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inert Material Used</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., sand, kitty litter, soil"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          What inert material was mixed with the waste?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mix_ratio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mix Ratio</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value="50:50"
                            disabled
                          />
                        </FormControl>
                        <FormDescription>
                          Required ratio for OR/MD compliance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded-md">
                    <div>
                      <div className="text-sm text-muted-foreground">Waste Amount</div>
                      <div className="text-lg font-semibold">{wasteAmount.toFixed(2)} {form.watch('unit_of_measure')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Inert Material Needed</div>
                      <div className="text-lg font-semibold">{inertAmount.toFixed(2)} {form.watch('unit_of_measure')}</div>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Mix {wasteAmount.toFixed(2)} {form.watch('unit_of_measure')} of waste with {inertAmount.toFixed(2)} {form.watch('unit_of_measure')} of {wasteMaterialMixed || 'inert material'}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Step 4: Compliance Documentation
        </CardTitle>
        <CardDescription>
          Provide evidence and witness verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCannabisWaste && isCannabiJurisdiction && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Metrc requires: (1) At least 2 photos, (2) Licensed witness, (3) Witness signature
            </AlertDescription>
          </Alert>
        )}

        <div>
          <FormLabel>Photo Evidence</FormLabel>
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                className="gap-2 px-4 text-emerald-600 transition duration-300 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos
                  </>
                )}
              </Button>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <span className="text-sm text-muted-foreground">
                {uploadedPhotos.length} photo(s) uploaded
                {isCannabisWaste && isCannabiJurisdiction && ' (min. 2 required)'}
              </span>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {uploadedPhotos.map((url, idx) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt={`Waste photo ${idx + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => handleRemovePhoto(url)}
                    >
                      ×
                    </Button>
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      {idx === 0 ? 'Before' : idx === 1 ? 'After' : `Photo ${idx + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Upload before and after photos of waste disposal
          </p>
        </div>

        {(requiresWitness || isCannabisWaste) && (
          <>
            <FormField
              control={form.control}
              name="witnessed_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Witness {requiresWitness && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select witness" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUsers
                        .filter(u => u.id !== userId && can('waste:witness'))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Licensed user who witnessed the disposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="witness_id_verified"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Witness ID verified
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Witness Signature</FormLabel>
              <div className="mt-2 border rounded-md p-4 bg-white">
                {signatureDataUrl ? (
                  <div className="space-y-2">
                    <img src={signatureDataUrl} alt="Witness signature" className="border rounded max-h-40" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSignatureDataUrl(null)
                        signatureRef.current?.clear()
                      }}
                    >
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Please sign below to verify witness presence
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: 'w-full h-40 cursor-crosshair',
                        }}
                        backgroundColor="rgb(249, 250, 251)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => signatureRef.current?.clear()}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (signatureRef.current?.isEmpty()) {
                            toast.error('Please provide a signature')
                            return
                          }
                          const dataUrl = signatureRef.current?.toDataURL()
                          if (dataUrl) {
                            setSignatureDataUrl(dataUrl)
                            toast.success('Signature captured')
                          }
                        }}
                      >
                        Save Signature
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  const renderStep5 = () => {
    const values = form.getValues()

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Step 5: Review and Submit
          </CardTitle>
          <CardDescription>
            Review your waste disposal record before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Source</div>
              <div className="capitalize">{values.source_type}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Waste Type</div>
              <div>{WASTE_TYPES.find(t => t.value === values.waste_type)?.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Quantity</div>
              <div>{values.quantity} {values.unit_of_measure}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Disposal Method</div>
              <div>{DISPOSAL_METHODS.find(m => m.value === values.disposal_method)?.label}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Reason</div>
              <div>{values.reason}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Date</div>
              <div>{values.disposed_at}</div>
            </div>
          </div>

          {values.rendered_unusable && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Rendering Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Method:</span> {RENDERING_METHODS.find(r => r.value === values.rendering_method)?.label}
                </div>
                {values.rendering_method === 'fifty_fifty_mix' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Mix Ratio:</span> {values.mix_ratio}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inert Material:</span> {values.waste_material_mixed}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Compliance Documentation</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {uploadedPhotos.length >= 2 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm">{uploadedPhotos.length} photo(s) uploaded</span>
              </div>
              {values.witnessed_by && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Witness assigned</span>
                </div>
              )}
              {signatureDataUrl && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Signature captured</span>
                </div>
              )}
            </div>
          </div>

          {isCannabisWaste && isCannabiJurisdiction && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This waste record meets Metrc compliance requirements
              </AlertDescription>
            </Alert>
          )}

          {values.notes && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Notes</div>
              <div className="text-sm mt-1">{values.notes}</div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          <div className="flex justify-between">
            <div>
              {step > 1 && (
                <Button type="button" variant="ghost" onClick={handleBack} className="gap-2 px-4 text-emerald-600 transition duration-300 hover:text-emerald-700 hover:bg-emerald-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {step === 1 && onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <div>
              {step < 5 && (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {step === 5 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Waste Log
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

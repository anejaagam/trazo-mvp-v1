'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Factory,
  Package,
  Scale,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductionTypeBadge, type ProductionType } from './production-status-badge'

interface HarvestPackage {
  id: string
  tag?: string
  product_name?: string
  product_type?: string
  current_quantity: number
  unit_of_measure: string
  lab_test_status?: string
  production_status?: string
}

interface HarvestInfo {
  id: string
  batch_number: string
  cultivar_name?: string
  packages: HarvestPackage[]
}

interface StartProductionDialogProps {
  harvest: HarvestInfo
  siteId: string
  organizationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (productionBatchId: string, batchNumber: string) => void
}

interface SelectedPackage {
  packageId: string
  quantityUsed: number
  unitOfMeasure: string
  maxQuantity: number
  tag?: string
  productName?: string
}

const PRODUCTION_TYPES: { value: ProductionType; label: string; description: string }[] = [
  {
    value: 'extraction',
    label: 'Extraction',
    description: 'CO2, hydrocarbon, or solvent-based extraction (typical yield: 10-35%)',
  },
  {
    value: 'infusion',
    label: 'Infusion',
    description: 'Creating oils, edibles, or infused products (typical yield: 80-120%)',
  },
  {
    value: 'preroll',
    label: 'Pre-Roll',
    description: 'Rolling pre-roll joints (typical yield: 85-100%)',
  },
  {
    value: 'packaging',
    label: 'Packaging',
    description: 'Repackaging into retail units (typical yield: 95-100%)',
  },
  {
    value: 'processing',
    label: 'Processing',
    description: 'Trimming, curing, or other processing (typical yield: 60-100%)',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Custom production process',
  },
]

export function StartProductionDialog({
  harvest,
  siteId,
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: StartProductionDialogProps) {
  const [step, setStep] = useState<'type' | 'packages' | 'confirm'>('type')
  const [loading, setLoading] = useState(false)
  const [productionType, setProductionType] = useState<ProductionType | ''>('')
  const [expectedYield, setExpectedYield] = useState('')
  const [expectedYieldUnit, setExpectedYieldUnit] = useState('Grams')
  const [notes, setNotes] = useState('')
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([])

  // Filter available packages (passed lab tests, not in production)
  const availablePackages = harvest.packages.filter(
    (pkg) =>
      pkg.current_quantity > 0 &&
      pkg.lab_test_status === 'passed' &&
      (!pkg.production_status || pkg.production_status === 'available')
  )

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('type')
      setProductionType('')
      setExpectedYield('')
      setNotes('')
      setSelectedPackages([])
    }
  }, [open])

  const togglePackage = (pkg: HarvestPackage, selected: boolean) => {
    if (selected) {
      setSelectedPackages((prev) => [
        ...prev,
        {
          packageId: pkg.id,
          quantityUsed: pkg.current_quantity,
          unitOfMeasure: pkg.unit_of_measure,
          maxQuantity: pkg.current_quantity,
          tag: pkg.tag,
          productName: pkg.product_name,
        },
      ])
    } else {
      setSelectedPackages((prev) => prev.filter((p) => p.packageId !== pkg.id))
    }
  }

  const updatePackageQuantity = (packageId: string, quantity: number) => {
    setSelectedPackages((prev) =>
      prev.map((p) =>
        p.packageId === packageId
          ? { ...p, quantityUsed: Math.min(Math.max(0, quantity), p.maxQuantity) }
          : p
      )
    )
  }

  const totalInputWeight = selectedPackages.reduce((sum, p) => sum + p.quantityUsed, 0)

  const handleNext = () => {
    if (step === 'type') {
      if (!productionType) {
        toast.error('Please select a production type')
        return
      }
      setStep('packages')
    } else if (step === 'packages') {
      if (selectedPackages.length === 0) {
        toast.error('Please select at least one package')
        return
      }
      if (totalInputWeight === 0) {
        toast.error('Total input quantity must be greater than 0')
        return
      }
      setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'packages') {
      setStep('type')
    } else if (step === 'confirm') {
      setStep('packages')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Step 1: Create the production batch
      const createResponse = await fetch('/api/production/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          organizationId,
          productionType,
          startedAt: new Date().toISOString(),
          expectedYield: expectedYield ? parseFloat(expectedYield) : undefined,
          expectedYieldUnit,
          sourceHarvestId: harvest.id,
          notes,
        }),
      })

      const createData = await createResponse.json()

      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create production batch')
      }

      const productionBatchId = createData.productionBatchId

      // Step 2: Add input packages
      const inputsResponse = await fetch('/api/production/add-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionBatchId,
          inputs: selectedPackages.map((p) => ({
            packageId: p.packageId,
            quantityUsed: p.quantityUsed,
            unitOfMeasure: p.unitOfMeasure,
          })),
        }),
      })

      const inputsData = await inputsResponse.json()

      if (!inputsData.success) {
        throw new Error(inputsData.error || 'Failed to add input packages')
      }

      toast.success(`Production batch ${createData.batchNumber} started successfully`)
      onOpenChange(false)
      onSuccess?.(productionBatchId, createData.batchNumber)
    } catch (error) {
      console.error('Start production error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start production')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Start Production from Harvest
          </DialogTitle>
          <DialogDescription>
            Create a production batch from {harvest.batch_number}
            {harvest.cultivar_name && ` (${harvest.cultivar_name})`}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {['type', 'packages', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : i < ['type', 'packages', 'confirm'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-12 h-0.5 ${
                    i < ['type', 'packages', 'confirm'].indexOf(step) ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step 1: Select Production Type */}
        {step === 'type' && (
          <div className="space-y-4 py-4">
            <Label>Select Production Type</Label>
            <div className="grid gap-3">
              {PRODUCTION_TYPES.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setProductionType(type.value)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    productionType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ProductionTypeBadge type={type.value} />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    {productionType === type.value && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="expectedYield">Expected Yield (optional)</Label>
                <Input
                  id="expectedYield"
                  type="number"
                  step="0.01"
                  value={expectedYield}
                  onChange={(e) => setExpectedYield(e.target.value)}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yieldUnit">Unit</Label>
                <Select value={expectedYieldUnit} onValueChange={setExpectedYieldUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grams">Grams</SelectItem>
                    <SelectItem value="Kilograms">Kilograms</SelectItem>
                    <SelectItem value="Ounces">Ounces</SelectItem>
                    <SelectItem value="Pounds">Pounds</SelectItem>
                    <SelectItem value="Each">Each (units)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Packages */}
        {step === 'packages' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>Select Input Packages</Label>
              <Badge variant="secondary">
                {selectedPackages.length} selected | {totalInputWeight.toFixed(1)}g total
              </Badge>
            </div>

            {availablePackages.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No packages available for production. Packages must have passing lab tests and not
                  be in another production batch.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availablePackages.map((pkg) => {
                  const isSelected = selectedPackages.some((p) => p.packageId === pkg.id)
                  const selectedPkg = selectedPackages.find((p) => p.packageId === pkg.id)

                  return (
                    <Card
                      key={pkg.id}
                      className={isSelected ? 'border-primary' : ''}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => togglePackage(pkg, !!checked)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm truncate">
                                {pkg.tag || pkg.product_name || 'Package'}
                              </span>
                              {pkg.lab_test_status === 'passed' && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Tested
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Available: {pkg.current_quantity} {pkg.unit_of_measure}
                              {pkg.product_type && ` | ${pkg.product_type}`}
                            </div>

                            {isSelected && selectedPkg && (
                              <div className="flex items-center gap-2 mt-2">
                                <Label className="text-xs">Use:</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updatePackageQuantity(pkg.id, selectedPkg.quantityUsed - 100)
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  className="w-24 h-7 text-center"
                                  value={selectedPkg.quantityUsed}
                                  onChange={(e) =>
                                    updatePackageQuantity(pkg.id, parseFloat(e.target.value) || 0)
                                  }
                                  max={selectedPkg.maxQuantity}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    updatePackageQuantity(pkg.id, selectedPkg.quantityUsed + 100)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  / {selectedPkg.maxQuantity} {selectedPkg.unitOfMeasure}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            <Alert>
              <Factory className="h-4 w-4" />
              <AlertDescription>
                Review your production batch details before starting.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Production Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Source Harvest:</span>
                    <p className="font-medium">{harvest.batch_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Production Type:</span>
                    <p className="font-medium">
                      <ProductionTypeBadge type={productionType as ProductionType} />
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input Packages:</span>
                    <p className="font-medium">{selectedPackages.length} packages</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Input:</span>
                    <p className="font-medium">{totalInputWeight.toFixed(2)} Grams</p>
                  </div>
                  {expectedYield && (
                    <div>
                      <span className="text-muted-foreground">Expected Yield:</span>
                      <p className="font-medium">
                        {expectedYield} {expectedYieldUnit}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-muted-foreground">Selected Packages:</span>
                  <div className="mt-2 space-y-1">
                    {selectedPackages.map((pkg) => (
                      <div key={pkg.packageId} className="flex justify-between text-sm">
                        <span>{pkg.tag || pkg.productName || 'Package'}</span>
                        <span>
                          {pkg.quantityUsed} {pkg.unitOfMeasure}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any production notes..."
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'type' && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          {step === 'confirm' ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Factory className="h-4 w-4 mr-2" />
                  Start Production
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

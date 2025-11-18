'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Truck, AlertTriangle, Package, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface HarvestPackage {
  id: string
  package_tag: string
  product_name: string
  quantity: number
  unit_of_measure: string
  packaged_at: string
  status: string
}

interface CreateTransferFormProps {
  organizationId: string
  siteId: string
  availablePackages: HarvestPackage[]
  onTransferCreated: (manifestId: string) => void
}

export function CreateTransferForm({
  organizationId,
  siteId,
  availablePackages,
  onTransferCreated,
}: CreateTransferFormProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [recipientLicense, setRecipientLicense] = useState('')
  const [recipientFacility, setRecipientFacility] = useState('')
  const [transferType, setTransferType] = useState('Wholesale')
  const [shipmentLicenseType, setShipmentLicenseType] = useState('Cultivator')
  const [shipmentTransactionType, setShipmentTransactionType] = useState('Standard')
  const [estimatedDeparture, setEstimatedDeparture] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverLicense, setDriverLicense] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [plannedRoute, setPlannedRoute] = useState('')
  const [notes, setNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const togglePackage = (packageId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    )
  }

  const handleSubmit = async () => {
    if (selectedPackages.length === 0) {
      toast.error('Please select at least one package')
      return
    }

    if (!recipientLicense || !recipientFacility) {
      toast.error('Please enter recipient license and facility name')
      return
    }

    if (!estimatedDeparture || !estimatedArrival) {
      toast.error('Please enter estimated departure and arrival times')
      return
    }

    try {
      setIsCreating(true)

      const packages = selectedPackages.map((packageId) => {
        const pkg = availablePackages.find((p) => p.id === packageId)!
        return {
          packageId: pkg.id,
          packageLabel: pkg.package_tag,
          itemName: pkg.product_name,
          quantity: pkg.quantity,
          unitOfMeasure: pkg.unit_of_measure,
          packagedDate: new Date(pkg.packaged_at).toISOString().split('T')[0],
        }
      })

      const response = await fetch('/api/transfers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          siteId,
          recipientLicenseNumber: recipientLicense,
          recipientFacilityName: recipientFacility,
          transferType,
          shipmentLicenseType,
          shipmentTransactionType,
          estimatedDeparture,
          estimatedArrival,
          driverName,
          driverLicenseNumber: driverLicense,
          vehicleMake,
          vehicleModel,
          vehiclePlate,
          plannedRoute,
          packages,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create transfer manifest')
      }

      const result = await response.json()

      toast.success(`Transfer manifest ${result.manifestNumber} created successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      onTransferCreated(result.manifestId)
    } catch (error) {
      console.error('Error creating transfer:', error)
      toast.error((error as Error).message || 'Failed to create transfer manifest')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Packages ({selectedPackages.length} selected)
          </CardTitle>
          <CardDescription>
            Choose harvest packages to include in this transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {availablePackages.length === 0 ? (
            <Alert>
              <AlertDescription>
                No packages available for transfer. Ensure packages are in 'active' status.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {availablePackages.map((pkg) => (
                <label
                  key={pkg.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedPackages.includes(pkg.id)}
                    onCheckedChange={() => togglePackage(pkg.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{pkg.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Tag: {pkg.package_tag}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {pkg.quantity} {pkg.unit_of_measure}
                    </div>
                    <Badge variant="outline">{pkg.status}</Badge>
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Recipient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientLicense">Recipient License Number *</Label>
            <Input
              id="recipientLicense"
              value={recipientLicense}
              onChange={(e) => setRecipientLicense(e.target.value)}
              placeholder="LIC-12345"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientFacility">Recipient Facility Name *</Label>
            <Input
              id="recipientFacility"
              value={recipientFacility}
              onChange={(e) => setRecipientFacility(e.target.value)}
              placeholder="ABC Dispensary"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferType">Transfer Type *</Label>
              <Select value={transferType} onValueChange={setTransferType}>
                <SelectTrigger id="transferType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Return">Return</SelectItem>
                  <SelectItem value="Donation">Donation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipmentLicenseType">License Type *</Label>
              <Select value={shipmentLicenseType} onValueChange={setShipmentLicenseType}>
                <SelectTrigger id="shipmentLicenseType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cultivator">Cultivator</SelectItem>
                  <SelectItem value="Processor">Processor</SelectItem>
                  <SelectItem value="Dispensary">Dispensary</SelectItem>
                  <SelectItem value="Distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select value={shipmentTransactionType} onValueChange={setShipmentTransactionType}>
                <SelectTrigger id="transactionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Transport Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedDeparture">Estimated Departure *</Label>
              <Input
                id="estimatedDeparture"
                type="datetime-local"
                value={estimatedDeparture}
                onChange={(e) => setEstimatedDeparture(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedArrival">Estimated Arrival *</Label>
              <Input
                id="estimatedArrival"
                type="datetime-local"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <Input
                id="driverName"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="John Driver"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverLicense">Driver License</Label>
              <Input
                id="driverLicense"
                value={driverLicense}
                onChange={(e) => setDriverLicense(e.target.value)}
                placeholder="DL123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleMake">Vehicle Make</Label>
              <Input
                id="vehicleMake"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleModel">Vehicle Model</Label>
              <Input
                id="vehicleModel"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Tacoma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">License Plate</Label>
              <Input
                id="vehiclePlate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="ABC1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plannedRoute">Planned Route</Label>
            <Textarea
              id="plannedRoute"
              value={plannedRoute}
              onChange={(e) => setPlannedRoute(e.target.value)}
              placeholder="I-5 South to Highway 99..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, delivery notes, etc."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" disabled={isCreating}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isCreating || selectedPackages.length === 0}>
          {isCreating ? 'Creating Manifest...' : 'Create Transfer Manifest'}
        </Button>
      </div>
    </div>
  )
}

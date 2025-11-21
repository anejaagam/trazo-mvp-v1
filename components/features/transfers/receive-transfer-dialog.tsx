'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/label'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle2, XCircle, Package } from 'lucide-react'
import { toast } from 'sonner'

interface TransferPackage {
  id: string
  packageLabel: string
  itemName: string
  quantity: number
  unitOfMeasure: string
}

interface ReceiveTransferDialogProps {
  manifestId: string
  manifestNumber: string
  packages: TransferPackage[]
  onReceived: () => void
  trigger?: React.ReactNode
}

export function ReceiveTransferDialog({
  manifestId,
  manifestNumber,
  packages,
  onReceived,
  trigger,
}: ReceiveTransferDialogProps) {
  const [open, setOpen] = useState(false)
  const [receivedDateTime, setReceivedDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  )
  const [packageStatus, setPackageStatus] = useState<
    Record<string, { accepted: boolean; receivedQuantity?: number; rejectionReason?: string }>
  >({})
  const [isReceiving, setIsReceiving] = useState(false)

  const togglePackageAcceptance = (packageLabel: string) => {
    setPackageStatus((prev) => ({
      ...prev,
      [packageLabel]: {
        accepted: !prev[packageLabel]?.accepted,
        receivedQuantity: prev[packageLabel]?.receivedQuantity,
        rejectionReason: !prev[packageLabel]?.accepted ? undefined : prev[packageLabel]?.rejectionReason,
      },
    }))
  }

  const updateReceivedQuantity = (packageLabel: string, quantity: number) => {
    setPackageStatus((prev) => ({
      ...prev,
      [packageLabel]: {
        ...prev[packageLabel],
        receivedQuantity: quantity,
      },
    }))
  }

  const updateRejectionReason = (packageLabel: string, reason: string) => {
    setPackageStatus((prev) => ({
      ...prev,
      [packageLabel]: {
        ...prev[packageLabel],
        rejectionReason: reason,
      },
    }))
  }

  const handleReceive = async () => {
    const packageReceipts = packages.map((pkg) => ({
      packageLabel: pkg.packageLabel,
      accepted: packageStatus[pkg.packageLabel]?.accepted ?? true,
      receivedQuantity: packageStatus[pkg.packageLabel]?.receivedQuantity,
      rejectionReason: packageStatus[pkg.packageLabel]?.rejectionReason,
    }))

    // Validate rejected packages have reasons
    const rejectedWithoutReason = packageReceipts.filter(
      (p) => !p.accepted && !p.rejectionReason
    )
    if (rejectedWithoutReason.length > 0) {
      toast.error('Please provide rejection reasons for all rejected packages')
      return
    }

    try {
      setIsReceiving(true)

      const response = await fetch('/api/transfers/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestId,
          receivedDateTime,
          packages: packageReceipts,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to receive transfer')
      }

      const result = await response.json()

      toast.success(`Transfer manifest ${manifestNumber} received successfully`)

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, { duration: 5000 })
        })
      }

      setOpen(false)
      onReceived()
    } catch (error) {
      console.error('Error receiving transfer:', error)
      toast.error((error as Error).message || 'Failed to receive transfer')
    } finally {
      setIsReceiving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Receive Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Transfer Manifest</DialogTitle>
          <DialogDescription>
            Manifest {manifestNumber} - Review and accept/reject packages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Received DateTime */}
          <div className="space-y-2">
            <Label htmlFor="receivedDateTime">Received Date & Time *</Label>
            <Input
              id="receivedDateTime"
              type="datetime-local"
              value={receivedDateTime}
              onChange={(e) => setReceivedDateTime(e.target.value)}
            />
          </div>

          {/* Package List */}
          <div className="space-y-2">
            <Label>Packages ({packages.length})</Label>
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {packages.map((pkg) => {
                const status = packageStatus[pkg.packageLabel] ?? { accepted: true }
                return (
                  <div key={pkg.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={status.accepted}
                        onCheckedChange={() => togglePackageAcceptance(pkg.packageLabel)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{pkg.itemName}</span>
                          {status.accepted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Tag: {pkg.packageLabel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expected: {pkg.quantity} {pkg.unitOfMeasure}
                        </div>
                      </div>
                    </div>

                    {status.accepted && (
                      <div className="pl-9 space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`qty-${pkg.id}`} className="text-xs">
                            Received Quantity
                          </Label>
                          <Input
                            id={`qty-${pkg.id}`}
                            type="number"
                            step="0.01"
                            placeholder={pkg.quantity.toString()}
                            value={status.receivedQuantity ?? ''}
                            onChange={(e) =>
                              updateReceivedQuantity(pkg.packageLabel, Number(e.target.value))
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                    )}

                    {!status.accepted && (
                      <div className="pl-9 space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`reason-${pkg.id}`} className="text-xs text-red-600">
                            Rejection Reason *
                          </Label>
                          <Textarea
                            id={`reason-${pkg.id}`}
                            placeholder="Reason for rejecting this package..."
                            value={status.rejectionReason ?? ''}
                            onChange={(e) =>
                              updateRejectionReason(pkg.packageLabel, e.target.value)
                            }
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <Alert>
            <AlertDescription>
              <strong>Accepting:</strong>{' '}
              {packages.filter((p) => packageStatus[p.packageLabel]?.accepted !== false).length} /{' '}
              {packages.length} packages
              <br />
              <strong>Rejecting:</strong>{' '}
              {packages.filter((p) => packageStatus[p.packageLabel]?.accepted === false).length} /{' '}
              {packages.length} packages
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isReceiving}>
            Cancel
          </Button>
          <Button onClick={handleReceive} disabled={isReceiving}>
            {isReceiving ? 'Processing...' : 'Confirm Receipt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

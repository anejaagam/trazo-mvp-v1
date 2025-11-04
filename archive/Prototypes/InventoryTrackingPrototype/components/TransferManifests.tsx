import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Plus, Truck, CheckCircle2, FileText } from "lucide-react";
import type { TransferManifest, MetrcPackage } from "../lib/types";

interface TransferManifestsProps {
  manifests: TransferManifest[];
  packages: MetrcPackage[];
  onCreateManifest: (manifest: Omit<TransferManifest, "id" | "manifestNumber" | "createdAt">) => void;
}

export function TransferManifests({ manifests, packages, onCreateManifest }: TransferManifestsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [recipientLicense, setRecipientLicense] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [notes, setNotes] = useState("");

  const availablePackages = packages.filter(p => p.status === "active");

  const handleCreate = () => {
    if (!selectedPackages.length || !recipientLicense || !recipientName || !driverName || !vehicleNumber) {
      return;
    }

    const newManifest: Omit<TransferManifest, "id" | "manifestNumber" | "createdAt"> = {
      packages: selectedPackages,
      recipientLicense,
      recipientName,
      recipientAddress,
      driverName,
      driverLicense,
      vehicleNumber,
      vehicleMake: vehicleMake || undefined,
      status: "draft",
      createdBy: "Current User",
      notes: notes || undefined
    };

    onCreateManifest(newManifest);

    // Reset form
    setSelectedPackages([]);
    setRecipientLicense("");
    setRecipientName("");
    setRecipientAddress("");
    setDriverName("");
    setDriverLicense("");
    setVehicleNumber("");
    setVehicleMake("");
    setNotes("");
    setIsCreateDialogOpen(false);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const togglePackage = (packageId: string) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const getStatusBadge = (status: TransferManifest["status"]) => {
    const variants = {
      draft: { variant: "outline" as const, label: "Draft" },
      pending: { variant: "secondary" as const, label: "Pending" },
      in_transit: { variant: "default" as const, label: "In Transit" },
      delivered: { variant: "default" as const, label: "Delivered" },
      rejected: { variant: "destructive" as const, label: "Rejected" }
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const lookupRecipient = (license: string) => {
    // Mock lookup - in real app would query state database
    const mockRecipients: Record<string, { name: string; address: string }> = {
      "100-ABCD": {
        name: "Portland Cannabis Dispensary",
        address: "123 Main St, Portland, OR 97201"
      },
      "100-EFGH": {
        name: "Salem Processing Facility",
        address: "456 Industrial Blvd, Salem, OR 97301"
      }
    };

    const recipient = mockRecipients[license];
    if (recipient) {
      setRecipientName(recipient.name);
      setRecipientAddress(recipient.address);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <div>
                <CardTitle>Transfer Manifests</CardTitle>
                <CardDescription>Create Metrc-compliant transfer documentation</CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manifest
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Transfer Manifest</DialogTitle>
                  <DialogDescription>
                    Generate Metrc-compliant manifest for package transfers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Package Selection */}
                  <div className="space-y-3">
                    <Label>Select Packages to Transfer *</Label>
                    <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                      {availablePackages.length > 0 ? (
                        availablePackages.map(pkg => (
                          <div key={pkg.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={pkg.id}
                              checked={selectedPackages.includes(pkg.id)}
                              onCheckedChange={() => togglePackage(pkg.id)}
                            />
                            <label
                              htmlFor={pkg.id}
                              className="flex-1 text-sm cursor-pointer leading-tight"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{pkg.uid}</span>
                                <Badge variant="outline">{pkg.batchName}</Badge>
                              </div>
                              <p className="text-muted-foreground text-xs mt-0.5">
                                {pkg.strainName} • {pkg.weight} {pkg.weightUom}
                              </p>
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No active packages available for transfer
                        </p>
                      )}
                    </div>
                    {selectedPackages.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPackages.length} package{selectedPackages.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>

                  {/* Recipient Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm">Recipient Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="recipientLicense">Recipient License Number *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="recipientLicense"
                            value={recipientLicense}
                            onChange={(e) => setRecipientLicense(e.target.value)}
                            placeholder="e.g., 100-ABCD"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => lookupRecipient(recipientLicense)}
                          >
                            Lookup
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="recipientName">Recipient Name *</Label>
                        <Input
                          id="recipientName"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Business or individual name"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="recipientAddress">Recipient Address *</Label>
                        <Textarea
                          id="recipientAddress"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Full street address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Driver & Vehicle Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm">Driver & Vehicle Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="driverName">Driver Name *</Label>
                        <Input
                          id="driverName"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="driverLicense">Driver License #</Label>
                        <Input
                          id="driverLicense"
                          value={driverLicense}
                          onChange={(e) => setDriverLicense(e.target.value)}
                          placeholder="e.g., OR-DL-12345678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                        <Input
                          id="vehicleNumber"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          placeholder="e.g., VEH-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicleMake">Vehicle Make/Model</Label>
                        <Input
                          id="vehicleMake"
                          value={vehicleMake}
                          onChange={(e) => setVehicleMake(e.target.value)}
                          placeholder="e.g., Ford Transit"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional transfer notes..."
                      rows={2}
                    />
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Manifest will be created in draft status. Submit to Metrc to finalize transfer.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={
                        !selectedPackages.length ||
                        !recipientLicense ||
                        !recipientName ||
                        !recipientAddress ||
                        !driverName ||
                        !vehicleNumber
                      }
                    >
                      Create Manifest
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-4 border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Transfer manifest created successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manifest #</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manifests.length > 0 ? (
                  manifests.map((manifest) => (
                    <TableRow key={manifest.id}>
                      <TableCell className="font-mono text-sm">
                        {manifest.manifestNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {manifest.packages.length} pkg{manifest.packages.length !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{manifest.recipientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {manifest.recipientLicense}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{manifest.driverName}</TableCell>
                      <TableCell className="text-sm">{manifest.vehicleNumber}</TableCell>
                      <TableCell>{getStatusBadge(manifest.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(manifest.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No manifests created yet. Create your first transfer manifest.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm mb-2">Transfer Manifest Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All manifests must include valid recipient license numbers</li>
              <li>• Driver and vehicle information required for compliance</li>
              <li>• Use "Lookup" to auto-fill recipient details from state registry</li>
              <li>• Manifests must be submitted to Metrc before physical transfer</li>
              <li>• Track manifest status from draft through delivery</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

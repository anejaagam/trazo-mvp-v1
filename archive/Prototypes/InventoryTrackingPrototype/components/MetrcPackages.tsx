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
import { Plus, Package, Beaker, CheckCircle2, QrCode } from "lucide-react";
import type { MetrcPackage, Batch, PackageType, PackageStatus } from "../lib/types";

interface MetrcPackagesProps {
  packages: MetrcPackage[];
  batches: Batch[];
  onCreatePackage: (pkg: Omit<MetrcPackage, "id" | "uid" | "createdAt">) => void;
}

export function MetrcPackages({ packages, batches, onCreatePackage }: MetrcPackagesProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [packageType, setPackageType] = useState<PackageType>("harvest");
  const [weight, setWeight] = useState("");
  const [weightUom, setWeightUom] = useState("g");
  const [productName, setProductName] = useState("");
  const [notes, setNotes] = useState("");

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  const handleCreate = () => {
    if (!selectedBatch || !weight) return;

    const newPackage: Omit<MetrcPackage, "id" | "uid" | "createdAt"> = {
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      packageType: packageType,
      status: packageType === "sample" ? "lab_sample" : "active",
      weight: Number(weight),
      weightUom: weightUom,
      strainName: selectedBatch.strain,
      productName: productName || undefined,
      createdBy: "Current User",
      notes: notes || undefined,
      labSampleDate: packageType === "sample" ? new Date().toISOString() : undefined
    };

    onCreatePackage(newPackage);

    // Reset form
    setWeight("");
    setProductName("");
    setNotes("");
    setIsCreateDialogOpen(false);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getStatusBadge = (status: PackageStatus) => {
    const variants: Record<PackageStatus, { variant: any; label: string }> = {
      active: { variant: "default", label: "Active" },
      lab_sample: { variant: "secondary", label: "Lab Sample" },
      in_transit: { variant: "outline", label: "In Transit" },
      transferred: { variant: "outline", label: "Transferred" },
      destroyed: { variant: "destructive", label: "Destroyed" }
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: PackageType) => {
    const variants: Record<PackageType, { color: string; label: string }> = {
      harvest: { color: "bg-green-100 text-green-800", label: "Harvest" },
      product: { color: "bg-blue-100 text-blue-800", label: "Product" },
      sample: { color: "bg-purple-100 text-purple-800", label: "Sample" },
      waste: { color: "bg-gray-100 text-gray-800", label: "Waste" }
    };
    const config = variants[type];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <div>
                <CardTitle>Metrc Packages</CardTitle>
                <CardDescription>Create and manage Metrc-compliant harvest packages</CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Package
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Metrc Package</DialogTitle>
                  <DialogDescription>
                    Convert harvest or create sample package with UID assignment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch">Source Batch *</Label>
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger id="batch">
                        <SelectValue placeholder="Select batch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.filter(b => !b.locked).map(batch => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name} {batch.strain && `- ${batch.strain}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="packageType">Package Type *</Label>
                      <Select value={packageType} onValueChange={(v) => setPackageType(v as PackageType)}>
                        <SelectTrigger id="packageType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="harvest">Harvest</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="sample">Lab Sample</SelectItem>
                          <SelectItem value="waste">Waste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="weight"
                          type="number"
                          min="0"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0.0"
                          className="flex-1"
                        />
                        <Select value={weightUom} onValueChange={setWeightUom}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="oz">oz</SelectItem>
                            <SelectItem value="lb">lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {packageType === "sample" && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <Beaker className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-800">
                        This package will be marked as a lab sample and linked to testing workflow.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Blue Dream - Flower"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes about this package..."
                      rows={2}
                    />
                  </div>

                  <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertDescription>
                      A unique Metrc UID will be automatically assigned upon creation.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!selectedBatch || !weight}>
                      Create Package
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
                Package created successfully with Metrc UID assigned!
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metrc UID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Strain</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test Results</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-mono text-sm">{pkg.uid}</TableCell>
                      <TableCell>{getTypeBadge(pkg.packageType)}</TableCell>
                      <TableCell>{pkg.batchName}</TableCell>
                      <TableCell>{pkg.strainName || "—"}</TableCell>
                      <TableCell>
                        {pkg.weight} {pkg.weightUom}
                      </TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      <TableCell>
                        {pkg.testResults ? (
                          <Badge variant={pkg.testResults.passed ? "default" : "destructive"}>
                            {pkg.testResults.passed ? "Passed" : "Failed"}
                          </Badge>
                        ) : pkg.packageType === "sample" ? (
                          <Badge variant="outline">Pending</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(pkg.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No packages created yet. Create your first Metrc package to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm mb-2">Metrc Package Guidelines:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Each package receives a unique Metrc UID (format: 1A4060300002331000000XXX)</li>
              <li>• Lab sample packages are automatically linked to testing workflow</li>
              <li>• Harvest packages must be created before transfer manifests</li>
              <li>• Package weight must be recorded in compliance with state regulations</li>
              <li>• All packages remain in the tracking system for full traceability</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

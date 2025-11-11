import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Plus, Printer, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import type { ComplianceLabel, MetrcPackage, Batch } from "../lib/types";

interface ComplianceLabelsProps {
  labels: ComplianceLabel[];
  packages: MetrcPackage[];
  batches: Batch[];
  onCreateLabel: (label: Omit<ComplianceLabel, "id" | "createdAt">) => void;
  onPrintLabel: (labelId: string) => void;
}

export function ComplianceLabels({ labels, packages, batches, onCreateLabel, onPrintLabel }: ComplianceLabelsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<ComplianceLabel | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [labelType, setLabelType] = useState<ComplianceLabel["labelType"]>("package");
  const [state, setState] = useState<ComplianceLabel["state"]>("OR");
  const [productName, setProductName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [preApprovalNumber, setPreApprovalNumber] = useState("");
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([
    "For use only by adults 21 years of age or older",
    "Keep out of reach of children"
  ]);

  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const selectedBatch = selectedPackage ? batches.find(b => b.id === selectedPackage.batchId) : null;

  const standardWarnings = [
    "For use only by adults 21 years of age or older",
    "Keep out of reach of children",
    "Marijuana use during pregnancy or breastfeeding can be harmful",
    "Marijuana impairs your ability to drive and operate machinery",
    "Smoking is hazardous to your health",
    "There may be health risks associated with consumption of this product"
  ];

  const toggleWarning = (warning: string) => {
    setSelectedWarnings(prev =>
      prev.includes(warning)
        ? prev.filter(w => w !== warning)
        : [...prev, warning]
    );
  };

  const handleCreate = () => {
    if (!selectedPackage || !productName) return;

    const newLabel: Omit<ComplianceLabel, "id" | "createdAt"> = {
      packageId: selectedPackage.id,
      batchId: selectedPackage.batchId,
      labelType,
      state,
      productName,
      strainName: selectedPackage.strainName,
      weight: `${selectedPackage.weight}${selectedPackage.weightUom}`,
      thc: selectedPackage.testResults?.thcPercent ? `${selectedPackage.testResults.thcPercent}%` : undefined,
      cbd: selectedPackage.testResults?.cbdPercent ? `${selectedPackage.testResults.cbdPercent}%` : undefined,
      testDate: selectedPackage.testResults?.testDate ? new Date(selectedPackage.testResults.testDate).toISOString().split('T')[0] : undefined,
      harvestDate: selectedBatch?.startDate,
      packageDate: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || undefined,
      warnings: selectedWarnings,
      universalSymbol: true,
      preApprovalNumber: state === "OR" ? preApprovalNumber || undefined : undefined,
      licenseNumber: "100-XXXX"
    };

    onCreateLabel(newLabel);

    // Reset form
    setProductName("");
    setExpiryDate("");
    setPreApprovalNumber("");
    setIsCreateDialogOpen(false);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePrint = (label: ComplianceLabel) => {
    setSelectedLabel(label);
    setIsPrintPreviewOpen(true);
  };

  const confirmPrint = () => {
    if (selectedLabel) {
      onPrintLabel(selectedLabel.id);
      setIsPrintPreviewOpen(false);
      setSelectedLabel(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <div>
                <CardTitle>Compliance Labels</CardTitle>
                <CardDescription>Generate state-compliant product labels</CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Label
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Compliance Label</DialogTitle>
                  <DialogDescription>
                    Generate state-compliant label with required warnings and symbols
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="package">Package *</Label>
                      <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                        <SelectTrigger id="package">
                          <SelectValue placeholder="Select package..." />
                        </SelectTrigger>
                        <SelectContent>
                          {packages.filter(p => p.status === "active").map(pkg => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.uid} - {pkg.batchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="labelType">Label Type *</Label>
                      <Select value={labelType} onValueChange={(v) => setLabelType(v as ComplianceLabel["labelType"])}>
                        <SelectTrigger id="labelType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="package">Package Label</SelectItem>
                          <SelectItem value="product">Product Label</SelectItem>
                          <SelectItem value="sample">Sample Label</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedPackage && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription className="text-blue-800 text-sm">
                        <strong>Package Info:</strong> {selectedPackage.strainName} • {selectedPackage.weight}{selectedPackage.weightUom}
                        {selectedPackage.testResults && (
                          <> • THC: {selectedPackage.testResults.thcPercent}% • CBD: {selectedPackage.testResults.cbdPercent}%</>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select value={state} onValueChange={(v) => setState(v as ComplianceLabel["state"])}>
                        <SelectTrigger id="state">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Blue Dream - Flower"
                      />
                    </div>
                  </div>

                  {state === "OR" && (
                    <div className="space-y-2">
                      <Label htmlFor="preApproval">OR Pre-Approval Number</Label>
                      <Input
                        id="preApproval"
                        value={preApprovalNumber}
                        onChange={(e) => setPreApprovalNumber(e.target.value)}
                        placeholder="e.g., OR-LABEL-2024-1234"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for Oregon - submit label design for pre-approval
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <Label>Required Warnings *</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {standardWarnings.map(warning => (
                        <div key={warning} className="flex items-start space-x-3">
                          <Checkbox
                            id={warning}
                            checked={selectedWarnings.includes(warning)}
                            onCheckedChange={() => toggleWarning(warning)}
                          />
                          <label
                            htmlFor={warning}
                            className="text-sm cursor-pointer leading-tight flex-1"
                          >
                            {warning}
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedWarnings.length < 2 && (
                      <p className="text-xs text-red-600">
                        At least 2 warnings required for compliance
                      </p>
                    )}
                  </div>

                  <Alert className="border-orange-200 bg-orange-50">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">Universal Symbol Required</AlertTitle>
                    <AlertDescription className="text-orange-700 text-sm">
                      All labels will include the state-mandated universal cannabis symbol.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreate} 
                      disabled={!selectedPackage || !productName || selectedWarnings.length < 2}
                    >
                      Create Label
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
                Compliance label created successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>THC/CBD</TableHead>
                  <TableHead>Pre-Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.length > 0 ? (
                  labels.map((label) => (
                    <TableRow key={label.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm">{label.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {label.strainName} • {label.weight}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {label.labelType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{label.state}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {label.thc && label.cbd ? (
                          <>THC: {label.thc} • CBD: {label.cbd}</>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {label.preApprovalNumber || "—"}
                      </TableCell>
                      <TableCell>
                        {label.printedAt ? (
                          <Badge variant="default">Printed</Badge>
                        ) : (
                          <Badge variant="secondary">Ready</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrint(label)}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No labels created yet. Create your first compliance label.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm mb-2">Label Compliance Requirements:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All labels must include universal cannabis symbol</li>
              <li>• Minimum 2 state-mandated warnings required</li>
              <li>• Oregon: Labels require pre-approval (submit design to OLCC)</li>
              <li>• Include THC/CBD percentages from lab test results</li>
              <li>• License number and package date must be visible</li>
              <li>• Labels must be legible and permanently affixed to package</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview Dialog */}
      <Dialog open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Label Print Preview</DialogTitle>
            <DialogDescription>
              Review label before printing
            </DialogDescription>
          </DialogHeader>
          {selectedLabel && (
            <div className="border-2 border-gray-800 rounded-lg p-6 bg-white space-y-4">
              {/* Universal Symbol */}
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Product Info */}
              <div className="text-center border-b pb-3">
                <h3 className="text-lg">{selectedLabel.productName}</h3>
                {selectedLabel.strainName && (
                  <p className="text-sm text-gray-600">{selectedLabel.strainName}</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Weight:</span>
                  <span>{selectedLabel.weight}</span>
                </div>
                {selectedLabel.thc && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">THC:</span>
                    <span>{selectedLabel.thc}</span>
                  </div>
                )}
                {selectedLabel.cbd && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CBD:</span>
                    <span>{selectedLabel.cbd}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Package Date:</span>
                  <span>{new Date(selectedLabel.packageDate).toLocaleDateString()}</span>
                </div>
                {selectedLabel.testDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Test Date:</span>
                    <span>{new Date(selectedLabel.testDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Warnings */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs uppercase tracking-wide">Warnings:</p>
                {selectedLabel.warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs leading-tight">
                    ⚠ {warning}
                  </p>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t pt-3 text-xs text-gray-600 space-y-1">
                <p>License: {selectedLabel.licenseNumber}</p>
                {selectedLabel.preApprovalNumber && (
                  <p>OR Pre-Approval: {selectedLabel.preApprovalNumber}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

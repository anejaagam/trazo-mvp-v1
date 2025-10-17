import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import type { Item, Movement, Batch, StockBalance } from "../lib/types";

interface IssueInventoryProps {
  items: Item[];
  batches: Batch[];
  stockBalances: StockBalance[];
  onIssue: (movement: Omit<Movement, "id" | "timestamp">) => void;
}

export function IssueInventory({ items, batches, stockBalances, onIssue }: IssueInventoryProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingIssue, setPendingIssue] = useState<Omit<Movement, "id" | "timestamp"> | null>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const stockBalance = stockBalances.find(sb => sb.itemId === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedBatch || !quantity) return;

    const qtyNum = Number(quantity);
    if (stockBalance && qtyNum > stockBalance.onHand) {
      alert(`Insufficient stock. Available: ${stockBalance.onHand} ${selectedItem.uom}`);
      return;
    }

    const movement: Omit<Movement, "id" | "timestamp"> = {
      type: "issue",
      itemId: selectedItem.id,
      quantity: qtyNum,
      uom: selectedItem.uom,
      siteId: "site-1",
      batchId: selectedBatch.id,
      batchName: selectedBatch.name,
      actorId: "",
      actorName: ""
    };

    // If item has safety note, show safety dialog first
    if (selectedItem.safetyNote) {
      setPendingIssue(movement);
      setShowSafetyDialog(true);
    } else {
      confirmIssue(movement);
    }
  };

  const confirmIssue = (movement: Omit<Movement, "id" | "timestamp">) => {
    onIssue(movement);

    // Reset form
    setQuantity("");
    setPendingIssue(null);
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSafetyConfirm = () => {
    if (pendingIssue) {
      confirmIssue(pendingIssue);
      setShowSafetyDialog(false);
    }
  };

  const activeBatches = batches.filter(b => b.status === "active" && !b.locked);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <div>
              <CardTitle>Issue to Batch</CardTitle>
              <CardDescription>Consume inventory for batch production</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-4 border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Inventory issued successfully! Batch consumption recorded.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch">Batch *</Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger id="batch">
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {activeBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} {batch.strain && `- ${batch.strain}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeBatches.length === 0 && (
                <p className="text-xs text-orange-600">No active batches available</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item">Item *</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger id="item">
                  <SelectValue placeholder="Select an item..." />
                </SelectTrigger>
                <SelectContent>
                  {items.filter(i => i.active).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.uom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && stockBalance && (
              <Alert>
                <AlertDescription>
                  Available stock: <strong>{stockBalance.onHand} {selectedItem.uom}</strong>
                </AlertDescription>
              </Alert>
            )}

            {selectedItem?.safetyNote && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Safety Note</AlertTitle>
                <AlertDescription className="text-xs whitespace-pre-line">
                  {selectedItem.safetyNote}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity to issue"
                required
              />
              {selectedItem && (
                <p className="text-xs text-muted-foreground">Unit: {selectedItem.uom}</p>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              <Button 
                type="submit" 
                disabled={!selectedItem || !selectedBatch || !quantity}
                className="flex-1"
              >
                Issue to Batch
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setSelectedItemId("");
                  setSelectedBatchId("");
                  setQuantity("");
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm mb-2">Instructions:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Select the batch that will consume this inventory</li>
              <li>• Choose the item to issue</li>
              <li>• Enter the quantity being consumed</li>
              <li>• For hazardous materials, confirm safety acknowledgment</li>
              <li>• Consumption will be attributed to the selected batch</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Safety Interstitial Dialog */}
      <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Safety Confirmation Required
            </DialogTitle>
            <DialogDescription>
              You are about to issue a hazardous material. Please confirm you have read and understood the safety requirements.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem?.safetyNote && (
            <Alert variant="destructive">
              <AlertDescription className="whitespace-pre-line text-sm">
                {selectedItem.safetyNote}
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-sm">
              By confirming, you acknowledge that you:
            </p>
            <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
              <li>Have read and understood the safety requirements</li>
              <li>Are wearing appropriate PPE</li>
              <li>Will handle this material according to safety protocols</li>
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSafetyDialog(false);
              setPendingIssue(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSafetyConfirm} className="bg-orange-600 hover:bg-orange-700">
              I Confirm - Proceed with Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

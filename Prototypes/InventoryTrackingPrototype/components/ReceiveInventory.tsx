import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, Package } from "lucide-react";
import type { Item, Movement } from "../lib/types";

interface ReceiveInventoryProps {
  items: Item[];
  onReceive: (movement: Omit<Movement, "id" | "timestamp">) => void;
}

export function ReceiveInventory({ items, onReceive }: ReceiveInventoryProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;

    const movement: Omit<Movement, "id" | "timestamp"> = {
      type: "receive",
      itemId: selectedItem.id,
      quantity: Number(quantity),
      uom: selectedItem.uom,
      siteId: "site-1",
      lotCode: lotCode || undefined,
      expiryDate: expiryDate || undefined,
      actorId: "",
      actorName: ""
    };

    onReceive(movement);

    // Reset form
    setQuantity("");
    setLotCode("");
    setExpiryDate("");
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <div>
              <CardTitle>Receive Inventory</CardTitle>
              <CardDescription>Record incoming stock deliveries</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-4 border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Inventory received successfully! Stock levels updated.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  required
                />
                {selectedItem && (
                  <p className="text-xs text-muted-foreground">Unit: {selectedItem.uom}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lotCode">Lot/Batch Code</Label>
                <Input
                  id="lotCode"
                  value={lotCode}
                  onChange={(e) => setLotCode(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              {expiryDate && (() => {
                const expiry = new Date(expiryDate);
                const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
                  return (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Warning: This lot expires in {daysUntilExpiry} days (near-expiry)
                      </AlertDescription>
                    </Alert>
                  );
                }
              })()}
            </div>

            <div className="pt-4 flex gap-2">
              <Button type="submit" disabled={!selectedItem || !quantity} className="flex-1">
                Receive Inventory
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setSelectedItemId("");
                  setQuantity("");
                  setLotCode("");
                  setExpiryDate("");
                }}
              >
                Clear
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm mb-2">Instructions:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Select the item you are receiving from the dropdown</li>
              <li>• Enter the quantity being received</li>
              <li>• Optionally record lot/batch code for traceability</li>
              <li>• Add expiry date if applicable (system will alert if near-expiry)</li>
              <li>• Stock levels will be updated immediately upon submission</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle2, Settings, Trash2, AlertTriangle } from "lucide-react";
import type { Item, Movement, StockBalance, UserRole } from "../lib/types";

interface AdjustDisposeProps {
  items: Item[];
  stockBalances: StockBalance[];
  onSubmit: (movement: Omit<Movement, "id" | "timestamp">) => void;
  userRole: UserRole;
}

export function AdjustDispose({ items, stockBalances, onSubmit, userRole }: AdjustDisposeProps) {
  const [activeTab, setActiveTab] = useState<"adjust" | "dispose">("adjust");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedItem = items.find(i => i.id === selectedItemId);
  const stockBalance = stockBalances.find(sb => sb.itemId === selectedItemId);

  // Role-based permissions
  const canAdjust = userRole === "site_manager" || userRole === "compliance";
  const canDispose = userRole === "site_manager" || userRole === "compliance";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity || !reason) return;

    if (activeTab === "adjust" && !canAdjust) {
      alert("You do not have permission to adjust inventory.");
      return;
    }

    if (activeTab === "dispose" && !canDispose) {
      alert("You do not have permission to dispose inventory.");
      return;
    }

    const movement: Omit<Movement, "id" | "timestamp"> = {
      type: activeTab,
      itemId: selectedItem.id,
      quantity: Math.abs(Number(quantity)),
      uom: selectedItem.uom,
      siteId: "site-1",
      reason: reason,
      evidenceLink: evidenceLink || undefined,
      actorId: "",
      actorName: ""
    };

    onSubmit(movement);

    // Reset form
    setQuantity("");
    setReason("");
    setEvidenceLink("");
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Adjust & Dispose</CardTitle>
          <CardDescription>Stock adjustments and disposal management</CardDescription>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-4 border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {activeTab === "adjust" ? "Adjustment" : "Disposal"} recorded successfully!
              </AlertDescription>
            </Alert>
          )}

          {userRole === "operator" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your role does not have permission to adjust or dispose inventory. Contact your Site Manager.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "adjust" | "dispose")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="adjust" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Adjust Stock
              </TabsTrigger>
              <TabsTrigger value="dispose" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Dispose
              </TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="space-y-4 mt-4">
              <Alert>
                <AlertDescription>
                  Use adjustments for cycle counts, corrections, or reconciliation. All adjustments require a reason.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-adjust">Item *</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger id="item-adjust">
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
                      Current stock: <strong>{stockBalance.onHand} {selectedItem.uom}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity-adjust">Adjustment Quantity *</Label>
                  <Input
                    id="quantity-adjust"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity (positive or negative)"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use positive numbers to add, negative to subtract
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason-adjust">Reason *</Label>
                  <Textarea
                    id="reason-adjust"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Cycle count correction, damaged goods, data entry error..."
                    rows={3}
                    required
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={!selectedItem || !quantity || !reason || !canAdjust}
                    className="flex-1"
                  >
                    Submit Adjustment
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSelectedItemId("");
                      setQuantity("");
                      setReason("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="dispose" className="space-y-4 mt-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Disposal is permanent and requires justification. Evidence (photo/document) is recommended.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-dispose">Item *</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger id="item-dispose">
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

                <div className="space-y-2">
                  <Label htmlFor="quantity-dispose">Quantity to Dispose *</Label>
                  <Input
                    id="quantity-dispose"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity to dispose"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason-dispose">Disposal Reason *</Label>
                  <Textarea
                    id="reason-dispose"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Expired, damaged, contaminated, recalled..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence">Evidence Link (Photo/Document)</Label>
                  <Input
                    id="evidence"
                    value={evidenceLink}
                    onChange={(e) => setEvidenceLink(e.target.value)}
                    placeholder="Enter URL or reference to evidence..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended for compliance and audit purposes
                  </p>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={!selectedItem || !quantity || !reason || !canDispose}
                    className="flex-1"
                  >
                    Submit Disposal
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setSelectedItemId("");
                      setQuantity("");
                      setReason("");
                      setEvidenceLink("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

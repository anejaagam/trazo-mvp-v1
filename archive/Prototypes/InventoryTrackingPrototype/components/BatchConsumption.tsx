import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Package, Lock } from "lucide-react";
import type { Batch, Movement, Item } from "../lib/types";

interface BatchConsumptionProps {
  batches: Batch[];
  movements: Movement[];
  items: Item[];
}

export function BatchConsumption({ batches, movements, items }: BatchConsumptionProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches.length > 0 ? batches[0].id : ""
  );

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  // Get all movements for the selected batch
  const batchMovements = movements.filter(m => m.batchId === selectedBatchId);

  // Calculate totals by item
  const consumptionTotals = batchMovements.reduce((acc, movement) => {
    const existing = acc.find(t => t.itemId === movement.itemId);
    if (existing) {
      existing.quantity += movement.quantity;
      existing.movements.push(movement);
    } else {
      acc.push({
        itemId: movement.itemId,
        quantity: movement.quantity,
        movements: [movement]
      });
    }
    return acc;
  }, [] as Array<{ itemId: string; quantity: number; movements: Movement[] }>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <div className="flex-1">
              <CardTitle>Batch Consumption</CardTitle>
              <CardDescription>View attributed inputs per batch for compliance packets</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Batch Selector */}
            <div className="space-y-2">
              <Label htmlFor="batch-select">Select Batch</Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger id="batch-select">
                  <SelectValue placeholder="Select a batch..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} {batch.strain && `- ${batch.strain}`} 
                      {batch.locked && " 🔒"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBatch && (
              <>
                {/* Batch Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Batch Name</p>
                      <p className="flex items-center gap-2">
                        {selectedBatch.name}
                        {selectedBatch.locked && <Lock className="w-3 h-3" />}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Strain</p>
                      <p>{selectedBatch.strain || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p>{new Date(selectedBatch.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={selectedBatch.status === "active" ? "default" : "secondary"}>
                        {selectedBatch.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedBatch.locked && (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      This batch is locked. Related movements are read-only for compliance purposes.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Consumption Summary */}
                {consumptionTotals.length > 0 ? (
                  <>
                    <div>
                      <h3 className="mb-4">Consumption Summary</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Total Quantity</TableHead>
                              <TableHead># Movements</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {consumptionTotals.map(total => {
                              const item = items.find(i => i.id === total.itemId);
                              if (!item) return null;

                              return (
                                <TableRow key={total.itemId}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{item.category}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {total.quantity.toFixed(2)} {item.uom}
                                  </TableCell>
                                  <TableCell>{total.movements.length}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Detailed Movements */}
                    <div>
                      <h3 className="mb-4">Detailed Movement History</h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date/Time</TableHead>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Lot Code</TableHead>
                              <TableHead>Actor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batchMovements
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map(movement => {
                                const item = items.find(i => i.id === movement.itemId);
                                if (!item) return null;

                                return (
                                  <TableRow key={movement.id}>
                                    <TableCell className="text-sm">
                                      {new Date(movement.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                      {movement.quantity} {movement.uom}
                                    </TableCell>
                                    <TableCell>
                                      {movement.lotCode || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {movement.actorName}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No inventory has been issued to this batch yet
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h4 className="mb-2">Batch Attribution for Compliance</h4>
          <p className="text-sm text-muted-foreground">
            This view shows all inputs consumed by a batch. When a batch report is generated, 
            these records become locked and read-only to maintain compliance integrity. 
            Use this data for batch packets, audits, and traceability requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

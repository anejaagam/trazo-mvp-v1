import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ClipboardList, Filter } from "lucide-react";
import type { Movement, Item, Batch } from "../lib/types";

interface MovementsLogProps {
  movements: Movement[];
  items: Item[];
  batches: Batch[];
}

export function MovementsLog({ movements, items, batches }: MovementsLogProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterItem, setFilterItem] = useState<string>("all");
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMovements = movements.filter(movement => {
    if (filterType !== "all" && movement.type !== filterType) return false;
    if (filterItem !== "all" && movement.itemId !== filterItem) return false;
    if (filterBatch !== "all" && movement.batchId !== filterBatch) return false;
    
    if (searchTerm) {
      const item = items.find(i => i.id === movement.itemId);
      const searchLower = searchTerm.toLowerCase();
      return (
        item?.name.toLowerCase().includes(searchLower) ||
        movement.actorName.toLowerCase().includes(searchLower) ||
        movement.lotCode?.toLowerCase().includes(searchLower) ||
        movement.reason?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case "receive": return "default";
      case "issue": return "secondary";
      case "adjust": return "outline";
      case "dispose": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          <div>
            <CardTitle>Movements Log</CardTitle>
            <CardDescription>Immutable audit trail of all inventory transactions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-type">Movement Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="receive">Receive</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="adjust">Adjust</SelectItem>
                  <SelectItem value="dispose">Dispose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-item">Item</Label>
              <Select value={filterItem} onValueChange={setFilterItem}>
                <SelectTrigger id="filter-item">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-batch">Batch</Label>
              <Select value={filterBatch} onValueChange={setFilterBatch}>
                <SelectTrigger id="filter-batch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search movements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {(filterType !== "all" || filterItem !== "all" || filterBatch !== "all" || searchTerm) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilterType("all");
                setFilterItem("all");
                setFilterBatch("all");
                setSearchTerm("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredMovements.length} of {movements.length} movements
        </div>

        {/* Movements Table */}
        {filteredMovements.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => {
                  const item = items.find(i => i.id === movement.itemId);
                  
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <Badge variant={getMovementBadgeVariant(movement.type)}>
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <span className={
                          movement.type === "receive" ? "text-green-600" :
                          movement.type === "dispose" ? "text-red-600" :
                          ""
                        }>
                          {movement.type === "receive" ? "+" : movement.type === "dispose" ? "-" : ""}
                          {movement.quantity} {movement.uom}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.batchName || "—"}
                      </TableCell>
                      <TableCell>
                        {movement.lotCode || "—"}
                        {movement.expiryDate && (
                          <div className="text-xs text-muted-foreground">
                            Exp: {new Date(movement.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {movement.actorName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(movement.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {movement.reason || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {movements.length === 0 
              ? "No movements recorded yet"
              : "No movements match the current filters"
            }
          </div>
        )}

        {/* Audit Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Audit Trail:</strong> All movements are immutable and timestamped. 
            Once a movement is recorded, it cannot be modified or deleted, ensuring complete traceability for compliance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

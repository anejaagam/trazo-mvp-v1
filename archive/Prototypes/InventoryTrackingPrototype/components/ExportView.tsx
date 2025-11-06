import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import type { Movement, Item, Batch } from "../lib/types";

interface ExportViewProps {
  movements: Movement[];
  items: Item[];
  batches: Batch[];
}

export function ExportView({ movements, items, batches }: ExportViewProps) {
  const [exportType, setExportType] = useState<"movements" | "batch_consumption">("movements");
  const [filterType, setFilterType] = useState("all");
  const [filterItem, setFilterItem] = useState("all");
  const [filterBatch, setFilterBatch] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleExportCSV = () => {
    let data: any[] = [];
    let headers: string[] = [];

    if (exportType === "movements") {
      // Filter movements
      const filtered = movements.filter(m => {
        if (filterType !== "all" && m.type !== filterType) return false;
        if (filterItem !== "all" && m.itemId !== filterItem) return false;
        if (filterBatch !== "all" && m.batchId !== filterBatch) return false;
        
        if (startDate) {
          const moveDate = new Date(m.timestamp);
          const start = new Date(startDate);
          if (moveDate < start) return false;
        }
        
        if (endDate) {
          const moveDate = new Date(m.timestamp);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (moveDate > end) return false;
        }
        
        return true;
      });

      headers = [
        "Movement ID",
        "Type",
        "Item",
        "Quantity",
        "UoM",
        "Batch",
        "Lot Code",
        "Expiry Date",
        "Actor",
        "Timestamp (UTC)",
        "Reason",
        "Evidence Link"
      ];

      data = filtered.map(m => {
        const item = items.find(i => i.id === m.itemId);
        return {
          "Movement ID": m.id,
          "Type": m.type,
          "Item": item?.name || "Unknown",
          "Quantity": m.quantity,
          "UoM": m.uom,
          "Batch": m.batchName || "",
          "Lot Code": m.lotCode || "",
          "Expiry Date": m.expiryDate || "",
          "Actor": m.actorName,
          "Timestamp (UTC)": new Date(m.timestamp).toISOString(),
          "Reason": m.reason || "",
          "Evidence Link": m.evidenceLink || ""
        };
      });
    } else {
      // Batch consumption export
      const batchId = filterBatch !== "all" ? filterBatch : (batches[0]?.id || "");
      const batchMovements = movements.filter(m => m.batchId === batchId);
      
      const totals = batchMovements.reduce((acc, m) => {
        const existing = acc.find(t => t.itemId === m.itemId);
        if (existing) {
          existing.quantity += m.quantity;
        } else {
          acc.push({
            itemId: m.itemId,
            quantity: m.quantity
          });
        }
        return acc;
      }, [] as Array<{ itemId: string; quantity: number }>);

      const batch = batches.find(b => b.id === batchId);

      headers = ["Batch", "Item", "Category", "Total Quantity", "UoM", "# Movements"];

      data = totals.map(t => {
        const item = items.find(i => i.id === t.itemId);
        const movementCount = batchMovements.filter(m => m.itemId === t.itemId).length;
        
        return {
          "Batch": batch?.name || "",
          "Item": item?.name || "Unknown",
          "Category": item?.category || "",
          "Total Quantity": t.quantity,
          "UoM": item?.uom || "",
          "# Movements": movementCount
        };
      });
    }

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(h => {
        const value = row[h];
        // Escape commas and quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(","))
    ].join("\n");

    // Trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportType}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Calculate stats
  const getFilteredCount = () => {
    if (exportType === "movements") {
      return movements.filter(m => {
        if (filterType !== "all" && m.type !== filterType) return false;
        if (filterItem !== "all" && m.itemId !== filterItem) return false;
        if (filterBatch !== "all" && m.batchId !== filterBatch) return false;
        if (startDate && new Date(m.timestamp) < new Date(startDate)) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(m.timestamp) > end) return false;
        }
        return true;
      }).length;
    } else {
      const batchId = filterBatch !== "all" ? filterBatch : (batches[0]?.id || "");
      return movements.filter(m => m.batchId === batchId).length;
    }
  };

  const filteredCount = getFilteredCount();

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <div>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Generate CSV/PDF reports for audits and compliance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <Alert className="mb-4 border-green-600 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Export generated successfully! Check your downloads folder.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Export Type */}
            <div className="space-y-2">
              <Label>Export Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={exportType === "movements" ? "default" : "outline"}
                  onClick={() => setExportType("movements")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Movements Log
                </Button>
                <Button
                  variant={exportType === "batch_consumption" ? "default" : "outline"}
                  onClick={() => setExportType("batch_consumption")}
                  className="justify-start"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Batch Consumption
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="text-sm">Filters</h4>
              
              {exportType === "movements" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="export-type-filter">Movement Type</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger id="export-type-filter">
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
                      <Label htmlFor="export-item-filter">Item</Label>
                      <Select value={filterItem} onValueChange={setFilterItem}>
                        <SelectTrigger id="export-item-filter">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="export-batch-filter">Batch {exportType === "batch_consumption" && "*"}</Label>
                <Select value={filterBatch} onValueChange={setFilterBatch}>
                  <SelectTrigger id="export-batch-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {exportType === "movements" && <SelectItem value="all">All Batches</SelectItem>}
                    {batches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    <strong>Records to export:</strong> {filteredCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CSV format with UTC timestamps
                  </p>
                </div>
                <Badge>CSV</Badge>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex gap-2">
              <Button 
                onClick={handleExportCSV} 
                disabled={filteredCount === 0}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate CSV Export
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setFilterType("all");
                  setFilterItem("all");
                  setFilterBatch("all");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Filters
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm mb-2">Export Guidelines:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Movements Log: Complete audit trail of all inventory transactions</li>
                <li>• Batch Consumption: Summary of inputs used per batch</li>
                <li>• Timestamps are stored in UTC for consistency</li>
                <li>• Use date filters to export specific periods for audits</li>
                <li>• All exports include actor information for accountability</li>
                <li>• Records are immutable once exported for compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

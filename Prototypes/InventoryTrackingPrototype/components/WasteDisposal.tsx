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
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Plus, Trash2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { WasteLog, Batch } from "../lib/types";

interface WasteDisposalProps {
  wasteLogs: WasteLog[];
  batches: Batch[];
  onCreateWasteLog: (log: Omit<WasteLog, "id" | "createdAt">) => void;
}

export function WasteDisposal({ wasteLogs, batches, onCreateWasteLog }: WasteDisposalProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasteType, setWasteType] = useState<WasteLog["wasteType"]>("harvest");
  const [reason, setReason] = useState<WasteLog["reason"]>("damaged");
  const [reasonDetail, setReasonDetail] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUom, setWeightUom] = useState("g");
  const [method, setMethod] = useState<WasteLog["method"]>("grind_mix");
  const [methodDetail, setMethodDetail] = useState("");
  const [witnessName, setWitnessName] = useState("");

  const handleCreate = () => {
    if (!weight) return;

    const now = new Date();
    const holdEnd = new Date(now);
    holdEnd.setDate(holdEnd.getDate() + 3); // 3-day hold for Oregon

    const newLog: Omit<WasteLog, "id" | "createdAt"> = {
      wasteType,
      reason,
      reasonDetail: reasonDetail || undefined,
      weight: Number(weight),
      weightUom,
      method,
      methodDetail: methodDetail || undefined,
      holdStartDate: now.toISOString(),
      holdEndDate: holdEnd.toISOString(),
      status: "hold",
      witnessName: witnessName || undefined,
      createdBy: "Current User"
    };

    onCreateWasteLog(newLog);

    // Reset form
    setWeight("");
    setReasonDetail("");
    setMethodDetail("");
    setWitnessName("");
    setIsCreateDialogOpen(false);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getStatusBadge = (log: WasteLog) => {
    const now = new Date();
    const holdEnd = new Date(log.holdEndDate);
    
    if (log.status === "disposed") {
      return <Badge variant="default">Disposed</Badge>;
    } else if (log.status === "ready") {
      return <Badge variant="secondary">Ready for Disposal</Badge>;
    } else if (holdEnd > now) {
      const daysRemaining = Math.ceil((holdEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="w-3 h-3" />
          Hold ({daysRemaining}d left)
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Ready for Disposal</Badge>;
    }
  };

  const getHoldProgress = (log: WasteLog) => {
    const start = new Date(log.holdStartDate);
    const end = new Date(log.holdEndDate);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min((elapsed / total) * 100, 100);
  };

  const activeHoldLogs = wasteLogs.filter(l => l.status === "hold");
  const readyLogs = wasteLogs.filter(l => {
    if (l.status === "disposed") return false;
    const holdEnd = new Date(l.holdEndDate);
    return holdEnd <= new Date();
  });

  return (
    <div className="space-y-6">
      {/* Alert Cards */}
      {(activeHoldLogs.length > 0 || readyLogs.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {activeHoldLogs.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Active Hold Period</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {activeHoldLogs.length} waste log{activeHoldLogs.length !== 1 ? "s" : ""} in 3-day hold period
              </AlertDescription>
            </Alert>
          )}
          {readyLogs.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Ready for Disposal</AlertTitle>
              <AlertDescription className="text-green-700">
                {readyLogs.length} waste log{readyLogs.length !== 1 ? "s" : ""} ready for final disposal
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <div>
                <CardTitle>Waste Disposal Log</CardTitle>
                <CardDescription>Track cannabis waste with 3-day hold compliance (Oregon)</CardDescription>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Log Waste
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Waste Disposal Log</DialogTitle>
                  <DialogDescription>
                    Record cannabis waste with automatic 3-day hold period
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wasteType">Waste Type *</Label>
                      <Select value={wasteType} onValueChange={(v) => setWasteType(v as WasteLog["wasteType"])}>
                        <SelectTrigger id="wasteType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plant">Plant Material</SelectItem>
                          <SelectItem value="harvest">Harvest</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason *</Label>
                      <Select value={reason} onValueChange={(v) => setReason(v as WasteLog["reason"])}>
                        <SelectTrigger id="reason">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="failed_test">Failed Test</SelectItem>
                          <SelectItem value="contaminated">Contaminated</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="trim">Trim/Processing Waste</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasonDetail">Reason Detail</Label>
                    <Textarea
                      id="reasonDetail"
                      value={reasonDetail}
                      onChange={(e) => setReasonDetail(e.target.value)}
                      placeholder="Provide additional details..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="method">Disposal Method *</Label>
                      <Select value={method} onValueChange={(v) => setMethod(v as WasteLog["method"])}>
                        <SelectTrigger id="method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grind_mix">Grind & Mix (50/50)</SelectItem>
                          <SelectItem value="compost">Compost</SelectItem>
                          <SelectItem value="landfill">Landfill</SelectItem>
                          <SelectItem value="incineration">Incineration</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="methodDetail">Method Detail</Label>
                    <Textarea
                      id="methodDetail"
                      value={methodDetail}
                      onChange={(e) => setMethodDetail(e.target.value)}
                      placeholder="e.g., Mixed with kitty litter and coffee grounds..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="witnessName">Witness Name</Label>
                    <Input
                      id="witnessName"
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      placeholder="Optional witness for disposal"
                    />
                  </div>

                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">Oregon 3-Day Hold Requirement</AlertTitle>
                    <AlertDescription className="text-orange-700 text-sm">
                      Cannabis waste must be held for 72 hours before final disposal per OAR 845-025-8020.
                      This log will automatically track the hold period.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!weight}>
                      Create Waste Log
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
                Waste log created successfully! 3-day hold period started.
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Hold Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteLogs.length > 0 ? (
                  wasteLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.wasteType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm capitalize">{log.reason.replace(/_/g, " ")}</p>
                          {log.reasonDetail && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {log.reasonDetail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.weight} {log.weightUom}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {log.method.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        {log.status === "hold" ? (
                          <div className="space-y-1 min-w-32">
                            <Progress value={getHoldProgress(log)} />
                            <p className="text-xs text-muted-foreground">
                              Until {new Date(log.holdEndDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : log.disposalDate ? (
                          <p className="text-sm">
                            {new Date(log.disposalDate).toLocaleDateString()}
                          </p>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(log)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No waste logs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm mb-2">Waste Disposal Guidelines (Oregon OAR 845-025-8020):</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All cannabis waste must be held for 72 hours before disposal</li>
              <li>• Waste must be rendered unusable (ground/mixed 50% cannabis, 50% non-cannabis)</li>
              <li>• Document waste type, weight, reason, and disposal method</li>
              <li>• Maintain witness signatures and photo evidence when required</li>
              <li>• All disposal activities must be recorded in Metrc within 24 hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

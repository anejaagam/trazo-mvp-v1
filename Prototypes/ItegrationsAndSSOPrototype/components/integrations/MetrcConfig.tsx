import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { FileText, CheckCircle2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface MetrcConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MetrcConfig({ open, onOpenChange }: MetrcConfigProps) {
  const [config, setConfig] = useState({
    apiKey: "YOUR_METRC_API_KEY_HERE",
    userKey: "YOUR_METRC_USER_KEY_HERE",
    state: "CA",
    facilityLicense: "C11-0000001-LIC",
    autoSync: true,
    syncInterval: "15",
    syncInventory: true,
    syncPackages: true,
    syncPlants: true,
    syncTransfers: true,
    syncSales: true,
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  const handleSave = () => {
    toast.success("Metrc API configuration saved successfully");
    onOpenChange(false);
  };

  const handleTestConnection = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("success");
      toast.success("Successfully connected to Metrc API");
    }, 2000);
  };

  const handleManualSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("success");
      toast.success("Data synced successfully from Metrc");
    }, 3000);
  };

  const states = [
    "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "HI", "IL", "LA", "ME", 
    "MA", "MD", "MI", "MO", "MT", "NV", "NJ", "NM", "NY", "ND", "OH", "OK", 
    "OR", "PA", "RI", "UT", "VT", "VA", "WA", "WV"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Metrc API Configuration</DialogTitle>
              <DialogDescription>
                Configure automated compliance reporting sync with state track-and-trace system
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credentials">
              <span className="flex items-center gap-2">
                Credentials
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="metrc-state">State</Label>
                <Select
                  value={config.state}
                  onValueChange={(value) => setConfig({ ...config, state: value })}
                >
                  <SelectTrigger id="metrc-state" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Select your state's Metrc instance
                </p>
              </div>

              <div>
                <Label htmlFor="metrc-api-key">API Key</Label>
                <Input
                  id="metrc-api-key"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Software API Key from Metrc account settings
                </p>
              </div>

              <div>
                <Label htmlFor="metrc-user-key">User API Key</Label>
                <Input
                  id="metrc-user-key"
                  type="password"
                  value={config.userKey}
                  onChange={(e) => setConfig({ ...config, userKey: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  User-specific API key for authentication
                </p>
              </div>

              <div>
                <Label htmlFor="metrc-license">Facility License Number</Label>
                <Input
                  id="metrc-license"
                  value={config.facilityLicense}
                  onChange={(e) => setConfig({ ...config, facilityLicense: e.target.value })}
                  className="mt-1"
                  placeholder="C11-0000001-LIC"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your facility's license number in Metrc
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTestConnection}
                  disabled={syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {syncStatus === "success" && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-700" />
                      <span className="text-sm text-green-800">
                        Successfully connected to Metrc {config.state} API
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600">Last sync</p>
                        <p className="text-green-900">2 minutes ago</p>
                      </div>
                      <div>
                        <p className="text-green-600">Records synced</p>
                        <p className="text-green-900">1,247</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="text-blue-900 mb-2">API Endpoint</h4>
                  <p className="text-sm text-blue-800 font-mono">
                    https://api-{config.state.toLowerCase()}.metrc.com/
                  </p>
                  <p className="text-sm text-blue-800 mt-2">
                    Using Metrc API v1.0
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Automatic Sync</h4>
                  <p className="text-sm text-gray-500">Automatically sync data with Metrc on schedule</p>
                </div>
                <Switch
                  checked={config.autoSync}
                  onCheckedChange={(checked) => setConfig({ ...config, autoSync: checked })}
                />
              </div>

              {config.autoSync && (
                <div>
                  <Label htmlFor="sync-interval">Sync Interval (minutes)</Label>
                  <Select
                    value={config.syncInterval}
                    onValueChange={(value) => setConfig({ ...config, syncInterval: value })}
                  >
                    <SelectTrigger id="sync-interval" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    How often to sync data with Metrc
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="mb-3">Manual Sync</h4>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManualSync}
                  disabled={syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Manually trigger a sync with Metrc
                </p>
              </div>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-amber-900 mb-1">Rate Limits</h4>
                      <p className="text-sm text-amber-800">
                        Metrc API has rate limits. Frequent syncing may result in throttling. 
                        Recommended: 15-30 minute intervals for most operations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="entities" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select which data types to sync with Metrc
              </p>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Inventory</h4>
                  <p className="text-sm text-gray-500">Sync inventory items and stock levels</p>
                </div>
                <Switch
                  checked={config.syncInventory}
                  onCheckedChange={(checked) => setConfig({ ...config, syncInventory: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Packages</h4>
                  <p className="text-sm text-gray-500">Sync package creation, updates, and adjustments</p>
                </div>
                <Switch
                  checked={config.syncPackages}
                  onCheckedChange={(checked) => setConfig({ ...config, syncPackages: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Plants</h4>
                  <p className="text-sm text-gray-500">Sync plant tracking and growth stages</p>
                </div>
                <Switch
                  checked={config.syncPlants}
                  onCheckedChange={(checked) => setConfig({ ...config, syncPlants: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Transfers</h4>
                  <p className="text-sm text-gray-500">Sync transfer manifests and deliveries</p>
                </div>
                <Switch
                  checked={config.syncTransfers}
                  onCheckedChange={(checked) => setConfig({ ...config, syncTransfers: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Sales</h4>
                  <p className="text-sm text-gray-500">Sync retail and wholesale transactions</p>
                </div>
                <Switch
                  checked={config.syncSales}
                  onCheckedChange={(checked) => setConfig({ ...config, syncSales: checked })}
                />
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <h4 className="text-blue-900 mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Options
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Export data in Metrc-compatible formats for manual upload
                  </p>
                  <Button variant="outline" size="sm" className="bg-white">
                    <Download className="h-4 w-4 mr-2" />
                    Generate CSV Export
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

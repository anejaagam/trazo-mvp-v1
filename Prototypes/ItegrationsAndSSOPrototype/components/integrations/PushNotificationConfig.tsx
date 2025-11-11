import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Bell, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

interface PushNotificationConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PushNotificationConfig({ open, onOpenChange }: PushNotificationConfigProps) {
  const [config, setConfig] = useState({
    fcmServerKey: "AAAA1234567890abcdefghijklmnopqrstuvwxyz",
    apnsKeyId: "ABC123DEFG",
    apnsTeamId: "XYZ987TEAM",
    apnsBundleId: "com.example.app",
    enableBadges: true,
    enableSounds: true,
    enableVibration: true,
  });

  const handleSave = () => {
    toast.success("Push notification settings saved successfully");
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Push Notifications Configuration</DialogTitle>
              <DialogDescription>
                Configure Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="fcm" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fcm">
              <span className="flex items-center gap-2">
                Firebase (FCM)
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3" />
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="apns">Apple (APNs)</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="fcm" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fcm-server-key">FCM Server Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="fcm-server-key"
                    type="password"
                    value={config.fcmServerKey}
                    onChange={(e) => setConfig({ ...config, fcmServerKey: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(config.fcmServerKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Found in Firebase Console → Project Settings → Cloud Messaging
                </p>
              </div>

              <div>
                <Label htmlFor="fcm-sender-id">FCM Sender ID</Label>
                <Input
                  id="fcm-sender-id"
                  placeholder="123456789012"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Firebase project sender ID
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="mb-2">Connection Status</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Connected and operational</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Last verified: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="apns" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="apns-key-id">APNs Key ID</Label>
                <Input
                  id="apns-key-id"
                  value={config.apnsKeyId}
                  onChange={(e) => setConfig({ ...config, apnsKeyId: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  10-character Key ID from Apple Developer portal
                </p>
              </div>

              <div>
                <Label htmlFor="apns-team-id">Team ID</Label>
                <Input
                  id="apns-team-id"
                  value={config.apnsTeamId}
                  onChange={(e) => setConfig({ ...config, apnsTeamId: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Apple Developer Team ID
                </p>
              </div>

              <div>
                <Label htmlFor="apns-bundle-id">Bundle ID</Label>
                <Input
                  id="apns-bundle-id"
                  value={config.apnsBundleId}
                  onChange={(e) => setConfig({ ...config, apnsBundleId: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your app's bundle identifier
                </p>
              </div>

              <div>
                <Label htmlFor="apns-key-file">APNs Auth Key (.p8 file)</Label>
                <div className="mt-1">
                  <Button variant="outline" className="w-full">
                    Upload .p8 Key File
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Download from Apple Developer → Certificates, Identifiers & Profiles → Keys
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Badge Notifications</h4>
                  <p className="text-sm text-gray-500">Show unread count on app icon</p>
                </div>
                <Switch
                  checked={config.enableBadges}
                  onCheckedChange={(checked) => setConfig({ ...config, enableBadges: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Sound Alerts</h4>
                  <p className="text-sm text-gray-500">Play notification sounds</p>
                </div>
                <Switch
                  checked={config.enableSounds}
                  onCheckedChange={(checked) => setConfig({ ...config, enableSounds: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Vibration</h4>
                  <p className="text-sm text-gray-500">Vibrate device on notification</p>
                </div>
                <Switch
                  checked={config.enableVibration}
                  onCheckedChange={(checked) => setConfig({ ...config, enableVibration: checked })}
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-900 mb-2">Notification Categories</h4>
                <p className="text-sm text-blue-800">
                  Users can customize which notifications they receive in their account settings.
                  Categories include: Alerts, Task Reminders, System Updates, and Compliance Deadlines.
                </p>
              </div>
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

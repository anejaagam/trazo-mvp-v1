import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Mail, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface EmailConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailConfig({ open, onOpenChange }: EmailConfigProps) {
  const [config, setConfig] = useState({
    apiKey: "SG.1234567890abcdefghijklmnopqrstuvwxyz",
    fromEmail: "notifications@example.com",
    fromName: "Platform Notifications",
    replyToEmail: "support@example.com",
    enableAlerts: true,
    enableReports: true,
    enableDigests: true,
    testEmail: "",
  });

  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSave = () => {
    toast.success("Email configuration saved successfully");
    onOpenChange(false);
  };

  const handleTestEmail = () => {
    if (!config.testEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setTestStatus("sending");
    setTimeout(() => {
      setTestStatus("success");
      toast.success(`Test email sent to ${config.testEmail}`);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Email Notifications Configuration</DialogTitle>
              <DialogDescription>
                Configure SendGrid for email delivery and notification preferences
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
            <TabsTrigger value="sender">Sender Info</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                <Input
                  id="sendgrid-api-key"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Create an API key in SendGrid Dashboard → Settings → API Keys
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="mb-2">Connection Status</h4>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-700">Connected and operational</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Emails sent (30 days)</p>
                    <p className="text-gray-900">12,453</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery rate</p>
                    <p className="text-gray-900">98.7%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-blue-900 mb-2">Required Permissions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mail Send - Full Access</li>
                  <li>• Tracking - Read Access</li>
                  <li>• Stats - Read Access</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sender" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="from-email">From Email Address</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Must be a verified sender in SendGrid
                </p>
              </div>

              <div>
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={config.fromName}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Display name shown to recipients
                </p>
              </div>

              <div>
                <Label htmlFor="reply-to">Reply-To Email</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={config.replyToEmail}
                  onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Where replies will be sent
                </p>
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="test-email">Send Test Email</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                    value={config.testEmail}
                    onChange={(e) => setConfig({ ...config, testEmail: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testStatus === "sending"}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {testStatus === "sending" ? "Sending..." : "Send"}
                  </Button>
                </div>
                {testStatus === "success" && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Test email sent successfully
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Alert Notifications</h4>
                  <p className="text-sm text-gray-500">Critical alerts and warnings</p>
                </div>
                <Switch
                  checked={config.enableAlerts}
                  onCheckedChange={(checked) => setConfig({ ...config, enableAlerts: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Report Emails</h4>
                  <p className="text-sm text-gray-500">Scheduled reports and summaries</p>
                </div>
                <Switch
                  checked={config.enableReports}
                  onCheckedChange={(checked) => setConfig({ ...config, enableReports: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4>Daily Digests</h4>
                  <p className="text-sm text-gray-500">Consolidated daily activity summary</p>
                </div>
                <Switch
                  checked={config.enableDigests}
                  onCheckedChange={(checked) => setConfig({ ...config, enableDigests: checked })}
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-900 mb-1">Email Templates</h4>
                    <p className="text-sm text-amber-800">
                      Customize email templates in SendGrid Dashboard → Email API → Dynamic Templates.
                      Use template IDs in your notification settings.
                    </p>
                  </div>
                </div>
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

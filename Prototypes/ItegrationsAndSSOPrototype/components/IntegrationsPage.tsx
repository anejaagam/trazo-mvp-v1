import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Bell, 
  Mail, 
  Shield, 
  Plug2, 
  Wifi, 
  FileText, 
  Settings,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { PushNotificationConfig } from "./integrations/PushNotificationConfig";
import { EmailConfig } from "./integrations/EmailConfig";
import { SSOConfig } from "./integrations/SSOConfig";
import { MetrcConfig } from "./integrations/MetrcConfig";
import type { Integration } from "../types/integrations";

export function IntegrationsPage() {
  const [activeIntegrations, setActiveIntegrations] = useState<Record<string, boolean>>({
    push: true,
    email: true,
    sso: true,
    metrc: true,
  });

  const [configDialog, setConfigDialog] = useState<string | null>(null);

  const integrations: Integration[] = [
    {
      id: "push",
      name: "Push Notifications",
      description: "Firebase Cloud Messaging for mobile push notifications (APNs/FCM)",
      icon: <Bell className="h-5 w-5" />,
      status: "active",
      category: "notifications",
      mvp: true,
    },
    {
      id: "email",
      name: "Email Notifications",
      description: "SendGrid email delivery for alerts and reports",
      icon: <Mail className="h-5 w-5" />,
      status: "active",
      category: "notifications",
      mvp: true,
    },
    {
      id: "sso",
      name: "Single Sign-On",
      description: "OIDC/SAML authentication (Google Workspace, Microsoft Entra ID)",
      icon: <Shield className="h-5 w-5" />,
      status: "active",
      category: "authentication",
      mvp: true,
    },
    {
      id: "metrc",
      name: "Metrc API",
      description: "Automated compliance reporting sync with state track-and-trace system",
      icon: <FileText className="h-5 w-5" />,
      status: "active",
      category: "compliance",
      mvp: true,
    },
    {
      id: "biotrack",
      name: "BioTrack/CTLS",
      description: "Automated submission to state compliance tracking systems",
      icon: <FileText className="h-5 w-5" />,
      status: "coming-soon",
      category: "compliance",
      mvp: false,
    },
    {
      id: "tagio",
      name: "tagIO Sensors",
      description: "Environmental monitoring sensor integration for real-time data",
      icon: <Wifi className="h-5 w-5" />,
      status: "coming-soon",
      category: "hardware",
      mvp: false,
    },
    {
      id: "trazo",
      name: "Trazo Edge Gateway",
      description: "Partner hardware integration via Modbus RTU/TCP protocol",
      icon: <Plug2 className="h-5 w-5" />,
      status: "coming-soon",
      category: "hardware",
      mvp: false,
    },
  ];

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "coming-soon":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Coming Soon
          </Badge>
        );
    }
  };

  const handleToggleIntegration = (id: string) => {
    setActiveIntegrations(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filterByCategory = (category: string) => {
    if (category === "all") return integrations;
    return integrations.filter(i => i.category === category);
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              {integration.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {integration.name}
                {integration.mvp && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    MVP
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(integration.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {integration.status === "active" && (
              <>
                <Switch
                  checked={activeIntegrations[integration.id]}
                  onCheckedChange={() => handleToggleIntegration(integration.id)}
                />
                <span className="text-sm text-gray-600">
                  {activeIntegrations[integration.id] ? "Enabled" : "Disabled"}
                </span>
              </>
            )}
            {integration.status === "coming-soon" && (
              <span className="text-sm text-gray-500">
                Available in future release
              </span>
            )}
          </div>
          {integration.status === "active" && activeIntegrations[integration.id] && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigDialog(integration.id)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">
            Connect your platform with third-party services and hardware
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="hardware">Hardware</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {integrations.map(renderIntegrationCard)}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            {filterByCategory("notifications").map(renderIntegrationCard)}
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            {filterByCategory("authentication").map(renderIntegrationCard)}
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {filterByCategory("compliance").length > 0 ? (
              filterByCategory("compliance").map(renderIntegrationCard)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Compliance integrations coming in future releases</p>
                  <p className="text-sm mt-2">
                    Currently supporting export-based workflows
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="hardware" className="space-y-4">
            {filterByCategory("hardware").length > 0 ? (
              filterByCategory("hardware").map(renderIntegrationCard)
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <Plug2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Hardware integrations coming in future releases</p>
                  <p className="text-sm mt-2">
                    Currently supporting manual data entry
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="text-blue-600">
                <Plug2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-blue-900 mb-2">Integration Roadmap</h3>
                <p className="text-blue-800 text-sm">
                  <strong>MVP Scope:</strong> Push notifications (Firebase), Email notifications (SendGrid), SSO authentication, and Metrc API are available now.
                </p>
                <p className="text-blue-800 text-sm mt-2">
                  <strong>Post-MVP:</strong> BioTrack/CTLS API sync, tagIO sensors, and Trazo Edge Gateway integrations are planned for future releases.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Dialogs */}
      <PushNotificationConfig
        open={configDialog === "push"}
        onOpenChange={(open) => !open && setConfigDialog(null)}
      />
      <EmailConfig
        open={configDialog === "email"}
        onOpenChange={(open) => !open && setConfigDialog(null)}
      />
      <SSOConfig
        open={configDialog === "sso"}
        onOpenChange={(open) => !open && setConfigDialog(null)}
      />
      <MetrcConfig
        open={configDialog === "metrc"}
        onOpenChange={(open) => !open && setConfigDialog(null)}
      />
    </div>
  );
}

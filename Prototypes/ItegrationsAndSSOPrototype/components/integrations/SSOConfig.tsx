import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Shield, CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface SSOConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SSOConfig({ open, onOpenChange }: SSOConfigProps) {
  const [config, setConfig] = useState({
    googleEnabled: true,
    microsoftEnabled: true,
    oidcEnabled: false,
    samlEnabled: false,
    googleClientId: "123456789-abcdefghijklmnop.apps.googleusercontent.com",
    googleClientSecret: "GOCSPX-1234567890abcdefghijklm",
    microsoftClientId: "12345678-1234-1234-1234-123456789abc",
    microsoftTenantId: "87654321-4321-4321-4321-987654321xyz",
    callbackUrl: "https://app.example.com/auth/callback",
  });

  const handleSave = () => {
    toast.success("SSO configuration saved successfully");
    onOpenChange(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Single Sign-On Configuration</DialogTitle>
              <DialogDescription>
                Configure OIDC/SAML authentication providers (Google Workspace, Microsoft Entra ID)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="google" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="google">
              <span className="flex items-center gap-2">
                Google
                {config.googleEnabled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="microsoft">
              <span className="flex items-center gap-2">
                Microsoft
                {config.microsoftEnabled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="oidc">OIDC</TabsTrigger>
            <TabsTrigger value="saml">SAML</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4>Enable Google Workspace SSO</h4>
                  <p className="text-sm text-gray-500">Allow users to sign in with Google accounts</p>
                </div>
                <Switch
                  checked={config.googleEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, googleEnabled: checked })}
                />
              </div>

              {config.googleEnabled && (
                <>
                  <div>
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="google-client-id"
                        value={config.googleClientId}
                        onChange={(e) => setConfig({ ...config, googleClientId: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.googleClientId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      From Google Cloud Console → APIs & Services → Credentials
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="google-client-secret">Client Secret</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="google-client-secret"
                        type="password"
                        value={config.googleClientSecret}
                        onChange={(e) => setConfig({ ...config, googleClientSecret: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.googleClientSecret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="google-callback">Authorized Redirect URI</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="google-callback"
                        value={config.callbackUrl}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.callbackUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add this URL to your Google OAuth client configuration
                    </p>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Setup Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                        <li>Go to Google Cloud Console</li>
                        <li>Create a new OAuth 2.0 Client ID</li>
                        <li>Add the authorized redirect URI above</li>
                        <li>Copy the Client ID and Secret here</li>
                      </ol>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="microsoft" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4>Enable Microsoft Entra ID SSO</h4>
                  <p className="text-sm text-gray-500">Allow users to sign in with Microsoft accounts</p>
                </div>
                <Switch
                  checked={config.microsoftEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, microsoftEnabled: checked })}
                />
              </div>

              {config.microsoftEnabled && (
                <>
                  <div>
                    <Label htmlFor="microsoft-client-id">Application (client) ID</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="microsoft-client-id"
                        value={config.microsoftClientId}
                        onChange={(e) => setConfig({ ...config, microsoftClientId: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.microsoftClientId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="microsoft-tenant-id">Directory (tenant) ID</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="microsoft-tenant-id"
                        value={config.microsoftTenantId}
                        onChange={(e) => setConfig({ ...config, microsoftTenantId: e.target.value })}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.microsoftTenantId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="microsoft-secret">Client Secret</Label>
                    <Input
                      id="microsoft-secret"
                      type="password"
                      placeholder="Enter client secret value"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Create in Azure Portal → App registrations → Certificates & secrets
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="microsoft-callback">Redirect URI</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="microsoft-callback"
                        value={config.callbackUrl}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(config.callbackUrl)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Add this URL in Azure Portal → App registrations → Authentication
                    </p>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Setup Instructions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                        <li>Go to Azure Portal → Microsoft Entra ID</li>
                        <li>Register a new application</li>
                        <li>Configure redirect URI for Web platform</li>
                        <li>Create a client secret</li>
                        <li>Copy Application ID, Tenant ID, and Secret here</li>
                      </ol>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4>Enable Custom OIDC Provider</h4>
                  <p className="text-sm text-gray-500">Connect with any OpenID Connect provider</p>
                </div>
                <Switch
                  checked={config.oidcEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, oidcEnabled: checked })}
                />
              </div>

              {config.oidcEnabled && (
                <>
                  <div>
                    <Label htmlFor="oidc-issuer">Issuer URL</Label>
                    <Input
                      id="oidc-issuer"
                      placeholder="https://your-provider.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="oidc-client-id">Client ID</Label>
                    <Input
                      id="oidc-client-id"
                      placeholder="Enter client ID"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="oidc-client-secret">Client Secret</Label>
                    <Input
                      id="oidc-client-secret"
                      type="password"
                      placeholder="Enter client secret"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="oidc-scopes">Scopes</Label>
                    <Input
                      id="oidc-scopes"
                      placeholder="openid profile email"
                      defaultValue="openid profile email"
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {!config.oidcEnabled && (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enable custom OIDC to connect with providers like Okta, Auth0, or Keycloak</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="saml" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4>Enable SAML 2.0 Provider</h4>
                  <p className="text-sm text-gray-500">Connect with SAML 2.0 identity providers</p>
                </div>
                <Switch
                  checked={config.samlEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, samlEnabled: checked })}
                />
              </div>

              {config.samlEnabled && (
                <>
                  <div>
                    <Label htmlFor="saml-entity-id">Entity ID</Label>
                    <Input
                      id="saml-entity-id"
                      placeholder="https://app.example.com/saml"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="saml-sso-url">SSO URL</Label>
                    <Input
                      id="saml-sso-url"
                      placeholder="https://your-idp.com/sso"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="saml-certificate">X.509 Certificate</Label>
                    <Textarea
                      id="saml-certificate"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      className="mt-1 font-mono text-sm"
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>Service Provider Metadata</Label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-700 mb-2">
                        ACS URL: https://app.example.com/saml/acs
                      </p>
                      <p className="text-sm text-gray-700">
                        Entity ID: https://app.example.com/saml
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Download Metadata XML
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {!config.samlEnabled && (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enable SAML 2.0 to connect with enterprise identity providers</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-amber-900 mb-1">Security Note</h4>
              <p className="text-sm text-amber-800">
                Ensure all redirect URIs use HTTPS in production. Keep client secrets secure and rotate them periodically.
              </p>
            </div>
          </div>
        </div>

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

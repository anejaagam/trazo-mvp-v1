import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Chrome, Settings, Clock, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function OrgSettings() {
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [stepUpTTL, setStepUpTTL] = useState('12');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [kioskTimeout, setKioskTimeout] = useState('30');
  const [jitEnabled, setJitEnabled] = useState(true);
  const [breakGlassEnabled, setBreakGlassEnabled] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Configure authentication, MFA policies, and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sso" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sso">SSO & Auth</TabsTrigger>
              <TabsTrigger value="mfa">MFA Policy</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* SSO & Auth */}
            <TabsContent value="sso" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SSO Integration</Label>
                    <p className="text-sm text-slate-500">
                      Enable single sign-on for this organization
                    </p>
                  </div>
                  <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} />
                </div>

                {ssoEnabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Chrome className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Google Workspace</span>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Client ID:</span>
                          <p className="font-mono text-xs mt-1">123456789.apps.googleusercontent.com</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Allowed Domains:</span>
                          <p className="mt-1">trazo.com</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                        </svg>
                        <span className="font-medium">Microsoft Entra ID</span>
                        <Badge variant="secondary">Configured</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-600">Tenant ID:</span>
                          <p className="font-mono text-xs mt-1">abc-123-def-456</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Type:</span>
                          <p className="mt-1">SAML 2.0</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button>
                    </div>

                    <Separator />

                    <Button variant="outline" className="w-full">
                      + Add SSO Provider
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Email/Password Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPwdLength">Minimum Password Length</Label>
                    <Input id="minPwdLength" type="number" defaultValue="12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pwdExpiry">Password Expiry (days)</Label>
                    <Input id="pwdExpiry" type="number" defaultValue="90" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-slate-500">Enforce complexity rules</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Magic Links</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Magic Link Login</Label>
                    <p className="text-sm text-slate-500">Passwordless email authentication</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkExpiry">Link Expiry (minutes)</Label>
                  <Input id="linkExpiry" type="number" defaultValue="15" className="w-32" />
                </div>
              </div>
            </TabsContent>

            {/* MFA Policy */}
            <TabsContent value="mfa" className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  MFA is required by default for all users. Step-up MFA gates sensitive actions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require MFA for All Users</Label>
                    <p className="text-sm text-slate-500">Enforce TOTP authentication</p>
                  </div>
                  <Switch checked={mfaRequired} onCheckedChange={setMfaRequired} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="stepUpTTL">Step-up MFA Validity Window (hours)</Label>
                  <Input
                    id="stepUpTTL"
                    type="number"
                    value={stepUpTTL}
                    onChange={(e) => setStepUpTTL(e.target.value)}
                    className="w-32"
                  />
                  <p className="text-sm text-slate-500">
                    How long after MFA verification until step-up is required again (default: 12)
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Step-up Required Actions</Label>
                  <div className="space-y-2">
                    {[
                      'Publish/Apply Recipes',
                      'Issue Manual Overrides',
                      'Lock/Redact Evidence',
                      'Edit Alarm Routing',
                      'Create/Rotate API Tokens',
                    ].map(action => (
                      <div key={action} className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Backup MFA Methods</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Backup Codes</Label>
                      <p className="text-sm text-slate-500">Allow SMS as fallback</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Backup Codes</Label>
                      <p className="text-sm text-slate-500">Send codes via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Sessions */}
            <TabsContent value="sessions" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="w-32"
                  />
                  <p className="text-sm text-slate-500">
                    Standard web session duration (default: 60)
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="kioskTimeout">Kiosk Session Timeout (minutes)</Label>
                  <Input
                    id="kioskTimeout"
                    type="number"
                    value={kioskTimeout}
                    onChange={(e) => setKioskTimeout(e.target.value)}
                    className="w-32"
                  />
                  <p className="text-sm text-slate-500">
                    Inactivity timeout for shared device sessions (default: 30)
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-logout on Inactivity</Label>
                    <p className="text-sm text-slate-500">Logout after timeout period</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Remember Device</Label>
                    <p className="text-sm text-slate-500">Reduce MFA frequency on trusted devices</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium">Active Sessions</h3>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-600">Total Active</div>
                      <div className="text-2xl font-medium">42</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Kiosk Sessions</div>
                      <div className="text-2xl font-medium">8</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Avg. Duration</div>
                      <div className="text-2xl font-medium">35m</div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  View All Active Sessions
                </Button>
              </div>
            </TabsContent>

            {/* Advanced */}
            <TabsContent value="advanced" className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Advanced security features. Changes require admin approval and audit logging.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Just-in-Time (JIT) Support Access</Label>
                    <p className="text-sm text-slate-500">
                      Allow time-boxed support access with full audit trail
                    </p>
                  </div>
                  <Switch checked={jitEnabled} onCheckedChange={setJitEnabled} />
                </div>

                {jitEnabled && (
                  <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="jitMaxDuration">Max JIT Duration (hours)</Label>
                      <Input id="jitMaxDuration" type="number" defaultValue="4" className="w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Require reason for JIT access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Show banner during JIT session</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Break-glass Emergency Access</Label>
                    <p className="text-sm text-slate-500">
                      Sealed credentials for SSO outages (heavily audited)
                    </p>
                  </div>
                  <Switch checked={breakGlassEnabled} onCheckedChange={setBreakGlassEnabled} />
                </div>

                {breakGlassEnabled && (
                  <div className="pl-4 border-l-2 border-amber-200 space-y-2">
                    <div className="space-y-2">
                      <Label htmlFor="breakGlassTTL">Break-glass Session TTL (minutes)</Label>
                      <Input id="breakGlassTTL" type="number" defaultValue="15" className="w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Multi-party alerts on use</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Create follow-up task for review</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">IP Allowlist (Optional)</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Restrict Access by IP</Label>
                      <p className="text-sm text-slate-500">Only allow login from specified IPs</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6">
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

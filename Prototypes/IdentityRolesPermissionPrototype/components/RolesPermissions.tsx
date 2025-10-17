import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, Eye, Check, X } from 'lucide-react';
import { mockRoles } from '../lib/mock-data';
import { PERMISSIONS, ROLE_PERMISSIONS, STEP_UP_ACTIONS } from '../lib/supabase';

export function RolesPermissions() {
  const [selectedRole, setSelectedRole] = useState(mockRoles[0].name);

  const rolePermissions = ROLE_PERMISSIONS[selectedRole];
  const permissionGroups = {
    'User Management': Object.keys(PERMISSIONS).filter(p => p.startsWith('users.')),
    'Roles': Object.keys(PERMISSIONS).filter(p => p.startsWith('roles.')),
    'Recipes': Object.keys(PERMISSIONS).filter(p => p.startsWith('recipes.')),
    'Control': Object.keys(PERMISSIONS).filter(p => p.startsWith('control.')),
    'Evidence': Object.keys(PERMISSIONS).filter(p => p.startsWith('evidence.')),
    'Routing': Object.keys(PERMISSIONS).filter(p => p.startsWith('routing.')),
    'Tasks': Object.keys(PERMISSIONS).filter(p => p.startsWith('tasks.')),
    'API Tokens': Object.keys(PERMISSIONS).filter(p => p.startsWith('tokens.')),
    'Audit': Object.keys(PERMISSIONS).filter(p => p.startsWith('audit.')),
    'Organization': Object.keys(PERMISSIONS).filter(p => p.startsWith('org.')),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Role-based access control with least-privilege defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="matrix" className="space-y-4">
            <TabsList>
              <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
              <TabsTrigger value="roles">Role Details</TabsTrigger>
              <TabsTrigger value="stepup">Step-up Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-4">
              {/* Role Selector */}
              <div className="flex gap-2 flex-wrap">
                {mockRoles.map(role => (
                  <Button
                    key={role.id}
                    variant={selectedRole === role.name ? 'default' : 'outline'}
                    onClick={() => setSelectedRole(role.name)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {role.display_name}
                  </Button>
                ))}
              </div>

              {/* Selected Role Info */}
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {mockRoles.find(r => r.name === selectedRole)?.display_name}
                  </CardTitle>
                  <CardDescription>
                    {mockRoles.find(r => r.name === selectedRole)?.description}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Permission Groups */}
              <div className="space-y-6">
                {Object.entries(permissionGroups).map(([group, permissions]) => {
                  if (permissions.length === 0) return null;
                  
                  return (
                    <div key={group} className="space-y-2">
                      <h3 className="font-medium">{group}</h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Permission</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-24 text-center">Granted</TableHead>
                              <TableHead className="w-32 text-center">Step-up MFA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissions.map(permission => {
                              const hasPermission = rolePermissions.includes(permission);
                              const requiresStepUp = STEP_UP_ACTIONS.includes(permission);
                              
                              return (
                                <TableRow key={permission}>
                                  <TableCell className="font-mono text-sm">
                                    {permission}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">
                                    {PERMISSIONS[permission as keyof typeof PERMISSIONS]}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {hasPermission ? (
                                      <Check className="h-4 w-4 text-green-600 mx-auto" />
                                    ) : (
                                      <X className="h-4 w-4 text-slate-300 mx-auto" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {requiresStepUp && hasPermission && (
                                      <Badge variant="secondary" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Typical Scope</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRoles.map(role => {
                      const permCount = ROLE_PERMISSIONS[role.name]?.length || 0;
                      
                      return (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-slate-400" />
                              <span className="font-medium">{role.display_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {role.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{permCount} permissions</Badge>
                          </TableCell>
                          <TableCell>
                            {role.name === 'org_admin' && <Badge>Organization</Badge>}
                            {role.name === 'site_manager' && <Badge>Site</Badge>}
                            {role.name === 'head_grower' && <Badge>Site</Badge>}
                            {role.name === 'operator' && <Badge>Room</Badge>}
                            {role.name === 'installer' && <Badge>Site</Badge>}
                            {role.name === 'compliance' && <Badge>Organization</Badge>}
                            {role.name === 'exec_viewer' && <Badge>Organization</Badge>}
                            {role.name === 'support_ro' && <Badge variant="secondary">JIT Only</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="stepup" className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    Step-up MFA Required Actions
                  </CardTitle>
                  <CardDescription>
                    These sensitive actions require recent MFA verification (within 12 hours by default)
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>MFA Window</TableHead>
                      <TableHead>Audit Trail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {STEP_UP_ACTIONS.map(action => (
                      <TableRow key={action}>
                        <TableCell className="font-mono text-sm">
                          {action}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {PERMISSIONS[action as keyof typeof PERMISSIONS]}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">12 hours</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Eye className="h-3 w-3" />
                            Logged
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Policy Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Default TTL:</span>
                      <span className="ml-2 font-medium">12 hours</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Configurable:</span>
                      <span className="ml-2 font-medium">Per organization</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Bypass:</span>
                      <span className="ml-2 font-medium">Not allowed</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Audit retention:</span>
                      <span className="ml-2 font-medium">Immutable</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

/**
 * RolePermissionMatrix Component
 * Display permission matrix for all roles
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Check, X } from 'lucide-react';
import { ROLES } from '@/lib/rbac/roles';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import type { RoleKey, PermissionKey } from '@/lib/rbac/types';

interface RolePermissionMatrixProps {
  userCounts?: Partial<Record<RoleKey, number>>;
}

export function RolePermissionMatrix({ userCounts = {} }: RolePermissionMatrixProps) {
  const [selectedRole, setSelectedRole] = useState<RoleKey>('org_admin');

  // Group permissions by resource
  const permissionGroups: Record<string, PermissionKey[]> = {};
  
  Object.keys(PERMISSIONS).forEach((key) => {
    const permKey = key as PermissionKey;
    const resource = permKey.split(':')[0];
    const groupName = resource.charAt(0).toUpperCase() + resource.slice(1);
    
    if (!permissionGroups[groupName]) {
      permissionGroups[groupName] = [];
    }
    permissionGroups[groupName].push(permKey);
  });

  const selectedRoleData = ROLES[selectedRole];
  const selectedRolePermissions = selectedRoleData?.permissions || [];

  const hasPermission = (permission: PermissionKey): boolean => {
    // Check for wildcard
    if (selectedRolePermissions.includes('*')) {
      return true;
    }
    
    // Check exact match
    if (selectedRolePermissions.includes(permission)) {
      return true;
    }
    
    // Check resource wildcard (e.g., 'batch:*' includes 'batch:view')
    const [resource] = permission.split(':');
    const wildcardPermission = `${resource}:*`;
    return selectedRolePermissions.includes(wildcardPermission);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="roles">Role Details</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4">
          {/* Role Selector */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(ROLES).map(([key, role]) => (
              <Button
                key={key}
                variant={selectedRole === key ? 'default' : 'outline'}
                onClick={() => setSelectedRole(key as RoleKey)}
                size="sm"
                className={selectedRole === key 
                  ? '' 
                  : 'border-brand-lighter-green-600 text-brand-dark-green-700 dark:text-brand-lighter-green-400 hover:bg-brand-lighter-green-50 dark:hover:bg-brand-dark-green-900/20 hover:text-brand-dark-green-700 dark:hover:text-brand-lighter-green-300'}
              >
                <Shield className="mr-2 h-4 w-4" />
                {role.name}
                {userCounts[key as RoleKey] !== undefined && (
                  <Badge variant="secondary" className="ml-2">
                    {userCounts[key as RoleKey]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Selected Role Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">{selectedRoleData?.name}</CardTitle>
              <CardDescription>{selectedRoleData?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Permissions:</span>
                  <span className="ml-2 font-medium">
                    {selectedRolePermissions.includes('*')
                      ? 'All (Wildcard)'
                      : `${selectedRolePermissions.length} granted`}
                  </span>
                </div>
                {userCounts[selectedRole] !== undefined && (
                  <div>
                    <span className="text-slate-600">Users:</span>
                    <span className="ml-2 font-medium">{userCounts[selectedRole]}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permission Groups */}
          <div className="space-y-6">
            {Object.entries(permissionGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, permissions]) => {
                if (permissions.length === 0) return null;

                return (
                  <div key={group} className="space-y-2">
                    <h3 className="font-medium text-brand-dark-green-700">{group}</h3>
                    <div className="rounded-lg border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Permission Key</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-24 text-center">Granted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {permissions.map((permission) => {
                            const permData = PERMISSIONS[permission];
                            const granted = hasPermission(permission);

                            return (
                              <TableRow key={permission}>
                                <TableCell className="font-mono text-sm">
                                  {permission}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                  {permData.description}
                                </TableCell>
                                <TableCell className="text-center">
                                  {granted ? (
                                    <Check className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <X className="h-4 w-4 text-slate-300 mx-auto" />
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
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(ROLES).map(([key, role]) => {
                  const roleKey = key as RoleKey;
                  const permCount = role.permissions.includes('*')
                    ? 'All'
                    : role.permissions.length;

                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-brand-lighter-green-600" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeof permCount === 'number'
                            ? `${permCount} permissions`
                            : permCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userCounts[roleKey] !== undefined ? (
                          <Badge variant="secondary">{userCounts[roleKey]} users</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Hierarchy</CardTitle>
              <CardDescription>
                Understanding role relationships and typical use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">org_admin</Badge>
                  <p className="text-slate-600">
                    Full administrative access across the entire organization. Can manage users, sites, and all settings.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">site_manager</Badge>
                  <p className="text-slate-600">
                    Manages specific sites. Can handle day-to-day operations, user assignments, and site-level configurations.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">head_grower</Badge>
                  <p className="text-slate-600">
                    Advanced cultivation operations. Creates recipes, manages batches, and oversees growing operations.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="mt-0.5">operator</Badge>
                  <p className="text-slate-600">
                    Day-to-day operations. Executes tasks, records data, and performs routine maintenance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

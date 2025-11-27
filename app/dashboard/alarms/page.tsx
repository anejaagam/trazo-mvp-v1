/**
 * Alarms Dashboard Page
 * 
 * Main alarm monitoring dashboard showing active alarms, summary statistics,
 * and quick actions. Protected by RBAC (requires 'alarm:view' permission).
 * 
 * Created: November 15, 2025
 * Phase: 14A - Core Alarms Implementation
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canPerformAction } from '@/lib/rbac/guards';
import { getServerSiteId } from '@/lib/site/server';
import { ALL_SITES_ID } from '@/lib/site/types';
import { UnifiedNotificationCenter } from '@/components/features/alarms/unified-notification-center';
import { AlarmsDashboard } from '@/components/features/alarms/alarms-dashboard-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata = {
  title: 'Alarms & Notifications | TRAZO',
  description: 'Monitor and manage facility alarms and notifications',
};

export default async function AlarmsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[Alarms Page] Auth error or no user:', authError);
    redirect('/auth/login');
  }

  // Get user role and organization
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (userDataError) {
    console.error('[Alarms Page] Error fetching user data:', userDataError);
    redirect('/dashboard');
  }

  if (!userData || !userData.role) {
    console.error('[Alarms Page] User data not found or no role for user:', user.id, userData);
    redirect('/dashboard');
  }

  const userRole = userData.role;
  const organizationId = userData.organization_id || '';

  // Get user's default site
  const { data: userSiteData } = await supabase
    .from('users')
    .select('default_site_id')
    .eq('id', user.id)
    .single();

  const defaultSiteId = userSiteData?.default_site_id || null;

  // Get site_id from site context (cookie-based)
  const contextSiteId = await getServerSiteId();

  // For "All Sites" mode, pass null so alarms from all sites are shown
  // If no context site, fall back to user's default site
  let siteId: string | null = null;
  if (contextSiteId === ALL_SITES_ID) {
    siteId = null; // All sites mode
  } else if (contextSiteId) {
    siteId = contextSiteId; // Use context site
  } else if (defaultSiteId) {
    siteId = defaultSiteId; // Fall back to default site
  }

  console.log('[Alarms Page] User:', user.id, 'Role:', userRole, 'Site:', siteId);

  // Check alarm:view permission
  const permissionCheck = canPerformAction(userRole, 'alarm:view');

  console.log('[Alarms Page] Permission check result:', permissionCheck);

  if (!permissionCheck.allowed) {
    console.error(`[Alarms Page] User ${user.id} with role ${userRole} does not have alarm:view permission. Reason:`, permissionCheck.reason);
    redirect('/dashboard');
  }

  console.log('[Alarms Page] Access granted, rendering page');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alarms & Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Monitor active alarms, acknowledge alerts, and view all notifications in one place
        </p>
      </div>

      <Tabs defaultValue="unified" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unified">Unified View</TabsTrigger>
          <TabsTrigger value="alarms-only">Alarms Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="unified">
          <UnifiedNotificationCenter
            userId={user.id}
            organizationId={organizationId}
            siteId={siteId}
          />
        </TabsContent>

        <TabsContent value="alarms-only">
          <AlarmsDashboard
            userId={user.id}
            userRole={userRole}
            siteId={siteId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

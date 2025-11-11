import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditLogTable } from '@/components/features/admin/audit-log-table';
import { getAuditLogs } from '@/lib/supabase/queries/audit';
import { checkAdminAuth } from '@/lib/admin-helpers';
import type { AuditEventWithUser } from '@/types/admin';

export const metadata: Metadata = {
  title: 'Audit Log - Trazo Admin',
  description: 'Track security-relevant events and user actions',
};

export default async function AuditLogPage() {
  const { isDevMode } = await checkAdminAuth('audit:view', 'Audit Log');

  // Fetch recent audit events (or use mock data in dev mode)
  let auditEvents: AuditEventWithUser[] = [];
  
  if (!isDevMode) {
    const { data } = await getAuditLogs(
      {},
      {
        page: 1,
        per_page: 50, // Initial load
      }
    );
    auditEvents = data || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-4 font-semibold text-brand-dark-green-700 dark:text-brand-lighter-green-400">
          Audit Log
        </h1>
        <p className="text-body-base text-slate-600 dark:text-slate-300 mt-2">
          Track security-relevant events and user actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            View and filter audit events for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable events={auditEvents || []} />
        </CardContent>
      </Card>
    </div>
  );
}

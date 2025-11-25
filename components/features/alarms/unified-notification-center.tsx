/**
 * Unified Notification Center Component
 *
 * Displays both critical alarms and informational notifications in a single view
 * Supports filtering by category (All, Alarms, Inventory, Batches, Tasks)
 *
 * Created: Phase 3 - Alarms & Notifications v2
 */

'use client';

import { useAlarms, useNotifications } from '@/hooks/use-alarms';
import { AlarmCard } from './alarm-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  RefreshCw,
  Package,
  Sprout,
  ClipboardList,
  Calendar,
  Thermometer,
  ExternalLink,
} from 'lucide-react';
import { acknowledgeAlarm, resolveAlarm } from '@/app/actions/alarms';
import { useState, useEffect } from 'react';
import type { Notification } from '@/types/telemetry';
import Link from 'next/link';

interface UnifiedNotificationCenterProps {
  userId: string;
  organizationId: string;
  siteId: string | null;
}

// Helper to get icon for notification category
function getCategoryIcon(category: string) {
  switch (category) {
    case 'inventory':
      return <Package className="h-4 w-4" />;
    case 'batch':
      return <Sprout className="h-4 w-4" />;
    case 'task':
      return <ClipboardList className="h-4 w-4" />;
    case 'system':
      return <Bell className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

// Helper to get icon for alarm type
function getAlarmTypeIcon(alarmType: string) {
  if (alarmType.includes('temperature')) {
    return <Thermometer className="h-4 w-4" />;
  } else if (alarmType === 'task_overdue') {
    return <Calendar className="h-4 w-4 text-amber-600" />;
  }
  return <AlertTriangle className="h-4 w-4" />;
}

// Helper to get urgency badge color
function getUrgencyColor(urgency: string) {
  switch (urgency) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

// Notification Card Component
function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const isUnread = !notification.read_at;
  const isTaskCompleted = notification.category === 'task' && notification.read_at;

  return (
    <Card className={`${isUnread ? 'border-l-4 border-l-blue-500' : isTaskCompleted ? 'border-l-4 border-l-green-500 bg-green-50/30' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getCategoryIcon(notification.category)}</div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {notification.category}
                </Badge>
                <Badge variant={getUrgencyColor(notification.urgency) as any}>
                  {notification.urgency}
                </Badge>
                {isUnread && (
                  <Badge variant="default" className="bg-blue-500">
                    New
                  </Badge>
                )}
                {isTaskCompleted && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <p className={`text-sm ${isTaskCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{new Date(notification.sent_at).toLocaleString()}</span>
                {isTaskCompleted && notification.read_at && (
                  <span className="text-green-600 font-medium">
                    Completed {new Date(notification.read_at).toLocaleString()}
                  </span>
                )}
                {notification.link_url && (
                  <Link
                    href={notification.link_url}
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    View Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
          {isUnread && !isTaskCompleted && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedNotificationCenter({
  userId,
  organizationId,
  siteId,
}: UnifiedNotificationCenterProps) {
  const [activeTab, setActiveTab] = useState('all');

  // Fetch alarms
  const {
    alarms,
    loading: alarmsLoading,
    error: alarmsError,
    refresh: refreshAlarms,
    acknowledge: acknowledgeAlarmHook,
  } = useAlarms({
    siteId: siteId ?? undefined,
    status: 'active',
    realtime: true,
  });

  // Refresh alarms when switching to alarms tab
  useEffect(() => {
    if (activeTab === 'alarms' || activeTab === 'all') {
      refreshAlarms();
    }
  }, [activeTab]);

  // Fetch notifications with category filter
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    userId,
    organizationId,
    category: activeTab === 'all' || activeTab === 'alarms' ? undefined : (activeTab as any),
    realtime: true,
  });

  const handleAcknowledge = async (alarmId: string, note?: string) => {
    const result = await acknowledgeAlarm(alarmId, note);
    if (result.success) {
      refreshAlarms();
    } else {
      console.error('Failed to acknowledge alarm:', result.error);
      alert(`Failed to acknowledge alarm: ${result.error}`);
    }
  };

  const handleResolve = async (alarmId: string, note?: string, rootCause?: string) => {
    const result = await resolveAlarm(alarmId, note, rootCause);
    if (result.success) {
      refreshAlarms();
    } else {
      console.error('Failed to resolve alarm:', result.error);
      alert(`Failed to resolve alarm: ${result.error}`);
    }
  };

  const handleRefresh = () => {
    refreshAlarms();
    refreshNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markAsRead(notificationId);
    if (!result.success) {
      console.error('Failed to mark notification as read:', result.error);
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAsRead();
    if (!result.success) {
      console.error('Failed to mark all as read:', result.error);
      alert(`Failed to mark all as read: ${result.error}`);
    }
  };

  // Combine alarms and notifications for "All" view
  const filteredNotifications =
    activeTab === 'alarms' ? [] : notifications;

  const filteredAlarms =
    activeTab === 'inventory' || activeTab === 'batch' || activeTab === 'task'
      ? []
      : alarms;

  const loading = alarmsLoading || notificationsLoading;
  const error = alarmsError || notificationsError;

  const totalItems = filteredAlarms.length + filteredNotifications.length;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-blue-500">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
              Mark All Read
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for Filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            <Bell className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="alarms">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alarms {alarms.length > 0 && `(${alarms.length})`}
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Sprout className="h-4 w-4 mr-2" />
            Batches
          </TabsTrigger>
          <TabsTrigger value="task">
            <ClipboardList className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Content for each tab */}
        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {error && (
            <Card className="p-8 border-red-200 bg-red-50">
              <div className="text-center text-red-600">
                Error loading data: {error.message}
              </div>
            </Card>
          )}

          {!loading && !error && totalItems === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Items</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all'
                    ? 'No alarms or notifications to display.'
                    : activeTab === 'alarms'
                    ? 'No active alarms. All systems operating normally.'
                    : `No ${activeTab} notifications.`}
                </p>
              </div>
            </Card>
          )}

          {/* Display Alarms */}
          {filteredAlarms.map((alarm) => (
            <div key={alarm.id} className="relative">
              <div className="flex items-start gap-2">
                <div className="mt-4">{getAlarmTypeIcon(alarm.alarm_type)}</div>
                <div className="flex-1">
                  <AlarmCard
                    alarm={alarm}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Display Notifications */}
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}

          {loading && totalItems === 0 && (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                Loading...
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {totalItems > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {totalItems} item{totalItems !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

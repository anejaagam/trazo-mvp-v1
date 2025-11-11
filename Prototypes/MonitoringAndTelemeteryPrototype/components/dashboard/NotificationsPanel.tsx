import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import type { Notification } from '../../types/telemetry';
import { Bell, BellDot, Check, AlertCircle, Info, Wrench, FileText } from 'lucide-react';
import { formatTimestamp } from '../../lib/telemetry';

interface NotificationsPanelProps {
  notifications: Notification[];
  timezone: string;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToAlarm?: (alarmId: string) => void;
}

export function NotificationsPanel({ 
  notifications, 
  timezone, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onNavigateToAlarm 
}: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getNotificationIcon = (type: Notification['type'], severity: Notification['severity']) => {
    if (type === 'alarm') {
      return severity === 'critical' 
        ? <AlertCircle className="w-5 h-5 text-destructive" />
        : <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
    if (type === 'maintenance') return <Wrench className="w-5 h-5 text-blue-500" />;
    if (type === 'export') return <FileText className="w-5 h-5 text-green-500" />;
    return <Info className="w-5 h-5 text-muted-foreground" />;
  };
  
  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 border-destructive/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
    }
  };
  
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.alarm_id && onNavigateToAlarm) {
      onNavigateToAlarm(notification.alarm_id);
      setOpen(false);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellDot className="w-4 h-4 mr-2" />
              Notifications
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                {unreadCount}
              </Badge>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'
            }
          </SheetDescription>
        </SheetHeader>
        
        {unreadCount > 0 && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMarkAllAsRead}
              className="w-full"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        )}
        
        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg border transition-colors ${
                      !notification.read 
                        ? getSeverityColor(notification.severity)
                        : 'bg-muted/30 border-border'
                    } ${notification.alarm_id ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type, notification.severity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatTimestamp(notification.timestamp, timezone, true)}
                          </span>
                          {notification.type === 'alarm' && (
                            <Badge variant="outline" className="text-xs">
                              Alarm
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                  <Separator className="my-2" />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

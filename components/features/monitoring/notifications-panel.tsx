'use client'

import { useState } from 'react'
import { Bell, BellDot, Check, AlertCircle, AlertTriangle, Info, Wrench, FileText } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface NotificationsPanelProps {
  userId: string
}

export function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { can } = usePermissions('org_admin')

  // Real-time notifications
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ userId, realtime: true, limit: 50, autoFetch: true })

  if (!can('monitoring:view')) {
    return null
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const handleNavigateToAlarm = (alarmId: string | null) => {
    if (alarmId) {
      setOpen(false)
      router.push(`/dashboard/monitoring/alarms?id=${alarmId}`)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alarm':
        return <AlertCircle className="h-5 w-5" />
      case 'maintenance':
        return <Wrench className="h-5 w-5" />
      case 'export':
        return <FileText className="h-5 w-5" />
      case 'system':
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
      default:
        return 'text-blue-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
      default:
        return <Info className="h-4 w-4" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellDot className="h-5 w-5" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark All Read
              </Button>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            View and manage your alarm notifications and system alerts
          </SheetDescription>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-destructive">Failed to load notifications</p>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
            <Bell className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <ScrollArea className="h-[calc(100vh-180px)] mt-4">
            <div className="space-y-2 pr-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${notification.is_read ? 'bg-background' : 'bg-muted/50'}
                    hover:bg-accent
                  `}
                  onClick={() => {
                    if (!notification.is_read) {
                      handleMarkAsRead(notification.id)
                    }
                    if (notification.related_alarm_id) {
                      handleNavigateToAlarm(notification.related_alarm_id)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className={`mt-0.5 ${getSeverityColor(notification.severity)}`}>
                      {getCategoryIcon(notification.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium leading-none">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        {/* Severity Badge */}
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getSeverityColor(notification.severity)}`}
                        >
                          {getSeverityIcon(notification.severity)}
                          {notification.severity}
                        </Badge>

                        {/* Category Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {notification.category}
                        </Badge>

                        {/* Timestamp */}
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Mark as Read Button (only for unread) */}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Read Timestamp (for read notifications) */}
                  {notification.is_read && notification.read_at && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Read {formatDistanceToNow(new Date(notification.read_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

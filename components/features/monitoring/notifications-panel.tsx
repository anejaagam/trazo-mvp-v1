'use client'

import { useState } from 'react'
import { Bell, BellDot, Check, AlertCircle, AlertTriangle, Info, Wrench, FileText, CheckSquare } from 'lucide-react'
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

  const handleNavigateToTask = (notification: any) => {
    const taskId = notification.metadata?.task_id
    if (taskId) {
      setOpen(false)
      router.push(`/dashboard/workflows?taskId=${taskId}`)
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    
    // Handle category-specific navigation
    if (notification.category === 'task') {
      handleNavigateToTask(notification)
    } else if (notification.related_alarm_id) {
      handleNavigateToAlarm(notification.related_alarm_id)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alarm':
        return <AlertCircle className="h-5 w-5" />
      case 'task':
        return <CheckSquare className="h-5 w-5" />
      case 'maintenance':
        return <Wrench className="h-5 w-5" />
      case 'export':
        return <FileText className="h-5 w-5" />
      case 'system':
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getUrgencyColor = (urgency: string, severity?: string) => {
    // Use urgency for tasks, severity for alarms
    const level = urgency || severity || 'medium'
    switch (level) {
      case 'high':
      case 'critical':
        return 'text-red-500'
      case 'medium':
      case 'warning':
        return 'text-yellow-500'
      case 'low':
      case 'info':
      default:
        return 'text-blue-500'
    }
  }

  const getUrgencyIcon = (urgency: string, severity?: string) => {
    const level = urgency || severity || 'medium'
    switch (level) {
      case 'high':
      case 'critical':
        return <AlertCircle className="h-4 w-4" />
      case 'medium':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'low':
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
            <div className="space-y-3 pr-4">
              {notifications.map((notification) => {
                const isHighUrgency = notification.urgency === 'high' || notification.severity === 'critical';
                const isMediumUrgency = notification.urgency === 'medium' || notification.severity === 'warning';
                
                return (
                  <div
                    key={notification.id}
                    className={`
                      relative overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer
                      ${notification.is_read 
                        ? 'bg-background border-slate-200' 
                        : isHighUrgency
                          ? 'bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50 border-red-300 shadow-md shadow-red-100 ring-2 ring-red-200'
                          : isMediumUrgency
                            ? 'bg-gradient-to-br from-yellow-50 via-yellow-50/80 to-amber-50 border-yellow-300 shadow-sm shadow-yellow-100 ring-1 ring-yellow-200'
                            : 'bg-gradient-to-br from-blue-50 via-slate-50 to-slate-50 border-blue-200 shadow-sm'
                      }
                      hover:shadow-lg hover:scale-[1.02]
                      ${isHighUrgency && !notification.is_read ? 'animate-pulse-slow' : ''}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Urgency indicator bar */}
                    {!notification.is_read && (
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isHighUrgency 
                            ? 'bg-gradient-to-b from-red-500 via-red-600 to-red-500' 
                            : isMediumUrgency
                              ? 'bg-gradient-to-b from-yellow-500 via-amber-500 to-yellow-500'
                              : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-500'
                        }`}
                      />
                    )}
                    
                    <div className="p-4 pl-5">
                      <div className="flex items-start gap-3">
                        {/* Category Icon with enhanced styling */}
                        <div className={`
                          mt-0.5 flex items-center justify-center rounded-full p-2 flex-shrink-0
                          ${isHighUrgency && !notification.is_read
                            ? 'bg-red-100 text-red-700 ring-2 ring-red-300'
                            : isMediumUrgency && !notification.is_read
                              ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300'
                              : !notification.is_read
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                : 'bg-slate-100 text-slate-600'
                          }
                        `}>
                          {getCategoryIcon(notification.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold leading-tight ${
                              isHighUrgency && !notification.is_read ? 'text-red-900' : 
                              isMediumUrgency && !notification.is_read ? 'text-yellow-900' : 
                              'text-slate-900'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1 ${
                                isHighUrgency ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                                isMediumUrgency ? 'bg-yellow-500 shadow-md shadow-yellow-500/50' :
                                'bg-blue-500'
                              }`} />
                            )}
                          </div>
                          
                          <p className={`text-sm leading-relaxed ${
                            isHighUrgency && !notification.is_read ? 'text-red-800 font-medium' :
                            isMediumUrgency && !notification.is_read ? 'text-yellow-800' :
                            'text-slate-600'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {/* Urgency/Severity Badge with enhanced styling */}
                            <Badge
                              variant={isHighUrgency ? 'destructive' : 'outline'}
                              className={`flex items-center gap-1 text-xs font-semibold ${
                                isHighUrgency 
                                  ? 'bg-red-600 text-white border-red-700 shadow-sm' 
                                  : isMediumUrgency
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                                    : 'bg-blue-50 text-blue-700 border-blue-300'
                              }`}
                            >
                              {getUrgencyIcon(notification.urgency, notification.severity)}
                              <span className="uppercase tracking-wide">
                                {notification.urgency || notification.severity}
                              </span>
                            </Badge>

                            {/* Category Badge */}
                            <Badge variant="secondary" className="text-xs font-medium capitalize">
                              {notification.category}
                            </Badge>

                            {/* Timestamp */}
                            <span className="text-xs text-slate-500 font-medium">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Mark as Read Button (only for unread) */}
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 flex-shrink-0 ${
                              isHighUrgency ? 'hover:bg-red-100 text-red-700' :
                              isMediumUrgency ? 'hover:bg-yellow-100 text-yellow-700' :
                              'hover:bg-blue-100 text-blue-700'
                            }`}
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
                        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Read {formatDistanceToNow(new Date(notification.read_at), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  )
}

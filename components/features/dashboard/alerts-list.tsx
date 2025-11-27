'use client'

import { motion } from "framer-motion"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"

interface AlertsListProps {
  alarms: any[]
}

// Database uses: 'info', 'warning', 'critical'
type SeverityType = 'info' | 'warning' | 'critical'

const severityConfig: Record<SeverityType, {
  icon: any
  color: string
  bg: string
  badgeBg: string
  badgeText: string
  label: string
}> = {
  info: { 
    icon: Info, 
    color: "text-blue-600",
    bg: "bg-blue-50",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    label: "Info"
  },
  warning: { 
    icon: AlertTriangle, 
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    badgeBg: "bg-yellow-400",
    badgeText: "text-yellow-900",
    label: "Warning"
  },
  critical: { 
    icon: AlertCircle, 
    color: "text-red-600",
    bg: "bg-red-50",
    badgeBg: "bg-red-500",
    badgeText: "text-white",
    label: "Critical"
  },
}

function getTimeAgo(date: string): string {
  const now = new Date()
  const alarmDate = new Date(date)
  const diffMs = now.getTime() - alarmDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function AlertsList({ alarms }: AlertsListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl p-5 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-900 text-sm mb-0.5">Recent Alerts</p>
          <p className="text-gray-500 text-xs">System alerts and notifications requiring attention</p>
        </div>
        <Link href="/dashboard/alarms" className="text-[#00D9A3] text-xs hover:underline">View All</Link>
      </div>

      <div className="space-y-2">
        {alarms.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No active alarms</p>
        ) : (
          alarms.map((alarm, index) => {
            const severity = (alarm.severity || 'warning') as SeverityType
            const config = severityConfig[severity] || severityConfig.warning
            const Icon = config.icon
            
            return (
              <motion.div
                key={alarm.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} hover:bg-opacity-80 transition-colors cursor-pointer group`}
              >
                <div className="flex-shrink-0 pt-0.5">
                  <Icon className={`size-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm mb-0.5">{alarm.message}</p>
                  <p className="text-gray-500 text-xs">{getTimeAgo(alarm.triggered_at || alarm.created_at)}</p>
                </div>
                <span className={`px-2 py-1 ${config.badgeBg} ${config.badgeText} text-xs rounded flex-shrink-0`}>
                  {config.label}
                </span>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

import { motion } from "motion/react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

const alerts = [
  { 
    id: 1, 
    message: "Pod 12 temperature exceeds threshold", 
    severity: "high" as const, 
    time: "7 min ago",
    label: "High"
  },
  { 
    id: 2, 
    message: "CO2 tank inventory below minimum", 
    severity: "medium" as const, 
    time: "1 hour ago",
    label: "Medium"
  },
  { 
    id: 3, 
    message: "Weekly cleaning checklist overdue", 
    severity: "low" as const, 
    time: "3 hours ago",
    label: "Low"
  },
];

const severityConfig = {
  low: { 
    icon: Info, 
    color: "text-blue-600",
    bg: "bg-blue-50",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700"
  },
  medium: { 
    icon: AlertTriangle, 
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    badgeBg: "bg-yellow-400",
    badgeText: "text-yellow-900"
  },
  high: { 
    icon: AlertCircle, 
    color: "text-red-600",
    bg: "bg-red-50",
    badgeBg: "bg-red-500",
    badgeText: "text-white"
  },
};

export function AlertsList() {
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
        <button className="text-[#00D9A3] text-xs hover:underline">View All</button>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, index) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} hover:bg-opacity-80 transition-colors cursor-pointer group`}
            >
              <div className="flex-shrink-0 pt-0.5">
                <Icon className={`size-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm mb-0.5">{alert.message}</p>
                <p className="text-gray-500 text-xs">{alert.time}</p>
              </div>
              <span className={`px-2 py-1 ${config.badgeBg} ${config.badgeText} text-xs rounded flex-shrink-0`}>
                {alert.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

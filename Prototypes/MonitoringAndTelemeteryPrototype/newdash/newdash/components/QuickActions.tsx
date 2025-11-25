import { motion } from "motion/react";
import { Plus, FileText, Settings, Download } from "lucide-react";

const actions = [
  { icon: Plus, label: "New Batch" },
  { icon: FileText, label: "View Reports" },
  { icon: Settings, label: "System Settings" },
  { icon: Download, label: "Export Data" },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-[#00D9A3] to-[#00a67e] rounded-xl p-5"
    >
      <h3 className="text-white mb-3 text-sm">Quick Actions</h3>
      
      <div className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ x: 4 }}
              className="w-full flex items-center gap-3 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-left"
            >
              <Icon className="size-4" />
              <span className="text-sm">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

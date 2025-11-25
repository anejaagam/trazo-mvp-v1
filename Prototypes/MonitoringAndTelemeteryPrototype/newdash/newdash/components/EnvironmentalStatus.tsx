import { motion } from "motion/react";
import { Thermometer, Droplets, Wind, Server } from "lucide-react";

const metrics = [
  { 
    icon: Thermometer, 
    label: "Avg Temperature", 
    value: "72.5°F",
    color: "from-orange-500 to-red-500"
  },
  { 
    icon: Droplets, 
    label: "Avg Humidity", 
    value: "65.2%",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    icon: Wind, 
    label: "Avg CO2", 
    value: "1250 ppm",
    color: "from-purple-500 to-pink-500"
  },
  { 
    icon: Server, 
    label: "Pods Online", 
    value: "47/48",
    color: "from-[#00D9A3] to-emerald-500"
  },
];

export function EnvironmentalStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl p-5 border border-gray-200"
    >
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-1">Environmental Status</p>
        <p className="text-gray-500 text-xs">Current conditions across all pods</p>
      </div>

      <div className="space-y-2">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 bg-gradient-to-br ${metric.color} rounded-lg`}>
                  <Icon className="size-4 text-white" />
                </div>
                <span className="text-gray-600 text-sm">{metric.label}</span>
              </div>
              <span className="text-gray-900 text-sm">{metric.value}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

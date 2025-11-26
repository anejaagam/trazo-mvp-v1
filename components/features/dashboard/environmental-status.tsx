'use client'

import { motion } from "framer-motion"
import { Thermometer, Droplets, Wind, Server } from "lucide-react"

interface EnvironmentalStatusProps {
  environmental: {
    avgTemp: number
    avgHumidity: number
    avgCO2: number
    podsOnline: number
    totalPods: number
  }
}

export function EnvironmentalStatus({ environmental }: EnvironmentalStatusProps) {
  const metrics = [
    { 
      icon: Thermometer, 
      label: "Avg Temperature", 
      value: environmental.avgTemp > 0 ? `${environmental.avgTemp.toFixed(1)}°C` : "--",
      color: "from-orange-500 to-red-500"
    },
    { 
      icon: Droplets, 
      label: "Avg Humidity", 
      value: environmental.avgHumidity > 0 ? `${environmental.avgHumidity.toFixed(1)}%` : "--",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Wind, 
      label: "Avg CO2", 
      value: environmental.avgCO2 > 0 ? `${Math.round(environmental.avgCO2)} ppm` : "--",
      color: "from-purple-500 to-pink-500"
    },
    { 
      icon: Server, 
      label: "Pods Online", 
      value: `${environmental.podsOnline}/${environmental.totalPods}`,
      color: "from-[#00D9A3] to-emerald-500"
    },
  ]
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

      <div className="space-y-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 bg-gradient-to-br ${metric.color} rounded-xl shadow-sm`}>
                  <Icon className="size-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-gray-700 text-sm font-medium">{metric.label}</span>
              </div>
              <span className="text-gray-900 text-base font-semibold">{metric.value}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

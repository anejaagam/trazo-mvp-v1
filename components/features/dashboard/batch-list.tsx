'use client'

import { motion } from "framer-motion"

const batches = [
  { 
    id: "B-2024-001", 
    strain: "Blue Dream", 
    count: 16, 
    status: "complete" as const, 
    day: "Day 45",
    statusLabel: "Complete"
  },
  { 
    id: "B-2024-002", 
    strain: "OG Kush", 
    count: 12, 
    status: "vegetative" as const, 
    day: "Day 21",
    statusLabel: "Vegetative"
  },
  { 
    id: "B-2024-003", 
    strain: "Gelato", 
    count: 16, 
    status: "harvest" as const, 
    day: "Day 3",
    statusLabel: "Harvest"
  },
]

const statusStyles = {
  complete: { bg: "bg-[#00D9A3]", text: "text-white" },
  vegetative: { bg: "bg-blue-500", text: "text-white" },
  harvest: { bg: "bg-purple-500", text: "text-white" },
}

export function BatchList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl p-5 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-900 text-sm mb-0.5">Recent Batches</p>
          <p className="text-gray-500 text-xs">Latest batch activity and status updates</p>
        </div>
        <button className="text-[#00D9A3] text-xs hover:underline">View All</button>
      </div>

      <div className="space-y-2">
        {batches.map((batch, index) => {
          const style = statusStyles[batch.status]
          return (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="flex-1">
                <p className="text-gray-900 text-sm mb-0.5">{batch.id}</p>
                <p className="text-gray-500 text-xs">{batch.strain} • {batch.count} plants</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 ${style.bg} ${style.text} text-xs rounded`}>
                  {batch.statusLabel}
                </span>
                <span className="text-gray-500 text-xs">{batch.day}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

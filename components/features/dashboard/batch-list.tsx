'use client'

import { motion } from "framer-motion"

interface BatchListProps {
  batches: any[]
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  germination: { bg: "bg-yellow-500", text: "text-white" },
  vegetative: { bg: "bg-blue-500", text: "text-white" },
  flowering: { bg: "bg-purple-500", text: "text-white" },
  harvest: { bg: "bg-[#00D9A3]", text: "text-white" },
  complete: { bg: "bg-gray-500", text: "text-white" },
}

const statusLabels: Record<string, string> = {
  germination: "Germination",
  vegetative: "Vegetative",
  flowering: "Flowering",
  harvest: "Harvest",
  complete: "Complete",
}

export function BatchList({ batches }: BatchListProps) {
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
        {batches.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No active batches</p>
        ) : (
          batches.map((batch, index) => {
            const style = statusStyles[batch.status] || statusStyles.vegetative
            const cultivarName = batch.cultivar?.name || 'Unknown'
            const plantCount = batch.plants?.[0]?.count || 0
            
            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex-1">
                  <p className="text-gray-900 text-sm mb-0.5">{batch.batch_number}</p>
                  <p className="text-gray-500 text-xs">{cultivarName} • {plantCount} plants</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 ${style.bg} ${style.text} text-xs rounded`}>
                    {statusLabels[batch.status] || batch.status}
                  </span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

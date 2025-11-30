'use client'

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-600 text-sm">{title}</p>
        <Icon className="size-5 text-gray-400" />
      </div>
      <p className="text-gray-900 text-3xl mb-1">{value}</p>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">{change}</span>
      </div>
    </motion.div>
  )
}

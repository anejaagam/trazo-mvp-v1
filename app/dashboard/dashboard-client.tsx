'use client'

import { motion } from "framer-motion"
import { StatCard } from "@/components/features/dashboard/stat-card"
import { BatchList } from "@/components/features/dashboard/batch-list"
import { EnvironmentalStatus } from "@/components/features/dashboard/environmental-status"
import { AlertsList } from "@/components/features/dashboard/alerts-list"
import { ActivityChart } from "@/components/features/dashboard/activity-chart"
import { QuickActions } from "@/components/features/dashboard/quick-actions"
import { Boxes, Sprout, Bell, Package } from "lucide-react"
import type { JurisdictionId } from "@/lib/jurisdiction/types"

interface DashboardClientProps {
  siteId: string
  organizationId: string
  userId: string
  jurisdictionId: string | null
  stats: {
    activeBatches: number
    totalPlants: number
    activeAlarms: number
    lowStockItems: number
  }
  environmental: {
    avgTemp: number
    avgHumidity: number
    avgCO2: number
    podsOnline: number
    totalPods: number
  }
  batches: any[]
  alarms: any[]
  growthData: Array<{ name: string; plants: number; batches: number }>
  totalPlants: number
  growthPercent: string
}

export function DashboardClient({ siteId, organizationId, userId, jurisdictionId, stats, environmental, batches, alarms, growthData, totalPlants, growthPercent }: DashboardClientProps) {
  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-gray-900 mb-1">Dashboard Overview</h1>
        <p className="text-gray-600 text-sm">Welcome back! Here&apos;s what&apos;s happening with your operations.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Batches"
          value={stats.activeBatches.toString()}
          change={stats.activeBatches > 0 ? "In progress" : "None active"}
          icon={Boxes}
        />
        <StatCard
          title="Total Plants"
          value={stats.totalPlants.toLocaleString()}
          change={stats.totalPlants > 0 ? "Across all batches" : "No plants"}
          icon={Sprout}
        />
        <StatCard
          title="Active Alarms"
          value={stats.activeAlarms.toString()}
          change={stats.activeAlarms === 0 ? "All clear" : "Requires attention"}
          icon={Bell}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          change={stats.lowStockItems > 0 ? "Needs reorder" : "Stock levels good"}
          icon={Package}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 flex">
          <ActivityChart data={growthData} totalPlants={totalPlants} growthPercent={growthPercent} />
        </div>
        <div className="space-y-4 flex flex-col">
          <EnvironmentalStatus environmental={environmental} />
          <QuickActions 
            siteId={siteId}
            organizationId={organizationId}
            userId={userId}
            jurisdictionId={jurisdictionId as JurisdictionId}
          />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BatchList batches={batches} />
        <AlertsList alarms={alarms} />
      </div>
    </>
  )
}

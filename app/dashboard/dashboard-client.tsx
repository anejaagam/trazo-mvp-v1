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
}

export function DashboardClient({ siteId, organizationId, userId, jurisdictionId }: DashboardClientProps) {
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
          value="24"
          change="+12 from last month"
          icon={Boxes}
        />
        <StatCard
          title="Total Plants"
          value="2,840"
          change="+184 from last week"
          icon={Sprout}
        />
        <StatCard
          title="Active Alarms"
          value="3"
          change="-2 from yesterday"
          icon={Bell}
        />
        <StatCard
          title="Low Stock Items"
          value="7"
          change="+3 from last week"
          icon={Package}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 flex">
          <ActivityChart />
        </div>
        <div className="space-y-4 flex flex-col">
          <EnvironmentalStatus />
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
        <BatchList />
        <AlertsList />
      </div>
    </>
  )
}

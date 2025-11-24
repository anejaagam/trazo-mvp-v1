'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, FileText, Settings, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BatchModal } from "@/components/features/batches/batch-modal"
import { useJurisdiction } from "@/hooks/use-jurisdiction"
import type { JurisdictionId } from "@/lib/jurisdiction/types"

const actions = [
  { icon: Plus, label: "New Batch", action: "newBatch" },
  { icon: FileText, label: "View Reports", href: "/dashboard/reports" },
  { icon: Settings, label: "System Settings", href: "/dashboard/admin/settings" },
  { icon: Download, label: "Export Data", action: "export" },
]

interface QuickActionsProps {
  siteId: string
  organizationId: string
  userId: string
  jurisdictionId: JurisdictionId
}

export function QuickActions({ siteId, organizationId, userId, jurisdictionId }: QuickActionsProps) {
  const router = useRouter()
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const { jurisdiction } = useJurisdiction(jurisdictionId)
  const plantType = jurisdiction?.plant_type || 'cannabis'

  const handleAction = (action: typeof actions[0]) => {
    if (action.action === "newBatch") {
      setIsBatchModalOpen(true)
      return
    }
    if (action.action === "export") {
      toast.info("Export functionality coming soon")
      return
    }
    if (action.href) {
      router.push(action.href)
    }
  }

  const handleBatchSuccess = () => {
    setIsBatchModalOpen(false)
    toast.success("Batch created successfully")
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-[#00D9A3] to-[#00a67e] rounded-xl p-5"
      >
        <h3 className="text-white mb-3 text-sm">Quick Actions</h3>
        
        <div className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ x: 4 }}
                onClick={() => handleAction(action)}
                className="w-full flex items-center gap-3 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-left"
              >
                <Icon className="size-4" />
                <span className="text-sm">{action.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <BatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={handleBatchSuccess}
        siteId={siteId}
        organizationId={organizationId}
        userId={userId}
        jurisdictionId={jurisdictionId}
        plantType={plantType}
      />
    </>
  )
}

import { motion } from "motion/react";
import { StatCard } from "./components/StatCard";
import { BatchList } from "./components/BatchList";
import { EnvironmentalStatus } from "./components/EnvironmentalStatus";
import { AlertsList } from "./components/AlertsList";
import { ActivityChart } from "./components/ActivityChart";
import { QuickActions } from "./components/QuickActions";
import { Boxes, Sprout, Bell, Package } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-gray-900 mb-1">Dashboard Overview</h1>
          <p className="text-gray-600 text-sm">Welcome back! Here's what's happening with your operations.</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Batches"
            value="24"
            change="+3 from last month"
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
            change="3 from yesterday"
            icon={Bell}
          />
          <StatCard
            title="Low Stock Items"
            value="7"
            change="3 from last week"
            icon={Package}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
          <div className="space-y-4">
            <EnvironmentalStatus />
            <QuickActions />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BatchList />
          <AlertsList />
        </div>
      </div>
    </div>
  );
}

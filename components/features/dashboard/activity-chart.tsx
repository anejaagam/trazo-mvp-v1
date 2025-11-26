'use client'

import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useEffect, useRef, useState, useMemo } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ActivityChartProps {
  data: Array<{ name: string; plants: number; batches: number }>
  totalPlants: number
  growthPercent: string
}

const WEEK_OPTIONS = [
  { value: '4', label: '4 weeks' },
  { value: '8', label: '8 weeks' },
  { value: '12', label: '12 weeks' },
]

export function ActivityChart({ data, totalPlants, growthPercent }: ActivityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 })
  const [selectedWeeks, setSelectedWeeks] = useState('4')

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        // Use full width with proper margins
        setDimensions({ width: width || 800, height: 400 })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Filter data based on selected weeks
  const filteredData = useMemo(() => {
    const weeks = parseInt(selectedWeeks)
    // Data comes with 12 weeks, take the last N weeks
    return data.slice(-weeks)
  }, [data, selectedWeeks])

  // Recalculate cumulative totals for filtered data
  const chartData = useMemo(() => {
    let cumulativePlants = 0
    let cumulativeBatches = 0
    return filteredData.map(week => {
      cumulativePlants += week.plants
      cumulativeBatches += week.batches
      return {
        name: week.name,
        plants: cumulativePlants,
        batches: cumulativeBatches
      }
    })
  }, [filteredData])

  // Calculate growth percentage for filtered period
  const displayGrowthPercent = useMemo(() => {
    const firstWeek = chartData[0]?.plants || 0
    const lastWeek = chartData[chartData.length - 1]?.plants || 0
    if (firstWeek > 0) {
      return ((lastWeek - firstWeek) / firstWeek * 100).toFixed(2)
    }
    return '0.00'
  }, [chartData])

  const displayTotalPlants = chartData[chartData.length - 1]?.plants || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl p-5 border border-gray-200 w-full h-full flex flex-col"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-2">Growth Metrics</p>
          <p className="text-gray-900 text-2xl mb-1">{displayTotalPlants.toLocaleString()} Plants</p>
          <p className={`text-xs ${parseFloat(displayGrowthPercent) >= 0 ? 'text-[#00D9A3]' : 'text-red-500'}`}>
            {parseFloat(displayGrowthPercent) >= 0 ? '+' : ''}{displayGrowthPercent}% growth over last {selectedWeeks} weeks
          </p>
        </div>
        <Select value={selectedWeeks} onValueChange={setSelectedWeeks}>
          <SelectTrigger className="w-[110px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEK_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={containerRef} className="w-full outline-none [&_svg]:outline-none [&_*]:outline-none">
        {dimensions.width > 0 && (
          <LineChart width={dimensions.width} height={dimensions.height} data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }} style={{ outline: 'none' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                color: "#111827"
              }}
              cursor={{ stroke: 'rgba(0, 217, 163, 0.3)', strokeWidth: 2 }}
            />
            <Line 
              type="monotone"
              dataKey="plants" 
              stroke="#00D9A3" 
              strokeWidth={3}
              dot={{ fill: '#00D9A3', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone"
              dataKey="batches" 
              stroke="#9ca3af" 
              strokeWidth={2}
              dot={{ fill: '#9ca3af', r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        )}
      </div>
    </motion.div>
  )
}

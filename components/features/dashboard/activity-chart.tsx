'use client'

import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useEffect, useRef, useState } from "react"

const data = [
  { name: "Week 1", plants: 2456, batches: 18 },
  { name: "Week 2", plants: 2512, batches: 19 },
  { name: "Week 3", plants: 2598, batches: 21 },
  { name: "Week 4", plants: 2656, batches: 22 },
  { name: "Week 5", plants: 2740, batches: 23 },
  { name: "Week 6", plants: 2812, batches: 24 },
  { name: "This Week", plants: 2840, batches: 24 },
]

export function ActivityChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 })

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl p-5 border border-gray-200 w-full h-full flex flex-col"
    >
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-2">Growth Metrics</p>
        <p className="text-gray-900 text-2xl mb-1">2,840 Plants</p>
        <p className="text-[#00D9A3] text-xs">+6.93% growth over last 7 weeks</p>
      </div>

      <div ref={containerRef} className="w-full">
        {dimensions.width > 0 && (
          <LineChart width={dimensions.width} height={dimensions.height} data={data} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
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

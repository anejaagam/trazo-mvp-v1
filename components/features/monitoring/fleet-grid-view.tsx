/**
 * FleetGridView Component
 * 
 * Grid view for fleet monitoring showing pod cards
 * Complements the table view in FleetView
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer, Droplets, Wind, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getActiveRecipesForScopes } from '@/app/actions/recipes'
import type { PodSnapshot } from '@/types/telemetry'

interface FleetGridViewProps {
  snapshots: PodSnapshot[]
  onPodClick?: (podId: string) => void
}

type RecipeInfo = {
  recipeName: string
  stageName: string
  currentDay: number
  totalDays: number
} | null

export function FleetGridView({ snapshots, onPodClick }: FleetGridViewProps) {
  const [activeRecipes, setActiveRecipes] = useState<Record<string, RecipeInfo>>({})
  
  useEffect(() => {
    async function fetchRecipes() {
      if (snapshots.length === 0) return
      
      const podIds = snapshots.map(s => s.pod.id)
      const { data: podRecipes } = await getActiveRecipesForScopes('pod', podIds)
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: assignments } = await supabase
        .from('batch_pod_assignments')
        .select('pod_id, batch_id')
        .in('pod_id', podIds)
        .is('removed_at', null)
      
      const batchIds = assignments ? [...new Set(assignments.map(a => a.batch_id))] : []
      
      const { data: batchRecipes } = batchIds.length > 0 
        ? await getActiveRecipesForScopes('batch', batchIds)
        : { data: null }
      
      const mergedRecipes: Record<string, RecipeInfo> = {}
      
      if (batchRecipes && assignments) {
        assignments.forEach(assignment => {
          if (batchRecipes[assignment.batch_id]) {
            mergedRecipes[assignment.pod_id] = batchRecipes[assignment.batch_id]
          }
        })
      }
      
      if (podRecipes) {
        Object.entries(podRecipes).forEach(([podId, recipe]) => {
          if (recipe !== null) {
            mergedRecipes[podId] = recipe
          }
        })
      }
      
      setActiveRecipes(mergedRecipes)
    }
    
    fetchRecipes()
  }, [snapshots])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {snapshots.map((snapshot) => {
        const recipe = activeRecipes[snapshot.pod.id]
        const hasAlarms = snapshot.alarm_count_24h > 0
        const lastUpdateSeconds = snapshot.last_update 
          ? Math.floor((Date.now() - new Date(snapshot.last_update).getTime()) / 1000)
          : null

        return (
          <Card
            key={snapshot.pod.id}
            className={`group transition-all duration-200 overflow-hidden ${
              onPodClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''
            } ${hasAlarms ? 'ring-1 ring-destructive/30' : ''}`}
            onClick={() => onPodClick?.(snapshot.pod.id)}
          >
            {/* Header with status indicator */}
            <div className={`px-4 py-3 border-b ${
              hasAlarms 
                ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50' 
                : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-xl truncate">{snapshot.pod.name}</h3>
                    {hasAlarms ? (
                      <Badge variant="destructive" className="gap-1 h-5 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        {snapshot.alarm_count_24h}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 h-5 text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        OK
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{snapshot.room.name}</p>
                </div>
              </div>
              
              {/* Recipe info */}
              {recipe && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {recipe.recipeName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {recipe.stageName} · Day {recipe.currentDay}/{recipe.totalDays}
                  </span>
                </div>
              )}
            </div>

            {/* Metrics */}
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Temperature */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/50 mb-1">
                    <Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-lg font-bold">{snapshot.temperature_c?.toFixed(1) ?? '--'}°</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Temp</p>
                </div>

                {/* Humidity */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-1">
                    <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-bold">{snapshot.humidity_pct?.toFixed(0) ?? '--'}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Humidity</p>
                </div>

                {/* CO2 */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-1">
                    <Wind className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold">{snapshot.co2_ppm?.toFixed(0) ?? '--'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">CO₂ ppm</p>
                </div>
              </div>

              {/* Last update footer */}
              {lastUpdateSeconds !== null && (
                <div className="mt-4 pt-3 border-t flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {lastUpdateSeconds < 60 
                      ? `${lastUpdateSeconds}s ago`
                      : `${Math.floor(lastUpdateSeconds / 60)}m ago`
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

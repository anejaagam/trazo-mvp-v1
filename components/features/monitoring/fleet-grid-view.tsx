/**
 * FleetGridView Component
 * 
 * Grid view for fleet monitoring showing pod cards
 * Complements the table view in FleetView
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer, Droplets, Wind, Activity } from 'lucide-react'
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
  // Fetch active recipes for all pods
  const [activeRecipes, setActiveRecipes] = useState<Record<string, RecipeInfo>>({})
  
  useEffect(() => {
    async function fetchRecipes() {
      if (snapshots.length === 0) return
      
      const podIds = snapshots.map(s => s.pod.id)
      console.log('Fleet Grid: Fetching recipes for pods:', podIds)
      
      // Fetch pod-level recipes
      const { data: podRecipes } = await getActiveRecipesForScopes('pod', podIds)
      console.log('Fleet Grid: Pod recipes:', podRecipes)
      
      // Fetch batch assignments to find which pods belong to batches
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: assignments, error: assignError } = await supabase
        .from('batch_pod_assignments')
        .select('pod_id, batch_id')
        .in('pod_id', podIds)
        .is('removed_at', null)
      
      console.log('Fleet Grid: Batch assignments:', assignments, 'Error:', assignError)
      
      // Get unique batch IDs
      const batchIds = assignments ? [...new Set(assignments.map(a => a.batch_id))] : []
      console.log('Fleet Grid: Batch IDs:', batchIds)
      
      const { data: batchRecipes } = batchIds.length > 0 
        ? await getActiveRecipesForScopes('batch', batchIds)
        : { data: null }
      
      console.log('Fleet Grid: Batch recipes:', batchRecipes)
      
      // Merge pod and batch recipes
      const mergedRecipes: Record<string, RecipeInfo> = {}
      
      // First add batch recipes (map batch recipes to their assigned pods)
      if (batchRecipes && assignments) {
        assignments.forEach(assignment => {
          if (batchRecipes[assignment.batch_id]) {
            mergedRecipes[assignment.pod_id] = batchRecipes[assignment.batch_id]
          }
        })
      }
      
      // Then override with pod-specific recipes if they exist (pod recipes take precedence)
      // Only override if the pod recipe is not null
      if (podRecipes) {
        Object.entries(podRecipes).forEach(([podId, recipe]) => {
          if (recipe !== null) {
            mergedRecipes[podId] = recipe
          }
        })
      }
      
      console.log('Fleet Grid: Final merged recipes:', mergedRecipes)
      setActiveRecipes(mergedRecipes)
    }
    
    fetchRecipes()
  }, [snapshots])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {snapshots.map((snapshot) => {
        const tempStatus = snapshot.temperature_c 
          ? (snapshot.temperature_c < 18 || snapshot.temperature_c > 30 ? 'warning' : 'normal')
          : 'unknown'
        
        const humidityStatus = snapshot.humidity_pct
          ? (snapshot.humidity_pct < 40 || snapshot.humidity_pct > 70 ? 'warning' : 'normal')
          : 'unknown'

        const recipe = activeRecipes[snapshot.pod.id]

        return (
          <Card
            key={snapshot.pod.id}
            className={`transition-all ${
              onPodClick ? 'cursor-pointer hover:shadow-lg hover:border-primary' : ''
            }`}
            onClick={() => onPodClick?.(snapshot.pod.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base">{snapshot.pod.name}</CardTitle>
                    {recipe && (
                      <Badge variant="secondary" className="text-xs">
                        {recipe.recipeName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {snapshot.room.name}
                    </p>
                    {recipe && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {recipe.stageName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Day {recipe.currentDay} of {recipe.totalDays}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={snapshot.alarm_count_24h > 0 ? 'destructive' : 'default'}>
                  {snapshot.alarm_count_24h > 0 ? `${snapshot.alarm_count_24h} Alarms` : 'OK'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Temperature */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    tempStatus === 'warning' ? 'text-orange-600' : ''
                  }`}>
                    {snapshot.temperature_c?.toFixed(1) ?? '--'}°C
                  </span>
                  {tempStatus === 'warning' && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200">
                      ⚠
                    </Badge>
                  )}
                </div>
              </div>

              {/* Humidity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Humidity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    humidityStatus === 'warning' ? 'text-orange-600' : ''
                  }`}>
                    {snapshot.humidity_pct?.toFixed(1) ?? '--'}%
                  </span>
                  {humidityStatus === 'warning' && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 bg-orange-50 text-orange-700 border-orange-200">
                      ⚠
                    </Badge>
                  )}
                </div>
              </div>

              {/* CO2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CO₂</span>
                </div>
                <span className="text-sm font-semibold">
                  {snapshot.co2_ppm?.toFixed(0) ?? '--'} ppm
                </span>
              </div>

              {/* Last Update */}
              {snapshot.last_update && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Last update</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.floor((Date.now() - new Date(snapshot.last_update).getTime()) / 1000)}s ago
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

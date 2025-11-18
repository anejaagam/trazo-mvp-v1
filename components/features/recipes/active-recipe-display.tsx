'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Clock,
  Thermometer,
  Droplets,
  Sun,
  Activity,
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { ActiveRecipeDetails } from '@/types/recipe'

interface ActiveRecipeDisplayProps {
  activeRecipe: ActiveRecipeDetails
}

export function ActiveRecipeDisplay({ activeRecipe }: ActiveRecipeDisplayProps) {
  const router = useRouter()
  const { activation, current_setpoints } = activeRecipe

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'yyyy-MM-dd h:mm a')
  }

  const handleViewRecipe = () => {
    router.push(`/dashboard/recipes/${activation.recipe_id}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Active Recipe
              <Badge variant="default" className="bg-emerald-500">Active</Badge>
            </CardTitle>
            <CardDescription>
              {activation.recipe?.name || 'Unknown Recipe'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewRecipe}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Recipe
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stage */}
        {activation.current_stage && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Current Stage
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {activation.current_stage.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {activation.current_stage.stage_type}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                Day {activation.current_stage_day} of {activation.current_stage.duration_days}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm">
            <p className="text-slate-600 dark:text-slate-400">Started</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formatDate(activation.activated_at)}
              </p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-slate-600 dark:text-slate-400">Version</p>
            <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
              v{activation.recipe_version?.version || '?'}
            </p>
          </div>
        </div>

        {/* Current Setpoints */}
        {current_setpoints && current_setpoints.length > 0 && (
          <div className="border-t dark:border-slate-700 pt-4">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Active Environmental Setpoints
            </p>
            <div className="grid grid-cols-2 gap-3">
              {current_setpoints.map((setpoint, idx) => {
                const getIcon = () => {
                  switch (setpoint.parameter_type) {
                    case 'temperature': return <Thermometer className="w-4 h-4 text-orange-500" />
                    case 'humidity': return <Droplets className="w-4 h-4 text-blue-500" />
                    case 'co2': return <Activity className="w-4 h-4 text-green-500" />
                    case 'light_intensity': return <Sun className="w-4 h-4 text-yellow-500" />
                    default: return <Activity className="w-4 h-4 text-slate-400" />
                  }
                }

                const getLabel = () => {
                  switch (setpoint.parameter_type) {
                    case 'temperature': return 'Temperature'
                    case 'humidity': return 'Humidity'
                    case 'vpd': return 'VPD'
                    case 'co2': return 'CO₂'
                    case 'light_intensity': return 'Light Level'
                    case 'photoperiod': return 'Light Schedule'
                    default: return setpoint.parameter_type
                  }
                }

                const getValue = () => {
                  if (setpoint.parameter_type === 'photoperiod' && setpoint.value) {
                    return `${setpoint.value} hours`
                  }
                  if (setpoint.min_value !== null && setpoint.max_value !== null) {
                    return `${setpoint.min_value}-${setpoint.max_value} ${setpoint.unit}`
                  }
                  if (setpoint.value !== null) {
                    return `${setpoint.value} ${setpoint.unit}`
                  }
                  return '-'
                }

                return (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {getIcon()}
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">{getLabel()}</p>
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {getValue()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

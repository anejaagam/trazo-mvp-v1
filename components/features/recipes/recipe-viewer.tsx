'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Edit, 
  Copy, 
  Clock,
  Thermometer,
  Droplets,
  Sun,
  Moon,
  Activity,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  type RecipeWithVersions, 
  type RecipeVersionWithStages,
  type RecipeStageWithDetails,
  type EnvironmentalSetpoint
} from '@/types/recipe'
import { useState, useEffect, useMemo } from 'react'
import { AssignRecipeDialog } from './assign-recipe-dialog'
import { createClient } from '@/lib/supabase/client'
import { publishRecipe } from '@/app/actions/recipes'

// Format date consistently for SSR/CSR hydration
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

interface RecipeViewerProps {
  recipe: RecipeWithVersions
  version?: RecipeVersionWithStages
  canEdit?: boolean
  canClone?: boolean
  canApply?: boolean
  onClose?: () => void
  onEdit?: () => void
  onClone?: () => void
}

export function RecipeViewer({ 
  recipe, 
  version,
  canEdit = false,
  canClone = false,
  canApply = false,
  onClose,
  onEdit,
  onClone
}: RecipeViewerProps) {
  const router = useRouter()
  const [selectedStageId, setSelectedStageId] = useState<string>('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [organizationId, setOrganizationId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [creatorName, setCreatorName] = useState<string>('')
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [isPublishing, setIsPublishing] = useState(false)

  // Fetch user and organization info for assignment
  useEffect(() => {
    async function fetchUserInfo() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.organization_id) {
          setOrganizationId(userData.organization_id)
        }
      }
    }
    fetchUserInfo()
  }, [])

  // Get the current version or latest version from recipe
  const currentVersion = version || recipe.latest_version
  const stages = useMemo(() => 
    (version?.stages || []) as RecipeStageWithDetails[], 
    [version]
  )

  // Set first stage as selected when stages load
  useEffect(() => {
    if (stages.length > 0 && !selectedStageId) {
      setSelectedStageId(stages[0].id)
    }
  }, [stages, selectedStageId])

  // Fetch creator's name and all version creators
  useEffect(() => {
    async function fetchUserNames() {
      try {
        const supabase = createClient()
        
        // Collect all unique user IDs
        const userIds = new Set<string>()
        if (currentVersion?.created_by) {
          userIds.add(currentVersion.created_by)
        }
        if (recipe.versions && recipe.versions.length > 0) {
          recipe.versions.forEach(v => {
            if (v.created_by) userIds.add(v.created_by)
          })
        }
        
        if (userIds.size === 0) {
          console.log('No user IDs found')
          return
        }
        
        console.log('Fetching user names for IDs:', Array.from(userIds))
        
        // Fetch all users at once
        const { data: usersData, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', Array.from(userIds))
        
        if (error) {
          console.error('Error fetching user names:', error)
          return
        }
        
        console.log('Fetched user data:', usersData)
        
        if (usersData && usersData.length > 0) {
          const names: Record<string, string> = {}
          usersData.forEach(user => {
            names[user.id] = user.full_name || user.email || 'Unknown User'
          })
          
          console.log('User names map:', names)
          setUserNames(names)
          
          // Set creator name for current version
          if (currentVersion?.created_by && names[currentVersion.created_by]) {
            setCreatorName(names[currentVersion.created_by])
          }
        }
      } catch (error) {
        console.error('Error in fetchUserNames:', error)
      }
    }
    
    if (currentVersion || recipe.versions) {
      fetchUserNames()
    }
  }, [currentVersion, recipe.versions])

  // Set initial selected stage
  useEffect(() => {
    if (!selectedStageId && stages.length > 0) {
      setSelectedStageId(stages[0].id)
    }
  }, [selectedStageId, stages])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.push('/dashboard/recipes')
    }
  }

  const handleClone = async () => {
    if (onClone) {
      onClone()
    } else {
      try {
        // Navigate to new recipe page with the current recipe data pre-filled
        const cloneData = {
          name: `${recipe.name} (Copy)`,
          description: recipe.description || '',
          plantTypes: recipe.plant_types || [],
          tags: recipe.tags || [],
          stages: version?.version_data?.stages || []
        }
        
        // Store clone data in sessionStorage to pre-fill the form
        sessionStorage.setItem('cloneRecipeData', JSON.stringify(cloneData))
        
        router.push('/dashboard/recipes/new')
        toast.success(`Cloning "${recipe.name}"...`)
      } catch (error) {
        console.error('Clone error:', error)
        toast.error('Failed to clone recipe')
      }
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      router.push(`/dashboard/recipes/${recipe.id}/edit`)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const { data, error } = await publishRecipe(recipe.id)
      
      if (error) {
        toast.error(error)
        return
      }
      
      toast.success('Recipe published successfully!')
      // Refresh the page to show updated status
      router.refresh()
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish recipe')
    } finally {
      setIsPublishing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'draft': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      case 'deprecated': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const totalDuration = stages.reduce((sum: number, s: RecipeStageWithDetails) => sum + (s.duration_days || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{recipe.name}</h2>
              <Badge className={getStatusColor(recipe.status)}>{recipe.status}</Badge>
              {recipe.plant_types && recipe.plant_types.length > 0 && (
                <Badge variant="outline">{recipe.plant_types[0]}</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              v{currentVersion?.version || recipe.current_version} · Created by {creatorName || 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {recipe.status.toLowerCase() === 'draft' && canEdit && (
            <Button onClick={handlePublish} disabled={isPublishing}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          )}
          {canClone && (
            <Button variant="outline" onClick={handleClone}>
              <Copy className="w-4 h-4 mr-2" />
              Clone
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {canApply && recipe.status.toLowerCase() === 'published' && (
            <Button onClick={() => setAssignDialogOpen(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Assign Recipe
            </Button>
          )}
        </div>
      </div>

      {/* Assign Recipe Dialog */}
      {canApply && currentVersion && (
        <AssignRecipeDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          recipeId={recipe.id}
          recipeName={recipe.name}
          recipeVersionId={currentVersion.id}
          organizationId={organizationId}
          userId={userId}
        />
      )}

      {/* Description */}
      {recipe.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300">{recipe.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Version Information */}
      {currentVersion && (
        <Card>
          <CardHeader>
            <CardTitle>Version Information</CardTitle>
            <CardDescription>v{currentVersion.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Created By</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-slate-400" />
                  <p className="text-slate-900 dark:text-slate-100">
                    {creatorName || 'Loading...'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Created At</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-slate-900 dark:text-slate-100">
                    {formatDate(currentVersion.created_at)}
                  </p>
                </div>
              </div>
            </div>
            {currentVersion.notes && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Release Notes</p>
                <p className="text-slate-900 dark:text-slate-100 mt-1">{currentVersion.notes}</p>
              </div>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {recipe.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Growth Stages */}
      {stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Stages</CardTitle>
            <CardDescription>
              {stages.length} stage(s) · Total duration: {totalDuration} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="overflow-x-auto pb-2">
                <Tabs value={selectedStageId} onValueChange={setSelectedStageId}>
                  <TabsList className="inline-flex w-auto min-w-full">
                    {stages.map(stage => (
                      <TabsTrigger key={stage.id} value={stage.id} className="flex-shrink-0 min-w-[120px]">
                        <span className="truncate">{stage.name}</span>
                        <span className="ml-2 text-xs text-slate-500">({stage.duration_days}d)</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {stages.map(stage => (
                    <TabsContent key={stage.id} value={stage.id} className="mt-6">
                      <StageDetails stage={stage} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Activations */}
      {recipe.active_activations && recipe.active_activations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Activations</CardTitle>
            <CardDescription>
              Currently applied to {recipe.active_activations.length} location(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipe.active_activations.map((activation) => (
                <div key={activation.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {activation.scope_type}: {activation.scope_name || activation.scope_id}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Started: {formatDate(activation.activated_at)}
                      {activation.current_stage_id && ` · Stage ${activation.current_stage_day} days`}
                    </p>
                  </div>
                  <Badge variant={activation.is_active ? 'default' : 'secondary'}>
                    {activation.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {recipe.versions && recipe.versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>
              {recipe.versions.length} version(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipe.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={v.version === currentVersion?.version ? 'default' : 'outline'}>
                      v{v.version}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {userNames[v.created_by] || 'Loading...'}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {formatDate(v.created_at)}
                      </p>
                    </div>
                  </div>
                  {v.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md truncate">
                      {v.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StageDetails({ stage }: { stage: RecipeStageWithDetails }) {
  const setpoints = stage.setpoints || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Stage Duration</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="font-medium text-slate-900 dark:text-slate-100">{stage.duration_days} days</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Order</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">Stage {stage.order_index + 1}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Parameters</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">{setpoints.length} setpoints</p>
        </div>
      </div>

      {stage.description && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Description</p>
          <p className="text-slate-900 dark:text-slate-100">{stage.description}</p>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Environmental Setpoints</h4>
        {setpoints.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No setpoints defined for this stage.</p>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Temperature */}
                {(() => {
                  const tempSetpoint = setpoints.find((sp: EnvironmentalSetpoint) => sp.parameter_type === 'temperature')
                  if (!tempSetpoint) return null
                  return (
                    <div>
                      <p className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">Temperature (°F):</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Min:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{tempSetpoint.min_value ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Max:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{tempSetpoint.max_value ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Relative Humidity */}
                {(() => {
                  const humiditySetpoint = setpoints.find((sp: EnvironmentalSetpoint) => sp.parameter_type === 'humidity')
                  if (!humiditySetpoint) return null
                  return (
                    <div>
                      <p className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">Relative Humidity (%):</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Min:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{humiditySetpoint.min_value ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Max:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{humiditySetpoint.max_value ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* VPD */}
                {(() => {
                  const vpdSetpoint = setpoints.find((sp: EnvironmentalSetpoint) => sp.parameter_type === 'vpd')
                  if (!vpdSetpoint) return null
                  return (
                    <div>
                      <p className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">VPD (kPa):</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Min:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{vpdSetpoint.min_value ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Max:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{vpdSetpoint.max_value ?? '-'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Light Level */}
                {(() => {
                  const lightSetpoint = setpoints.find((sp: EnvironmentalSetpoint) => sp.parameter_type === 'light_intensity')
                  if (!lightSetpoint) return null
                  return (
                    <div>
                      <p className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">Light Level (%):</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Min:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{lightSetpoint.min_value ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Max:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{lightSetpoint.max_value ?? '-'}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Light Schedule */}
                {(() => {
                  const photoperiodSetpoint = setpoints.find((sp: EnvironmentalSetpoint) => sp.parameter_type === 'photoperiod')
                  if (!photoperiodSetpoint || !photoperiodSetpoint.value) return null
                  
                  // Calculate on/off times from duration (assuming lights on at 6:00 AM)
                  const hours = photoperiodSetpoint.value
                  const offHour = 6 + Math.floor(hours)
                  const offMin = Math.round((hours % 1) * 60)
                  const lightOff = `${offHour.toString().padStart(2, '0')}:${offMin.toString().padStart(2, '0')}`
                  
                  return (
                    <div>
                      <p className="text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">Light Schedule:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">On:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">06:00 AM</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">Off:</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{lightOff}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Duration: {photoperiodSetpoint.value} hours
                      </p>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {stage.nutrient_formula && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">Nutrient Formula</h4>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stage.nutrient_formula.ec_target && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">EC Target</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {stage.nutrient_formula.ec_target} mS/cm
                    </p>
                  </div>
                )}
                {stage.nutrient_formula.ph_target && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">pH Target</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {stage.nutrient_formula.ph_target}
                    </p>
                  </div>
                )}
                {stage.nutrient_formula.npk_ratio && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">NPK Ratio</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {stage.nutrient_formula.npk_ratio}
                    </p>
                  </div>
                )}
                {stage.nutrient_formula.notes && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Notes</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {stage.nutrient_formula.notes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function SetpointCard({ setpoint }: { setpoint: EnvironmentalSetpoint }) {
  const hasDay = setpoint.day_value !== null && setpoint.day_value !== undefined
  const hasNight = setpoint.night_value !== null && setpoint.night_value !== undefined
  const hasSingleValue = setpoint.value !== null && setpoint.value !== undefined

  const getSetpointIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('temp')) return <Thermometer className="w-4 h-4 text-slate-400" />
    if (lowerType.includes('humid') || lowerType.includes('rh')) return <Droplets className="w-4 h-4 text-slate-400" />
    if (lowerType.includes('light') || lowerType.includes('photo')) return <Sun className="w-4 h-4 text-slate-400" />
    return <Activity className="w-4 h-4 text-slate-400" />
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {getSetpointIcon(setpoint.parameter_type)}
            <h5 className="font-medium text-slate-900 dark:text-slate-100">{setpoint.parameter_type}</h5>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hasSingleValue && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Target Value</p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {setpoint.value} {setpoint.unit}
                </p>
              </div>
            )}
            {hasDay && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Sun className="w-3 h-3" /> Day Value
                </p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {setpoint.day_value} {setpoint.unit}
                </p>
              </div>
            )}
            {hasNight && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Night Value
                </p>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {setpoint.night_value} {setpoint.unit}
                </p>
              </div>
            )}
            {setpoint.deadband !== null && setpoint.deadband !== undefined && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Deadband</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  ±{setpoint.deadband} {setpoint.unit}
                </p>
              </div>
            )}
          </div>

          {(setpoint.min_value !== null || setpoint.max_value !== null) && (
            <div className="pt-3 border-t dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Safety Bounds</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                {setpoint.min_value !== null && `Min: ${setpoint.min_value} ${setpoint.unit}`}
                {setpoint.min_value !== null && setpoint.max_value !== null && ' · '}
                {setpoint.max_value !== null && `Max: ${setpoint.max_value} ${setpoint.unit}`}
              </p>
            </div>
          )}

          {setpoint.ramp_duration_minutes && (
            <div className="pt-3 border-t dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ramp Configuration</p>
              <p className="text-sm text-slate-900 dark:text-slate-100">
                Gradual transition over {setpoint.ramp_duration_minutes} minutes
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Recipe, RecipeStatus, PlantType } from '@/types/recipe'
import { Plus, Search, Clock, Loader2 } from 'lucide-react'

// Format date consistently for SSR/CSR hydration
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface RecipeLibraryProps {
  organizationId: string
  siteId?: string
  facilityType?: string
  userRole?: string | null
  jurisdictionId?: string | null
  recipes: Recipe[]
  loading?: boolean
  canCreate?: boolean
  canView?: boolean
  onSelectRecipe?: (recipe: Recipe) => void
  onCreateRecipe?: () => void
  onRefresh?: () => void
}

export function RecipeLibrary({ 
  recipes: initialRecipes,
  facilityType,
  loading = false,
  canCreate = false,
  canView = true,
  onSelectRecipe, 
  onCreateRecipe,
  onRefresh
}: RecipeLibraryProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<RecipeStatus | 'all'>('all')
  const [filterPlantType, setFilterPlantType] = useState<PlantType | 'all'>('all')

  // Determine available plant types based on facility type
  const availablePlantTypes: Array<PlantType | 'all'> = facilityType === 'cannabis' 
    ? ['all', 'cannabis']
    : facilityType === 'produce'
    ? ['all', 'produce']
    : ['all', 'cannabis', 'produce'] // If no facility type, show both

  useEffect(() => {
    setRecipes(initialRecipes)
  }, [initialRecipes])

  useEffect(() => {
    if (onRefresh) {
      onRefresh()
    }
  }, [filterStatus, filterPlantType, onRefresh])

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || recipe.status === filterStatus
    
    const matchesPlantType = 
      filterPlantType === 'all' || 
      (recipe.plant_types && recipe.plant_types.includes(filterPlantType))
    
    return matchesSearch && matchesStatus && matchesPlantType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      case 'applied': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'draft': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
      case 'deprecated': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      case 'archived': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
    }
  }

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            You don&apos;t have permission to view recipes
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Recipe Library
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Stage-based environmental control templates
          </p>
        </div>
        {canCreate && onCreateRecipe && (
          <Button onClick={onCreateRecipe} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Recipe
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search recipes by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 self-center">Status:</span>
                {(['all', 'draft', 'published', 'applied', 'deprecated'] as const).map(status => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    onClick={() => setFilterStatus(status)}
                    size="sm"
                    className={filterStatus !== status ? 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50' : ''}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400 self-center">Type:</span>
                {availablePlantTypes.map(type => (
                  <Button
                    key={type}
                    variant={filterPlantType === type ? 'default' : 'outline'}
                    onClick={() => setFilterPlantType(type)}
                    size="sm"
                    className={filterPlantType !== type ? 'text-neutral-600 hover:text-neutral-700 hover:bg-neutral-50' : ''}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Recipe Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <Card 
              key={recipe.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelectRecipe?.(recipe)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-slate-900 dark:text-slate-100">
                    {recipe.name}
                  </CardTitle>
                  <Badge className={getStatusColor(recipe.status)}>
                    {recipe.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {recipe.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Version</span>
                    <span className="text-slate-900 dark:text-slate-100">v{recipe.current_version}</span>
                  </div>
                  {recipe.plant_types && recipe.plant_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.plant_types.map(type => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {recipe.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{recipe.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    Updated {formatDate(recipe.updated_at)}
                  </div>
                  {recipe.is_template && (
                    <Badge variant="outline" className="text-xs">
                      Template
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRecipes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              No recipes found matching your criteria
            </p>
            {canCreate && onCreateRecipe && (
              <Button onClick={onCreateRecipe} variant="outline" className="mt-4 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 border-green-300 hover:border-green-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Recipe
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

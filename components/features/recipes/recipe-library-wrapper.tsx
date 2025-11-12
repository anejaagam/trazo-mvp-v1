'use client'

import { useRouter } from 'next/navigation'
import { RecipeLibrary } from './recipe-library'
import type { Recipe } from '@/types/recipe'

interface RecipeLibraryWrapperProps {
  organizationId: string
  siteId?: string
  facilityType?: string
  userRole?: string | null
  recipes: Recipe[]
  loading?: boolean
  canCreate?: boolean
  canView?: boolean
}

export function RecipeLibraryWrapper({
  organizationId,
  siteId,
  facilityType,
  userRole,
  recipes,
  loading = false,
  canCreate = false,
  canView = true,
}: RecipeLibraryWrapperProps) {
  const router = useRouter()

  const handleCreateRecipe = () => {
    console.log('Creating new recipe, navigating to /dashboard/recipes/new')
    router.push('/dashboard/recipes/new')
  }

  const handleSelectRecipe = (recipe: Recipe) => {
    console.log('Selecting recipe:', recipe.id)
    router.push(`/dashboard/recipes/${recipe.id}`)
  }

  return (
    <RecipeLibrary
      organizationId={organizationId}
      siteId={siteId}
      facilityType={facilityType}
      userRole={userRole}
      recipes={recipes}
      loading={loading}
      canCreate={canCreate}
      canView={canView}
      onCreateRecipe={handleCreateRecipe}
      onSelectRecipe={handleSelectRecipe}
    />
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { getRecipes } from '@/lib/supabase/queries/recipes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
  }

  // Show published and applied recipes only
  const { data: recipes, error } = await getRecipes(organizationId, { 
    status: ['published', 'applied'] 
  })
  if (error) {
    console.error('Failed to load recipes', error)
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 })
  }

  // Get the actual version UUIDs for each recipe
  const recipeData = []
  for (const recipe of recipes || []) {
    let versionId = null
    
    // If current_version is set, fetch the corresponding version record
    if (recipe.current_version) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: version } = await supabase
        .from('recipe_versions')
        .select('id')
        .eq('recipe_id', recipe.id)
        .eq('version', recipe.current_version)
        .single()
      
      versionId = version?.id || null
    }
    
    recipeData.push({
      id: recipe.id,
      name: recipe.name,
      plant_types: recipe.plant_types,
      current_version_id: versionId,
    })
  }

  return NextResponse.json({ data: recipeData })
}

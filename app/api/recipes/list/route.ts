import { NextRequest, NextResponse } from 'next/server'
import { getRecipes } from '@/lib/supabase/queries/recipes'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
  }

  const { data, error } = await getRecipes(organizationId, { status: 'published' })
  if (error) {
    console.error('Failed to load recipes', error)
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 })
  }

  return NextResponse.json({
    data:
      data?.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        plant_types: recipe.plant_types,
        current_version_id: recipe.current_version,
      })) || [],
  })
}

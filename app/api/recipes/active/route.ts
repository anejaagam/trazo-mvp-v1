import { NextRequest, NextResponse } from 'next/server'
import { getActiveRecipeForScope } from '@/lib/supabase/queries/recipes'
import type { RecipeScopeType } from '@/types/recipe'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scopeType = (searchParams.get('scopeType') || 'batch') as RecipeScopeType
  const scopeId = searchParams.get('scopeId')

  if (!scopeId) {
    return NextResponse.json({ error: 'scopeId is required' }, { status: 400 })
  }

  const { data, error } = await getActiveRecipeForScope(scopeType, scopeId)
  if (error) {
    console.error('Error fetching active recipe details:', error)
    return NextResponse.json({ error: 'Failed to load recipe data' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

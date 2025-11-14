import { NextRequest, NextResponse } from 'next/server'
import { assignRecipeToScope } from '@/lib/supabase/queries/recipes'
import type { RecipeScopeType } from '@/types/recipe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipeId,
      recipeVersionId,
      scopeType,
      scopeId,
      scopeName,
      userId,
      scheduledStart,
    } = body || {}

    if (!recipeId || !recipeVersionId || !scopeType || !scopeId || !scopeName || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await assignRecipeToScope(
      recipeId,
      recipeVersionId,
      scopeType as RecipeScopeType,
      scopeId,
      scopeName,
      userId,
      scheduledStart || new Date().toISOString()
    )

    if (error) {
      console.error('Failed to activate recipe', error)
      return NextResponse.json({ error: 'Failed to activate recipe' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('activate recipe route error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receiveTagsBatch } from '@/lib/supabase/queries/harvest-plants'
import { validateTagReceipt } from '@/lib/compliance/metrc/validation/plant-harvest-rules'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization and default site
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, default_site_id')
      .eq('id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get site context
    const contextSiteId = await getServerSiteId()
    const currentSiteId = (contextSiteId && contextSiteId !== ALL_SITES_ID)
      ? contextSiteId
      : userData.default_site_id

    const body = await request.json()
    const { organization_id, site_id, tags, order_batch_number } = body

    // Use provided site_id or fall back to current site context
    const effectiveSiteId = site_id || currentSiteId

    if (!organization_id || !effectiveSiteId || !tags) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate site_id matches current context if context is set
    if (currentSiteId && site_id && site_id !== currentSiteId) {
      return NextResponse.json(
        { success: false, message: 'Provided site_id does not match current site context' },
        { status: 403 }
      )
    }

    // Validate tag receipt
    const validation = validateTagReceipt(tags)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // Add organization_id, site_id, and order_batch_number to each tag
    const tagsWithContext = tags.map((tag: any) => ({
      ...tag,
      organization_id,
      site_id: effectiveSiteId,
      order_batch_number,
    }))

    const result = await receiveTagsBatch(tagsWithContext, user.id)

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      success: true,
      tags_received: result.data?.length || 0,
      warnings: validation.warnings,
    })
  } catch (error) {
    console.error('Error in receive tags API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

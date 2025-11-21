import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receiveTagsBatch } from '@/lib/supabase/queries/harvest-plants'
import { validateTagReceipt } from '@/lib/compliance/metrc/validation/plant-harvest-rules'

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

    const body = await request.json()
    const { organization_id, site_id, tags, order_batch_number } = body

    if (!organization_id || !site_id || !tags) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
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
      site_id,
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

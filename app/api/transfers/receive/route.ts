import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receiveIncomingTransfer } from '@/lib/compliance/metrc/sync/transfer-manifest-sync'
import { getServerSiteId } from '@/lib/site/server'
import { ALL_SITES_ID } from '@/lib/site/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
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

    if (!currentSiteId) {
      return NextResponse.json(
        { success: false, message: 'No site context available. Please select a site.' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const result = await receiveIncomingTransfer({
      ...body,
      receivedBy: user.id,
      siteId: currentSiteId,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to receive transfer',
          errors: result.errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      manifestId: result.manifestId,
      manifestNumber: result.manifestNumber,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error in receive transfer API:', error)
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

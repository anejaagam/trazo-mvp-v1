import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { receiveIncomingTransfer } from '@/lib/compliance/metrc/sync/transfer-manifest-sync'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const result = await receiveIncomingTransfer({
      ...body,
      receivedBy: user.id,
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

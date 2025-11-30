import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials } from '@/lib/compliance/metrc/auth'

/**
 * POST /api/compliance/validate-credentials
 * Validate Metrc API credentials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { vendor_api_key, user_api_key, state_code, is_sandbox } = body

    if (!vendor_api_key || !user_api_key || !state_code) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate credentials with Metrc API
    const isValid = await validateCredentials(
      vendor_api_key,
      user_api_key,
      state_code,
      is_sandbox || false
    )

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('Error validating credentials:', error)

    // Return user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate credentials'

    return NextResponse.json(
      { valid: false, error: errorMessage },
      { status: 200 } // Return 200 so the UI can display the error
    )
  }
}

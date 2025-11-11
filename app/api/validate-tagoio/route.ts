/**
 * API Route to validate TagoIO device token
 * Replaces Supabase Edge Function to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceToken } = body

    if (!deviceToken) {
      return NextResponse.json(
        { isValid: false, error: 'Device token is required' },
        { status: 400 }
      )
    }

    // Call TagoIO API to validate the token and get device info
    // TagoIO SDK uses lowercase 'token' header based on their source code
    const response = await fetch('https://api.tago.io/info', {
      method: 'GET',
      headers: {
        'token': deviceToken,
        'Content-Type': 'application/json',
      },
    })

    // Try to parse error response body for better error messages
    if (!response.ok) {
      let errorMessage = response.statusText
      
      try {
        const errorData = await response.json()
        errorMessage = errorData?.message || errorData?.error || errorMessage
      } catch {
        // If JSON parsing fails, use status text
      }

      if (response.status === 401) {
        return NextResponse.json({
          isValid: false,
          error: 'Invalid or expired device token. Please check your token and try again.',
        })
      }
      
      if (response.status === 400) {
        return NextResponse.json({
          isValid: false,
          error: 'Invalid token format. TagoIO device tokens should be in UUID format (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
        })
      }
      
      return NextResponse.json({
        isValid: false,
        error: `TagoIO API error: ${errorMessage}`,
      })
    }

    const deviceInfo = await response.json()

    // Extract device info from the response
    // TagoIO wraps response in { status: true, result: {...} }
    const result = deviceInfo?.result || deviceInfo
    const deviceId = result?.id || 'unknown'
    const deviceName = result?.name || 'Unknown Device'

    return NextResponse.json({
      isValid: true,
      deviceId,
      deviceName,
    })
  } catch (error) {
    console.error('Error validating TagoIO credentials:', error)
    return NextResponse.json(
      {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to validate credentials',
      },
      { status: 500 }
    )
  }
}

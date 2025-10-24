import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getRegionConfig, type Region } from '@/lib/supabase/region'

// Type-specific confirmation handler
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ type: string }> }
) {
  const { searchParams } = new URL(request.url)
  const { type: rawType } = await ctx.params
  const typeParam = (rawType || '').toLowerCase()
  const type = (typeParam as EmailOtpType)
  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const regionParam = searchParams.get('region')

  // Default post-success redirects per type
  const successRedirect = (() => {
    switch (typeParam) {
      case 'signup':
        return '/auth/login?verified=1'
      case 'invite':
        return '/auth/update-password'
      case 'recovery':
        return '/auth/update-password'
      default:
        return '/auth/login'
    }
  })()

  // Resolve region: explicit param > cookie > US
  const cookieStore = await cookies()
  const regionCookie = cookieStore.get('user_region')?.value
  const resolvedRegion: Region = (regionParam === 'CA' || regionParam === 'US')
    ? (regionParam as Region)
    : ((regionCookie === 'CA' ? 'CA' : 'US') as Region)

  const supabase = createServerClient(
    getRegionConfig(resolvedRegion).url,
    getRegionConfig(resolvedRegion).anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  // Prefer PKCE token flow (server-side)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      // Persist region if provided
      if (regionParam && regionParam !== regionCookie) {
        cookieStore.set('user_region', resolvedRegion, { path: '/', httpOnly: false })
      }
      redirect(successRedirect)
    }
    // Try opposite region as fallback
    const fallback: Region = resolvedRegion === 'CA' ? 'US' : 'CA'
    const fb = createServerClient(getRegionConfig(fallback).url, getRegionConfig(fallback).anonKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    })
    const fbRes = await fb.auth.verifyOtp({ type, token_hash })
    if (!fbRes.error) {
      cookieStore.set('user_region', fallback, { path: '/', httpOnly: false })
      redirect(successRedirect)
    }
    redirect(`/auth/error?error=${encodeURIComponent('Email link is invalid or has expired')}`)
  }

  // Legacy code exchange (server-side)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(successRedirect)
    }
    const fallback: Region = resolvedRegion === 'CA' ? 'US' : 'CA'
    const fb = createServerClient(getRegionConfig(fallback).url, getRegionConfig(fallback).anonKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    })
    const fbRes = await fb.auth.exchangeCodeForSession(code)
    if (!fbRes.error) {
      cookieStore.set('user_region', fallback, { path: '/', httpOnly: false })
      redirect(successRedirect)
    }
    redirect(`/auth/error?error=${encodeURIComponent('Email link is invalid or has expired')}`)
  }

  // No token available server-side (likely in URL hash). Fall back to client handler.
  const qs = new URLSearchParams()
  if (typeParam) qs.set('type', typeParam)
  if (regionParam) qs.set('region', regionParam)
  redirect(`/auth/confirm-client?${qs.toString()}`)
}

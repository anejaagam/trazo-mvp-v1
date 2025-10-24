"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Region } from '@/lib/supabase/region'
import type { EmailOtpType } from '@supabase/supabase-js'

function parseHash(hash: string) {
  const out: Record<string, string> = {}
  if (!hash) return out
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  for (const part of h.split('&')) {
    const [k, v] = part.split('=')
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return out
}

export default function ConfirmClientPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const type = (sp.get('type') || 'signup').toLowerCase()
  const regionParam = sp.get('region') || undefined
  const selectedRegion: Region | undefined = (regionParam === 'CA' || regionParam === 'US')
    ? (regionParam as Region)
    : undefined

  const successRedirect = useMemo(() => {
    switch (type) {
      case 'invite':
      case 'recovery':
        return '/auth/update-password'
      case 'signup':
      default:
        return '/auth/login?verified=1'
    }
  }, [type])

  useEffect(() => {
    async function run() {
      try {
  const supabase = createClient(selectedRegion)
        const url = new URL(window.location.href)
        // Try query params first
        const token_hash = url.searchParams.get('token_hash')
        const code = url.searchParams.get('code')
  const t = (url.searchParams.get('type') || type) as EmailOtpType

        if (token_hash && t) {
          const { error } = await supabase.auth.verifyOtp({ type: t, token_hash })
          if (error) throw error
          router.replace(successRedirect)
          setDone(true)
          return
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          router.replace(successRedirect)
          setDone(true)
          return
        }

        // Parse hash fragment fallback (implicit flow)
        const hash = parseHash(window.location.hash)
        if (hash.token_hash && t) {
          const { error } = await supabase.auth.verifyOtp({ type: t, token_hash: hash.token_hash })
          if (error) throw error
          router.replace(successRedirect)
          setDone(true)
          return
        }

        if (hash.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(hash.code)
          if (error) throw error
          router.replace(successRedirect)
          setDone(true)
          return
        }

        if (hash.access_token) {
          const { error } = await supabase.auth.setSession({
            access_token: hash.access_token,
            refresh_token: hash.refresh_token,
          })
          if (error) throw error
          router.replace(successRedirect)
          setDone(true)
          return
        }

        setError('No token found in URL')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to complete confirmation'
        setError(msg)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Completing sign-in…</h1>
        {!done && !error && <p className="text-sm text-muted-foreground">Please wait a moment.</p>}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
}

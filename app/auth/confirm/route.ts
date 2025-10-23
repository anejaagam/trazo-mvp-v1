
import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { type NextRequest } from "next/server";
import { getRegionConfig, type Region } from '@/lib/supabase/region';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Log all parameters for debugging
  console.log('Email confirmation params:', Object.fromEntries(searchParams.entries()));
  
  // Support both PKCE flow (token_hash) and legacy implicit flow (code)
  const token_hash = searchParams.get("token_hash");
  const code = searchParams.get("code"); // Legacy format
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";
  const regionParam = searchParams.get("region");
  
  // Also check for confirmation token (older format)
  const confirmationToken = searchParams.get("confirmation_token");
  const confirmationUrl = searchParams.get("confirmation_url");

  // Get region from explicit param first, then cookie fallback
  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('user_region');
  const resolvedRegion = (regionParam === 'CA' || regionParam === 'US')
    ? (regionParam as Region)
    : ((regionCookie?.value === 'CA' ? 'CA' : 'US') as Region);
  // Persist resolved region for subsequent requests
  if (regionParam && regionParam !== regionCookie?.value) {
    cookieStore.set('user_region', resolvedRegion, { path: '/', httpOnly: false });
  }
  const region = resolvedRegion;
  // Resolve initial config (unused directly; clients are created via helper)
  getRegionConfig(region);

  // Helper to create a region-specific Supabase client bound to our cookie jar
  const createClientFor = (r: Region) => {
    const cfg = getRegionConfig(r);
    return createServerClient(cfg.url, cfg.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });
  };
  const supabase = createClientFor(region);

  // Handle PKCE flow (preferred - current Supabase default)
  if (token_hash && type) {
    console.log('Using PKCE flow with token_hash');
    // Try resolved region first, then fallback to the other region (US<->CA)
    const tryRegions: Region[] = region === 'CA' ? ['CA', 'US'] as Region[] : ['US', 'CA'] as Region[];
    for (const r of tryRegions) {
      const client = r === region ? supabase : createClientFor(r);
      const { error } = await client.auth.verifyOtp({ type, token_hash });
      if (!error) {
        if (r !== region) {
          // Persist the corrected region if we succeeded on fallback
          cookieStore.set('user_region', r, { path: '/', httpOnly: false });
        }
        redirect(next);
      }
      console.warn(`PKCE verification failed in region ${r}:`, error?.message);
    }
    // If we reach here, both attempts failed
    redirect(`/auth/error?error=${encodeURIComponent('Email link is invalid or has expired')}`);
  }
  
  // Handle code exchange flow
  if (code) {
    console.log('Using code exchange flow');
    const tryRegions: Region[] = region === 'CA' ? ['CA', 'US'] as Region[] : ['US', 'CA'] as Region[];
    for (const r of tryRegions) {
      const client = r === region ? supabase : createClientFor(r);
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        if (r !== region) cookieStore.set('user_region', r, { path: '/', httpOnly: false });
        redirect(next);
      }
      console.warn(`Code exchange failed in region ${r}:`, error?.message);
    }
    redirect(`/auth/error?error=${encodeURIComponent('Email link is invalid or has expired')}`);
  }

  // Handle older confirmation token format
  if (confirmationToken || confirmationUrl) {
    console.log('Detected older confirmation token format, redirecting to login');
    redirect(`/auth/login?message=Please check your email and click the verification link`);
  }

  // Log the full URL for debugging
  console.error('No valid token found. Full URL:', request.url);
  
  // No valid token provided
  redirect(`/auth/error?error=No token hash or code provided. Please check your email for the verification link and click it again.`);
}

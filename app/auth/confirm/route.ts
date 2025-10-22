
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
  
  // Also check for confirmation token (older format)
  const confirmationToken = searchParams.get("confirmation_token");
  const confirmationUrl = searchParams.get("confirmation_url");

  // Get region from cookie
  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('user_region');
  const region = (regionCookie?.value === 'CA' ? 'CA' : 'US') as Region;
  const config = getRegionConfig(region);

  // Create region-specific Supabase client
  const supabase = createServerClient(config.url, config.anonKey, {
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

  // Handle PKCE flow (preferred - current Supabase default)
  if (token_hash && type) {
    console.log('Using PKCE flow with token_hash');
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      redirect(next);
    } else {
      console.error('PKCE verification error:', error);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }
  
  // Handle legacy implicit flow (backward compatibility)
  if (code) {
    console.log('Using code exchange flow');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      redirect(next);
    } else {
      console.error('Code exchange error:', error);
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
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

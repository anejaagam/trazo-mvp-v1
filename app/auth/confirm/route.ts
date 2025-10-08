import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';
import { type NextRequest } from "next/server";
import { getRegionConfig, type Region } from '@/lib/supabase/region';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/protected";

  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // Redirect user to protected area after successful verification
      redirect(next);
    } else {
      // Redirect the user to an error page with instructions
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Redirect the user to an error page with instructions
  redirect(`/auth/error?error=No token hash or type provided`);
}

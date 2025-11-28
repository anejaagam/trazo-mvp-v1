import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getRegionConfig, type Region } from './region';
import { isDevModeActive, shouldBypassAuth, logDevMode } from '@/lib/dev-mode';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Check if we're in development mode and should bypass auth
  const devModeActive = isDevModeActive();
  const bypassAuth = shouldBypassAuth(request.nextUrl.pathname);
  
  if (devModeActive && bypassAuth) {
    logDevMode(`Middleware - ${request.nextUrl.pathname}`);
    return supabaseResponse;
  }
  
  // Get region from cookie (default to US)
  const regionCookie = request.cookies.get('user_region');
  const region = (regionCookie?.value === 'CA' ? 'CA' : 'US') as Region;
  const config = getRegionConfig(region);

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // In development mode, skip authentication checks (already bypassed at top if needed)
  // This is a fallback check for any routes that weren't caught by the early return
  if (devModeActive && bypassAuth) {
    return supabaseResponse;
  }

  // Allow API routes to handle their own authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/dev-auth') &&
    !request.nextUrl.pathname.startsWith('/landing') &&
    !request.nextUrl.pathname.startsWith('/onboarding') &&
    request.nextUrl.pathname !== '/'
  ) {
    // No user, potentially redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Check if authenticated user accessing dashboard needs to complete onboarding
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Get user's role and organization onboarding status
      const { data: userData } = await supabase
        .from('users')
        .select('role, organization:organizations!users_organization_id_fkey(onboarding_completed)')
        .eq('id', user.id)
        .single();

      if (userData?.role === 'org_admin') {
        const org = userData.organization as { onboarding_completed?: boolean } | null;
        if (org && org.onboarding_completed !== true) {
          // Redirect org_admin to onboarding if not completed
          const url = request.nextUrl.clone();
          url.pathname = '/onboarding';
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status in middleware:', error);
      // Continue to dashboard layout which will handle the check
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
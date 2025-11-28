/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getStoredRegion, setStoredRegion } from '@/lib/supabase/client';
import type { Region } from '@/lib/types/region';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Try stored region first, fallback to US
      let region = getStoredRegion();
      let supabase = createClient(region);

      // Attempt login
      let { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login fails and we tried CA, try US
      if (loginError && region === 'CA') {
        region = 'US';
        supabase = createClient(region);
        const retryResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = retryResult.data;
        loginError = retryResult.error;
      }

      // If login fails and we tried US, try CA
      if (loginError && region === 'US') {
        region = 'CA';
        supabase = createClient(region);
        const retryResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        data = retryResult.data;
        loginError = retryResult.error;
      }

      if (loginError) {
        throw loginError;
      }

      if (data.user) {
        // Get user's region from metadata or use the successful region
        const userRegion = (data.user.user_metadata?.region as Region) || region;

        // Store the correct region
        setStoredRegion(userRegion);

        // Set cookie
        document.cookie = `user_region=${userRegion}; path=/; max-age=31536000; SameSite=Lax${
          process.env.NODE_ENV === 'production' ? '; Secure' : ''
        }`;

        // Update last_sign_in and activate invited users
        // This handles the case where invited users are logging in for the first time
        try {
          // First check current status and organization
          const { data: userData } = await supabase
            .from('users')
            .select('status, organization_id, role')
            .eq('id', data.user.id)
            .single();

          // Skip approval check for developers (they don't belong to organizations)
          if (userData?.role !== 'developer' && userData?.organization_id) {
            // Check organization approval status
            const { data: orgData } = await supabase
              .from('organizations')
              .select('approval_status, name')
              .eq('id', userData.organization_id)
              .single();

            if (orgData?.approval_status === 'pending') {
              // Organization not yet approved - sign out and show message
              await supabase.auth.signOut();
              setError('Your organization is pending approval. You will be notified once approved.');
              setLoading(false);
              return;
            }

            if (orgData?.approval_status === 'rejected') {
              // Organization was rejected - sign out and show message
              await supabase.auth.signOut();
              setError('Your organization was not approved for access. Please contact support for more information.');
              setLoading(false);
              return;
            }

            // Check if org admin needs to complete onboarding
            if (userData?.role === 'org_admin' && orgData?.approval_status === 'approved') {
              // Fetch full org data including onboarding status
              const { data: fullOrgData } = await supabase
                .from('organizations')
                .select('onboarding_completed')
                .eq('id', userData.organization_id)
                .single();

              if (fullOrgData && !fullOrgData.onboarding_completed) {
                // Update user login time first
                await supabase
                  .from('users')
                  .update({ 
                    last_sign_in: new Date().toISOString(),
                    ...(userData?.status === 'invited' ? { status: 'active' as const } : {})
                  })
                  .eq('id', data.user.id);

                // Redirect to onboarding wizard
                router.push('/onboarding');
                router.refresh();
                return;
              }
            }
          }
          
          // Update user with new login time and activate if invited
          await supabase
            .from('users')
            .update({ 
              last_sign_in: new Date().toISOString(),
              // Activate the user if they were invited
              ...(userData?.status === 'invited' ? { status: 'active' as const } : {})
            })
            .eq('id', data.user.id);
        } catch {
          // Non-blocking
        }

        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-secondary-700">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-secondary-400" />
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary-200 rounded-xl text-secondary-800 placeholder:text-secondary-400 focus:outline-none focus:border-brand-lighter-green-500 focus:ring-2 focus:ring-brand-lighter-green-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
          />
        </div>
      </div>

      {/* Forgot Password Link */}
      <div className="flex justify-end">
        <a 
          href="/auth/forgot-password" 
          className="text-sm text-brand-lighter-green-700 hover:text-brand-lighter-green-800 font-medium transition-colors"
        >
          Forgot password?
        </a>
      </div>

      {/* Login Button */}
      <Button
        type="submit"
        disabled={loading}
        loading={loading}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      {/* Divider */}
      <div className="flex items-center my-8">
        <div className="flex-1 border-t border-secondary-200"></div>
        <span className="px-4 text-sm text-secondary-500">New to Trazo?</span>
        <div className="flex-1 border-t border-secondary-200"></div>
      </div>

      {/* Sign up link */}
      <div className="text-center">
        <a 
          href="/auth/sign-up" 
          className="inline-flex items-center justify-center w-full h-12 px-6 border-2 border-secondary-300 rounded-3xl text-secondary-700 font-semibold hover:border-brand-lighter-green-500 hover:text-brand-lighter-green-700 transition-all duration-200"
        >
          Create an account
        </a>
      </div>
    </form>
  );
}
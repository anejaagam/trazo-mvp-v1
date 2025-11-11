/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getStoredRegion, setStoredRegion } from '@/lib/supabase/client';
import type { Region } from '@/lib/types/region';

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
          // First check current status
          const { data: userData } = await supabase
            .from('users')
            .select('status')
            .eq('id', data.user.id)
            .single();
          
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
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-secondary-800">
          Email or Username
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 bg-brand-lighter-green-400/40 border border-secondary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-lightest-green-800 focus:border-transparent"
          placeholder="Enter your email or username"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-secondary-800">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 bg-brand-lighter-green-400/40 border border-secondary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-lightest-green-800 focus:border-transparent"
          placeholder="Enter your password"
        />
      </div>

      {/* Forgot Password Link */}
      <div className="text-center">
        <a 
          href="/auth/forgot-password" 
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Forgot Password?
        </a>
      </div>

      {/* Login Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-lightest-green-800 text-secondary-800 hover:bg-brand-lightest-green-700 disabled:bg-gray-400 disabled:text-gray-600 font-medium px-8 py-2 rounded-md transition-colors text-lg"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      {/* Sign up link */}
      <div className="text-center pt-4">
        <p className="text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <a 
            href="/auth/sign-up" 
            className="text-information-600 hover:text-information-800 font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
}
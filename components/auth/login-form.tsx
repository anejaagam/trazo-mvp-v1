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

        // Redirect to protected area
        router.push('/protected');
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
    <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Log In</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>

      <p className="text-sm text-center text-gray-600">
        Don&apos;t have an account?{' '}
        <a href="/auth/sign-up" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
    </form>
  );
}
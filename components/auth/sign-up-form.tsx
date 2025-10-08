/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, setStoredRegion } from '@/lib/supabase/client';
import { RegionSelector } from './region-selector';
import type { Region } from '@/lib/types/region';

export function SignUpForm() {
  const router = useRouter();
  const [region, setRegion] = useState<Region>('US');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting signup for region:', region);
      
      // Store region FIRST (before auth)
      setStoredRegion(region);

      // Set cookie for server-side access
      document.cookie = `user_region=${region}; path=/; max-age=31536000; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`;

      console.log('📝 Region stored in localStorage and cookie:', region);

      // Create client for selected region
      const supabase = createClient(region);

      console.log('🔐 Calling signUp with region metadata:', region);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            region,
            full_name: fullName,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/protected`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Redirect to email verification page
        router.push('/auth/verify-email?email=' + encodeURIComponent(email));
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <RegionSelector
        value={region}
        onChange={setRegion}
        disabled={loading}
        required
      />

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email <span className="text-red-500">*</span>
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
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium mb-1">
          Company Name
        </label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Acme Farms"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <a href="/auth/login" className="text-blue-600 hover:underline">
          Log in
        </a>
      </p>
    </form>
  );
}
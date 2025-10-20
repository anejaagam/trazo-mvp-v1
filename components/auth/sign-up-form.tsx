/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, setStoredRegion } from '@/lib/supabase/client';
import { RegionSelector } from './region-selector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
      // Store region FIRST (before auth)
      setStoredRegion(region);

      // Set cookie for server-side access
      document.cookie = `user_region=${region}; path=/; max-age=31536000; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`;

      // Create client for selected region
      const supabase = createClient(region);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            region,
            full_name: fullName,
            company_name: companyName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
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
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-display-4 font-semibold text-foreground mb-2">
          Create Account
        </h1>
        <p className="font-body text-body-base text-muted-foreground">
          Join thousands of farmers using Trazo to transform their operations
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border-2 border-destructive/20 text-destructive rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-body text-body-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSignUp} className="space-y-6">
        {/* Region Selector */}
        <div className="space-y-2">
          
          <RegionSelector
            value={region}
            onChange={setRegion}
            disabled={loading}
            required
          />
        </div>

        {/* Email Input */}
        <Input
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="you@farmname.com"
          error={error?.includes('email') ? 'Please check your email address' : undefined}
        />

        {/* Password Input */}
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
          placeholder="Create a secure password"
          helperText="At least 6 characters"
        />

        {/* Full Name Input */}
        <Input
          type="text"
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={loading}
          placeholder="John Doe"
        />

        {/* Company Name Input */}
        <Input
          type="text"
          label="Farm/Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={loading}
          placeholder="Green Valley Farms"
        />

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>

        {/* Sign In Link */}
        <div className="text-center pt-4">
          <p className="font-body text-body-sm text-muted-foreground">
            Already have an account?{' '}
            <a 
              href="/auth/login" 
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
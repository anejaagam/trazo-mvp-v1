'use client';

import { useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRegion } from '@/components/providers/region-provider';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook that returns a region-aware Supabase client
 * Automatically updates when region changes
 */
export function useSupabase(): SupabaseClient {
  const { region } = useRegion();

  const supabase = useMemo(() => {
    return createClient(region);
  }, [region]);

  return supabase;
}

/**
 * Hook for explicitly specifying which region to use
 * Useful when you need to query a specific region regardless of user's region
 */
export function useSupabaseRegion(region: 'US' | 'CA'): SupabaseClient {
  const supabase = useMemo(() => {
    return createClient(region);
  }, [region]);

  return supabase;
}
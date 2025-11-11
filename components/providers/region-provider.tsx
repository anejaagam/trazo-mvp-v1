'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredRegion, setStoredRegion, clearStoredRegion } from '@/lib/supabase/client';
import type { Region } from '@/lib/types/region';

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
  clearRegion: () => void;
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

interface RegionProviderProps {
  children: ReactNode;
  defaultRegion?: Region;
}

export function RegionProvider({ children, defaultRegion = 'US' }: RegionProviderProps) {
  const [region, setRegionState] = useState<Region>(defaultRegion);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load region from localStorage on mount
    const stored = getStoredRegion();
    setRegionState(stored);
    setIsLoading(false);

    // Sync region across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_region' && e.newValue) {
        setRegionState(e.newValue === 'CA' ? 'CA' : 'US');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setRegion = (newRegion: Region) => {
    setRegionState(newRegion);
    setStoredRegion(newRegion);

    // Also set cookie for server-side access
    document.cookie = `user_region=${newRegion}; path=/; max-age=31536000; SameSite=Lax${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`;

    // Log for debugging
    console.log(`🌍 Region changed to: ${newRegion}`);
  };

  const clearRegion = () => {
    setRegionState('US');
    clearStoredRegion();
    document.cookie = 'user_region=; path=/; max-age=0';
    console.log('🌍 Region cleared, defaulting to US');
  };

  return (
    <RegionContext.Provider value={{ region, setRegion, clearRegion, isLoading }}>
      {children}
    </RegionContext.Provider>
  );
}

/**
 * Hook to access and update user's region
 * @throws Error if used outside RegionProvider
 */
export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within RegionProvider');
  }
  return context;
}

/**
 * Hook to get current region without ability to change it
 * Useful for components that only need to read the region
 */
export function useCurrentRegion(): Region {
  const { region } = useRegion();
  return region;
}
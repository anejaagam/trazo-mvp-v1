/**
 * Domain Context
 * 
 * React context for managing domain state throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DomainType } from '../types/domains';
import { getDomainConfig, type DomainConfig, getFieldVisibility, type FieldVisibility } from '../config/domainConfig';

/**
 * Domain Context Value
 */
export interface DomainContextValue {
  domain: DomainType;
  config: DomainConfig;
  fieldVisibility: FieldVisibility;
  setDomain: (domain: DomainType) => void;
}

/**
 * Domain Context
 */
const DomainContext = createContext<DomainContextValue | undefined>(undefined);

/**
 * Local Storage Key
 */
const DOMAIN_STORAGE_KEY = 'trazo_domain_type';

/**
 * Get initial domain from environment, localStorage, or default
 */
function getInitialDomain(): DomainType {
  // 1. Check environment variable (for production deployment)
  const envDomain = import.meta.env.VITE_DOMAIN_TYPE as DomainType | undefined;
  if (envDomain === 'cannabis' || envDomain === 'produce') {
    return envDomain;
  }
  
  // 2. Check localStorage (for development toggle)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DOMAIN_STORAGE_KEY);
    if (stored === 'cannabis' || stored === 'produce') {
      return stored;
    }
  }
  
  // 3. Default to cannabis
  return 'cannabis';
}

/**
 * Domain Provider Props
 */
export interface DomainProviderProps {
  children: ReactNode;
  initialDomain?: DomainType;
}

/**
 * Domain Provider Component
 */
export function DomainProvider({ children, initialDomain }: DomainProviderProps) {
  const [domain, setDomainState] = useState<DomainType>(initialDomain || getInitialDomain());
  
  // Update localStorage when domain changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DOMAIN_STORAGE_KEY, domain);
    }
  }, [domain]);
  
  // Get current configuration
  const config = getDomainConfig(domain);
  const fieldVisibility = getFieldVisibility(domain);
  
  // Set domain function
  const setDomain = (newDomain: DomainType) => {
    setDomainState(newDomain);
    console.log(`🔄 Domain switched to: ${newDomain}`);
  };
  
  const value: DomainContextValue = {
    domain,
    config,
    fieldVisibility,
    setDomain,
  };
  
  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
}

/**
 * Use Domain Hook
 * 
 * Access domain context from any component
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { domain, config, fieldVisibility } = useDomain();
 *   
 *   return (
 *     <div>
 *       <h1>{config.terminology.batches}</h1>
 *       {fieldVisibility.metrcTags && <MetrcTagInput />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDomain(): DomainContextValue {
  const context = useContext(DomainContext);
  
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider');
  }
  
  return context;
}

/**
 * Use Domain Type Hook
 * 
 * Shorthand for accessing just the domain type
 */
export function useDomainType(): DomainType {
  const { domain } = useDomain();
  return domain;
}

/**
 * Use Domain Config Hook
 * 
 * Shorthand for accessing just the configuration
 */
export function useDomainConfig(): DomainConfig {
  const { config } = useDomain();
  return config;
}

/**
 * Use Field Visibility Hook
 * 
 * Shorthand for accessing field visibility
 */
export function useFieldVisibility(): FieldVisibility {
  const { fieldVisibility } = useDomain();
  return fieldVisibility;
}

/**
 * WithDomain HOC
 * 
 * Higher-order component for class components
 */
export function withDomain<P extends object>(
  Component: React.ComponentType<P & { domain: DomainContextValue }>
) {
  return function WithDomainComponent(props: P) {
    const domain = useDomain();
    return <Component {...props} domain={domain} />;
  };
}

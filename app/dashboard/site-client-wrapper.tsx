'use client';

import { ReactNode } from 'react';
import { SiteProvider } from '@/components/providers/site-provider';
import type { Site, ServerSiteContext } from '@/lib/site/types';

interface SiteClientWrapperProps {
  children: ReactNode;
  siteContext: ServerSiteContext;
}

/**
 * Client wrapper that provides SiteProvider context to dashboard pages
 *
 * This component is the client boundary between the server layout
 * and client components that need site context
 */
export function SiteClientWrapper({ children, siteContext }: SiteClientWrapperProps) {
  return (
    <SiteProvider
      initialSite={siteContext.currentSite}
      availableSites={siteContext.availableSites}
      userRole={siteContext.userRole}
      canViewAllSites={siteContext.canViewAllSites}
    >
      {children}
    </SiteProvider>
  );
}

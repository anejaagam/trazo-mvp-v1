'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Check, LayoutGrid, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSite } from '@/hooks/use-site';
import { ALL_SITES_ID } from '@/lib/site/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface SiteSelectorProps {
  /** Custom class name for the trigger button */
  className?: string;
  /** Whether to show as compact (icon only on small screens) */
  compact?: boolean;
}

/**
 * SiteSelector - Dropdown for switching between sites
 *
 * Features:
 * - Shows current site name
 * - Dropdown with all accessible sites
 * - "All Sites" option for org_admin
 * - Loading state during switch
 * - Disabled state for single-site users
 */
export function SiteSelector({ className, compact = false }: SiteSelectorProps) {
  const {
    currentSite,
    availableSites,
    siteId,
    isLoading,
    selectSite,
    hasMultipleSites,
    isAllSitesMode,
    canViewAllSites,
  } = useSite();

  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelectSite = async (newSiteId: string) => {
    if (newSiteId === siteId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await selectSite(newSiteId);
      setIsOpen(false);
      // Refresh the page to load new site data
      window.location.reload();
    } catch (error) {
      console.error('Error switching site:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Don't show selector if user has no sites
  if (availableSites.length === 0 && !canViewAllSites) {
    return null;
  }

  // Current display name
  const displayName = isAllSitesMode
    ? 'All Sites'
    : currentSite?.name || 'Select Site';

  // Show dropdown even with single site if they can view all sites
  const showDropdown = hasMultipleSites || canViewAllSites;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={!showDropdown || isLoading || isSwitching}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex items-center gap-2 h-9 px-3 font-normal',
            !showDropdown && 'cursor-default hover:bg-transparent',
            className
          )}
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAllSitesMode ? (
            <LayoutGrid className="h-4 w-4" />
          ) : (
            <Building2 className="h-4 w-4 opacity-55" />
          )}
          <span className={cn('max-w-[150px] truncate', compact && 'hidden sm:inline')}>
            {displayName}
          </span>
          {showDropdown && (
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          )}
        </Button>
      </DropdownMenuTrigger>

      {showDropdown && (
        <DropdownMenuContent align="start" className="w-[220px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Switch Site
          </DropdownMenuLabel>

          {/* All Sites option for org_admin */}
          {canViewAllSites && (
            <>
              <DropdownMenuItem
                onClick={() => handleSelectSite(ALL_SITES_ID)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="flex-1">All Sites</span>
                {isAllSitesMode && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Individual sites */}
          {availableSites.map((site) => (
            <DropdownMenuItem
              key={site.id}
              onClick={() => handleSelectSite(site.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{site.name}</div>
                {site.metrc_license_number && (
                  <div className="text-xs text-muted-foreground truncate">
                    {site.metrc_license_number}
                  </div>
                )}
              </div>
              {site.id === siteId && !isAllSitesMode && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          {availableSites.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No sites available
            </div>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

/**
 * Compact site indicator for the sidebar
 */
export function SiteIndicator({ className }: { className?: string }) {
  const { currentSite, isAllSitesMode } = useSite();

  const displayName = isAllSitesMode
    ? 'All Sites'
    : currentSite?.name || 'No site selected';

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      {isAllSitesMode ? (
        <LayoutGrid className="h-3.5 w-3.5" />
      ) : (
        <Building2 className="h-3.5 w-3.5" />
      )}
      <span className="truncate">{displayName}</span>
    </div>
  );
}

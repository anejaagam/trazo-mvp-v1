/**
 * Domain Toggle Component
 * 
 * Development-only component for switching between domains
 * Should only be visible in development mode
 */

import { useDomain } from '../contexts/DomainContext';
import type { DomainType } from '../types/domains';

/**
 * Domain Toggle Props
 */
export interface DomainToggleProps {
  className?: string;
  showInProduction?: boolean;
}

/**
 * Domain Toggle Component
 * 
 * Displays a toggle to switch between cannabis and produce domains.
 * Only visible in development unless showInProduction is true.
 */
export function DomainToggle({ className = '', showInProduction = false }: DomainToggleProps) {
  const { domain, setDomain, config } = useDomain();
  
  // Hide in production unless explicitly enabled
  const isDevelopment = import.meta.env.DEV;
  if (!isDevelopment && !showInProduction) {
    return null;
  }
  
  const handleToggle = (newDomain: DomainType) => {
    if (newDomain !== domain) {
      setDomain(newDomain);
      // Reload to ensure all components reinitialize with new domain
      window.location.reload();
    }
  };
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-500 mb-2 font-medium">Development Mode</div>
        <div className="flex gap-2">
          <button
            onClick={() => handleToggle('cannabis')}
            className={`
              px-3 py-2 rounded text-sm font-medium transition-colors
              ${domain === 'cannabis'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            🌿 Cannabis
          </button>
          <button
            onClick={() => handleToggle('produce')}
            className={`
              px-3 py-2 rounded text-sm font-medium transition-colors
              ${domain === 'produce'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            🥬 Produce
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Current: <span className="font-semibold">{config.name}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Domain Badge Component
 * 
 * Small badge showing current domain (always visible)
 */
export function DomainBadge({ className = '' }: { className?: string }) {
  const { config } = useDomain();
  
  const badgeColor = config.domain === 'cannabis' 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : 'bg-orange-100 text-orange-800 border-orange-300';
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${badgeColor} ${className}`}>
      <span>{config.domain === 'cannabis' ? '🌿' : '🥬'}</span>
      <span>{config.name}</span>
    </div>
  );
}

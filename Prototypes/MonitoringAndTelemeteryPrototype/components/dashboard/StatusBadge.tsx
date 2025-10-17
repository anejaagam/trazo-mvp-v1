import { Badge } from '../ui/badge';
import type { PointHealth } from '../../types/telemetry';

interface StatusBadgeProps {
  health: PointHealth;
  size?: 'sm' | 'default';
}

const healthConfig: Record<PointHealth, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  Healthy: { label: 'OK', variant: 'default' },
  Stale: { label: 'Stale', variant: 'secondary' },
  Faulted: { label: 'Fault', variant: 'destructive' },
  CalDue: { label: 'Cal Due', variant: 'outline' },
};

export function StatusBadge({ health, size = 'default' }: StatusBadgeProps) {
  const config = healthConfig[health];
  
  return (
    <Badge 
      variant={config.variant}
      className={size === 'sm' ? 'text-xs px-1.5 py-0' : ''}
    >
      {config.label}
    </Badge>
  );
}

interface SpecStatusBadgeProps {
  drift: number;
  tolerance: number;
  size?: 'sm' | 'default';
}

export function SpecStatusBadge({ drift, tolerance, size = 'default' }: SpecStatusBadgeProps) {
  const absD = Math.abs(drift);
  
  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  let label = 'In Spec';
  let bgClass = 'bg-green-500 hover:bg-green-500';
  
  if (absD > tolerance) {
    variant = 'destructive';
    label = 'Out of Spec';
    bgClass = '';
  } else if (absD > tolerance * 0.8) {
    variant = 'secondary';
    label = 'Approaching';
    bgClass = 'bg-amber-500 hover:bg-amber-500';
  }
  
  return (
    <Badge 
      variant={variant}
      className={`${bgClass} ${size === 'sm' ? 'text-xs px-1.5 py-0' : ''}`}
    >
      {label}
    </Badge>
  );
}
